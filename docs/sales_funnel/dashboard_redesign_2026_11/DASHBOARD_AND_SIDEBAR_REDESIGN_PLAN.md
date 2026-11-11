# Dashboard and sidebar redesign

Date: 2026-11-11. Status: proposal for user review; implementation is not authorized by this document.

## 1. Product decision

Replace the composition of `/admin` and the shared authenticated navigation. The home screen must answer, in order: What needs my attention? Where is the pipeline? What business has converted? Where do I go next?

This is a light, minimal operational workspace. The latest user direction supersedes the four floating scorecards, ledger/allocation split, decorative telemetry, and related visual prescriptions in `CRM_CONCEPT_REDESIGN_MASTER_PLAN.md`. Preserve business rules and security fixes, not the rejected composition. Do not interpret this as approval to redesign authentication or rebuild every module.

Antislop applies throughout research, design, and eventual implementation, as explicitly selected by the user. Design Read: ENERGY 1 / RHYTHM 2 / MOTION 2. Identity comes from Marca Ubi typography, careful proportions, readable data, and precise transitions.

### Reference interpretation

| Supplied image | Useful principle | Application here |
| --- | --- | --- |
| 2: CONYEST | Calm canvas, strong numerical hierarchy, coherent navigation | Strong primary number and clear alignment; finance-card artwork and lime palette do not fit this CRM |
| 3: rillo | Actionable queue with context and progressive disclosure | Make follow-up work the main surface; show the reason a row needs attention and an explicit next action |
| 4: Vellum | Readable navigation and work-table hierarchy | Short labels, predictable spacing, clear selected state and restrained separators |
| 5: Briefly | Operational rhythm and shared alignment | Relate workload and next actions; do not invent a project timeline from absent scheduling data |
| 6: store dashboard | Legible tables and supporting context | A clear main work surface plus quieter related information, without copying its four-card opening |

## 2. Findings from the actual implementation

| Evidence | Consequence for the redesign |
| --- | --- |
| `src/app/admin/(workspace)/page.tsx` renders masthead, four KPIs, recent deals/stage split, then attention and reporting | Urgent work is below the first viewport; changing card styles cannot fix the information hierarchy |
| `AdminSidebar.tsx` hardcodes `₹65.4L Active` and `39 Commercial Deals` in its promo | Remove the promo. It is not a real current summary and includes a link outside normal tab filtering |
| Home pipeline/counts are current snapshots; converted value and cohort reporting use a selected period | A page-level date selector implies a scope it does not have. Put the date control inside Outcomes |
| Home aggregates all RLS-visible rows; it does not explicitly filter an individual owner | Label scope honestly. Do not call it company-wide or personal merely from the user's role |
| Default sales-executive feature permissions prohibit financial viewing; home checks command-center access but not that feature | Gate financial queries/serialization and exports server-side, not just CSS or rendered labels |
| Attention query limits 24 rows before filtering deferred On Hold records, then displays 8 | Eligible work may be omitted. Apply eligibility before limiting and query the selected queue independently |
| Home counts overdue as before now; Tasks uses before UTC day start; client tabs recompute local midnight | Reconcile home, sidebar, and Tasks with one reference instant, timezone and queue definitions |
| Stage-query failure is not included in every downstream availability flag | Dependency failures must produce unavailable states, not a ready/empty chart |
| Latest active deal search covers only the loaded 10 records | Replace homepage sample search with real navigation to the existing server-backed workspaces |
| `can_view_financials` has defaults and persistence but no shared runtime gate surfaced in research | The dashboard slice must enforce it; a separate cross-module audit is needed before claiming product-wide enforcement |

Research used the knowledge graph before source inspection. Three research agents covered domain workflows, typography, and architecture; a design synthesis agent reviewed the proposed composition. No live database or browser session was used, so findings describe source behavior rather than a fresh runtime certification.

## 3. Scope and navigation architecture

### Included

- Full dashboard recomposition: hierarchy, widgets, data contracts, states, interactions and mobile behavior.
- Shared sidebar, mobile navigation, compact context header and account placement.
- Scoped typography/tokens and any shared components directly needed by these surfaces.
- Dashboard correctness fixes necessary for trustworthy counts, permissions, scope labels and drill-throughs.
- Regression checks on every route consuming the shared shell.

### Separate follow-on work

Module interiors for Leads, Deals, Client works, Follow-ups, Analytics, Team, Inquiries and Settings retain their workflows. A later redesign can apply the new foundations to those interiors. Authentication, new CRM modules, payment accounting, configurable targets, notification infrastructure and historical pipeline snapshots are outside this slice.

### Sidebar specification

Expanded width: start at 240px and validate with real labels; collapsed width: 64–72px after visual testing. White or subtly tinted background, a single boundary with content, no enclosing floating frame. The sidebar is stable while the page scrolls; its navigation area can scroll on short viewports.

1. Brand row: official Marca Ubi mark at a readable intrinsic ratio, small workspace descriptor, collapse control.
2. Search/navigation trigger: label `Search or navigate`, platform-correct `Ctrl K`/`⌘ K` hint.
3. Primary destinations: Overview, Follow-ups, Leads, Deals, Client works, Inquiries.
4. Workspace group: Analytics, Team, Settings.
5. Bottom account row: real avatar or initials, name, role, account menu and sign-out.

| Label | Existing route | Existing permission key |
| --- | --- | --- |
| Overview | `/admin` | `command_center` |
| Follow-ups | `/admin/tasks` | `tasks` |
| Leads | `/admin/leads` | `leads` |
| Deals | `/admin/deals` | `deals` |
| Client works | `/admin/works` | `works` |
| Inquiries | `/admin/ingestion` | `ingestion` |
| Analytics | `/admin/analytics` | `analytics` |
| Team | `/admin/team` | `users` |
| Settings | `/admin/settings` | `settings` |

Preserve tab keys, hrefs, admin behavior and explicit non-empty `allowed_tabs` overrides. Hide empty groups. Use a neutral selected row and stronger text, with `aria-current`; no decorative active glow. One useful count beside Follow-ups is enough. Its definition is overdue plus due today, using the same eligibility and visibility scope as the destination. Unknown counts are omitted or explicitly unavailable, never replaced with zero.

There is no need for a workspace switcher unless multiple real workspaces exist. The account control is an account menu, not a pretend tenant selector. Remove Agency Intelligence, Live SSR, pipeline promo values and decorative network dots.

The existing search button dispatches an event; a working listener/provider was not established by research. Verify this before reuse. Initial guaranteed behavior: a keyboard-accessible launcher searches permitted navigation destinations and offers `Search leads for …` / `Search deals for …`, routing the query into their existing server-backed search. Do not imply cross-module instant record search until a real authorized search source is implemented. All advertised search behavior must work before delivery.

## 4. Recommended dashboard composition

### Desktop wireframe

```text
SIDEBAR          Workspace / Overview                         [page utilities]
                 Overview                                    [+ New lead]
                 Current pipeline ₹… · … active deals         Updated … UTC

                 TODAY / FOLLOW-UPS                           PIPELINE NOW
                 [Overdue n] [Today n] [Unassigned n]          Stage   Count   Value
                 ┌───────────────────────────────────────┐    New       …      …
                 │ Client / reason      Due     Owner    │    Contacted …      …
                 │ Next client conversation      [Open] │    Qualified …      …
                 │ … up to six eligible records         │    Proposal  …      …
                 │ Showing 6 of n   [View all follow-ups]│    … configured stages
                 └───────────────────────────────────────┘    [Open pipeline]

                 OUTCOMES                   [Last 30 days v] [Export summary]
                 Converted contract value ₹…   … wins
                 [A modest conversion-value chart if meaningful data exists]
                 [Metric definitions / cohort diagnostic]

                 DELIVERY EXCEPTIONS — compact conditional list, not another KPI grid
```

At approximately 1440×900: 48px context rail, 24–32px content gutters, 28–32px title, snapshot integrated into the title block, first queue row around 200–240px from viewport top. Aim to show at least five actionable rows without scrolling. These are validation targets, not fixed heights that clip zoomed or long content.

The Today queue is the primary bounded white work surface. Pipeline context is an unboxed aligned column, approximately one third of available width, not another equally prominent card. Outcomes follows across the width. Do not stretch modules to identical heights or add containers merely to fill blank space.

### A. Title and current snapshot

Use `Overview`, one concise context line, and one `New lead` action only for permitted users. Resolve both destination-tab and mutation permissions; do not show an action solely because the role is not viewer.

Current pipeline value is the primary number for authorized financial viewers; active deal count is subordinate. For financial-restricted users, active deal count takes prominence and amounts are absent from both visual UI and client payload. No generic icon tile, In Motion badge or repeated Active pill. Scope text is `Visible pipeline` initially; a personal/team selector is deferred until end-to-end owner filtering is defined.

`Updated …` means successful data retrieval time, not a claim of continuous live synchronization. Never mark failed data as freshly updated. Financial summaries are expected opportunity value, not collected payments.

### B. Today: actionable follow-up preview

Default to Overdue when its successful count is positive, otherwise Today. Tabs represent full queue counts; each selection fetches its own eligible preview, rather than filtering the first six loaded records. URL state should use a new documented `queue` parameter on home, preserving `timeframe`; normalize invalid values. The new home parameter is proposed behavior, not existing functionality.

Show up to six rows. Fields: client name; company or lead ID; clear reason (`Overdue since …`, `Due today …`, `No owner or follow-up`); due date/time; owner where available; explicit Open action. Show value only when authorized and useful. Priorities/stages are secondary plain labels; avoid several pills per row. Do not show fabricated avatars or owner identities.

Keep preview limit and full count distinct: `Showing 6 of 37 overdue follow-ups`. Counts and rows share filters, but retain separate availability states if one query fails. Use deterministic ordering: oldest due first, then ID; unassigned oldest creation first, then ID.

Open uses permitted lead/deal detail routes. Reuse existing dossier and scheduler behavior. Completing a follow-up means clearing the lead reminder through the existing transactional action and logging activity; it is not completing a standalone project task. First release keeps Open as the main row action. Inline `Reschedule` or `Complete follow-up` can be added only by reusing the full validated mutation/refresh/error contract, with explicit stale-record handling. No decorative checkboxes.

`View all` links to `/admin/tasks?queue=overdue`, `today` or `unassigned`. If a user lacks Tasks access, do not display those links or the task queue; use the alternate composition below.

### C. Pipeline now

Show configured active open/potential stages in database order. Each row has stage name, count, full formatted value when permitted, and one restrained horizontal bar. Choose count as the common bar measure, label it explicitly, and do not switch bar meanings per role. Values remain a separate column.

Use a neutral bar scale; stage names carry meaning. Status color can remain a small secondary signal after contrast testing. Remove arbitrary upward arrows, rainbow allocation strips, invented velocity labels and percentage pills. Counts do not prove movement or conversion between stages.

Each stage links to `/admin/deals?stage=<UUID>` when Deals is allowed, otherwise the supported Leads stage route when Leads is allowed; if neither is allowed, render informational rows without a navigation affordance. Preserve exact stage ID, not a guessed stage-name slug.

### D. Outcomes: a clearly local reporting period

Move existing supported ranges here: 7 days, 30 days, 90 days, quarter and year. Keep canonical `timeframe` URL behavior and browser back/forward support. Current snapshot, Today and pipeline stage counts do not change meaning when the period changes.

Lead with `Converted contract value` and number of conversions, not Revenue or Cashflow. Source is converted lead `expected_value` and `converted_at`; this is not invoiced, received, or bank-reconciled money. Show a comparison only when the baseline is valid and comparable. Existing quarter/year prior-period calculations need review before a delta is displayed: elapsed current periods must not be presented as equal-duration comparisons with a full prior period.

Use a modest bar chart of real conversion value over explicitly labeled intervals when there are events. Existing bucket helper divides the window into equal spans; either label those spans honestly or implement actual calendar buckets before using calendar-month labels. Include accessible values/table alternative and visible units. Never add historical pipeline trends without snapshot data.

Zero events: compact `No conversions recorded in this period`, retained date control and useful navigation to Deals when allowed. No large blank plot or celebratory all-clear statement. Query failure: unavailable with retry, not zero.

Creation-cohort conversion stays behind `Metric details` or in a subordinate line, labeled `Current conversion status of eligible leads created in this period`. Do not rename it closed-deal win rate. Show numerator/denominator and exclusions. No fixed 15% target: no configured target source was established. Average cycle and weighted potential can live in the same details panel when valid; they do not earn separate homepage cards.

Export remains available only with `can_export_data` and permitted data fields. Replace ambiguous `Export report` with `Export summary` and explicit scope. Preserve CSV formula neutralization. The revised export contract includes current snapshot, all permitted stage aggregates and selected-period outcomes with generation times; it excludes a misleading all-record ledger. If maintaining the existing latest-ten-deals export for compatibility, retain and explicitly label it as a sample in a separate export version. Never silently advertise full-record export.

### E. Delivery exceptions

For users with Works access, a compact lower section may show up to three persisted `at_risk` or `blocked` projects, with project, explicit health, next recorded milestone when available, owner and Open project. No risk inferred from missing dates. No global count derived from the currently loaded project subset.

This is an independent read dependency: use an exact authorized count plus bounded preview, show partial failure accurately, and isolate it from the main queue load. If these sources cannot be established within the slice, leave the widget out and keep Client works reachable in navigation. It must not delay the core dashboard. A healthy empty result gets one quiet line, not another large empty card.

## 5. Widget data contracts

| Item | Source/formula | Scope and state rules |
| --- | --- | --- |
| Current pipeline | Sum `expected_value` for open/potential leads | All visible eligible rows, synthetic exclusions; current snapshot; financial permission required |
| Active deals | Count same current set | Same visibility and exclusions as value; not period-created leads |
| Weighted potential | Potential-stage value × approved stage probability | Existing named weights Qualified .25, Proposal Sent .50, Negotiation .85; unknown potential weights mean unavailable; details only |
| Overdue | Eligible scheduled lead before UTC day start | Use Tasks semantics consistently; not before browser-local midnight or merely before now |
| Due today | Eligible scheduled lead within UTC day window | Mutually exclusive with overdue; display UTC explicitly |
| Unassigned | Eligible active lead with no owner AND no scheduled follow-up | Preserve current Tasks definition; do not relabel all ownerless leads as this queue |
| Pipeline stages | Count/value grouped by configured active status | Same current set; counts must reconcile with current snapshot |
| Converted contract value / wins | Converted leads whose `converted_at` lies in reporting range | Sum expected value/count; no payment inference or manufactured history |
| Cohort diagnostic | Converted current statuses / eligible leads created in period | Exclude known spam/out-of-scope from denominator; unavailable when denominator empty |
| Delivery exceptions | Persisted work health `at_risk`/`blocked` | Dedicated exact count/preview, Works access and RLS; not loaded subset totals |

Use one server-generated reference instant per dashboard response. Retain the existing UTC business-day contract in this slice and reuse the Tasks day-window helper. A future business-timezone setting would need coordinated dashboard, Tasks, sidebar, scheduling and export changes; the user's local machine timezone is not evidence of that product setting.

Reconcile deferred/revisit eligibility with Tasks before coding. Current Tasks applies its revisit guard broadly; home describes On Hold specifically. Select one documented predicate and apply it to both counts and previews; do not silently alter scheduling rules in a styling change. Apply eligibility before pagination/limit. Retain bounded aggregation and explicit safe-limit failures; never silently truncate 50,000+ rows.

All modules distinguish loading, ready, empty, unavailable and unauthorized/omitted. Directory resolution distinguishes genuinely unassigned from unavailable owner lookup; preserve PR #117's directory fallback without presenting its failure as a real former employee.

## 6. Role and authorization behavior

Resolve active profile, tab permissions, feature permissions and RLS scope server-side. Non-empty custom tab arrays retain their existing override semantics. Reuse existing feature-permission precedence once verified; research found defaults/persistence but no shared runtime helper. This is a necessary contract to settle in the dashboard data layer, not permission to broaden access.

| User | Recommended home behavior |
| --- | --- |
| Admin / sales manager | Today queue, visible pipeline and permitted financial outcomes; unassigned queue when Tasks and assignment workflows allow it |
| Sales executive | Assigned/RLS-visible operational work; counts and stages; no financial values or financial export by default. Label actual query scope rather than assuming a personal filter exists |
| Viewer | Read-only pipeline stage/deal preview becomes the main surface because Tasks is unavailable by default; financial outcomes only when allowed; no create/complete/reschedule/export by default |
| Custom tabs/features | Compose only permitted sections and drill-throughs. No queue-shaped blank hole, false all-clear message or link to forbidden routes |

For task-restricted users with Deals or Leads access, show a compact active-opportunity preview (client, stage, owner, next follow-up, value only if allowed), max six, with Open destination. This replaces Today rather than appearing as a second homepage ledger. If neither destination is allowed, retain permitted summaries as noninteractive information. Query failures remain distinct from restricted content.

Suppress financial data at query/DTO/export boundaries; client-side hiding is insufficient. This slice must not claim to fix permission enforcement across every existing dossier, list or backend endpoint. Track that cross-module audit explicitly if implementation confirms the gap beyond home.

## 7. Visual and typography specification

Public-site inventory: `src/app/fonts.ts` defines Circular XX Book 400 / Medium 500 / Bold 700, Graphik 100–700, and Helvetica Neue Thin/Light/Roman. `src/app/layout.tsx` loads all three; public body uses Graphik, and public components use Circular/Helvetica. Movatif is a Graphik alias, not a fourth loaded family. There is no release-version metadata to invent.

Recommended CRM pair: Circular XX for page/section headings and prominent numbers, Graphik 400/500 for navigation, forms and rows. Reuse local bindings. Current admin tokens already prioritize Circular over loaded Messina/Jakarta fallbacks; verify computed styles, not just font imports. Remove unnecessary admin font loads only after checking all consumers and fallback behavior.

| Element | Starting specification |
| --- | --- |
| Page title | Circular XX 500, 28–32px desktop / 24–28px mobile |
| Snapshot primary figure | Circular XX 400/500, 28–34px; full grouped currency |
| Section title | Circular XX 500, 17–18px |
| Navigation / controls / row content | Graphik 400/500, 14px; 15–16px where useful on touch layouts |
| Secondary metadata | Graphik 400, 12–13px with measured contrast |
| Numbers | Tabular numerals if supported by the actual cut; right aligned in columns, normal tracking; verify ₹ glyph and numeral widths |

Keep full `en-IN` currency grouping and meaningful decimal precision. No L/Cr abbreviations or large monospace metrics. Currency symbols remain visually attached to the amount, without the oversized detached rupee treatment in the current screen.

Starting palette: white surfaces; near-white neutral canvas; ink `#111111`; secondary `#454542`; muted text no lighter than a measured AA-compliant token; Marca Ubi red `#ea002a` for a deliberate primary action or urgent signal. Neutral controls and selected navigation do most of the work. Status meaning is always written in text.

Spacing uses 4/8/12/16/24/32. Controls 6–8px radius; main work surface around 10–12px. No shadows on persistent dashboard panels. Use separators only to clarify rows or sections; do not outline every label. Menus/dialogs should be distinguished through solid surface, boundary and placement; respect the project's zero-shadow delivery gate. Do not adopt master-skill dark/specular/glow/34px examples: latest user direction wins.

## 8. Interaction, loading and failure design

| Interaction | Proposed feedback |
| --- | --- |
| Initial load | Stable shell immediately; same-layout skeleton rows and quiet `Loading follow-ups` status; avoid a full-screen branded intro |
| Queue selection | Selected control responds immediately; replace only queue rows; retain dimensions and counts with an explicit pending state; do not present stale rows as the new queue |
| Date change | Outcomes marks pending; keep current snapshot and Today useful; prevent exporting stale data under the new range |
| Row / navigation hover | 100–140ms background/border transition; no lifting cards or bouncing icons |
| Drawer / launcher | Approximately 180–220ms opacity and short translation, correct focus management and Escape; preserve focus after close |
| Sidebar collapse | Approximately 160–200ms geometry change when safe; preserve preference and avoid reload/remount flicker |
| Successful mutation | Explicit success message, refresh affected row/counts; short row settling transition; no delayed fake success |
| Failed mutation | Preserve input, explain error and retry; no optimistic count remains committed after failure |

All timings are proposed tuning values. Reduced-motion mode removes translation, stagger and geometry animation; feedback still occurs. Do not animate values counting up from zero, pulse live dots indefinitely, stagger the whole dashboard, or delay usable content to showcase motion. Loading polish comes from continuity and accurate feedback.

Design distinct states: no scheduled follow-ups, selected queue empty, count unavailable but preview available, preview unavailable but count available, all-zero outcome range, financial restriction, expired session, failed directory, absent stage configuration, long text/full currency and safe-limit failure. `No scheduled follow-ups` does not prove every client relationship is healthy.

## 9. Responsive and accessible composition

- Wide desktop: persistent expanded sidebar; main queue and quieter pipeline context; bounded readable row lengths without an arbitrary center-island frame.
- Intermediate widths: collapse sidebar or use drawer when the actual content no longer fits; allow queue and pipeline to stack instead of squeezing columns.
- Mobile: labeled Menu control, Overview title, current counts/value as allowed, Today preview, pipeline summary, Outcomes, then delivery exceptions. Account remains in drawer. No desktop table shrunk to a phone.
- Mobile row: client/reason first; due time and owner next; explicit 44px action target. Long names wrap, amounts remain intact. Status and time are not hidden behind hover.
- Verify 320, 375, 768, 1024, 1440 and 1920 CSS pixels plus 200% zoom and short landscape viewports. Use fit-driven breakpoints, not assumptions based only on device names.
- Preserve mobile drawer focus trap, Escape, focus restoration, inert background and body-scroll cleanup. Use one main landmark and a working skip link.
- Text contrast 4.5:1 for ordinary text; relevant control/focus boundaries 3:1. Measure actual pairings. Color alone cannot communicate a stage, warning, selection or chart series.
- Queue filter controls need correct keyboard semantics. Either implement a complete tabs pattern or use ordinary labeled filter buttons; do not add tab roles without arrow-key/focus behavior.

## 10. Technical implementation map

Paths below are proposed modification surfaces, not edits already performed.

| Area | Files / approach |
| --- | --- |
| Composition and server DTO | `src/app/admin/(workspace)/page.tsx`, its `page.module.scss`; retain active-profile/auth/tab checks and resilient owner lookup |
| Dashboard modules | `src/app/admin/components/Dashboard/` composition/types/barrel; replace masthead/KPI-grid/ledger-allocation archetype with overview heading, Today preview, pipeline context and Outcomes; retire replaced components only after checking all callers |
| Data definitions | Existing `src/app/admin/lib/timeframeUtils.ts`, `followUpQueue.ts`; new focused dashboard data/permission helpers if needed; no client-side financial calculations |
| Shared shell | `AdminWorkspaceShell.tsx`, `admin-shell.module.scss`, `AdminHeader.tsx` and styling; preserve modal mounts, URL dossier behavior, events and account flows |
| Navigation | `AdminSidebar.tsx` / module, `navigationConfig.tsx`, `AdminMobileDrawer.tsx` / module, `UserProfileDropdown.tsx` only as needed |
| Type and tokens | `src/app/admin/styles/tokens.scss`, admin layout/font bindings; reuse `src/app/fonts.ts`; keep changes scoped under admin root |
| Loading and partial failure | Dashboard-local boundaries following the installed Next version's documented conventions; avoid shell replacement during period navigation |
| Design guidance | After approval, update relevant design fields in `DESIGN.md` and supersede old layout prescriptions with this approved specification |

Installed package research reports Next 16.1.6, but `node_modules/next/dist/docs/` was absent. Before framework code changes, locate the correct installed documentation/package path or restore matching documentation with appropriate authorization. Do not assume familiar Next conventions satisfy the user's local rule. This does not prevent completing this source-backed plan.

Profile/role/tab checks remain in place. Preserve PR #117 cookie recovery and directory resilience. Do not alter middleware, proxy, login/password actions, migration state or RLS policy merely for visual work. New reads use the authenticated client and existing RLS; any required database aggregation/migration is a separately reviewed change with isolated verification.

Existing aggregation scans bounded 1,000-row pages with a 50,000-row safety limit. Measure before replacing it. Parallelize independent authorized reads where safe, fetch detail only for previews, and avoid fetching all ledger rows for the new homepage. No new chart library or animation dependency is justified without checking existing utilities and bundle cost.

## 11. Execution phases and review gates

1. **Approve this direction.** Settle the proposed composition and paired typography. This plan does not change `DESIGN.md` or implement screens. Further user feedback updates the plan only, then stops until explicit `proceed` or `do it`.
2. **Visual proof before migration.** Once authorized, prepare a concrete desktop and mobile composition using realistic, clearly labeled sample content, including zero/error/restricted states. Judge side-by-side against the rejected screenshot. The gate is an actual layout review, not a claim that the CSS is cleaner.
3. **Data and permission contracts.** Implement shared queue eligibility/reference time, source-aware availability, financial/export DTO gates and honest metric labels. Validate count/preview reconciliation. Keep RLS and mutation invariants.
4. **Shared navigation foundation.** Build new sidebar/header/drawer composition, font/token mapping and functional launcher; verify all existing routes and custom permission variants before moving the dashboard.
5. **Dashboard replacement.** Implement the approved title/snapshot, Today work surface, pipeline context and Outcomes. Add delivery exceptions only when its independent source/permission contract passes. Remove the old default layout from home.
6. **Interaction and resilience.** Tune loading continuity, route/range pending behavior, reduced motion, retry and keyboard flows. Verify real mutation refresh and owner-resolution failures.
7. **Verification and handoff.** Run appropriate focused tests, typecheck, boundaries and production build; perform browser click-through and screenshots. Update graph after code, context pointer plus dated handoff when the phase ships. Open/update PR only when authorized and keep it open for manual review.

Current branch was confirmed as `fix/auth-runtime-diagnostics-and-resilience`; existing untracked `scratch/` is outside this plan and must be preserved. Before implementation, recheck branch/PR dependency state and choose an isolated review branch; do not put redesign commits into the auth-fix PR by accident. PR #117 and #116 status here comes from handoff documentation, not a fresh GitHub check. Git authorship remains Fenar7; no `feat` PR titles and no agent merges.

## 12. Acceptance and verification

### Visual acceptance

- First viewport contains real actionable work; no opening row of four equal oversized cards.
- Desktop uses the approved queue-led composition, quieter unboxed pipeline context and local Outcomes period control.
- No hardcoded business values, fake live status, arbitrary target, rainbow velocity graphic or sidebar promo.
- Public local fonts visibly render in headings, rows, numbers and controls; computed styles checked.
- Long company names, full INR amounts, custom stages and narrow viewports fit without hiding essential data.

### Data and security acceptance

- Home, sidebar badge and Tasks reconcile for the same authorized scope/reference instant.
- Test UTC midnight, overdue/today separation, deferred revisit rows before limits, preview overflow and per-query failure.
- Test current snapshots independently of period changes, empty conversion denominators, unknown stage weights, invalid stored amounts and comparison-baseline absence.
- Stage dependency failure cannot produce a ready chart; unavailable owner resolution cannot become a false identity.
- Financial-restricted and export-restricted users receive no prohibited client payload/export; test direct requests, not just visible controls.
- No false company totals from partial Works loading; no double counting at period boundaries or chart bucket edges.

### Browser and accessibility acceptance

- Click each permitted sidebar route; verify active state, reload, collapse preference, back/forward, mobile drawer and account sign-out.
- Exercise launcher with mouse and keyboard; forbidden routes never appear as actions.
- Exercise each queue, count-to-full-queue link, stage drill-through, dossier open/close and permitted new-lead action.
- Exercise date changes, failures, retry and export; CSV formula protection and declared export scope remain correct.
- Verify reduced motion, focus return, keyboard-only use, 200% zoom, touch target size and measured contrast.
- Capture desktop/mobile screenshots plus loading, empty, partial-failure and role-restricted states. Record route, viewport, role, action and observed result as R-35 click-through evidence.

### Engineering acceptance

Inspect and extend behavior-focused tests around `command-center-dashboard-data`, navigation/routes, tokens/shell and team navigation where relevant. Add focused tests for new queue classification/limit semantics, permission DTO filtering and availability dependencies; avoid tests that simply assert the new JSX's shape. Run relevant suites, `tsc --noEmit`, boundary checks and the required production build. Report actual results and limitations; earlier handoff passes are not evidence for new code.

The official four-block antislop delivery report and R-35 evidence are required for the implemented result before any approval-ready claim. This planning deliverable has not run runtime, build or browser checks and is not an approval-ready implementation.
