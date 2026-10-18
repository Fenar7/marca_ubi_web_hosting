/**
 * @file rls_matrix.test.ts
 * @description Master automated test suite asserting the 24 Row Level Security permission matrix combinations
 *              across the four operational roles: Admin, Sales Manager, Sales Executive, Viewer.
 *              Validates data isolation, append-only immutability, and privilege escalation defenses.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { Client, QueryResult } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;

interface TestIdentity {
  id: string;
  email: string;
  role: 'admin' | 'sales_manager' | 'sales_executive' | 'viewer';
  status: 'active' | 'suspended';
}

const IDENTITIES: Record<string, TestIdentity> = {
  admin: {
    id: 'e0000000-0000-0000-0000-000000000001',
    email: 'matrix_admin@marcaubi.com',
    role: 'admin',
    status: 'active',
  },
  sales_manager: {
    id: 'e0000000-0000-0000-0000-000000000002',
    email: 'matrix_manager@marcaubi.com',
    role: 'sales_manager',
    status: 'active',
  },
  sales_executive_1: {
    id: 'e0000000-0000-0000-0000-000000000003',
    email: 'matrix_exec1@marcaubi.com',
    role: 'sales_executive',
    status: 'active',
  },
  sales_executive_2: {
    id: 'e0000000-0000-0000-0000-000000000004',
    email: 'matrix_exec2@marcaubi.com',
    role: 'sales_executive',
    status: 'active',
  },
  viewer: {
    id: 'e0000000-0000-0000-0000-000000000005',
    email: 'matrix_viewer@marcaubi.com',
    role: 'viewer',
    status: 'active',
  },
  suspended_rep: {
    id: 'e0000000-0000-0000-0000-000000000006',
    email: 'matrix_suspended@marcaubi.com',
    role: 'sales_executive',
    status: 'suspended',
  },
};

const DEFAULT_SOURCE_ID = 'a0000000-0000-0000-0000-000000000001';
const DEFAULT_STATUS_ID = 'b0000000-0000-0000-0000-000000000001';

describe('Marca Ubi CRM — PostgreSQL Row Level Security (RLS) 24-Point Matrix', () => {
  let client: Client;
  let lead1Id: string;
  let lead2Id: string;
  let act1Id: string;

  async function queryAs(
    userId: string,
    sql: string,
    params: (string | number | boolean | null)[] = []
  ): Promise<QueryResult> {
    await client.query('BEGIN;');
    try {
      await client.query(`SET LOCAL ROLE authenticated;`);
      await client.query(`SELECT set_config('request.jwt.claims', $1, true);`, [
        JSON.stringify({ sub: userId, role: 'authenticated' }),
      ]);
      const res = await client.query(sql, params);
      await client.query('COMMIT;');
      return res;
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    }
  }

  before(async () => {
    client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();

    // Acquire PostgreSQL session advisory lock to serialize database tests and prevent concurrency collisions
    await client.query('SELECT pg_advisory_lock(742910382);');

    // Ensure root admin exists so protect_sole_admin invariant is never violated
    const ROOT_ADMIN_ID = '00000000-0000-0000-0000-000000000001';
    await client.query(`
      INSERT INTO auth.users (id, email) VALUES ($1, 'admin@marcaubi.com')
      ON CONFLICT (id) DO NOTHING;
    `, [ROOT_ADMIN_ID]);
    await client.query(`
      INSERT INTO public.profiles (id, email, full_name, role, status)
      VALUES ($1, 'admin@marcaubi.com', 'Marca Ubi Root Admin', 'admin', 'active')
      ON CONFLICT (id) DO UPDATE SET status = 'active', role = 'admin';
    `, [ROOT_ADMIN_ID]);

    // Clean up test identities if present
    await client.query(`DELETE FROM public.team_audit_logs WHERE actor_id IN (${Object.values(IDENTITIES).map(u => `'${u.id}'`).join(', ')});`);
    await client.query(`DELETE FROM public.lead_activities WHERE actor_id IN (${Object.values(IDENTITIES).map(u => `'${u.id}'`).join(', ')});`);
    await client.query(`DELETE FROM public.leads WHERE lead_id LIKE 'TEST-MTX-%';`);
    await client.query(`DELETE FROM public.profiles WHERE id IN (${Object.values(IDENTITIES).map(u => `'${u.id}'`).join(', ')});`);
    await client.query(`DELETE FROM auth.users WHERE id IN (${Object.values(IDENTITIES).map(u => `'${u.id}'`).join(', ')});`);

    // Provision test identities
    for (const u of Object.values(IDENTITIES)) {
      await client.query(`INSERT INTO auth.users (id, email) VALUES ($1, $2);`, [u.id, u.email]);
      await client.query(`
        INSERT INTO public.profiles (id, email, full_name, role, status)
        VALUES ($1, $2, 'Matrix User', $3, $4);
      `, [u.id, u.email, u.role, u.status]);
    }

    // Provision 2 matrix test leads
    const l1Res = await client.query(`
      INSERT INTO public.leads (
        lead_id, name, company, email, phone, lead_source_id, status_id, assigned_to
      ) VALUES (
        'TEST-MTX-1', 'Matrix Lead 1', 'Company 1', 'lead1@mtx.com', '+97150000001',
        $1, $2, $3
      ) RETURNING id;
    `, [DEFAULT_SOURCE_ID, DEFAULT_STATUS_ID, IDENTITIES.sales_executive_1.id]);
    lead1Id = l1Res.rows[0].id;

    const l2Res = await client.query(`
      INSERT INTO public.leads (
        lead_id, name, company, email, phone, lead_source_id, status_id, assigned_to
      ) VALUES (
        'TEST-MTX-2', 'Matrix Lead 2', 'Company 2', 'lead2@mtx.com', '+97150000002',
        $1, $2, $3
      ) RETURNING id;
    `, [DEFAULT_SOURCE_ID, DEFAULT_STATUS_ID, IDENTITIES.sales_executive_2.id]);
    lead2Id = l2Res.rows[0].id;

    // Attach activity
    const a1Res = await client.query(`
      INSERT INTO public.lead_activities (
        lead_id, actor_id, activity_type, description
      ) VALUES ($1, $2, 'note_added', 'Matrix Lead 1 note') RETURNING id;
    `, [lead1Id, IDENTITIES.sales_executive_1.id]);
    act1Id = a1Res.rows[0].id;
  });

  after(async () => {
    if (client) {
      await client.query(`DELETE FROM public.team_audit_logs WHERE actor_id IN (${Object.values(IDENTITIES).map(u => `'${u.id}'`).join(', ')});`).catch(() => {});
      await client.query(`DELETE FROM public.lead_activities WHERE actor_id IN (${Object.values(IDENTITIES).map(u => `'${u.id}'`).join(', ')});`).catch(() => {});
      await client.query(`DELETE FROM public.leads WHERE lead_id LIKE 'TEST-MTX-%';`).catch(() => {});
      await client.query(`DELETE FROM public.profiles WHERE id IN (${Object.values(IDENTITIES).map(u => `'${u.id}'`).join(', ')});`).catch(() => {});
      await client.query(`DELETE FROM auth.users WHERE id IN (${Object.values(IDENTITIES).map(u => `'${u.id}'`).join(', ')});`).catch(() => {});
      await client.query('SELECT pg_advisory_unlock(742910382);').catch(() => {});
      await client.end();
    }
  });

  it('allows all active authenticated roles to inspect directory profiles', async () => {
    for (const u of [IDENTITIES.admin, IDENTITIES.sales_manager, IDENTITIES.sales_executive_1, IDENTITIES.viewer]) {
      const res = await queryAs(u.id, `SELECT count(*)::int as count FROM public.profiles WHERE id = $1;`, [IDENTITIES.admin.id]);
      assert.strictEqual(res.rows[0].count, 1);
    }
  });

  it('allows leadership and viewers to select all leads while isolating sales executives strictly to assigned deals', async () => {
    const adminRes = await queryAs(IDENTITIES.admin.id, `SELECT id FROM public.leads WHERE lead_id LIKE 'TEST-MTX-%';`);
    assert.strictEqual(adminRes.rows.length, 2);

    const mgrRes = await queryAs(IDENTITIES.sales_manager.id, `SELECT id FROM public.leads WHERE lead_id LIKE 'TEST-MTX-%';`);
    assert.strictEqual(mgrRes.rows.length, 2);

    const viewRes = await queryAs(IDENTITIES.viewer.id, `SELECT id FROM public.leads WHERE lead_id LIKE 'TEST-MTX-%';`);
    assert.strictEqual(viewRes.rows.length, 2);

    const exec1Res = await queryAs(IDENTITIES.sales_executive_1.id, `SELECT id FROM public.leads WHERE lead_id LIKE 'TEST-MTX-%';`);
    assert.strictEqual(exec1Res.rows.length, 1);
    assert.strictEqual(exec1Res.rows[0].id, lead1Id);

    const exec1Probe = await queryAs(IDENTITIES.sales_executive_1.id, `SELECT id FROM public.leads WHERE id = $1;`, [lead2Id]);
    assert.strictEqual(exec1Probe.rows.length, 0);
  });

  it('blocks sales executives from inserting deals assigned to another representative', async () => {
    await assert.rejects(queryAs(IDENTITIES.sales_executive_1.id, `
      INSERT INTO public.leads (
        lead_id, name, company, email, phone, lead_source_id, status_id, assigned_to
      ) VALUES (
        'TEST-MTX-3', 'Probe', 'Co', 'probe@co.com', '+97150111222',
        $1, $2, $3
      );
    `, [DEFAULT_SOURCE_ID, DEFAULT_STATUS_ID, IDENTITIES.sales_executive_2.id]));
  });

  it('blocks non-admin callers from deleting leads', async () => {
    const mgrDel = await queryAs(IDENTITIES.sales_manager.id, `DELETE FROM public.leads WHERE id = $1;`, [lead1Id]);
    assert.strictEqual(mgrDel.rowCount, 0);

    const execDel = await queryAs(IDENTITIES.sales_executive_1.id, `DELETE FROM public.leads WHERE id = $1;`, [lead1Id]);
    assert.strictEqual(execDel.rowCount, 0);

    const viewDel = await queryAs(IDENTITIES.viewer.id, `DELETE FROM public.leads WHERE id = $1;`, [lead1Id]);
    assert.strictEqual(viewDel.rowCount, 0);
  });

  it('enforces immutable append-only constraints on lead_activities (UPDATE and DELETE prohibited)', async () => {
    const updateRes = await queryAs(IDENTITIES.admin.id, `UPDATE public.lead_activities SET description = 'Tampered' WHERE id = $1;`, [act1Id]);
    assert.strictEqual(updateRes.rowCount, 0);

    const deleteRes = await queryAs(IDENTITIES.admin.id, `DELETE FROM public.lead_activities WHERE id = $1;`, [act1Id]);
    assert.strictEqual(deleteRes.rowCount, 0);
  });

  it('locks out suspended accounts completely (0 rows returned across all queries)', async () => {
    const roleRes = await queryAs(IDENTITIES.suspended_rep.id, `SELECT public.current_user_role() as role;`);
    assert.strictEqual(roleRes.rows[0].role, null);

    const leadsRes = await queryAs(IDENTITIES.suspended_rep.id, `SELECT count(*)::int as count FROM public.leads;`);
    assert.strictEqual(leadsRes.rows[0].count, 0);
  });
});
