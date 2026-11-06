/**
 * Integration coverage for atomic follow-up completion against a disposable local database.
 * Set CRM_ISOLATED_DATABASE_URL to a loopback database whose name ends in `_test`.
 * Fixtures and permission changes remain inside one transaction that is always rolled back.
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';

const connectionString = process.env.CRM_ISOLATED_DATABASE_URL;

describe('Atomic CRM follow-up completion', { skip: !connectionString }, () => {
  let client: Client;
  const identities = {
    admin: randomUUID(),
    manager: randomUUID(),
    assigned: randomUUID(),
    other: randomUUID(),
    viewer: randomUUID(),
    suspended: randomUUID(),
  };
  const leadIds = { normal: randomUUID(), stale: randomUUID(), rollback: randomUUID() };
  const originalFollowUp = '2030-01-02T10:00:00.000Z';
  const rescheduledFollowUp = '2030-01-03T10:00:00.000Z';

  /** Savepoints let denied requests be checked without aborting the fixture transaction. */
  async function callAs(userId: string, leadId: string, expected: string, note: string | null = null): Promise<boolean> {
    await client.query('SAVEPOINT request_scope');
    try {
      await client.query('SET LOCAL ROLE authenticated');
      await client.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: userId, role: 'authenticated' })]);
      const result = await client.query<{ completed: boolean }>(
        'SELECT public.complete_lead_follow_up($1::uuid, $2::timestamptz, $3::text) AS completed',
        [leadId, expected, note]
      );
      await client.query('RESET ROLE');
      await client.query('RELEASE SAVEPOINT request_scope');
      return result.rows[0].completed;
    } catch (error) {
      await client.query('ROLLBACK TO SAVEPOINT request_scope');
      await client.query('RESET ROLE');
      await client.query('RELEASE SAVEPOINT request_scope');
      throw error;
    }
  }

  before(async () => {
    if (!connectionString) return;
    const parsed = new URL(connectionString);
    const localHosts = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);
    const databaseName = decodeURIComponent(parsed.pathname.slice(1));
    if (!localHosts.has(parsed.hostname) || !/_test$/i.test(databaseName)) {
      throw new Error('CRM_ISOLATED_DATABASE_URL must point to a loopback database named *_test.');
    }
    client = new Client({ connectionString });
    await client.connect();
    await client.query('BEGIN');

    const roles: Array<[string, string, string]> = [
      [identities.admin, 'admin', 'active'],
      [identities.manager, 'sales_manager', 'active'],
      [identities.assigned, 'sales_executive', 'active'],
      [identities.other, 'sales_executive', 'active'],
      [identities.viewer, 'viewer', 'active'],
      [identities.suspended, 'sales_executive', 'suspended'],
    ];
    for (const [id, role, status] of roles) {
      const email = `followup-${id}@example.test`;
      await client.query('INSERT INTO auth.users (id, email) VALUES ($1, $2)', [id, email]);
      await client.query(
        'INSERT INTO public.profiles (id, email, full_name, role, status) VALUES ($1, $2, $3, $4, $5)',
        [id, email, 'Follow-up test user', role, status]
      );
    }
    const source = await client.query<{ id: string }>('SELECT id FROM public.lead_sources ORDER BY id LIMIT 1');
    const stage = await client.query<{ id: string }>("SELECT id FROM public.funnel_statuses WHERE bucket = 'open' ORDER BY sort_order LIMIT 1");
    assert.ok(source.rows[0] && stage.rows[0], 'An isolated migrated database must have a lead source and an open stage');
    for (const [name, id] of Object.entries(leadIds)) {
      await client.query(
        `INSERT INTO public.leads (id, lead_id, name, email, lead_source_id, status_id, assigned_to, next_follow_up)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, `TEST-FOLLOWUP-${id}`, `Follow-up ${name}`, `${id}@example.test`, source.rows[0].id, stage.rows[0].id, identities.assigned, originalFollowUp]
      );
    }
  });

  after(async () => {
    if (!client) return;
    try {
      await client.query('ROLLBACK');
    } finally {
      await client.end();
    }
  });

  it('allows an assigned executive to complete once and binds the activity to that identity', async () => {
    assert.equal(await callAs(identities.assigned, leadIds.normal, originalFollowUp, 'Client confirmed'), true);
    assert.equal(await callAs(identities.assigned, leadIds.normal, originalFollowUp), false);
    const lead = await client.query('SELECT next_follow_up FROM public.leads WHERE id = $1', [leadIds.normal]);
    const activities = await client.query(
      "SELECT actor_id, metadata FROM public.lead_activities WHERE lead_id = $1 AND metadata->>'cleared_follow_up' = 'true'",
      [leadIds.normal]
    );
    assert.equal(lead.rows[0].next_follow_up, null);
    assert.equal(activities.rowCount, 1);
    assert.equal(activities.rows[0].actor_id, identities.assigned);
  });

  it('denies another executive, viewers and suspended accounts', async () => {
    assert.equal(await callAs(identities.other, leadIds.stale, originalFollowUp), false);
    await assert.rejects(callAs(identities.viewer, leadIds.stale, originalFollowUp), { code: '42501' });
    await assert.rejects(callAs(identities.suspended, leadIds.stale, originalFollowUp), { code: '42501' });
    const lead = await client.query('SELECT next_follow_up FROM public.leads WHERE id = $1', [leadIds.stale]);
    assert.equal(lead.rows[0].next_follow_up.toISOString(), originalFollowUp);
  });

  it('does not clear a follow-up rescheduled after the caller viewed it', async () => {
    await client.query('UPDATE public.leads SET next_follow_up = $2 WHERE id = $1', [leadIds.stale, rescheduledFollowUp]);
    assert.equal(await callAs(identities.manager, leadIds.stale, originalFollowUp), false);
    const lead = await client.query('SELECT next_follow_up FROM public.leads WHERE id = $1', [leadIds.stale]);
    assert.equal(lead.rows[0].next_follow_up.toISOString(), rescheduledFollowUp);
  });

  it('rolls back the lead update when the activity cannot be inserted', async () => {
    const before = await client.query('SELECT count(*)::int AS count FROM public.lead_activities WHERE lead_id = $1', [leadIds.rollback]);
    await client.query('SAVEPOINT deny_insert');
    try {
      await client.query('REVOKE INSERT ON public.lead_activities FROM authenticated');
      await assert.rejects(callAs(identities.admin, leadIds.rollback, originalFollowUp), { code: '42501' });
    } finally {
      await client.query('ROLLBACK TO SAVEPOINT deny_insert');
      await client.query('RELEASE SAVEPOINT deny_insert');
    }
    const lead = await client.query('SELECT next_follow_up FROM public.leads WHERE id = $1', [leadIds.rollback]);
    const afterCount = await client.query('SELECT count(*)::int AS count FROM public.lead_activities WHERE lead_id = $1', [leadIds.rollback]);
    assert.equal(lead.rows[0].next_follow_up.toISOString(), originalFollowUp);
    assert.equal(afterCount.rows[0].count, before.rows[0].count);
  });

  it('rejects an overlong note through the direct RPC boundary', async () => {
    await assert.rejects(callAs(identities.admin, leadIds.rollback, originalFollowUp, 'x'.repeat(2001)), { code: '22023' });
  });
});
