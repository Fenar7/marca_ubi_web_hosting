import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { after, before, describe, it } from 'node:test';
import { build } from 'esbuild';

type RpcResponse = { data: unknown; error: { code: string } | null };
type ContactResponse = { success: boolean; receiptId?: string };

interface CaptureFixture {
  request: (request: Request) => Promise<Response>;
  contact: (previous: unknown, form: FormData) => Promise<ContactResponse>;
}

const receipt = {
  id: 'a823de99-31f3-4b53-9554-60ee0c825cdc',
  inquiry_ref: 'INQ-1001',
  lead_id: 'b823de99-31f3-4b53-9554-60ee0c825cdc',
  lead_ref: 'LD-1001',
  outcome: 'linked',
  action: 'MERGE_INQUIRY',
  replayed: false,
};
const state = {
  calls: [] as { functionName: string; p_input: Record<string, unknown> }[],
  responses: [] as RpcResponse[],
  scheduled: [] as Array<() => Promise<void>>,
  notifications: [] as Record<string, unknown>[],
};
const globalState = globalThis as typeof globalThis & {
  __publicInquiryFixture?: typeof state;
};
let fixture: CaptureFixture;

before(async () => {
  globalState.__publicInquiryFixture = state;
  const stubs = {
    '@/app/lib/supabase/admin': `export const getAdminClient = () => ({
      rpc: async (functionName,args) => {
        const state = globalThis.__publicInquiryFixture;
        state.calls.push({functionName,...args});
        const response = state.responses.shift();
        if (!response) throw new Error('Missing RPC fixture response');
        return response;
      }
    });`,
    'next/server': `export const NextResponse = Response;
      export function after(callback) { globalThis.__publicInquiryFixture.scheduled.push(callback); }`,
    'next/headers': `export async function headers() { return new Headers({'x-real-ip':'127.0.1.1'}); }`,
    '@/app/lib/notifications': `export async function dispatchStudioLeadAlert(payload) {
      globalThis.__publicInquiryFixture.notifications.push(payload);
      return {success:true};
    }`,
  };
  const bundle = await build({
    stdin: {
      contents: `export { POST as request } from './src/app/api/sales-funnel/ingest/route';
        export { submitContactInquiry as contact } from './src/app/actions/contactActions';`,
      resolveDir: process.cwd(),
      loader: 'ts',
    },
    write: false,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    plugins: [
      {
        name: 'capture-fixture',
        setup(builder) {
          builder.onResolve(
            {
              filter:
                /^(next\/server|next\/headers|@\/app\/lib\/(supabase\/admin|notifications))$/,
            },
            (args) => ({
              path: args.path,
              namespace: 'capture-fixture',
            }),
          );
          builder.onLoad(
            { filter: /.*/, namespace: 'capture-fixture' },
            (args) => ({
              contents: stubs[args.path as keyof typeof stubs],
              loader: 'js',
            }),
          );
        },
      },
    ],
  });
  const output = { exports: {} };
  const require = createRequire(import.meta.url);
  new Function('module', 'exports', 'require', bundle.outputFiles[0].text)(
    output,
    output.exports,
    require,
  );
  fixture = output.exports as CaptureFixture;
});

after(() => {
  delete globalState.__publicInquiryFixture;
});

function websiteRequest(body: string) {
  return new Request('http://localhost/api/sales-funnel/ingest', {
    method: 'POST',
    headers: {
      'x-idempotency-key': 'capture-test-id',
      'x-real-ip': '127.0.1.2',
    },
    body,
  });
}

function contactForm() {
  const form = new FormData();
  form.set('name', 'Fixture Person');
  form.set('email', 'fixture@example.test');
  form.set('message', 'Please tell me more about studio services.');
  form.set('track', 'new-business');
  form.set('idempotencyKey', 'contact-test-id');
  return form;
}

describe('public inquiry adapters against a bounded RPC fixture', () => {
  it('returns the committed receipt without exposing an existing lead, and does not notify again on replay', async () => {
    const body = JSON.stringify({
      name: 'Fixture Person',
      email: 'fixture@example.test',
      source_name: 'Chat Pod',
      source_detail: 'Service enquiry and optional deliverables (chat pod v2)',
      brief_payload: {
        timeline: 'June',
        client_ip: '127.0.0.1',
        idempotencyKey: 'ignored',
        chatPod: {
          version: 2,
          serviceInterests: [{ label: 'Web design', hidden: true }],
        },
      },
    });
    state.responses.push(
      { data: receipt, error: null },
      { data: { ...receipt, replayed: true }, error: null },
    );
    const first = await fixture.request(websiteRequest(body));
    assert.equal(first.status, 201);
    assert.deepEqual(await first.json(), {
      success: true,
      receiptId: 'INQ-1001',
      message: 'Your inquiry has been received.',
    });
    assert.equal((await fixture.request(websiteRequest(body))).status, 200);
    assert.equal(state.calls[0].functionName, 'record_inquiry');
    assert.equal(state.calls[0].p_input.origin, 'chat_pod');
    assert.equal(state.calls[0].p_input.idempotency_key, 'capture-test-id');
    assert.deepEqual(state.calls[0].p_input.brief, {
      timeline: 'June',
      serviceInterests: ['Web design'],
    });
    assert.equal(state.scheduled.length, 1);
    await state.scheduled.shift()?.();
    assert.equal(state.notifications.length, 1);
  });

  it('rejects oversized JSON without Content-Length before touching the database', async () => {
    const callCount = state.calls.length;
    const response = await fixture.request(
      websiteRequest('x'.repeat(64 * 1024 + 1)),
    );
    assert.equal(response.status, 413);
    assert.equal(state.calls.length, callCount);
  });

  it('returns an unavailable response for database errors and logs no phantom success', async () => {
    state.responses.push({ data: null, error: { code: 'PGRST202' } });
    const response = await fixture.request(
      websiteRequest(
        JSON.stringify({
          name: 'Fixture Person',
          email: 'fixture@example.test',
          source_name: 'Contact Page',
          source_detail: 'Contact Page Direct Inquiry',
        }),
      ),
    );
    assert.equal(response.status, 503);
    assert.equal(state.calls.at(-1)?.p_input.origin, 'website');
  });

  it('returns Contact failure until a valid receipt is committed', async () => {
    state.responses.push(
      { data: null, error: { code: 'P0001' } },
      { data: null, error: null },
      { data: { ...receipt, replayed: true }, error: null },
    );
    assert.equal((await fixture.contact(null, contactForm())).success, false);
    assert.equal((await fixture.contact(null, contactForm())).success, false);
    assert.deepEqual(await fixture.contact(null, contactForm()), {
      success: true,
      message: 'Your inquiry has been received.',
      receiptId: 'INQ-1001',
    });
    assert.equal(state.calls.at(-1)?.p_input.origin, 'contact');
    assert.equal(
      state.calls.at(-1)?.p_input.idempotency_key,
      'contact-test-id',
    );
  });
});
