# Public inquiry capture

Contact, Start Project, Chat Pod, and the Company Profile download pass through one database transaction. It records an inquiry, links or creates the lead when permitted, and stores the associated audit evidence. The public handler only acknowledges an inquiry once it receives and validates the transaction receipt. Missing storage configuration, an unavailable RPC, and malformed replies fail closed.

## Public API and rollout

| Path | Contract |
| --- | --- |
| `POST /api/sales-funnel/ingest` | An accepted event returns `201` with `success`, `receiptId`, and `message`. Replaying the same key and normalized payload returns the original receipt and `200`. A conflicting payload with the same key returns `409`. First-party successful requests no longer reveal CRM lead identifiers, duplicate decisions, or counts. |
| Public Contact server action | Success includes the committed `receiptId`. The form preserves its opaque identity when retrying unchanged input. The existing honeypot response remains a no-write path. |
| Request limits | JSON remains limited to 64 KiB, measured against the stream even when the caller omits a byte count. The existing process-local rate limiter still applies. |

The production gate requires the inquiry migration and a server-side `SUPABASE_SERVICE_ROLE_KEY` configured for the same Supabase project as the public application. The prior direct `DATABASE_URL` writer is retired from this route. Apply the migration and confirm the RPC is exposed before switching writers. Verify any external consumer of `id`, `lead_id`, or `action` and migrate it to the receipt contract. The inspected in-repository consumers either check the HTTP success status or display the new receipt. The public endpoint accepts an optional idempotency header for legacy callers. A request that omits it is a new intent, so automated retries must always send a stable key.

Contact provenance comes from its dedicated server action. The shared browser endpoint maps known source and detail pairs to Start Project, Chat Pod, or Website and never accepts manual or Contact origin. Browser markers identify the reported surface, with no authentication proof of the browser's page. Chat Pod v2 retains bounded service labels and drops unrecognized nested metadata. Visitor IP, synthetic flags, and private CRM metadata are not carried from the request into the inquiry brief.

## Studio alerts

Next.js schedules the internal alert after the response for each committed non-replay. The adapter never converts a committed inquiry into a failed save when alert scheduling fails. Platform logs use the inquiry reference rather than contact details when an alert destination is absent. Until there is a durable outbox and retry worker, a rejected webhook, a lost database acknowledgement after commit, or interrupted background work can leave an inquiry recorded without an alert. Replaying the public request returns the existing receipt and does not try to send the alert again. The persisted inbox remains the operational record. [Next.js after documentation](https://nextjs.org/docs/app/api-reference/functions/after)

## Verification

The focused run passed 141 tests covering the public ingest, Contact, Chat Pod parity, and ProjectForm contracts. The new fixture imports the actual route and server action with the RPC, request header, response scheduler, and webhook dependencies stubbed. It verifies a public receipt without internal lead data, unchanged retry scheduling once, bounded request streaming, Chat Pod v2 provenance and brief projection, capture failure when the RPC is unavailable, and Contact acknowledgement only when the reply supplies a valid receipt. Focused ESLint passed.

The fixture provides adapter and response evidence. It does not run the database transaction, establish concurrency behavior or RLS, exercise a deployed request context, or deliver an alert. Release verification must exercise each surface on isolated staging with notifications disabled or sent to the test destination. Do not submit fixture inquiries to production.
