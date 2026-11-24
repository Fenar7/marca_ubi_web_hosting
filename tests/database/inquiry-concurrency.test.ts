import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { Client } from "pg";

const connectionString = process.env.CRM_ISOLATED_DATABASE_URL;

test(
  "concurrent intake preserves one receipt per intent and one lead for overlapping contacts",
  {
    skip: !connectionString,
  },
  async () => {
    const url = new URL(connectionString!);
    assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(url.hostname));
    assert.match(decodeURIComponent(url.pathname), /_test$/i);

    const clients = Array.from(
      { length: 3 },
      () => new Client({ connectionString }),
    );
    const [first, retry, observer] = clients;
    const email = randomUUID() + "@example.invalid";
    const idempotencyKey = randomUUID();
    const followUpKey = randomUUID();
    const payload = {
      origin: "contact",
      email,
      name: "Inquiry concurrency fixture",
      summary: "Test capture.",
      idempotency_key: idempotencyKey,
    };
    let observerConnected = false;

    /** Each worker gets its own transaction and service JWT context. */
    async function capture(client: Client, intent: typeof payload) {
      await client.query("BEGIN");
      try {
        await client.query("SET LOCAL ROLE service_role");
        await client.query(
          "SELECT set_config('request.jwt.claims', $1, true)",
          ['{"role":"service_role"}'],
        );
        const result = await client.query<{
          receipt: { id: string; lead_id: string; replayed: boolean };
        }>("SELECT public.record_inquiry($1::jsonb) AS receipt", [
          JSON.stringify(intent),
        ]);
        await client.query("COMMIT");
        return result.rows[0].receipt;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    try {
      await observer.connect();
      observerConnected = true;
      await Promise.all([first.connect(), retry.connect()]);
      const [left, right] = await Promise.all([
        capture(first, payload),
        capture(retry, payload),
      ]);
      assert.ok(left.lead_id);
      assert.equal(left.id, right.id);
      assert.notEqual(left.replayed, right.replayed);
      const [third, fourth] = await Promise.all([
        capture(first, { ...payload, idempotency_key: followUpKey }),
        capture(retry, { ...payload, idempotency_key: randomUUID() }),
      ]);
      assert.notEqual(third.id, fourth.id);
      assert.equal(third.lead_id, left.lead_id);
      assert.equal(fourth.lead_id, left.lead_id);
      const leadCount = await observer.query<{ inquiry_count: number }>(
        "SELECT inquiry_count FROM public.leads WHERE email = $1",
        [email],
      );
      assert.deepEqual(leadCount.rows, [{ inquiry_count: 3 }]);
    } finally {
      try {
        if (observerConnected) {
          await observer.query(
            "DELETE FROM public.inquiry_receipts WHERE inquiry_id IN (SELECT id FROM public.inquiries WHERE email = $1)",
            [email],
          );
          await observer.query(
            "DELETE FROM public.inquiries WHERE email = $1",
            [email],
          );
          await observer.query("DELETE FROM public.leads WHERE email = $1", [
            email,
          ]);
        }
      } finally {
        await Promise.allSettled(clients.map((client) => client.end()));
      }
    }
  },
);
