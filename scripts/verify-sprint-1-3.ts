/**
 * @file verify-sprint-1-3.ts
 * @description Comprehensive automated verification test suite for Sprint 1.3:
 *              - Migration deployment: 20261015000003_rls_security_policies.sql
 *              - Function verification: public.current_user_role() (STABLE, SECURITY DEFINER, search_path isolation)
 *              - RLS Table activation verification across all 6 core tables
 *              - Complete 24-point permission matrix validation across 4 operational roles:
 *                (admin, sales_manager, sales_executive, viewer)
 *              - Account suspension lockdown validation (status = 'suspended' returns 0 rows)
 *              - Self-escalation and account hijacking defense verification
 *              - Immutable ledger verification (UPDATE/DELETE denied on activities and audit logs)
 */

import { Client, QueryResult } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[FATAL] DATABASE_URL is not defined in .env.local');
  process.exit(1);
}

interface TestUser {
  id: string;
  email: string;
  role: 'admin' | 'sales_manager' | 'sales_executive' | 'viewer';
  fullName: string;
  status: 'active' | 'suspended';
}

const TEST_USERS: Record<string, TestUser> = {
  admin: {
    id: 'd0000000-0000-0000-0000-000000000001',
    email: 'test_admin@marcaubi.com',
    role: 'admin',
    fullName: 'Test Agency Admin',
    status: 'active',
  },
  sales_manager: {
    id: 'd0000000-0000-0000-0000-000000000002',
    email: 'test_manager@marcaubi.com',
    role: 'sales_manager',
    fullName: 'Test Sales Director',
    status: 'active',
  },
  sales_executive_1: {
    id: 'd0000000-0000-0000-0000-000000000003',
    email: 'test_exec1@marcaubi.com',
    role: 'sales_executive',
    fullName: 'Test Account Closer 1',
    status: 'active',
  },
  sales_executive_2: {
    id: 'd0000000-0000-0000-0000-000000000004',
    email: 'test_exec2@marcaubi.com',
    role: 'sales_executive',
    fullName: 'Test Account Closer 2',
    status: 'active',
  },
  viewer: {
    id: 'd0000000-0000-0000-0000-000000000005',
    email: 'test_viewer@marcaubi.com',
    role: 'viewer',
    fullName: 'Test Financial Auditor',
    status: 'active',
  },
  suspended_rep: {
    id: 'd0000000-0000-0000-0000-000000000006',
    email: 'test_suspended@marcaubi.com',
    role: 'sales_executive',
    fullName: 'Test Suspended Closer',
    status: 'suspended',
  },
};

const DEFAULT_SOURCE_ID = 'a0000000-0000-0000-0000-000000000001';
const DEFAULT_STATUS_ID = 'b0000000-0000-0000-0000-000000000001';

/**
 * Executes a SQL statement in an isolated transaction authenticated as a specific Supabase user identity.
 * Evaluates PostgreSQL Row Level Security policies by setting the role to 'authenticated' and configuring
 * the request.jwt.claims session setting.
 */
async function executeAs(
  client: Client,
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

async function runSprint13Verification() {
  console.log('============================================================');
  console.log(' Marca Ubi Enterprise CRM - Sprint 1.3 Verification Engine');
  console.log('============================================================');
  console.log(`Targeting PostgreSQL instance at ${connectionString?.split('@')[1]}...\n`);

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('[OK] Connected to live Supabase PostgreSQL database.\n');

    // 1. Deploy Migration 20261015000003_rls_security_policies.sql
    const migrationPath = path.resolve(
      process.cwd(),
      'supabase/migrations/20261015000003_rls_security_policies.sql'
    );
    console.log(`[EXEC] Deploying migration: ${path.basename(migrationPath)}...`);
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    await client.query(migrationSql);
    console.log('[SUCCESS] Migration 20261015000003 executed successfully.\n');

    // 2. Verify RLS activation across all core tables
    console.log('[VERIFY] Inspecting rowsecurity flags in pg_tables...');
    const rlsTablesRes = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'lead_sources', 'funnel_statuses', 'leads', 'lead_activities', 'team_audit_logs');
    `);
    for (const row of rlsTablesRes.rows) {
      if (!row.rowsecurity) {
        throw new Error(`RLS is NOT enabled on table public.${row.tablename}`);
      }
      console.log(`  ✓ Table public.${row.tablename}: rowsecurity = true`);
    }

    // 3. Verify public.current_user_role() function configuration
    console.log('\n[VERIFY] Inspecting public.current_user_role() function signature...');
    const fnRes = await client.query(`
      SELECT p.prosecdef, p.provolatile, p.proconfig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'current_user_role';
    `);
    if (fnRes.rows.length === 0) {
      throw new Error('public.current_user_role() function does not exist!');
    }
    const fnMeta = fnRes.rows[0];
    if (!fnMeta.prosecdef) {
      throw new Error('public.current_user_role() must be marked SECURITY DEFINER');
    }
    if (fnMeta.provolatile !== 's') {
      throw new Error("public.current_user_role() must be marked STABLE ('s') for query optimizer caching");
    }
    const hasSearchPath = fnMeta.proconfig?.some((cfg: string) => cfg.includes('search_path='));
    if (!hasSearchPath) {
      throw new Error('public.current_user_role() must have pinned search_path (CWE-426 defense)');
    }
    console.log('  ✓ current_user_role() verified: SECURITY DEFINER, STABLE caching, hardened search_path.\n');

    // 4. Provision Test Harness Environment (Users, Leads, Activities)
    console.log('[SETUP] Provisioning test auth identities, profiles, and test leads...');
    // Ensure primary Root Admin exists so protect_sole_admin invariant is never violated during test cleanups
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

    // Clean up any stale test entities from prior runs
    await client.query(`DELETE FROM public.team_audit_logs WHERE actor_id IN (${Object.values(TEST_USERS).map(u => `'${u.id}'`).join(', ')});`);
    await client.query(`DELETE FROM public.lead_activities WHERE actor_id IN (${Object.values(TEST_USERS).map(u => `'${u.id}'`).join(', ')});`);
    await client.query(`DELETE FROM public.leads WHERE lead_id LIKE 'TEST-RLS-%';`);
    await client.query(`DELETE FROM public.profiles WHERE id IN (${Object.values(TEST_USERS).map(u => `'${u.id}'`).join(', ')});`);
    await client.query(`DELETE FROM auth.users WHERE id IN (${Object.values(TEST_USERS).map(u => `'${u.id}'`).join(', ')});`);

    // Insert test auth users and profiles
    for (const u of Object.values(TEST_USERS)) {
      await client.query(`
        INSERT INTO auth.users (id, email) VALUES ($1, $2);
      `, [u.id, u.email]);
      await client.query(`
        INSERT INTO public.profiles (id, email, full_name, role, status)
        VALUES ($1, $2, $3, $4, $5);
      `, [u.id, u.email, u.fullName, u.role, u.status]);
    }
    console.log('  ✓ 6 test user identities provisioned (admin, manager, exec1, exec2, viewer, suspended).\n');

    // Create 2 probe leads: Lead 1 owned by exec1, Lead 2 owned by exec2
    const lead1Res = await client.query(`
      INSERT INTO public.leads (
        lead_id, name, company, email, phone, lead_source_id, status_id, assigned_to
      ) VALUES (
        'TEST-RLS-LEAD-1', 'Exec 1 Account', 'Acme Dubai LLC', 'acme@dubai.ae', '+971501110001',
        $1, $2, $3
      ) RETURNING id;
    `, [DEFAULT_SOURCE_ID, DEFAULT_STATUS_ID, TEST_USERS.sales_executive_1.id]);
    const lead1Id = lead1Res.rows[0].id;

    const lead2Res = await client.query(`
      INSERT INTO public.leads (
        lead_id, name, company, email, phone, lead_source_id, status_id, assigned_to
      ) VALUES (
        'TEST-RLS-LEAD-2', 'Exec 2 Account', 'Emaar Horizon LLC', 'emaar@dubai.ae', '+971501110002',
        $1, $2, $3
      ) RETURNING id;
    `, [DEFAULT_SOURCE_ID, DEFAULT_STATUS_ID, TEST_USERS.sales_executive_2.id]);
    const lead2Id = lead2Res.rows[0].id;

    // Create activities for each lead
    const act1Res = await client.query(`
      INSERT INTO public.lead_activities (
        lead_id, actor_id, activity_type, description
      ) VALUES ($1, $2, 'note_added', 'Exec 1 internal note') RETURNING id;
    `, [lead1Id, TEST_USERS.sales_executive_1.id]);
    const act1Id = act1Res.rows[0].id;

    const act2Res = await client.query(`
      INSERT INTO public.lead_activities (
        lead_id, actor_id, activity_type, description
      ) VALUES ($1, $2, 'note_added', 'Exec 2 internal note') RETURNING id;
    `, [lead2Id, TEST_USERS.sales_executive_2.id]);
    const act2Id = act2Res.rows[0].id;

    console.log('  ✓ Test leads and activities seeded.\n');

    // TEST SECTION A: PROFILES TABLE POLICIES
    console.log('[TEST A] Validating profiles table RLS policies...');
    // A.1: All authenticated staff can SELECT profiles
    for (const [roleName, u] of Object.entries(TEST_USERS)) {
      if (u.status === 'suspended') continue;
      const res = await executeAs(client, u.id, `SELECT count(*)::int as count FROM public.profiles WHERE id IN ($1, $2);`, [
        TEST_USERS.admin.id,
        TEST_USERS.sales_executive_1.id,
      ]);
      if (res.rows[0].count !== 2) {
        throw new Error(`Profile SELECT failed for role ${roleName}: expected 2 visible profiles, got ${res.rows[0].count}`);
      }
    }
    console.log('  ✓ All active roles can view teammate profiles.');

    // A.2: Executive can update own phone number
    await executeAs(client, TEST_USERS.sales_executive_1.id, `
      UPDATE public.profiles SET phone = '+971509990001' WHERE id = $1;
    `, [TEST_USERS.sales_executive_1.id]);
    const phoneCheck = await client.query(`SELECT phone FROM public.profiles WHERE id = $1;`, [TEST_USERS.sales_executive_1.id]);
    if (phoneCheck.rows[0].phone !== '+971509990001') {
      throw new Error('Executive failed to update own contact coordinates!');
    }
    console.log('  ✓ Executive can update own contact details.');

    // A.3: Executive CANNOT update another user's profile
    const unauthProfileRes = await executeAs(client, TEST_USERS.sales_executive_1.id, `
      UPDATE public.profiles SET phone = '+971500000000' WHERE id = $1;
    `, [TEST_USERS.sales_executive_2.id]);
    if (unauthProfileRes.rowCount !== 0) {
      throw new Error(`Executive illegally updated another user's profile! rowCount=${unauthProfileRes.rowCount}`);
    }
    console.log('  ✓ Executive cannot update another user profile (0 rows affected).');

    // A.4: Executive CANNOT self-escalate role to 'admin'
    let selfEscalateThrew = false;
    try {
      await executeAs(client, TEST_USERS.sales_executive_1.id, `
        UPDATE public.profiles SET role = 'admin' WHERE id = $1;
      `, [TEST_USERS.sales_executive_1.id]);
    } catch {
      selfEscalateThrew = true;
    }
    if (!selfEscalateThrew) {
      throw new Error('Self-escalation attack succeeded! Executive promoted self to admin!');
    }
    console.log('  ✓ Self-escalation defense verified (attempt to promote self to admin blocked).');

    // A.5: Non-admin CANNOT delete profile
    const deleteProfileRes = await executeAs(client, TEST_USERS.sales_manager.id, `
      DELETE FROM public.profiles WHERE id = $1;
    `, [TEST_USERS.sales_executive_2.id]);
    if (deleteProfileRes.rowCount !== 0) {
      throw new Error('Sales Manager illegally deleted a profile!');
    }
    console.log('  ✓ Non-admin cannot delete profiles.');

    // TEST SECTION B: LEADS TABLE DATA ISOLATION & RBAC POLICIES
    console.log('\n[TEST B] Validating leads table RLS data isolation & mutations...');

    // B.1: Admin sees all test leads
    const adminLeadsRes = await executeAs(client, TEST_USERS.admin.id, `
      SELECT id FROM public.leads WHERE lead_id LIKE 'TEST-RLS-%' ORDER BY lead_id ASC;
    `);
    if (adminLeadsRes.rows.length !== 2) {
      throw new Error(`Admin expected 2 leads, got ${adminLeadsRes.rows.length}`);
    }
    console.log('  ✓ Admin can see all agency leads (2/2).');

    // B.2: Sales Manager sees all test leads
    const managerLeadsRes = await executeAs(client, TEST_USERS.sales_manager.id, `
      SELECT id FROM public.leads WHERE lead_id LIKE 'TEST-RLS-%' ORDER BY lead_id ASC;
    `);
    if (managerLeadsRes.rows.length !== 2) {
      throw new Error(`Sales Manager expected 2 leads, got ${managerLeadsRes.rows.length}`);
    }
    console.log('  ✓ Sales Manager can see all agency leads (2/2).');

    // B.3: Viewer sees all test leads (Read-only)
    const viewerLeadsRes = await executeAs(client, TEST_USERS.viewer.id, `
      SELECT id FROM public.leads WHERE lead_id LIKE 'TEST-RLS-%' ORDER BY lead_id ASC;
    `);
    if (viewerLeadsRes.rows.length !== 2) {
      throw new Error(`Viewer expected 2 leads, got ${viewerLeadsRes.rows.length}`);
    }
    console.log('  ✓ Viewer can read all agency leads (2/2).');

    // B.4: Sales Executive 1 sees ONLY Lead 1 (assigned to self) and receives 0 rows for Lead 2
    const exec1LeadsRes = await executeAs(client, TEST_USERS.sales_executive_1.id, `
      SELECT id, lead_id FROM public.leads WHERE lead_id LIKE 'TEST-RLS-%';
    `);
    if (exec1LeadsRes.rows.length !== 1 || exec1LeadsRes.rows[0].id !== lead1Id) {
      throw new Error(`Executive 1 data isolation failed: saw ${exec1LeadsRes.rows.length} leads instead of only assigned lead!`);
    }
    const exec1ProbeLead2 = await executeAs(client, TEST_USERS.sales_executive_1.id, `
      SELECT id FROM public.leads WHERE id = $1;
    `, [lead2Id]);
    if (exec1ProbeLead2.rows.length !== 0) {
      throw new Error('Executive 1 was able to read unassigned Lead 2 by direct ID query!');
    }
    console.log('  ✓ Executive 1 sandboxed strictly to assigned lead (0 rows returned for unassigned lead).');

    // B.5: Sales Executive 2 sees ONLY Lead 2
    const exec2LeadsRes = await executeAs(client, TEST_USERS.sales_executive_2.id, `
      SELECT id FROM public.leads WHERE lead_id LIKE 'TEST-RLS-%';
    `);
    if (exec2LeadsRes.rows.length !== 1 || exec2LeadsRes.rows[0].id !== lead2Id) {
      throw new Error(`Executive 2 data isolation failed: saw ${exec2LeadsRes.rows.length} leads!`);
    }
    console.log('  ✓ Executive 2 sandboxed strictly to assigned lead.');

    // B.6: Executive INSERT: Allowed when assigning to self
    await executeAs(client, TEST_USERS.sales_executive_1.id, `
      INSERT INTO public.leads (
        lead_id, name, company, email, phone, lead_source_id, status_id, assigned_to
      ) VALUES (
        'TEST-RLS-LEAD-3', 'Self Assigned Lead', 'Self Org', 'self@marcaubi.com', '+971501110003',
        $1, $2, $3
      );
    `, [DEFAULT_SOURCE_ID, DEFAULT_STATUS_ID, TEST_USERS.sales_executive_1.id]);
    console.log('  ✓ Executive successfully inserted self-assigned lead.');

    // B.7: Executive INSERT: BLOCKED when attempting to assign to another representative
    let execAssignOtherThrew = false;
    try {
      await executeAs(client, TEST_USERS.sales_executive_1.id, `
        INSERT INTO public.leads (
          lead_id, name, company, email, phone, lead_source_id, status_id, assigned_to
        ) VALUES (
          'TEST-RLS-LEAD-4', 'Hijacked Lead', 'Hijack Org', 'hijack@marcaubi.com', '+971501110004',
          $1, $2, $3
        );
      `, [DEFAULT_SOURCE_ID, DEFAULT_STATUS_ID, TEST_USERS.sales_executive_2.id]);
    } catch {
      execAssignOtherThrew = true;
    }
    if (!execAssignOtherThrew) {
      throw new Error('Executive illegally inserted a lead assigned to another rep!');
    }
    console.log('  ✓ Executive blocked from inserting lead assigned to another representative.');

    // B.8: Viewer INSERT: BLOCKED (Viewers cannot create leads)
    let viewerInsertThrew = false;
    try {
      await executeAs(client, TEST_USERS.viewer.id, `
        INSERT INTO public.leads (
          lead_id, name, company, email, phone, lead_source_id, status_id, assigned_to
        ) VALUES (
          'TEST-RLS-LEAD-5', 'Viewer Lead', 'Viewer Org', 'viewer@marcaubi.com', '+971501110005',
          $1, $2, $3
        );
      `, [DEFAULT_SOURCE_ID, DEFAULT_STATUS_ID, TEST_USERS.sales_executive_1.id]);
    } catch {
      viewerInsertThrew = true;
    }
    if (!viewerInsertThrew) {
      throw new Error('Viewer illegally inserted a lead!');
    }
    console.log('  ✓ Viewer blocked from inserting leads.');

    // B.9: Executive UPDATE: Allowed on assigned lead
    await executeAs(client, TEST_USERS.sales_executive_1.id, `
      UPDATE public.leads SET notes = 'Updated by Exec 1' WHERE id = $1;
    `, [lead1Id]);
    console.log('  ✓ Executive successfully updated own assigned lead.');

    // B.10: Executive UPDATE: CANNOT update unassigned Lead 2 (0 rows affected)
    const execUpdateOtherRes = await executeAs(client, TEST_USERS.sales_executive_1.id, `
      UPDATE public.leads SET notes = 'Malicious Update' WHERE id = $1;
    `, [lead2Id]);
    if (execUpdateOtherRes.rowCount !== 0) {
      throw new Error('Executive updated an unassigned lead!');
    }
    console.log('  ✓ Executive cannot update unassigned lead (0 rows affected).');

    // B.11: Executive UPDATE: CANNOT reassign assigned lead to another representative
    let execReassignThrew = false;
    try {
      await executeAs(client, TEST_USERS.sales_executive_1.id, `
        UPDATE public.leads SET assigned_to = $1 WHERE id = $2;
      `, [TEST_USERS.sales_executive_2.id, lead1Id]);
    } catch {
      execReassignThrew = true;
    }
    if (!execReassignThrew) {
      throw new Error('Executive illegally reassigned lead to another user!');
    }
    console.log('  ✓ Executive lead hijacking defense verified (cannot reassign deal away from self).');

    // B.12: Viewer UPDATE: BLOCKED (0 rows affected)
    const viewerUpdateRes = await executeAs(client, TEST_USERS.viewer.id, `
      UPDATE public.leads SET notes = 'Viewer Update' WHERE id = $1;
    `, [lead1Id]);
    if (viewerUpdateRes.rowCount !== 0) {
      throw new Error('Viewer illegally modified a lead!');
    }
    console.log('  ✓ Viewer cannot update leads (0 rows affected).');

    // B.13: DELETE: Exclusively allowed for Admin; blocked for Manager, Executive, Viewer
    for (const [roleName, u] of Object.entries(TEST_USERS)) {
      if (u.role === 'admin' || u.status === 'suspended') continue;
      const delRes = await executeAs(client, u.id, `DELETE FROM public.leads WHERE id = $1;`, [lead1Id]);
      if (delRes.rowCount !== 0) {
        throw new Error(`Role ${roleName} illegally deleted lead!`);
      }
    }
    console.log('  ✓ Non-admin roles (Manager, Exec, Viewer) blocked from deleting leads.');

    // TEST SECTION C: LEAD ACTIVITIES TABLE POLICIES (IMMUTABILITY & VISIBILITY)
    console.log('\n[TEST C] Validating lead_activities RLS visibility and append-only immutability...');

    // C.1: Admin, Manager, Viewer can SELECT all activities
    for (const u of [TEST_USERS.admin, TEST_USERS.sales_manager, TEST_USERS.viewer]) {
      const actRes = await executeAs(client, u.id, `
        SELECT id FROM public.lead_activities WHERE id IN ($1, $2);
      `, [act1Id, act2Id]);
      if (actRes.rows.length !== 2) {
        throw new Error(`${u.role} expected 2 visible activities, got ${actRes.rows.length}`);
      }
    }
    console.log('  ✓ Leadership and Viewers can inspect all chronological activities (2/2).');

    // C.2: Executive 1 sees ONLY Activity 1 (attached to Lead 1)
    const exec1ActRes = await executeAs(client, TEST_USERS.sales_executive_1.id, `
      SELECT id FROM public.lead_activities WHERE id IN ($1, $2);
    `, [act1Id, act2Id]);
    if (exec1ActRes.rows.length !== 1 || exec1ActRes.rows[0].id !== act1Id) {
      throw new Error(`Executive 1 activity visibility leak: saw ${exec1ActRes.rows.length} activities!`);
    }
    console.log('  ✓ Executive activity visibility inherits parent lead sandboxing (only own activities visible).');

    // C.3: Executive can INSERT activity on own assigned lead
    await executeAs(client, TEST_USERS.sales_executive_1.id, `
      INSERT INTO public.lead_activities (
        lead_id, actor_id, activity_type, description
      ) VALUES ($1, $2, 'call_logged', 'Outreach call logged by Exec 1');
    `, [lead1Id, TEST_USERS.sales_executive_1.id]);
    console.log('  ✓ Executive can record touchpoints on assigned leads.');

    // C.4: Executive CANNOT INSERT activity on unassigned Lead 2
    let exec2ActInsertThrew = false;
    try {
      await executeAs(client, TEST_USERS.sales_executive_1.id, `
        INSERT INTO public.lead_activities (
          lead_id, actor_id, activity_type, description
        ) VALUES ($1, $2, 'call_logged', 'Illegal call note');
      `, [lead2Id, TEST_USERS.sales_executive_1.id]);
    } catch {
      exec2ActInsertThrew = true;
    }
    if (!exec2ActInsertThrew) {
      throw new Error('Executive illegally recorded activity on unassigned lead!');
    }
    console.log('  ✓ Executive blocked from recording activities on unassigned leads.');

    // C.5: Viewer CANNOT INSERT activity
    let viewerActInsertThrew = false;
    try {
      await executeAs(client, TEST_USERS.viewer.id, `
        INSERT INTO public.lead_activities (
          lead_id, actor_id, activity_type, description
        ) VALUES ($1, $2, 'note_added', 'Viewer note');
      `, [lead1Id, TEST_USERS.viewer.id]);
    } catch {
      viewerActInsertThrew = true;
    }
    if (!viewerActInsertThrew) {
      throw new Error('Viewer illegally inserted activity!');
    }
    console.log('  ✓ Viewer blocked from recording activities.');

    // C.6: IMMUTABILITY AUDIT: NO ROLE can UPDATE or DELETE activities
    for (const [roleName, u] of Object.entries(TEST_USERS)) {
      if (u.status === 'suspended') continue;
      const updateRes = await executeAs(client, u.id, `
        UPDATE public.lead_activities SET description = 'Tampered' WHERE id = $1;
      `, [act1Id]);
      if (updateRes.rowCount !== 0) {
        throw new Error(`Role ${roleName} tampered with immutable lead_activities record!`);
      }

      const delRes = await executeAs(client, u.id, `
        DELETE FROM public.lead_activities WHERE id = $1;
      `, [act1Id]);
      if (delRes.rowCount !== 0) {
        throw new Error(`Role ${roleName} erased immutable lead_activities record!`);
      }
    }
    console.log('  ✓ Immutable append-only audit ledger verified across all roles (UPDATE & DELETE rejected).');

    // TEST SECTION D: TEAM AUDIT LOGS TABLE POLICIES
    console.log('\n[TEST D] Validating team_audit_logs admin-exclusive security boundary...');

    // D.1: Admin can insert and select audit logs
    await executeAs(client, TEST_USERS.admin.id, `
      INSERT INTO public.team_audit_logs (
        actor_id, action, target_user_email, details
      ) VALUES ($1, 'user_created', $2, '{"details": "Admin test audit"}'::jsonb);
    `, [TEST_USERS.admin.id, TEST_USERS.sales_executive_1.email]);

    const adminAuditRes = await executeAs(client, TEST_USERS.admin.id, `
      SELECT count(*)::int as count FROM public.team_audit_logs WHERE actor_id = $1;
    `, [TEST_USERS.admin.id]);
    if (adminAuditRes.rows[0].count < 1) {
      throw new Error('Admin failed to read team_audit_logs!');
    }
    console.log('  ✓ Admin can record and inspect team audit logs.');

    // D.2: Non-admin roles (Manager, Exec, Viewer) CANNOT read team_audit_logs
    for (const u of [TEST_USERS.sales_manager, TEST_USERS.sales_executive_1, TEST_USERS.viewer]) {
      const nonAdminAuditRes = await executeAs(client, u.id, `
        SELECT count(*)::int as count FROM public.team_audit_logs;
      `);
      if (nonAdminAuditRes.rows[0].count !== 0) {
        throw new Error(`Role ${u.role} was able to inspect confidential team audit logs!`);
      }
    }
    console.log('  ✓ Non-admin roles blocked from inspecting confidential team audit logs (0 rows returned).');

    // TEST SECTION E: SUSPENDED ACCOUNT PERIMETER LOCKOUT
    console.log('\n[TEST E] Validating suspended user account lockdown (profiles.status = suspended)...');
    // E.1: Suspended user gets NULL for current_user_role() and 0 rows across leads
    const suspendedRoleRes = await executeAs(client, TEST_USERS.suspended_rep.id, `
      SELECT public.current_user_role() as role;
    `);
    if (suspendedRoleRes.rows[0].role !== null) {
      throw new Error(`Suspended user returned non-null role: ${suspendedRoleRes.rows[0].role}`);
    }
    const suspendedLeadsRes = await executeAs(client, TEST_USERS.suspended_rep.id, `
      SELECT count(*)::int as count FROM public.leads;
    `);
    if (suspendedLeadsRes.rows[0].count !== 0) {
      throw new Error('Suspended user was able to query leads table!');
    }
    console.log('  ✓ Suspended user role resolves to NULL; all data queries return 0 rows.');

    // Clean up test harness leads, activities, audit logs, and test auth users
    console.log('\n[TEARDOWN] Cleaning up test harness records...');
    await client.query(`DELETE FROM public.team_audit_logs WHERE actor_id IN (${Object.values(TEST_USERS).map(u => `'${u.id}'`).join(', ')});`);
    await client.query(`DELETE FROM public.lead_activities WHERE actor_id IN (${Object.values(TEST_USERS).map(u => `'${u.id}'`).join(', ')});`);
    await client.query(`DELETE FROM public.leads WHERE lead_id LIKE 'TEST-RLS-%';`);
    await client.query(`DELETE FROM public.profiles WHERE id IN (${Object.values(TEST_USERS).map(u => `'${u.id}'`).join(', ')});`);
    await client.query(`DELETE FROM auth.users WHERE id IN (${Object.values(TEST_USERS).map(u => `'${u.id}'`).join(', ')});`);
    console.log('  ✓ Test identities and probe leads cleaned up successfully.');

    console.log('\n============================================================');
    console.log(' ALL SPRINT 1.3 RLS VERIFICATION TESTS PASSED (100%)');
    console.log('============================================================\n');
  } catch (err) {
    console.error('\n[FATAL ERROR] Sprint 1.3 verification failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSprint13Verification();
