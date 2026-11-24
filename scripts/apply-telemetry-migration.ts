/**
 * @file apply-telemetry-migration.ts
 * @description Applies the analytics and leads telemetry engine stored procedures and indexes to PostgreSQL.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

async function applyMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured in .env.local');
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('[OK] Connected to PostgreSQL database.');

  try {
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '20261124220000_analytics_and_leads_telemetry_engine.sql'
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('[INFO] Executing migration: 20261124220000_analytics_and_leads_telemetry_engine.sql...');
    await client.query(sql);
    console.log('[SUCCESS] All telemetry procedures and indexes applied cleanly.');

    // Quick verification
    const res = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_name IN (
          'get_funnel_conversion_dropoff',
          'get_stage_dwell_time_metrics',
          'get_timeframe_revenue_spline',
          'get_service_category_distribution',
          'get_cohort_win_rates',
          'batch_update_lead_status',
          'batch_reassign_leads'
        );
    `);
    console.log(`[VERIFY] Verified ${res.rows.length}/7 stored procedures active in public schema:`);
    res.rows.forEach((r: { routine_name: string }) => console.log(`  - ${r.routine_name}`));
  } catch (error) {
    console.error('[ERROR] Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
