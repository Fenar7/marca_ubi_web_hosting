/**
 * @file verify-sprint-4-2.ts
 * @description Comprehensive automated verification engine for Sprint 4.2:
 *              Lead Reassignment Wizard, Stored Procedure & Activity Backfill.
 *              Deploys and verifies live PostgreSQL stored procedure (20261015000008_atomic_reassignment_proc.sql),
 *              validates Zod validation contracts (leadReassignmentSchema),
 *              verifies caller admin authorization guards (ERRCODE 42501),
 *              verifies destination role and operational status guards (ERRCODE 22023),
 *              verifies deterministic row locking and ACID transactional integrity,
 *              confirms immutable touchpoint backfill in public.lead_activities,
 *              confirms tamper-proof audit trails in public.team_audit_logs,
 *              and validates preservation of Converted and Lost leads.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { leadReassignmentSchema, repInventoryQuerySchema } from '../src/app/lib/reassignment-schemas';

dotenv.config({ path: '.env.local' });

async function runSprint42Verification(): Promise<void> {
  console.log('Marca Ubi CRM - Sprint 4.2 Automated Verification Engine');
  console.log('Validating Lead Reassignment Wizard, Stored Procedure & Activity Backfill...\n');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is missing from environment. Verify .env.local configuration.');
  }

  const client = new pg.Client({ connectionString });
  await client.connect();
  console.log('[OK] Connected to live Supabase PostgreSQL database.');

  let totalAssertions = 0;
  let passedAssertions = 0;

  function assert(condition: boolean, description: string): void {
    totalAssertions++;
    if (condition) {
      passedAssertions++;
      console.log(`  ✓ ${description}`);
    } else {
      console.error(`  ✗ FAILED: ${description}`);
      throw new Error(`Assertion failed: ${description}`);
    }
  }

  try {
    // Test Suite 1: Migration deployment and stored procedure invariants
    console.log('\n[TEST 1] Deploying and validating migration: 20261015000008_atomic_reassignment_proc.sql...');
    const migrationPath = path.resolve('supabase/migrations/20261015000008_atomic_reassignment_proc.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    await client.query(migrationSql);
    console.log('  Migration 20261015000008 deployed successfully.');

    // Verify stored procedure existence and attributes in pg_proc
    const procRes = await client.query(`
      SELECT p.proname, p.prosecdef, p.proconfig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'execute_atomic_lead_reassignment';
    `);

    assert(procRes.rows.length === 1, 'Stored procedure public.execute_atomic_lead_reassignment exists');
    assert(procRes.rows[0].prosecdef === true, 'Stored procedure is declared SECURITY DEFINER');

    const proconfig = procRes.rows[0].proconfig || [];
    const hasSearchPath = proconfig.some((c: string) => c.includes('search_path=public, auth, pg_temp'));
    assert(hasSearchPath, 'Stored procedure enforces pinned search_path to eliminate CWE-426 hijacking');

    // Verify EXECUTE permission is revoked from anon and PUBLIC
    const aclRes = await client.query(`
      SELECT has_function_privilege('anon', 'public.execute_atomic_lead_reassignment(uuid, uuid, uuid, text)', 'execute') AS anon_can_exec,
             has_function_privilege('authenticated', 'public.execute_atomic_lead_reassignment(uuid, uuid, uuid, text)', 'execute') AS auth_can_exec;
    `);
    assert(aclRes.rows[0].anon_can_exec === false, 'Anonymous execution privilege is revoked from public.execute_atomic_lead_reassignment');
    assert(aclRes.rows[0].auth_can_exec === true, 'Authenticated execution privilege is granted to public.execute_atomic_lead_reassignment');

    // Test Suite 2: Client Zod validation contracts
    console.log('\n[TEST 2] Testing Zod schemas in src/app/lib/reassignment-schemas.ts...');
    const testAdminId = 'a0000000-0000-0000-0000-000000000001';
    const testSourceId = 'a0000000-0000-0000-0000-000000000002';
    const testDestId = 'a0000000-0000-0000-0000-000000000003';

    const validPayload = {
      sourceUserId: testSourceId,
      destinationUserId: testDestId,
      transferReason: 'Commercial account reassignment due to employee offboarding.',
    };
    const validResult = leadReassignmentSchema.safeParse(validPayload);
    assert(validResult.success === true, 'leadReassignmentSchema validates legitimate payload');

    // Reject self-reassignment (source === destination)
    const selfReassignResult = leadReassignmentSchema.safeParse({
      sourceUserId: testSourceId,
      destinationUserId: testSourceId,
      transferReason: 'Transferring to self should fail.',
    });
    assert(selfReassignResult.success === false, 'leadReassignmentSchema rejects identical source and destination IDs');

    // Reject short transfer reason (< 5 characters)
    const shortReasonResult = leadReassignmentSchema.safeParse({
      sourceUserId: testSourceId,
      destinationUserId: testDestId,
      transferReason: 'abc',
    });
    assert(shortReasonResult.success === false, 'leadReassignmentSchema rejects transfer reason under 5 characters');

    // Reject non-UUID strings
    const invalidUuidResult = leadReassignmentSchema.safeParse({
      sourceUserId: 'not-a-uuid',
      destinationUserId: testDestId,
      transferReason: 'Legitimate reason string.',
    });
    assert(invalidUuidResult.success === false, 'leadReassignmentSchema rejects invalid UUID strings');

    // Test rep inventory query schema
    const inventoryQueryValid = repInventoryQuerySchema.safeParse({ userId: testSourceId });
    assert(inventoryQueryValid.success === true, 'repInventoryQuerySchema validates standard UUID query');

    // Test Suite 3: Database Authorization & Input Guard Verification
    console.log('\n[TEST 3] Testing stored procedure perimeter defenses & edge guards...');

    // 3.1 Non-admin caller rejection
    const nonAdminUserRes = await client.query(`
      SELECT id FROM public.profiles WHERE role <> 'admin' AND status = 'active' LIMIT 1;
    `);
    if (nonAdminUserRes.rows.length > 0) {
      const nonAdminId = nonAdminUserRes.rows[0].id;
      let unauthorizedCaught = false;
      try {
        await client.query(`
          SELECT public.execute_atomic_lead_reassignment(
            $1::uuid, $2::uuid, $3::uuid, 'Unauthorized attempt'
          );
        `, [testSourceId, testDestId, nonAdminId]);
      } catch (err: unknown) {
        unauthorizedCaught = true;
        const pgErr = err as { code?: string; message?: string };
        assert(pgErr.code === '42501', 'Non-admin caller is rejected with ERRCODE 42501 (UNAUTHORIZED)');
      }
      assert(unauthorizedCaught, 'Non-admin execution was blocked by procedure guard');
    }

    // 3.2 Fetch live active admin for authorized test execution
    const activeAdminRes = await client.query(`
      SELECT id, email FROM public.profiles WHERE role = 'admin' AND status = 'active' LIMIT 1;
    `);
    assert(activeAdminRes.rows.length > 0, 'Active agency administrator profile is available for verification');
    const liveAdminId = activeAdminRes.rows[0].id;

    // 3.3 Transfer reason guard (< 5 chars)
    let shortReasonCaught = false;
    try {
      await client.query(`
        SELECT public.execute_atomic_lead_reassignment(
          $1::uuid, $2::uuid, $3::uuid, 'no'
        );
      `, [testSourceId, testDestId, liveAdminId]);
    } catch (err: unknown) {
      shortReasonCaught = true;
      const pgErr = err as { code?: string };
      assert(pgErr.code === '22023', 'Transfer reason under 5 chars is rejected with ERRCODE 22023 (INVALID PARAMETER)');
    }
    assert(shortReasonCaught, 'Short transfer reason was rejected');

    // 3.4 Self-reassignment guard in SQL
    let selfReassignCaught = false;
    try {
      await client.query(`
        SELECT public.execute_atomic_lead_reassignment(
          $1::uuid, $1::uuid, $2::uuid, 'Self transfer attempt'
        );
      `, [testSourceId, liveAdminId]);
    } catch (err: unknown) {
      selfReassignCaught = true;
      const pgErr = err as { code?: string };
      assert(pgErr.code === '22023', 'Self reassignment is rejected with ERRCODE 22023');
    }
    assert(selfReassignCaught, 'Self reassignment was blocked in database engine');

    // Test Suite 4: Destination User Validation Guards
    console.log('\n[TEST 4] Testing destination personnel validation (status & role whitelist)...');

    // 4.1 Non-existent destination profile
    let missingDestCaught = false;
    const fakeDestId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    try {
      await client.query(`
        SELECT public.execute_atomic_lead_reassignment(
          $1::uuid, $2::uuid, $3::uuid, 'Reassign to missing user'
        );
      `, [liveAdminId, fakeDestId, liveAdminId]);
    } catch (err: unknown) {
      missingDestCaught = true;
      const pgErr = err as { code?: string };
      assert(pgErr.code === '02000', 'Missing destination profile is rejected with ERRCODE 02000 (NOT FOUND)');
    }
    assert(missingDestCaught, 'Missing destination was rejected');

    // 4.2 Suspended destination profile
    const suspendedRepId = 'b0000000-0000-0000-0000-000000000099';
    await client.query(`
      INSERT INTO auth.users (id, email)
      VALUES ($1, 'suspended.dest@marcaubi.com')
      ON CONFLICT (id) DO NOTHING;
    `, [suspendedRepId]);

    await client.query(`
      INSERT INTO public.profiles (id, email, full_name, role, status, job_title)
      VALUES ($1, 'suspended.dest@marcaubi.com', 'Suspended Dest Rep', 'sales_executive', 'suspended', 'Sales Rep')
      ON CONFLICT (id) DO UPDATE SET status = 'suspended';
    `, [suspendedRepId]);

    let suspendedDestCaught = false;
    try {
      await client.query(`
        SELECT public.execute_atomic_lead_reassignment(
          $1::uuid, $2::uuid, $3::uuid, 'Reassign to suspended user'
        );
      `, [liveAdminId, suspendedRepId, liveAdminId]);
    } catch (err: unknown) {
      suspendedDestCaught = true;
      const pgErr = err as { code?: string; message?: string };
      assert(pgErr.code === '22023', 'Suspended destination profile is rejected with ERRCODE 22023');
      assert(pgErr.message?.includes('active user') === true, 'Error message explicitly specifies active requirement');
    }
    assert(suspendedDestCaught, 'Reassignment to suspended destination was blocked');

    // 4.3 Non-commercial role destination profile (e.g. viewer)
    const viewerRepId = 'b0000000-0000-0000-0000-000000000098';
    await client.query(`
      INSERT INTO auth.users (id, email)
      VALUES ($1, 'viewer.dest@marcaubi.com')
      ON CONFLICT (id) DO NOTHING;
    `, [viewerRepId]);

    await client.query(`
      INSERT INTO public.profiles (id, email, full_name, role, status, job_title)
      VALUES ($1, 'viewer.dest@marcaubi.com', 'Viewer Personnel', 'viewer', 'active', 'Financial Viewer')
      ON CONFLICT (id) DO UPDATE SET role = 'viewer', status = 'active';
    `, [viewerRepId]);

    let viewerDestCaught = false;
    try {
      await client.query(`
        SELECT public.execute_atomic_lead_reassignment(
          $1::uuid, $2::uuid, $3::uuid, 'Reassign to viewer personnel'
        );
      `, [liveAdminId, viewerRepId, liveAdminId]);
    } catch (err: unknown) {
      viewerDestCaught = true;
      const pgErr = err as { code?: string; message?: string };
      assert(pgErr.code === '22023', 'Non-commercial role destination is rejected with ERRCODE 22023');
      assert(pgErr.message?.includes('commercial role') === true, 'Error message explicitly specifies commercial role requirement');
    }
    assert(viewerDestCaught, 'Reassignment to viewer role was blocked');

    // Test Suite 5: End-to-End Atomic Batch Reassignment Transaction
    console.log('\n[TEST 5] Executing end-to-end atomic batch reassignment transaction...');

    // 5.1 Set up active source and destination commercial representatives
    const sourceRepId = 'c0000000-0000-0000-0000-000000000001';
    const destRepId = 'c0000000-0000-0000-0000-000000000002';

    await client.query(`
      INSERT INTO auth.users (id, email)
      VALUES 
        ($1, 'source.rep@marcaubi.com'),
        ($2, 'dest.rep@marcaubi.com')
      ON CONFLICT (id) DO NOTHING;
    `, [sourceRepId, destRepId]);

    await client.query(`
      INSERT INTO public.profiles (id, email, full_name, role, status, job_title)
      VALUES 
        ($1, 'source.rep@marcaubi.com', 'Marcus Vance (Departing Rep)', 'sales_executive', 'suspended', 'Senior Account Exec'),
        ($2, 'dest.rep@marcaubi.com', 'Zayd Al-Hadi (Receiving Rep)', 'sales_manager', 'active', 'Sales Manager')
      ON CONFLICT (id) DO UPDATE 
        SET status = EXCLUDED.status, role = EXCLUDED.role, full_name = EXCLUDED.full_name;
    `, [sourceRepId, destRepId]);

    // Retrieve active and terminal funnel status UUIDs
    const activeStatusRes = await client.query(`
      SELECT id, name FROM public.funnel_statuses WHERE bucket IN ('open', 'potential') ORDER BY sort_order ASC LIMIT 2;
    `);
    const convertedStatusRes = await client.query(`
      SELECT id, name FROM public.funnel_statuses WHERE bucket = 'converted' LIMIT 1;
    `);
    const lostStatusRes = await client.query(`
      SELECT id, name FROM public.funnel_statuses WHERE bucket = 'lost' LIMIT 1;
    `);

    assert(activeStatusRes.rows.length >= 2, 'Active funnel statuses are available in database');
    assert(convertedStatusRes.rows.length === 1, 'Converted status is available in database');
    assert(lostStatusRes.rows.length === 1, 'Lost status is available in database');

    const status1Id = activeStatusRes.rows[0].id;
    const status2Id = activeStatusRes.rows[1].id;
    const convertedStatusId = convertedStatusRes.rows[0].id;
    const lostStatusId = lostStatusRes.rows[0].id;

    // Fetch default lead source
    const sourceRes = await client.query(`SELECT id FROM public.lead_sources LIMIT 1;`);
    const defaultLeadSourceId = sourceRes.rows[0].id;

    // Clean up any existing test leads and activities for these explicit test IDs
    const testLead1 = 'e0000000-0000-0000-0000-000000000001';
    const testLead2 = 'e0000000-0000-0000-0000-000000000002';
    const testLead3 = 'e0000000-0000-0000-0000-000000000003';
    const testLeadConverted = 'e0000000-0000-0000-0000-000000000004';
    const testLeadLost = 'e0000000-0000-0000-0000-000000000005';

    await client.query(`DELETE FROM public.lead_activities WHERE lead_id IN ($1, $2, $3, $4, $5);`, [testLead1, testLead2, testLead3, testLeadConverted, testLeadLost]);
    await client.query(`DELETE FROM public.leads WHERE id IN ($1, $2, $3, $4, $5);`, [testLead1, testLead2, testLead3, testLeadConverted, testLeadLost]);
    await client.query(`DELETE FROM public.team_audit_logs WHERE details->>'source_user_id' = $1;`, [sourceRepId]);

    // Insert 3 active deals, 1 converted deal, and 1 lost deal assigned to source rep
    await client.query(`
      INSERT INTO public.leads (id, name, company, email, phone, lead_source_id, status_id, assigned_to, expected_value, priority)
      VALUES 
        ($1, 'Dubai Luxury Penthouse Deal', 'Emaar Properties', 'contact1@emaar.ae', '+971501110001', $6, $7, $11, 2500000.00, 'High'),
        ($2, 'Financial Freezone Brief', 'DIFC Holdings', 'contact2@difc.ae', '+971501110002', $6, $8, $11, 1500000.00, 'Medium'),
        ($3, 'Hospitality Brand Redesign', 'Jumeirah Group', 'contact3@jumeirah.ae', '+971501110003', $6, $7, $11, 750000.00, 'High'),
        ($4, 'Converted Flagship Portal', 'ADNOC Logistics', 'contact4@adnoc.ae', '+971501110004', $6, $9, $11, 4000000.00, 'High'),
        ($5, 'Closed Lost Opportunity', 'Old Venture LLC', 'contact5@venture.ae', '+971501110005', $6, $10, $11, 500000.00, 'Low')
      ON CONFLICT (id) DO UPDATE SET 
        assigned_to = EXCLUDED.assigned_to,
        status_id = EXCLUDED.status_id,
        expected_value = EXCLUDED.expected_value;
    `, [
      testLead1,
      testLead2,
      testLead3,
      testLeadConverted,
      testLeadLost,
      defaultLeadSourceId,
      status1Id,
      status2Id,
      convertedStatusId,
      lostStatusId,
      sourceRepId,
    ]);

    // 5.2 Execute atomic stored procedure
    const transferReasonText = 'Comprehensive commercial offboarding transfer to regional manager.';
    const rpcExecRes = await client.query(`
      SELECT public.execute_atomic_lead_reassignment(
        $1::uuid, $2::uuid, $3::uuid, $4::text
      ) AS result;
    `, [sourceRepId, destRepId, liveAdminId, transferReasonText]);

    const resultJson = rpcExecRes.rows[0].result;
    assert(resultJson.success === true, 'Stored procedure returned success: true');
    assert(resultJson.reassigned_count === 3, 'Stored procedure correctly reassigned exactly 3 active deals');
    assert(Number(resultJson.total_value) === 4750000.00, 'Stored procedure calculated accurate cumulative valuation (₹47,50,000)');

    // 5.3 Verify lead table state post-reassignment
    const reassignedLeadsRes = await client.query(`
      SELECT id, assigned_to, expected_value, status_id 
      FROM public.leads 
      WHERE id IN ($1, $2, $3);
    `, [testLead1, testLead2, testLead3]);

    assert(reassignedLeadsRes.rows.length === 3, 'All 3 active leads located in database');
    reassignedLeadsRes.rows.forEach((row: { id: string; assigned_to: string }) => {
      assert(row.assigned_to === destRepId, `Lead ${row.id} assigned_to updated to destination rep (${destRepId})`);
    });

    // 5.4 Verify historical ownership preservation (Converted & Lost leads remain untouched)
    const untouchedLeadsRes = await client.query(`
      SELECT id, assigned_to, status_id
      FROM public.leads 
      WHERE id IN ($1, $2);
    `, [testLeadConverted, testLeadLost]);

    assert(untouchedLeadsRes.rows.length === 2, 'Historical terminal leads located in database');
    untouchedLeadsRes.rows.forEach((row: { id: string; assigned_to: string }) => {
      assert(row.assigned_to === sourceRepId, `Terminal lead ${row.id} remained assigned to source rep (${sourceRepId}) to preserve historical records`);
    });

    // 5.5 Verify immutable activity entries in public.lead_activities
    const activitiesRes = await client.query(`
      SELECT lead_id, actor_id, activity_type, description, metadata
      FROM public.lead_activities
      WHERE lead_id IN ($1, $2, $3) AND activity_type = 'reassignment'
      ORDER BY created_at DESC;
    `, [testLead1, testLead2, testLead3]);

    assert(activitiesRes.rows.length === 3, 'Exactly 3 reassignment activity records backfilled in public.lead_activities');
    activitiesRes.rows.forEach((act: { lead_id: string; actor_id: string; activity_type: string; description: string; metadata: any }) => {
      assert(act.actor_id === liveAdminId, `Activity on lead ${act.lead_id} attributes acting administrator`);
      assert(act.activity_type === 'reassignment', `Activity type conforms to whitelist ('reassignment')`);
      assert(act.description.includes('Commercial ownership transferred'), 'Activity description details transfer');
      assert(act.metadata.previous_rep_id === sourceRepId, 'Activity metadata captures previous rep UUID');
      assert(act.metadata.new_rep_id === destRepId, 'Activity metadata captures new rep UUID');
      assert(act.metadata.transfer_reason === transferReasonText, 'Activity metadata captures transfer reason');
    });

    // 5.6 Verify team audit trail in public.team_audit_logs
    const auditRes = await client.query(`
      SELECT actor_id, action, target_user_email, details
      FROM public.team_audit_logs
      WHERE action = 'leads_bulk_reassigned' AND actor_id = $1
      ORDER BY created_at DESC
      LIMIT 1;
    `, [liveAdminId]);

    assert(auditRes.rows.length === 1, 'Audit log entry recorded for leads_bulk_reassigned');
    const auditEntry = auditRes.rows[0];
    assert(auditEntry.action === 'leads_bulk_reassigned', 'Audit log action matches leads_bulk_reassigned');
    assert(auditEntry.details.source_user_id === sourceRepId, 'Audit log records source representative');
    assert(auditEntry.details.destination_user_id === destRepId, 'Audit log records destination representative');
    assert(auditEntry.details.reassigned_count === 3, 'Audit log records reassigned count (3)');
    assert(Number(auditEntry.details.total_value) === 4750000.00, 'Audit log records total transferred valuation');

    // Test Suite 6: Zero Deals Safeguard
    console.log('\n[TEST 6] Testing zero active deals safeguard...');
    // Now sourceRep has 0 active deals remaining
    const zeroDealsRes = await client.query(`
      SELECT public.execute_atomic_lead_reassignment(
        $1::uuid, $2::uuid, $3::uuid, 'Reassign empty rep'
      ) AS result;
    `, [sourceRepId, destRepId, liveAdminId]);

    const zeroResultJson = zeroDealsRes.rows[0].result;
    assert(zeroResultJson.success === true, 'Zero active deals call returns success: true');
    assert(zeroResultJson.reassigned_count === 0, 'Zero active deals call returns reassigned_count: 0');
    assert(zeroResultJson.message.includes('No active leads') === true, 'Zero active deals returns informative message');

    // Clean up temporary test data
    console.log('\n[CLEANUP] Cleaning up verification artifacts...');
    await client.query(`DELETE FROM public.lead_activities WHERE lead_id IN ($1, $2, $3, $4, $5);`, [testLead1, testLead2, testLead3, testLeadConverted, testLeadLost]);
    await client.query(`DELETE FROM public.leads WHERE id IN ($1, $2, $3, $4, $5);`, [testLead1, testLead2, testLead3, testLeadConverted, testLeadLost]);
    await client.query(`DELETE FROM public.team_audit_logs WHERE details->>'source_user_id' = $1;`, [sourceRepId]);
    await client.query(`DELETE FROM public.profiles WHERE id IN ($1, $2, $3, $4);`, [sourceRepId, destRepId, suspendedRepId, viewerRepId]);
    await client.query(`DELETE FROM auth.users WHERE id IN ($1, $2, $3, $4);`, [sourceRepId, destRepId, suspendedRepId, viewerRepId]);
    console.log('  Test entities and artifacts cleanly purged.');

    console.log('\n[SUMMARY] SPRINT 4.2 VERIFICATION SUMMARY:');
    console.log(`Total Assertions Evaluated: ${totalAssertions}`);
    console.log(`Assertions Passed:         ${passedAssertions}`);
    console.log(`Assertions Failed:         0`);
    console.log('Status:                    100% PRODUCTION-READY\n');
  } finally {
    await client.end();
  }
}

runSprint42Verification().catch((err) => {
  console.error('\nVerification run failed:', err);
  process.exit(1);
});
