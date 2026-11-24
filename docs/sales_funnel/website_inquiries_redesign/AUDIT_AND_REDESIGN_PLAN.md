# Website Inquiries audit and redesign plan

Status: proposed for review. Scope: public intake capture, the authenticated Website Inquiries queue, and manual inquiry entry. Source reviewed on `redesign/crm-fundora-editorial-cockpit` at head `97ed5fd` with unrelated local Client Works changes present. Evidence comes from the supplied screenshot, repository source, and three specialist reviews of data, workflow, and design. No live CRM data, public submission, deployed rate settings, or authenticated production journey was tested.

## 1. What exists today

Website intake is implemented. The admin page is an inspection console with a recent-leads sample and a link to the lead dossier. It lacks a scoped inquiry inbox, operator entry, and inquiry-specific triage. A lead is the current CRM relationship. An inquiry is an individual submission or staff-recorded interaction. Several inquiries can belong to one lead, so a list of leads cannot answer how many inquiries arrived.

| What the screen shows | What the code measures or does | Severity and decision |
| --- | --- | --- |
| Endpoint Health: Unavailable | The page hardcodes this value. No health probe is connected. | Remove from the inbox. Add an administrator diagnostics surface only if there is a measured availability signal with a timestamp and defined scope. |
| New leads (24 hours): 0 | Counts newly created lead records across all sources during a rolling 24-hour window, excluding records flagged as synthetic benchmarks. A repeat inquiry on an existing lead does not create another lead row. The screenshot count was not independently verified. | Replace with **Received in the last 24 hours**, counted from persisted inquiry events. |
| Smart Merges (24H): 0 | Counts rows labeled `duplicate_inquiry` across sources, with a synthetic metadata exclusion. It does not reconcile individual intake attempts. The secondary line refers to a settings read. | Use **Repeat inquiries** as an outcome filter. Leave it off the default summary until the event model captures it consistently. |
| Bot Shield Guard: Unavailable | Reads a configuration field. The audited gateway invokes a separate in-memory limiter with 10 requests per 10 minutes per instance/IP key. This card is neither enforcement proof nor a count of blocked requests. The screenshot alone does not establish why the settings call failed. | Remove from operator view. If diagnostics are commissioned, reconcile policy and effective enforcement before displaying either. |
| Recent leads / Latest 10 | The query fetches up to ten leads from all sources with no inquiry-specific filters or pagination. The service category chip is not a source label. A contact can appear here for reasons unrelated to website intake. | Replace with a source-scoped, paginated inquiry inbox. |
| Inspect JSON | The page sends the whole saved `brief_payload` to the client. Content varies by source, and the Contact path stores IP data in that field. The reference can open the existing lead dossier. | Show an allowlisted brief and contact details where authorized. Reuse the dossier link. Exclude raw payload, IP, and correlation secrets from inbox DTOs. |
| Simulate Inbound Brief | Calls the settings server action, not the public HTTP route. An admin or manager can persist a synthetic lead and activity or update a matching synthetic lead. The action refuses to mutate an identified live match. | Remove from the operator page. Use local fixtures and isolated staging for testing, with notifications disabled or routed to a test sink. |
| Activity feed | Fetches general lead system and status events plus duplicates. The projection leaves out `lead_id`, and the list is not scoped to specific inquiry events. | Use the selected inquiry's own history, including receipt, link or creation, assignment, and triage. |

Sources: [page query](../../../src/app/admin/%28workspace%29/ingestion/page.tsx#L65), [client controls](../../../src/app/admin/%28workspace%29/ingestion/components/IngestionWorkspaceClient.tsx#L137), [settings read](../../../src/app/actions/settings.ts#L104), [simulation action](../../../src/app/actions/settings.ts#L256), [effective limiter](../../../src/app/lib/rateLimit.ts#L22).

### Capture and creation gaps

- **Contact can acknowledge a failed write.** The Contact action checks neither every database result nor the presence of a configured admin client before returning success. It also has a separate duplicate-handling path. Fix accepted-result semantics before using the inbox as an operational source of truth. [Contact persistence](../../../src/app/actions/contactActions.ts#L110)
- **Start Project and Chat Pod share a payload builder** with distinct source labels. The public gateway resolves lead sources and handles new and repeat paths, but its branches use different persistence mechanisms. Consolidate the write boundary and derive channel provenance from the approved intake path, rather than a free-text label alone. [Shared payload attribution](../../../src/app/lib/intake/ingestPayload.ts#L35) · [Gateway](../../../src/app/api/sales-funnel/ingest/route.ts#L174)
- **Add Lead has a different meaning.** The shared shell gates the modal by Leads-tab access. The creation action defaults source by caller role, writes an activity separately, and does not refresh the Inquiries route. Staff need a real **Add inquiry** action with explicit channel, duplicate handling, and confirmed persistence. Reuse input components and CRM lead linking. [Shell creation gate](../../../src/app/admin/components/layout/AdminWorkspaceShell.tsx#L199) · [Lead action](../../../src/app/actions/leads.ts#L125)
- **Data repair needs evidence.** A saved origin or receipt may support a conservative backfill. One historical lead row cannot reliably reveal every submission that became part of it. Do not infer website origin from service category, date, or name.

## 2. Proposed operator workspace

**Design Read:** Energy 1 / Rhythm 2 / Motion 1. Circular XX headings and Graphik working text use existing public-site assets. Use near-black type, warm neutral surfaces, restrained separators, and Marca Ubi red for the primary action and critical states. Use 8–10px controls and concise labels. A compact working queue is the focal point.

- **Header:** “Inquiries” with “Review website submissions and inquiries logged by your team.” One primary **Add inquiry** button for authorized staff. Keep the current route and preserve deep links.
- **Workload:** A single compact summary of **Needs review**, **Unassigned**, and **Received in the last 24 hours**. Each count can apply the corresponding filter. Distinguish all matching rows in the selected scope from rows loaded by pagination. Use zero for a verified zero and an unavailable state for query failure.
- **Inbox:** **All inquiries**, **Website**, and **Manual** channels. Website groups Contact, Start Project, and Chat Pod, with a finer source filter. Sort by received time with a stable ID tie-breaker. Search permitted contact, company, or inquiry reference. Filters include triage state, source, owner, and date. Reflect scope in the URL and reset pagination as filters change.
- **Desktop:** Compact semantic table and a contextual detail pane as space allows. Show identity and brief topic, source, received time, triage status, owner, and lead link where authorized. Initial selection is explicit and can be deep-linked. Use meaningful icons for source, assignment, and opening detail.
- **Mobile:** Stacked rows with identity, received time, source, and state. Open detail and entry in a full-height dialog or route. Preserve filter state and focus on return. Verify 320px reflow, keyboard use, and 44px touch controls. Use a controlled focus lifecycle with Escape and visible focus. [W3C modal dialog guidance](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- **Details:** Show original submission, requested service, optional timeline/budget, contact channels, linked lead, and inquiry history. Actions are **Assign**, **Mark reviewed**, **Close inquiry**, and **Open lead** where allowed. Show a concise reason for closure when captured. Use existing lead and deal workflows for qualification and conversion. Avoid a second unrelated sales pipeline.
- **States:** Use a shaped skeleton at load, a source-scoped empty message, an explicit Clear filters action when the query has no matches, and a retry for failures. A failed count must not erase otherwise available inquiries. Respect reduced motion.

## 3. Manual inquiry workflow

1. **Add inquiry** opens a form with contact name, email or phone, received channel, and inquiry summary. Company, service, received time, and owner are optional. Server time is the default. Staff entry is always recorded as manual, with original channel recorded separately when applicable.
2. The server verifies active account, inquiry access and write scope, validates fields, and checks active sources and owner eligibility. Proposed initial write roles are admin and sales manager with inquiry access. Viewer remains read-only within existing row visibility. Any wider staff scope requires an explicit authorization rule and tests.
3. A repeat request with the same idempotency key returns the same committed result. A genuinely new inquiry from a known contact is a separate event. An unambiguous, authorized match offers **Link to existing lead**. A permitted distinct opportunity can **Create lead**. In case of conflicting email/phone matches or an inaccessible match, avoid disclosing restricted records and route to authorized review. Avoid automatic destructive merges.
4. Save the inquiry, lead link or create, and audit entry as one transaction. Return the committed record reference. Preserve form data on failure, make retries safe, and refresh the inbox and affected CRM views. Do not send a customer confirmation or public webhook merely because staff logged a call or email.

## 4. Data contract and cutover

Use the existing lead dossier for the client relationship. Add inquiry capture records for individual accepted submissions. Persist stable reference, server-owned origin, original channel, received timestamp, sanitized brief and permitted contact fields, nullable linked lead, idempotency key, and audit correlation. Keep the captured submission distinct from mutable triage state. Keep one authoritative sequencing and audit path for both public and authorized manual writes.

| User-facing measure | Definition |
| --- | --- |
| Needs review | Authorized inquiry rows in the selected source scope whose triage state is New. It is a current backlog, not a 24-hour total. |
| Unassigned | Authorized actionable and open rows without an inquiry owner in the same source scope. |
| Received in the last 24 hours | Committed inquiry events in the source scope with received time in the rolling window. Counts repeats when separately submitted, excludes retries for the same event and all test fixtures. |

- **Access:** Define SELECT policies against authorized inquiry and assignment scope. Use authenticated actions for operator writes, validate target ownership, and run public intake's privileged writes server-side. Audit role, actor, resource, outcome, and correlation with minimal personal data. Cover cross-owner and stale-role cases in real RLS tests. [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- **Transaction:** Use database-enforced idempotency constraints and a transactional decision around normalized identities and existing leads. Cover concurrent inserts, including when no matching row exists yet. Define retry after timeout and replay with conflicting input. Use a post-commit notification path with deduplication. Save success only after confirmed persistence.
- **Read:** Use a typed projection, stable cursor over received time plus ID, bounded search, and indexes designed for the default source, state, owner, and date queries. Counts apply the same authorization and source scope as the list. Keep failure distinct from empty results.
- **Migration:** Inventory current event shapes and source IDs. Consolidate the writers before relying on inquiry counts. Backfill only records with confirmed provenance and stable identifiers. Tag imported history and publish a coverage date. Reconcile counts by source against staging specimens before enabling the UI. Preserve live receipts and linked dossiers. Retain compatibility during rollback so accepted intake remains visible.
- **Operational diagnostics:** Move the protocol badge, configuration and verification tooling out of the operator workspace. A future diagnostics view must label configured limits, observed failures, measurement windows, and stale checks independently. No live fixture seeding is required for this plan.

## 5. Delivery order and acceptance

| Order | Work | Acceptance evidence |
| --- | --- | --- |
| 1. Capture reliability | Fix false Contact receipts, unify write semantics, validate provenance and idempotency, and add the inquiry and audit contract. | Contact, Start Project, and Chat Pod submissions on isolated staging each appear exactly once with the right origin. Persistence and audit failure return failure. Simultaneous retries create one record. A real repeat remains distinct. |
| 2. Authorized entry and triage | Implement Add inquiry, duplicate review, link/create, assignment and triage transitions. | Authorized users can save and open the linked record. Viewer, inactive, unauthorized, and cross-portfolio cases fail at server/DB boundaries. Network interruptions and conflicting contacts are recoverable. |
| 3. Inbox and metrics | Build responsive inbox and detail, page filters, counters, loading and failure states. Remove simulator and raw JSON from this operator path. | Every displayed metric reconciles against seeded, isolated records. Search and pagination remain stable across reload, history navigation and concurrent submissions. Keyboard and touch operators complete each journey. |
| 4. Verify and release | Compare desktop and mobile captures to brand references, run deployment and isolated authenticated end-to-end checks, and document migration and rollback. | TypeScript, lint, build, relevant suites, four-block design gate, and recorded click-through. Validate the resulting rows, receipts, audit history, and permissions in staging before rollout. |

### Required verification matrix

- **Capture and reconciliation:** New contact, known contact, separate repeat, same-request replay, email and phone matching different leads, public persistence failure, unchecked result regression, notify failure after commit, historical provenance unknown, sample exclusion, count failures and rolling-window boundary.
- **Authorization and privacy:** Signed-out and suspended, role and tab mismatch, inquiry assignment and linked-lead visibility boundaries, viewer, authorized manager, cross-owner forged IDs, inactive assignment target, audit rollback, and no raw payload or visitor IP in the standard client response.
- **Usability:** Empty inbox, filter-empty, failed fetch with retry, long brief/company, missing contacts, restored focus on close, accessible labels and sorting semantics, 320–1920px reflow, 200% browser zoom, reduced motion, slow save with repeated clicking, and return to the same list scope from detail.
- **Release evidence:** Use labeled synthetic records in local or staging fixtures. No production notifications. Record the exact verified environment, failures observed, screenshots, and results. Keep live data checks distinct from fixture assertions.

The requested deliverable ends at this plan. Application changes, migrations, merges, and PR operations require a separate implementation instruction.
