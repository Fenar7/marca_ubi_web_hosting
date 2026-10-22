/**
 * @file clean-synthetic-leads.ts
 * @description Purges 10,000 synthetic stress-test records from public.leads table.
 *              Guarantees the PostgreSQL leads table and get_pipeline_kpis RPC return
 *              authentic boutique agency figures without benchmark skew.
 * @module scripts/clean-synthetic-leads
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!databaseUrl) {
    console.error('Missing DATABASE_URL or SUPABASE_DB_URL in environment.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database.');

    // Count existing synthetic records
    const countRes = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM public.leads WHERE brief_payload->>'synthetic_benchmark' = 'true';`
    );
    const countBefore = parseInt(countRes.rows[0]?.count || '0', 10);
    console.log(`Discovered ${countBefore} synthetic benchmark records.`);

    if (countBefore === 0) {
      console.log('No synthetic benchmark records to clean.');
      return;
    }

    // Atomic deletion of synthetic benchmark records
    const deleteRes = await client.query(
      `DELETE FROM public.leads WHERE brief_payload->>'synthetic_benchmark' = 'true';`
    );
    console.log(`Successfully purged ${deleteRes.rowCount} synthetic benchmark records.`);
  } catch (error) {
    console.error('Failed to purge synthetic benchmark records:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  void main();
}
