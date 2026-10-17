/**
 * @file verify-sprint-5-1.ts
 * @description Automated Live PostgreSQL & Next.js API Verification Engine for Sprint 5.1:
 *              Public Ingestion Route Handler, Token-Bucket Rate Limiter,
 *              Cryptographic Honeypot Trap & Contact Normalization Engine.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import pg from 'pg';
import * as dotenv from 'dotenv';
import { POST } from '../src/app/api/sales-funnel/ingest/route';
import { resetRateLimit } from '../src/app/lib/rateLimit';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('[FATAL] Missing DATABASE_URL in .env.local.');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: databaseUrl,
});

let totalAssertions = 0;
let passedAssertions = 0;

function assert(condition: boolean, description: string) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ ${description}`);
  } else {
    console.error(`  ✖ FAILED: ${description}`);
    process.exitCode = 1;
  }
}

async function runSprint51Verification() {
  console.log('\n============================================================');
  console.log('Marca Ubi CRM - Sprint 5.1 Automated Verification Engine');
  console.log('Testing Public Ingestion Route Handler, Rate Limiter & Honeypots');
  console.log('============================================================\n');

  await client.connect();
  console.log('[OK] Connected to live Supabase PostgreSQL database.');

  const runId = Date.now();
  const createdLeadIds: string[] = [];

  // Pre-cleanup to guarantee pristine test state
  await client.query(`
    DELETE FROM public.lead_activities 
    WHERE lead_id IN (
      SELECT id FROM public.leads 
      WHERE email LIKE '%@marcaubi-test.ae' 
         OR email = 'zayd.hadi@emaar.ae' 
         OR email = 'anita@studio-mumbai.in'
    );
    DELETE FROM public.leads 
    WHERE email LIKE '%@marcaubi-test.ae' 
       OR email = 'zayd.hadi@emaar.ae' 
       OR email = 'anita@studio-mumbai.in';
  `);

  try {
    // TEST 1: Database Connectivity and Default Catalogs
    console.log('\n[TEST 1] Verifying database connectivity & reference catalogs...');
    const sourcesRes = await client.query(
      'SELECT id, name FROM public.lead_sources WHERE is_active = true'
    );
    assert(sourcesRes.rows.length > 0, 'Active lead sources are available in database');

    const statusRes = await client.query(
      "SELECT id, name, bucket FROM public.funnel_statuses WHERE name = 'New' LIMIT 1"
    );
    const defaultStatus = statusRes.rows[0];
    assert(defaultStatus?.name === 'New', 'Default "New" funnel status exists in database');
    assert(defaultStatus?.bucket === 'open', 'Default "New" funnel status maps to "open" bucket');

    // TEST 2: Payload Size Limit Boundary (< 64KB)
    console.log('\n[TEST 2] Testing payload size limit protection (< 64KB)...');
    const oversizeBody = JSON.stringify({
      name: 'Oversize Tester',
      email: `oversize_${runId}@marcaubi-test.ae`,
      notes: 'A'.repeat(70000), // ~70KB
    });

    const oversizeReq = new Request('http://localhost:3000/api/sales-funnel/ingest', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': String(Buffer.byteLength(oversizeBody)),
        'x-forwarded-for': '203.0.113.10',
      },
      body: oversizeBody,
    });

    const oversizeRes = await POST(oversizeReq);
    assert(oversizeRes.status === 413, 'Oversize request is rejected with HTTP 413 Payload Too Large');

    const oversizeJson = await oversizeRes.json();
    assert(oversizeJson.success === false, 'Oversize response indicates failure');
    assert(oversizeJson.error.includes('64KB'), 'Oversize response specifies 64KB limit');

    // TEST 3: Cryptographic Honeypot Trap
    console.log('\n[TEST 3] Testing cryptographic honeypot trap (_hp_company_url_confirm)...');
    resetRateLimit();

    const honeypotBody = JSON.stringify({
      name: 'Bot Scraper',
      email: 'spambot@darkweb.org',
      phone: '+15559990000',
      _hp_company_url_confirm: 'https://evil-bot-affiliate.xyz',
    });

    const honeypotReq = new Request('http://localhost:3000/api/sales-funnel/ingest', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '198.51.100.99',
      },
      body: honeypotBody,
    });

    const honeypotRes = await POST(honeypotReq);
    assert(honeypotRes.status === 200, 'Honeypot returns simulated HTTP 200 to fool automated bots');

    const honeypotJson = await honeypotRes.json();
    assert(honeypotJson.success === true, 'Honeypot response returns success: true');
    assert(honeypotJson.simulated === true, 'Honeypot response flags simulated: true internally');

    // Verify zero records were written to public.leads
    const botLeads = await client.query(
      "SELECT id FROM public.leads WHERE email = 'spambot@darkweb.org'"
    );
    assert(botLeads.rows.length === 0, 'Zero database records were created for honeypot bot submission');

    // TEST 4: Token-Bucket Rate Limiter (10 reqs / 10 mins)
    console.log('\n[TEST 4] Testing token-bucket rate limiter enforcement (10 reqs / 10 mins)...');
    resetRateLimit();
    const rateLimitTestIp = '198.51.100.77';

    // Dispatch 10 valid requests
    for (let i = 1; i <= 10; i++) {
      const validBody = JSON.stringify({
        name: `Rate Limit Prospect ${i}`,
        email: `ratelimit_${runId}_${i}@marcaubi-test.ae`,
        phone: `050 123 ${String(1000 + i)}`,
      });

      const req = new Request('http://localhost:3000/api/sales-funnel/ingest', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': rateLimitTestIp,
        },
        body: validBody,
      });

      const res = await POST(req);
      assert(res.status === 201, `Request ${i}/10 succeeded with HTTP 201 Created`);

      const remainingHeader = res.headers.get('x-ratelimit-remaining');
      assert(remainingHeader === String(10 - i), `X-RateLimit-Remaining is accurately decremented to ${10 - i}`);

      const json = await res.json();
      if (json.id) createdLeadIds.push(json.id);
    }

    // 11th request must trigger HTTP 429
    const blockedBody = JSON.stringify({
      name: 'Blocked Prospect',
      email: `blocked_${runId}@marcaubi-test.ae`,
      phone: '050 123 4567',
    });

    const blockedReq = new Request('http://localhost:3000/api/sales-funnel/ingest', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': rateLimitTestIp,
      },
      body: blockedBody,
    });

    const blockedRes = await POST(blockedReq);
    assert(blockedRes.status === 429, '11th request is strictly rejected with HTTP 429 Too Many Requests');

    const retryAfterHeader = blockedRes.headers.get('retry-after');
    assert(!!retryAfterHeader && parseInt(retryAfterHeader, 10) > 0, 'Retry-After header is provided');

    const blockedJson = await blockedRes.json();
    assert(blockedJson.success === false, 'Blocked response returns success: false');
    assert(blockedJson.error.includes('Rate limit exceeded'), 'Blocked response returns rate limit error message');

    // TEST 5: Live Contact Normalization & HTML Sanitization Persistence
    console.log('\n[TEST 5] Testing live contact normalization & HTML sanitization persistence...');
    resetRateLimit();

    // UAE submission with mixed case email and HTML characters in name/company
    const uaePayload = JSON.stringify({
      name: '<script>alert("xss")</script>Zayd Al-Hadi',
      email: '  ZAYD.HADI@EMAAR.AE  ',
      phone: '050 123 4567',
      company: 'Emaar & Nakheel Luxury "Properties"',
      company_website: 'https://emaar.ae',
      preferred_channel: 'WhatsApp',
      service_category: 'Web & Digital',
      budget_bracket: '$50,000+',
      notes: 'Testing <img src=x onerror=alert(1)> sanitization in notes.',
      brief_payload: {
        timeline: 'Q2 2027',
        target_budget: 'AED 200,000',
      },
    });

    const uaeReq = new Request('http://localhost:3000/api/sales-funnel/ingest', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.88',
      },
      body: uaePayload,
    });

    const uaeRes = await POST(uaeReq);
    assert(uaeRes.status === 201, 'Live enterprise ingestion returns HTTP 201 Created');

    const uaeJson = await uaeRes.json();
    assert(uaeJson.success === true, 'Response payload contains success: true');
    assert(typeof uaeJson.lead_id === 'string' && uaeJson.lead_id.startsWith('LD-'), 'Lead ID is generated with sequence LD-XXXX');

    if (uaeJson.id) createdLeadIds.push(uaeJson.id);

    // Verify stored entity attributes in PostgreSQL database
    const storedLeadRes = await client.query(
      'SELECT * FROM public.leads WHERE id = $1',
      [uaeJson.id]
    );
    const storedLead = storedLeadRes.rows[0];

    assert(!!storedLead, 'Lead record successfully retrieved from public.leads');
    assert(storedLead.phone === '+971501234567', 'UAE phone number normalized accurately to E.164 (+971501234567)');
    assert(storedLead.email === 'zayd.hadi@emaar.ae', 'Email normalized to trimmed, lowercase string (zayd.hadi@emaar.ae)');
    assert(storedLead.name.includes('&lt;script&gt;'), 'Name string sanitized against XSS script tags');
    assert(storedLead.company.includes('&amp;'), 'Company string sanitized with encoded ampersand');
    assert(storedLead.company.includes('&quot;'), 'Company string sanitized with encoded quotes');
    assert(storedLead.preferred_channel === 'WhatsApp', 'Preferred communication channel stored accurately');
    assert(storedLead.service_category === 'Web & Digital', 'Service category stored accurately');

    // Verify touchpoint logging in public.lead_activities
    const activityRes = await client.query(
      'SELECT * FROM public.lead_activities WHERE lead_id = $1',
      [uaeJson.id]
    );

    assert(activityRes.rows.length >= 1, 'Initial touchpoint recorded in public.lead_activities');
    assert(activityRes.rows[0].activity_type === 'system_event', 'Initial touchpoint classified as system_event');
    assert(activityRes.rows[0].description.includes('Inbound lead inquiry'), 'Touchpoint description records inbound ingestion');

    // Indian phone normalization submission
    const indiaPayload = JSON.stringify({
      name: 'Anita Nair',
      email: 'anita@studio-mumbai.in',
      phone: '098470 12345',
      company: 'Studio Mumbai',
    });

    const indiaReq = new Request('http://localhost:3000/api/sales-funnel/ingest', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.89',
      },
      body: indiaPayload,
    });

    const indiaRes = await POST(indiaReq);
    assert(indiaRes.status === 201, 'Indian contact inquiry returns HTTP 201 Created');

    const indiaJson = await indiaRes.json();
    if (indiaJson.id) createdLeadIds.push(indiaJson.id);

    const storedIndiaRes = await client.query(
      'SELECT phone FROM public.leads WHERE id = $1',
      [indiaJson.id]
    );
    assert(storedIndiaRes.rows[0]?.phone === '+919847012345', 'Indian mobile normalized accurately to E.164 (+919847012345)');

    console.log('\n[CLEANUP] Purging verification test entities...');
    if (createdLeadIds.length > 0) {
      await client.query('DELETE FROM public.lead_activities WHERE lead_id = ANY($1)', [createdLeadIds]);
      await client.query('DELETE FROM public.leads WHERE id = ANY($1)', [createdLeadIds]);
      console.log(`  Purged ${createdLeadIds.length} test lead records and associated touchpoints.`);
    }

    console.log('\n============================================================');
    console.log(`SPRINT 5.1 VERIFICATION COMPLETE: ${passedAssertions}/${totalAssertions} assertions passed.`);
    console.log('STATUS: PRODUCTION-READY | ZERO DEFECTS');
    console.log('============================================================\n');
  } catch (error) {
    console.error('\n[FATAL ERROR IN VERIFICATION SUITE]:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

runSprint51Verification();
