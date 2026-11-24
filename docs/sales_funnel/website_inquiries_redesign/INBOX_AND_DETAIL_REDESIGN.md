# Inquiries inbox and detail redesign

Status: proposed for approval. Supersedes the operator layout and sample-data approach in the earlier Inquiries plan. No implementation or hosted database change is authorized by this document.

## Why rebuild

The current screen puts a large filter form before the list, then uses an accordion for local samples. That layout does not support scanning and managing intake. Separately, the configured hosted Supabase database was checked and lacks the inquiry table and capture and lookup functions. A failed live query must remain distinguishable from a genuine empty queue.

## Inbox at /admin/ingestion

Design Read: Energy 1, Rhythm 2, Motion 1. Keep the existing Marca Ubi shell, Circular XX headings, Graphik body text, a warm neutral canvas, and red for the primary action and selected states. Use lightly rounded controls, quiet separators, and dense but readable rows. Inquiry identity and brief preview lead every row.

1. Header with Inquiries and one primary Add inquiry action for authorized staff.
2. Compact workload strip for Needs review, Unassigned, and Received in the last 24 hours. Each count applies its matching filter. Show a verified zero as 0 and failed reads as Unavailable.
3. One toolbar with search, All / Website / Manual, and Filters. Put owner, status, specific source, date range, and sort behind Filters. Show active chips only when applied, with Clear filters. Preserve filter scope and the pagination cursor in the URL when opening and returning from a record.
4. Show the list immediately under the toolbar. Columns are contact/company and one-line brief, source, received time, status, and owner. The contact/company links to a dedicated route. Use a semantic table on desktop and stacked records on narrow screens. Keep sort deterministic by received time and ID.
5. Provide separate loading, empty, no matching results, and unavailable states. Retry reloads the live query. Remove the sample accordion and keep raw JSON out of the operator UI.

## Dedicated detail at /admin/ingestion/[id]

- Header with Back to inquiries, reference, inquiry identity, received time, and status. Preserve the originating filter and cursor through a validated internal return link. Support direct links and refresh.
- Main column with the complete brief, captured service, timeline and budget where supplied, and chronological activity. Show actor and time where available. Use actual fields so duration never appears as budget.
- Management column with contact actions, owner, review and close/reopen actions, and linked lead. Close requires a reason. Unlinked records expose an authorized exact-match lookup and permitted link/create actions. Reuse the existing dossier for lead management.
- Mobile uses one reading column and keeps management easy to reach. Provide keyboard focus and touch targets, distinct unavailable states, and restricted handling for missing or unauthorized records. On stale edits, preserve input and give the operator a way to reload the current record.

## Record creation and authority

Reuse the existing protected inquiry actions and audited transaction. Add inquiry accepts name, email or phone, channel, and summary, plus optional company, service, received time, and owner. Offer save for review, link, or create according to caller scope. Keep staff origin distinct from the original channel. Retain database idempotency, owner eligibility, linked-lead scope, and revision checks. Tests must cover concurrent retries, contact conflicts, inaccessible targets, and failed writes.

## Hosted Supabase test records

After explicit approval, confirm the hosted target and review the existing migration history and backfill eligibility. Apply the two inquiry migrations before testing against the live app. Verify schema, grants, and the actual application auth path.

Seed twelve realistic fictional inquiries into Supabase so they appear in the normal inbox and detail pages. Include Contact, Start Project, Chat Pod, and manual phone, email, and referral. Include assigned and unassigned records, new and reviewed records, closed records with a reason, recent and older dates, long and short briefs, and two inquiries from the same fictional contact. Some records should link to fictional leads and some should remain unlinked.

Use non-deliverable contact information and an auditable seed-batch marker. A small Test label identifies the records in normal screens. Exclude the batch from real metrics, dashboards, and outbound notifications. Make the seed idempotent. Provide a batch-scoped cleanup procedure that shows the exact rows and relationships it would remove before deletion.

## Verification and delivery

1. Review desktop and mobile designs for inbox and detail. Validate initial viewport row visibility, 320px reflow, keyboard navigation, focus recovery, and reduced motion.
2. Verify URL-preserved search, filters, paging, Back, and direct detail links. Verify absent, restricted, and stale records. Test failure and successful retry separately from fixture success.
3. In the approved hosted environment, open seeded rows, assign one, review one, close and reopen one, and link one to a fictional lead. Confirm the stored activity and that the seed does not affect real counts or trigger notifications.
4. Run TypeScript, focused lint, production build, database permission and transaction tests, and authenticated click-throughs. Capture screenshots from the actual routes. Record which checks used fixtures and which used hosted Supabase.
5. Independently review the diff, resolve findings, rerun the affected tests, and update PR #126 with screenshots and rollout/cleanup instructions. Leave the PR open for human review.
