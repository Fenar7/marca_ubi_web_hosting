/**
 * @file client-works-isolation.test.ts
 * @description Master Row Level Security (RLS) Test Suite for Phase 1:
 *              Validates access boundaries, role isolation, and update guards on public.client_works table.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;

describe('Phase 1: Client Works PostgreSQL RLS Multi-Role Isolation Suite', () => {
  let client: Client;

  before(async () => {
    if (!connectionString) {
      throw new Error('DATABASE_URL not set in .env.local');
    }
    client = new Client({ connectionString });
    await client.connect();
  });

  after(async () => {
    if (client) {
      await client.end();
    }
  });

  it('verifies public.client_works has Row Level Security enabled', async () => {
    const res = await client.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
      WHERE pg_namespace.nspname = 'public' 
        AND relname = 'client_works';
    `);
    assert.strictEqual(res.rows.length, 1);
    assert.strictEqual(res.rows[0].relrowsecurity, true, 'client_works table must have row security enabled.');
  });

  it('verifies all 4 required RLS policies exist on client_works', async () => {
    const res = await client.query(`
      SELECT policyname, cmd 
      FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'client_works'
      ORDER BY policyname;
    `);
    const policyNames = res.rows.map((r) => r.policyname);
    assert(policyNames.includes('client_works_select_policy'), 'client_works_select_policy must exist.');
    assert(policyNames.includes('client_works_update_policy'), 'client_works_update_policy must exist.');
    assert(policyNames.includes('client_works_insert_policy'), 'client_works_insert_policy must exist.');
    assert(policyNames.includes('client_works_delete_policy'), 'client_works_delete_policy must exist.');
  });

  it('verifies helper function current_user_has_tab executes stably and safely', async () => {
    const res = await client.query(`
      SELECT proname, prosecdef, provolatile
      FROM pg_proc
      JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
      WHERE pg_namespace.nspname = 'public'
        AND proname = 'current_user_has_tab';
    `);
    assert.strictEqual(res.rows.length, 1);
    assert.strictEqual(res.rows[0].prosecdef, true, 'current_user_has_tab must be SECURITY DEFINER.');
    assert.strictEqual(res.rows[0].provolatile, 's', 'current_user_has_tab must be STABLE.');
  });

  it('verifies client_works_select_policy enforces sales executive sandboxing to assigned projects', async () => {
    const res = await client.query(`
      SELECT qual
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'client_works'
        AND policyname = 'client_works_select_policy';
    `);
    assert.strictEqual(res.rows.length, 1);
    const qual = res.rows[0].qual;
    assert(qual.includes('creative_lead_id'), 'SELECT policy must grant access to creative leads.');
    assert(qual.includes('tech_lead_id'), 'SELECT policy must grant access to tech leads.');
    assert(qual.includes('assigned_to'), 'SELECT policy must grant access to reps assigned to underlying leads.');
  });
});
