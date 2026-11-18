# CRM Commercial Desk recovery and redesign plan

**Status:** Approved for implementation by the user on 2026-11-07. Execution is isolated on `fix/crm-workspace-recovery`; no production database or migration changes are authorized by this plan.

**Branch / review:** `redesign/crm-saas-workspace`, PR #114 stacked on PR #113. Keep both pull requests open and unmerged for human review.

**Design read:** ENERGY 2 / RHYTHM 2 / MOTION 1. Keep Marca Ubi's light editorial identity, Circular XX, black typography, fine neutral dividers, and restrained brand red `#ea002a`. Use the supplied references for layout and interaction ideas, not as templates to copy.

## 1. Why this recovery is necessary

The supplied screenshots are direct evidence that the previous acceptance claim was premature:

- The Overview renders four large KPI cells and a long attention list, but the captured first screen gives too little space to analytical context and meaningful relationships between pipeline stages, performance over time, and next actions.
- Inbound Leads displays “Leads or filter options could not be loaded.”
- Deals displays “Deals could not be loaded.”
- The earlier browser run tested unauthenticated redirects only. It did not exercise the authenticated data paths shown in these screenshots.
- Earlier checks found repository lint errors. Authenticated desktop/mobile click-through and isolated transaction verification were not complete.

The plan puts correctness and data evidence ahead of visual polish. It retains the current authorization and business-action contracts while replacing only the presentation or query boundaries that fail the acceptance gates below.

## 2. Forensic findings and open hypotheses

### Confirmed from code and screenshots

1. The Leads server page executes four reads in parallel: lead rows, stages, sources, and `crm_team_directory`. Any one error produces the same page-level alert. The source and assignee read errors are not logged with the same detail as the lead and stage reads. See `src/app/admin/(workspace)/leads/page.tsx` around the parallel query block and error branch.
2. The Deals server page executes reads for deals, stages, and sources. Any one error produces the same generic alert. See `src/app/admin/(workspace)/deals/page.tsx` around its query and error branch.
3. Both primary row queries embed assignee data from `crm_team_directory` with the explicit `leads_assigned_to_fkey` hint. Leads also reads this directory for filter options. The view is created by `supabase/migrations/20261105000001_preserve_activity_attribution_and_history.sql`.
4. That migration creates a view over active profiles, while the underlying `leads.assigned_to` foreign key references `profiles`. Whether the deployed PostgREST schema cache resolves this relationship through the view, and whether the migration is present in the database serving the screenshots, has not been verified.
5. The Overview builds its data separately from direct lead and funnel-stage queries. The overdue list is therefore not evidence that the Leads and Deals query paths work. Its overdue count and old due dates need a source freshness/timezone review.

### Lead hypothesis, not a diagnosis

The shared directory embed or deployed schema state may be breaking both primary queries. A missing `crm_team_directory` migration, a stale PostgREST schema cache, or an unresolved view relationship could explain the simultaneous failures. Other causes remain possible, including RLS, lookup access, invalid query filters, or a different database error. Do not change the view, relationship hint, RLS policy, or migration order until the authenticated failure has been captured with its query name and database error code/message.

### Required diagnostic evidence

- Exact deployment/runtime and database identity, with secrets excluded from logs.
- Applied migration list for the database that serves the screenshots, especially `20261105000001_preserve_activity_attribution_and_history.sql` and the follow-up transaction migration.
- For each Leads and Deals read: query label, HTTP/PostgREST status, safe error code/message, response status, and whether the failure is rows, stages, sources, or assignee directory.
- PostgREST relationship/schema-cache evidence for `leads.assigned_to -> profiles.id` when embedding `crm_team_directory`.
- RLS result for an authorized admin and one restricted CRM role using an isolated database.
- Overview source timestamps, timezone interpretation, and complete source count behind the overdue badge and selected attention rows.

## 3. Product and design direction

The target is a working commercial desk for an agency team, not a marketing dashboard. The visual language should stay distinctly Marca Ubi while borrowing the references' useful structural ideas:

- The rillo queue reference suggests a scannable work list with a contextual detail/action area. Apply that to Leads and follow-up triage, where selecting one real record can reveal its next action and recent history.
- The payments reference suggests compact summary metrics followed by a dense, well-labeled ledger. Apply this to Deals and reporting, with totals tied to a disclosed record scope.
- The timeline reference suggests a chronological view for real milestones, activity events, and due dates. Use it only where persisted timestamps support it; never manufacture a project or sales timeline to fill space.
- The dashboard reference suggests a clear table and restrained analytics can coexist. Retain detailed rows where users need to compare accounts, owners, stages, values, and due dates.

Use variation to express different work: an analytical Overview, a queue-and-dossier Leads surface, a stage-oriented Deals surface, and a chronological Follow-ups surface. Do not repeat a generic four-card grid on every route. Avoid charts without a named business question, random color chips, decorative icon tiles, nested borders, placeholder figures, and unsupported comparisons.

### Overview: decision and action in one scan

1. Compact title and time-scope row with an explicit last-updated state, one primary action, and an export control only when its scope is valid.
2. A restrained KPI strip for sourced snapshot values. Each metric explains its scope; do not imply month-over-month comparison when the baseline is absent.
3. A data-backed performance chart with readable dates/units and a text/table equivalent. For a zero series, show one zero baseline and a clear empty message. A failed query shows unavailable/retry, never a fabricated zero.
4. Beside or immediately below it, configured pipeline-stage distribution with real counts and values. Stage totals disclose whether open and potential buckets are included and link to matching Deals filters.
5. An actionable attention queue showing client, company, stage, owner, amount, due date/timezone, and action. Clarify whether the count is all overdue records or the loaded window; sort by actual urgency and identify stale/missing follow-ups.
6. A bounded recent-deals ledger showing loaded/total counts, stage, owner, value, and next follow-up. Query failure remains distinct from an empty ledger.

The queue and chart must not both compete as oversized blocks. At 1440px, make performance and stage health visible above the fold while keeping a small priority queue preview. At mobile widths, order the page as KPI summary, attention queue, chart, pipeline list, then ledger.

### Leads: inbox plus contextual record

- Preserve the heading, one primary create action, URL-backed search and filters, active-filter summary/reset, stable pagination, and visible loaded/total counts.
- Desktop: a useful-density table with client/contact, stage, owner, source, value, and next follow-up. Selecting a row opens the existing dossier in a contextual panel, with activity timeline and one clear next action. Keep direct links to the full detail route.
- Mobile: convert each row to a labeled record card; detail opens as a full-screen route/panel with key identity and next action visible first.
- Show a working leads table when optional lookup data is unavailable only if the query contract supports safe fallbacks. An owner or source must read as “unavailable” when its lookup failed, not “Unassigned” or “Direct” unless that value is true.
- Every create, assign, edit, status, convert, and follow-up path retains current validation, authorization, server error feedback, audit attribution, and dirty-form handling.

### Deals: stage view plus ledger

- Offer Board and Table modes with synchronized filters and a visible loaded/total count. Persist mode and filters in the URL where existing navigation contracts permit.
- Board columns represent configured stages and display real record counts and stage totals over an explicit scope. Long pipelines scroll without hiding keyboard focus.
- Deal rows/cards show client, value, owner, stage, next follow-up, and age only when age is computed from a real persisted timestamp.
- Stage changes remain guarded server-side. A keyboard/pointer “Move to stage” action opens the same required conversion/lost/on-hold dialogs as drag; drag is supplementary.
- Replace any silent 100-row boundary with explicit paging or incremental loading and truthful column totals. Maintain optimistic rollback and expose server rejection.
- Use the existing deal detail route as the stable destination; contextual detail may supplement, not break, direct links.

### Follow-ups: chronological work queue

- Group actual records into overdue, today, and upcoming using one stated timezone; include client, owner, current stage, due time, and completion/reschedule action.
- Offer a timeline or calendar only after confirming the stored scheduling model and timezone behavior. A list remains the reliable accessible alternative.
- Completing or rescheduling reports the server result, refreshes queue counts, and handles stale concurrent updates. Explain on-hold suppression and failed loads.

### Remaining routes

- **Works:** prioritize next milestone, delivery stage/health, accountable owner, and persisted milestone timeline. Distinguish missing owner, stale project, and query failure.
- **Analytics:** reuse the Overview metric definitions; display source, scope, timezone, and update time; provide chart table equivalents and stage reconciliation.
- **Team:** roster and workload counts derived from assigned records, with profile/access/audit history retained. Do not infer workload from partial failed queries.
- **Website inquiries:** show real intake events and processing outcomes; do not label recent leads as webhook events or show configured defaults as measured health.
- **Settings:** group supported operational controls, show valid units/ranges, save/error states, and honest audit-history limits.
- **Authentication and shell:** preserve the existing Marca Ubi mark, compact navigation, permission-aware destinations, keyboard focus, and responsive menu. Fix logo cropping only after tracing the actual asset and styles.

## 4. Delivery sequence and gates

### Phase 0: Freeze baseline and collect reproducible evidence

- Preserve the user-provided screenshot evidence and the clean baseline from `redesign/crm-saas-workspace`.
- Obtain an isolated local database with the exact migration sequence for PR #113 plus PR #114. Use only synthetic fixtures there.
- Reproduce the user screenshots at desktop and mobile viewport sizes while authenticated as an admin. Capture console/network traces and server logs for each page.
- Record a small deterministic fixture set: zero records, one record, multiple stages, missing owner/source, overdue/today/upcoming items, converted and lost deals, and more than one page.
- **Gate:** every screenshot error maps to a specific failed operation and database error. If reproduction differs from the screenshot deployment, record the environment delta before editing.

### Phase 1: Repair the data contract before visual redesign

- Trace each failing query from the route through generated Supabase types, foreign keys/views, RLS, migration state, and PostgREST schema cache.
- Decide and document the safe assignee projection contract. Ensure relationship inference is supported, or fetch the safe directory independently and join in typed server code. Do not broaden profile RLS to make the page render.
- Fix any missing/incorrect migration deployment dependency through the existing stacked PR workflow. Do not apply production migrations or rewrite branch targets as part of this plan without explicit approval.
- Separate primary-row failure from optional lookup failure where safe. Add query-specific logging with request/correlation ID and sanitized metadata; never log credentials or sensitive lead contents.
- Provide targeted retry states. Do not map errors to empty arrays, zero amounts, fake owners, or fabricated sources.
- **Gate:** authenticated admin and restricted-role tests pass against the isolated database; Leads and Deals load real rows; source/stage/owner behavior is correct; RLS does not leak profile fields; missing and failed lookup states are distinct.

### Phase 2: Approve design blueprint before coding

- Produce desktop/tablet/mobile wireframes for Overview, Leads, Deals, and Follow-ups first, then Works, Analytics, Team, Inquiries, Settings, auth, and dialogs.
- Map every displayed metric or timestamp to source query, formula, timezone, and empty/error behavior.
- Define selected-row behavior, URL state, keyboard order, focus restoration, responsive behavior, and all loading/empty/error states.
- Review realistic full-digit INR values and long client names at 320, 375, 768, 1024, 1440, and 1920 CSS pixels plus 200% zoom.
- Apply the user's existing antislop preference during the work; run the UI, human/accessibility, and mobile reviews against the supplied direction before implementation.
- **Gate:** user approves the wireframe/direction and explicit acceptance criteria. No implementation starts before this approval because this plan follows user feedback correcting the previous design direction.

### Phase 3: Implement Overview, Leads, and Deals as a vertical slice

- Build shared page heading, query-state, filter, pagination, metric/chart, table/card, and detail-panel pieces only where actual routes can share behavior.
- Implement Overview with reconciled metrics, chart, stage distribution, actionable queue, and scoped ledger.
- Implement Leads inbox plus dossier and Deals board/table plus guarded transitions.
- Keep each PR commit reviewable and keep PR #114 open and draft until its gates pass. Do not merge.
- **Gate:** query tests, route tests, component states, keyboard operation, and screenshots pass with isolated fixtures. Overview numbers reconcile with Leads/Deals for the same scope.

### Phase 4: Extend the approved system across remaining CRM surfaces

- Migrate Follow-ups, Works, Analytics, Team, Inquiries, Settings, auth, and shared shell using route-specific layouts from the approved blueprint.
- Preserve all server-side permission checks, action contracts, audit semantics, and deep links.
- **Gate:** role matrix, direct URL navigation, transactional behavior, empty/partial/error data, and relevant workflows pass for each route before moving to the next.

### Phase 5: Full verification and delivery review

- Run project unit tests, server-action boundary checks, focused and repository lint, TypeScript, production build, and isolated database tests. Fix findings in changed code; report unrelated lint debt separately with exact paths and ownership scope.
- Authenticated Playwright click-through on desktop and mobile for each route and key dialogs, using only loopback plus `CRM_E2E_DATABASE_ISOLATED=true` credentials. Record click-by-click evidence, network/console errors, and screenshots.
- Verify RLS and role cases: admin, manager, executive, viewer, suspended user, and custom-tab user.
- Exercise 0/1/many/over-page records, long labels/amounts, missing relations, partial lookup failure, full query failure, empty and retry states, stale writes, and transaction concurrency.
- Accessibility gate: contrast, focus, keyboard-only route/dialog use, non-drag stage alternative, reduced motion, screen-reader names, 44px targets, and no horizontal overflow at required viewports/zoom.
- Update the implementation review, context register, graphify output, and PR body/comment with actual evidence and remaining limitations. Keep #114 OPEN for human review.
- **Completion gate:** no authenticated route-level load errors; all displayed numbers reconcile to source; all primary actions work; all agreed lint/type/build/database/browser/accessibility checks pass; PR evidence is current. A build pass alone is insufficient.

## 5. Explicit non-goals and safety boundaries

- No production data edits, remote fixture mutation, or production migration application during reproduction.
- No weakening of RLS, broadening profile access, or suppressing query errors to make screenshots look populated.
- No fake charts, comparison percentages, workload numbers, timeline events, health indicators, or fabricated fallback records.
- No copying reference product names, palettes, logos, or exact screen layouts.
- No PR merge, branch fast-forward, or marking the PR ready before the completion gate.

## 6. Approval checkpoint

Review this plan first. Once approved, execute Phase 0 and Phase 1 before any interface work. If the data root cause or migration deployment order changes the architecture, update this plan and stop again for review before coding. The exact Leads/Deals database error and authenticated browser evidence are intentionally unresolved until an isolated reproduction supplies them.
