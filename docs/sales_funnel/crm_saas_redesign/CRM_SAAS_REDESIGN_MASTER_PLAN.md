# Marca Ubi CRM: Full SaaS Redesign Plan

**Status:** User-approved for implementation on 2026-11-06. The redesign is being delivered on a branch stacked on open PR #113; all PRs remain open for human review.  
**Scope:** All administrative CRM routes, shared shell, detail views, dialogs, responsive layouts, and their existing workflows.  
**Direction:** Current Marca Ubi public website identity: clean white and black, Circular XX, editorial rules, and brand red actions. Use full currency digits throughout.

## 1. Product and design intent

Build a CRM that feels like a cohesive, professional SaaS product and supports the agency's daily sales and delivery work. The interface must make the next action clear, keep real information readable at useful density, and explain missing or failed data. The brand should be recognizable without importing oversized marketing layouts into an operational tool.

**Design read:** ENERGY 2 / RHYTHM 2 / MOTION 1. Use a quiet light canvas, strong black type, fine dividers, measured red emphasis, consistent alignment, and restrained motion. Avoid repeated decorative icon tiles, random color chips, nested bordered cards, giant empty headers, fake targets, and charts added only to fill space.

The current public tokens are in `src/app/styles/client-tokens.scss`, with `#ea002a` brand red and `#c40023` hover. They are deliberately scoped away from the admin root. Create equivalent admin-scoped semantic tokens rather than relying on public selectors. Verify Circular XX loads in the admin font scope. Update `DESIGN.md` and CRM guidance to supersede the old dark/orange, lemon CTA, and abbreviated-number direction.

## 2. Current evidence and investigation gates

1. Login and sidebar screenshots show only fragments of the logo. Trace the actual asset, SVG colors, dimensions, cropping, CSS, and dark/light variants before choosing the corrected asset.
2. `analytics/analytics.module.scss` uses a white title on the light admin canvas; replace hardcoded page colors and audit all page-level overrides.
3. The overview screenshot shows repeated `₹0`/`₹1` ticks for a zero series, a corrupted stage separator, and a failed deals ledger while aggregate metrics remain visible. Reproduce the query error and fix its cause; a redesign must distinguish empty, unavailable, and partial data.
4. Overview excludes synthetic benchmark records, while analytics RPC and stage breakdown may use a different scope. The deals page limits records to 100, and analytics breakdown is not visibly paginated. Verify source, scope, row limits, and RLS using an isolated dataset before changing labels or calculations.
5. Ingestion currently presents hardcoded health and defaulted configuration as if measured, and its recent list is based on recent leads rather than a verified ingestion event source. Replace claims with measured data or an explicit unavailable state.
6. The shared KPI ribbon has a hardcoded 12% benchmark and fixed INR/USD rate. Remove unsupported benchmark claims; disclose the fixed conversion rate or remove USD conversion until a maintained source is available.
7. Security and settings audit history is limited to 20 rows. Label its scope and design pagination before calling it complete history.
8. Existing PR #113 is open and contains dashboard data-integrity and full-digit changes. Establish its final branch/base and migration status before implementation; do not merge it automatically.

## 3. Route and surface inventory

| Area | Routes / surfaces | Primary user job |
| --- | --- | --- |
| Authentication | `/admin/login`, `/admin/reset-password`, loading/error states | Sign in or recover access safely |
| Overview | `/admin` | Understand pipeline and act on today's priorities |
| Leads | `/admin/leads`, `/admin/leads/[id]`, dossier drawer | Find, qualify, assign, and follow up inquiries |
| Deals | `/admin/deals`, `/admin/deals/[id]` | Manage stages and guarded transitions |
| Works | `/admin/works` | Track delivery, milestones, health, and owners |
| Tasks | `/admin/tasks`, scheduler | Complete, reschedule, and inspect follow-ups |
| Team | `/admin/team`, `/admin/team/[id]` | Manage people, access, workload, and audit history |
| Analytics | `/admin/analytics` | Understand defined metrics and stage distribution |
| Inquiries | `/admin/ingestion` | Inspect actual website inquiry events and processing |
| Governance | `/admin/settings` | Manage supported settings and inspect audit events |
| Compatibility | `/admin/users`, `/admin/user-management` aliases, not-found and denied routes | Preserve existing links and permission behavior |

Before replacing duplicate surfaces, trace where each is actually mounted: New Lead modal/drawer, lead detail modal/drawer and dossier, edit and conversion dialogs, stage/lost/won/on-hold dialogs, follow-up scheduler, batch reassignment, add/suspend member, reassignment wizard, permission editor, credential reveal, and avatar upload. Retain or consolidate only after mapping callers, deep links, and action contracts.

**Dialog acceptance matrix:**

| Dialog / flow | Required behavior and edge cases |
| --- | --- |
| Create / edit lead | Contact requirements and field-level validation; duplicate outcome; role-scoped assignees; retain draft on failure; dirty-close confirmation; focus restoration. |
| Qualify / negotiation / lost / won / on hold | Stage-specific positive value/date, loss reason and notes, contract terms, or future revisit as applicable; no terminal-stage bypass; show server rejection; preserve audit and converted locking. |
| Follow-up | Validate date, time, timezone and note; show pending/success/error; refresh queue; retain inputs on failure. |
| Bulk reassignment / offboarding | Preview the exact selection and affected count; authorize caller and active destination; communicate atomic outcome or actionable failure, never unsupported partial success. |
| Add / suspend / permissions | Respect role and sole-admin guards; validate and audit; protect unsaved changes. Temporary credentials must not be exposed in URL, storage or logs. |
| Avatar | Validate file type and size, provide an accessible crop alternative, show progress and recoverable upload errors. |

All dialogs need an accessible title, focus management and restoration, an explicit Escape/backdrop policy while saving, announced errors, and a usable mobile presentation.

## 4. Proposed design system

### 4.1 Tokens

Initial working values to validate in browser and against contrast measurements: canvas `#f7f7f6`, surface `#ffffff`, primary text `#111111`, secondary text `#444444`, muted text no lighter than a tested AA-compliant value, border `#dedede`, brand red `#ea002a`, red hover `#c40023`, and focus ring with a tested contrast on adjacent colors. Confirm red button foreground by measuring actual contrast; do not assume white text passes. Use semantic tokens for success, warning, danger, and information with text labels, not hue alone.

Use Circular XX Book/Medium/Bold where available, with reliable system fallbacks. Body text target 14–16px; table data 14px minimum by default; labels 12–13px where contrast permits; page headings approximately 28–32px desktop and 24–28px mobile. Financial figures use `tabular-nums`, full locale grouping, and no `L`, `Cr`, `K`, or `M` abbreviations. Preserve meaningful decimal precision according to the underlying currency contract.

Use a 4px spacing base: 4/8/12/16/24/32/48. Working starting values: 24–32px desktop content padding, 16–20px mobile, 48–56px data rows, 44px minimum common action targets, 4–8px control radii, 8–12px panel radii. No nested card borders. Provide clear focus, hover, pressed, disabled, loading, error, and selected states.

### 4.2 Components

Build or adapt shared components for: shell/navigation; page title and primary action; buttons and icon buttons; text/select/date inputs; search/filter bars with active-filter count; tabs; table and mobile record card; status label; metric summary with source/period help; chart with text/table equivalent; empty/error/loading state; toast and inline feedback; accessible dialog/drawer; pagination; audit timeline; and confirmation for destructive actions.

Choose one component API and migrate callers incrementally. Inventory existing implementations before consolidation, including `admin/components/layout`, `Dashboard`, `kpi`, `LeadsTable`, `DossierDrawer`, `DossierWorkspace`, `Scheduler`, and `modals`. Keep server action, RLS, URL, and role checks intact. Do not place domain calculations in presentation components.

### 4.3 Responsive and interaction rules

Desktop: persistent sidebar and flexible content; tables retain useful density. Tablet: collapsible rail, wrapped toolbars, charts stack as needed. Mobile: accessible navigation drawer, full-width content, primary action reachable without overflow, tables represented by cards or deliberate horizontal scroll with labels retained. Validate at 320, 375, 768, 1024, 1440, and 1920 CSS pixels, 200% zoom, and long full-digit amounts.

Keyboard: visible focus, logical tab order, correct roles and labels, Escape and focus restoration for dialogs, and keyboard-accessible table sorting and board movement. Dragging must also have a single-pointer non-drag alternative. Follow WCAG 2.2 AA; 44px controls are the project target where practical. Respect `prefers-reduced-motion`.

## 5. Shared shell and global behavior

**Desktop composition:** sidebar with logo and nine permission-aware destinations; compact top bar with breadcrumb, global search if functional, and account menu; content heading with one page-level primary action. Do not duplicate the same primary action in multiple prominent places.

**Sidebar:** overview, leads, deals, works, tasks, team, analytics, inquiries, settings; preserve existing role and custom-tab rules. Active state uses readable text plus an indicator. Due counts must have a real source and meaningful failure state. Collapsed mode retains accessible labels and tooltips.

**Mobile:** menu button opens a focus-managed drawer; closing returns focus. Search and account actions remain reachable. Do not conceal unauthorized-route failures behind a misleading dashboard redirect.

**Acceptance:** direct links, back navigation, `/users` aliases, user role and suspension behavior, search, sign-out, active navigation, notifications, and loading/error states work on every supported viewport.

## 6. Detailed page specifications

### 6.1 Authentication

Use a properly rendered brand mark, compact sign-in panel, clear work-email and password labels, red primary button, show/hide password, and actionable help. Reset password uses the same structure. Show validation beside the relevant field; loading and failed login remain accessible and do not disclose account existence. Test autofill, password manager, Enter submission, focus, invalid/expired reset links, and narrow screens.

### 6.2 Overview

**Layout:** heading and date selector; a row of four concise metrics; below, a wider performance area and a narrower pipeline stage list; then a follow-up or recent-deal table. On mobile stack in this order, with priority work visible before secondary charts.

**Metrics:** active pipeline value, converted contract value, active deals, and conversion rate only where a source and calculation are defined. Show date scope on period metrics and make clear when a metric is a current snapshot. Comparison is unavailable when no valid baseline exists; do not show synthetic percentage changes. Full digits everywhere.

**Chart:** plot persisted conversion events for selected range with explicit period labels, source and unit. For all-zero values render one zero baseline and a message such as 'No conversions in this period'; do not produce repeated rounded tick labels. Provide keyboard access and a data-table alternative. A failed query is not an empty chart.

**Pipeline:** use configured stages and real totals. Clearly state whether open and potential buckets are included. Each stage opens a consistently filtered deals view. Never show invented duration or velocity.

**Ledger:** display the latest loaded active deals with client, category, value, stage, next follow-up and owner. Label its limit; preserve search and filters; offer retry if its query fails. A missing owner must be distinguishable from a failed directory query. Export must either include the documented displayed scope or state its full scope clearly; disable only with an explanation.

### 6.3 Leads and lead detail

**List:** title, New lead, search, filters (status, owner, source, priority), active filters and reset; sortable table with client, contact, source, status, owner, value, follow-up, and row actions. Preserve URL filter/deep-link state. Use server-backed pagination or a clearly labeled bounded dataset; never silently omit records. Table headers identify sort state; controls remain keyboard usable.

**Detail/drawer:** identity and contact actions; stage, owner, value, next follow-up; brief and notes; chronological activity; related work. Clear hierarchy and one primary action. Preserve add/edit/assign/schedule/convert and deep links. Confirm unsaved changes, show validation and server errors near controls, and restore focus when closed. Show empty, unavailable, archived/suspended owner, locked converted record, and unauthorized states separately.

**Mobile:** record cards retain name, stage, value, next follow-up and owner, with accessible actions; secondary fields move into detail rather than disappearing from the data model.

### 6.4 Deals and deal detail

Offer Board and Table views with the same filters and visible total/loaded counts. Board columns show configured stage, count and value. Deal cards show client, value, owner and follow-up. Long pipelines scroll horizontally without clipping keyboard focus. An explicit 'Move to stage' control supplements drag interaction and opens required negotiation/lost/converted/on-hold dialogs. Preserve existing previous/next stage controls and server-side transition checks.

Replace the silent 100-record ceiling with an explicitly designed paging/loading strategy. Define what column totals represent when only a page is loaded. Preserve optimistic rollback and show errors without pretending a transition succeeded. Detail views share the lead dossier model and permission rules.

### 6.5 Client works

Use a searchable list/table with client, project, delivery stage, health, next milestone, creative lead and technical lead. Open a detail panel for milestone checklist and assignment. Preserve stage/health edits, milestone optimistic rollback, director assignment role guards, and missing-owner states. Show saving, conflict, failure, and no-project states. Mobile cards retain the next milestone and owner.

### 6.6 Follow-up tasks

Group queue by overdue, today, and upcoming; include client, owner, stage, due time, and next action. Filters for owner and due range must preserve URL state where supported. Completing, rescheduling, and opening a lead must report the server result. Explain on-hold suppression and time zone. Design empty, inaccessible, stale task, concurrent update, and failure states.

### 6.7 Team and profile

Directory rows: name, role, status, assigned workload and actions; search/filter by role and status. Profile: identity, account state, permissions, assigned portfolio, and audit timeline. Preserve role boundaries for create, invite, edit permission, suspend/reactivate, reassignment, password reset, and avatar upload. Temporary credentials are shown only in their existing safe one-time flow. Confirm consequential actions; show errors and partial failures; don't imply session revocation or reassignment succeeded without confirmation.

### 6.8 Executive analytics

Use the same light canvas and black text as the rest of the product. Provide date and relevant filters, clear metric definitions, stage table and charts only where supported by data. Align source scope, synthetic exclusions, RLS, pagination and conversion definitions with overview, or visibly explain legitimate differences. Show last successful update and retry on failure. No fixed benchmark or quota unless configured and sourced. Expose chart values in a table; avoid color-only distinctions.

### 6.9 Website inquiries

Show actual inbound events with time, source, client, processing result, merge outcome when recorded, and a safe detail/JSON inspector. Establish a reliable event source and filter before calling entries website submissions. Display health only from an actual health check; otherwise say 'Health unavailable'. Do not turn configuration or query failures into zero/default values. Gate simulation controls by authorization and clearly identify simulated records. Distinguish production and benchmark data.

### 6.10 Settings and audit

Group operational timing, notification and security settings in readable sections rather than isolated decorative cards. Each field has a unit, valid range, current value and inline error. Save shows dirty, saving, saved, and failed states and warns on unsaved navigation. Confirm which settings actually affect live behavior; label unsupported controls instead of implying enforcement. Audit history shows actor, action and time, search/filter, and its true loaded range with pagination or an explicit limit.

## 7. Data, security and interaction contracts

Create a metric catalog before layout work: metric name, exact formula, time field, timezone, numerator/denominator, current vs period scope, synthetic-data policy, source query/RPC, authorization scope, empty/error behavior and reconciliation checks. Review active pipeline, weighted potential value, converted contract value, conversion rate, follow-up SLA, stage counts, lead totals and currency conversion. Record unresolved business definitions for review; do not invent values.

Validate every redesigned read and mutation through active session, role and tab permissions, RLS, input validation, and existing server action contracts. Preserve audit attribution and atomic operations. No fake status, silently swallowed errors, fabricated fallbacks or client-only authorization. Do not run fixture-mutating RLS tests against the remote `.env.local`; use a disposable database.

For every action, specify: initiating control; permission; required input and validation; pending state; success feedback and refreshed data; failure and retry; keyboard behavior; and audit/event expectations. Verify row actions, filters, sort, pagination, export, search, dialogs, stage changes, reassignment, scheduling, settings save, logout and recovery.

## 8. Work packages and review gates

1. **Discovery and contracts:** record branch/PR #113 state; trace all routes, shared components and dialog mounts; reproduce screenshots; build metric/source and action/permission matrices. At planning time PR #113 is open against `master` at `f7edb1bb51b7881782c96912192729fc9158076a`; recheck before execution. A stacked implementation may branch from that PR and target its branch for review; retarget only after the human maintainer merges the dependency. Its database migration is not assumed deployed and must be tested in a disposable database. Deliverable: approved inventory and data definitions.
2. **Design system and prototypes:** update design guidance; validate logo/fonts; establish admin tokens and component states. Produce desktop and mobile mockups for login, shell, overview, leads, deal board and dossier. Gate: visual review of actual compositions, red CTA contrast, full-digit amount fit and responsive behavior.
3. **Foundation:** implement tokens, shell, navigation, shared controls, typography, focus, dialog and table foundations; migrate auth. Gate: keyboard, roles, mobile navigation and public-site style isolation.
4. **Commercial workflows:** leads, details, deals, stage dialogs, search/filter/paging. Gate: full end-to-end create-to-follow-up and stage transitions, errors, permissions and no omitted rows.
5. **Operations:** works, tasks, team and member detail. Gate: role matrix, concurrent updates, optimistic rollback and audit behavior.
6. **Reporting and governance:** overview, analytics, inquiries and settings. Gate: cross-page reconciliation using controlled fixtures; zero/empty/error/partial states; measured health; export and pagination.
7. **Final quality review:** responsive, accessibility, content, browser interaction, security, data, performance, build and regression checks. Document limitations, migration ordering and rollback before opening or updating a PR. PR remains open for human review; never merge automatically.

Each package must preserve a working route and avoid a permanent split between old and new components. Keep PRs small enough to review, while grouping interdependent tokens and consumers so there is no broken intermediate design. Branch and PR sequence must reflect the actual state of PR #113 at execution time.

## 9. Verification matrix and delivery criteria

| Dimension | Evidence required |
| --- | --- |
| Visual | Desktop/tablet/mobile screenshots of every route and key dialog; verify logo, contrast, full digits, spacing, long content and no overflow. |
| Interaction | Click and keyboard walkthrough of every primary/secondary control; correct deep links, focus return, validation, loading, retry and unsaved state. |
| Access | Admin, manager, executive, viewer, suspended and custom-tab cases; direct URLs, server actions and RLS agree. |
| Data | Controlled empty/single/multiple/large/error/synthetic datasets; reconcile overview, analytics and board; exact financial formatting and export scope. |
| Accessibility | WCAG 2.2 AA contrast, keyboard, screen-reader names, focus visibility, non-drag stage action, reduced motion and chart alternative. |
| Engineering | Relevant unit and integration tests, type check, focused lint, production build, safe isolated RLS tests, and graphify update. Record failures rather than claiming a pass. |
| Performance | Check real navigation, table paging/virtualization, large datasets, mobile usability and layout shifts; set budgets after measuring baseline. |

Test at least 0, 1, page boundary, over-page-boundary and large result sets; missing/inactive users; invalid/negative/large monetary values; no conversion baseline; failed and partially failed queries; session expiry; and simultaneous modifications. Preserve real user data and never run remote-mutating test suites against the current remote configuration.

## 10. Reference research

- [Nielsen Norman Group: complex application design](https://www.nngroup.com/articles/complex-application-design/) — keep important information salient and reduce clutter without removing capability.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [W3C Kanban drag alternative](https://www.w3.org/WAI/WCAG22/Techniques/general/G219) — accessibility baseline and a non-drag alternative.
- [Carbon data table accessibility](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/accessibility) — accessible sorting and table controls.
- [GOV.UK chart guidance](https://brand.design-system.service.gov.uk/data/charts/) — clear chart labels and sources.
- [Ion sales pipeline on Dribbble](https://dribbble.com/shots/26807157-Ion-Sales-Pipeline-Dashboard) and [CrmOne analytics on Dribbble](https://dribbble.com/shots/27677124-CrmOne-CRM-Sales-Analytics-Dashboard-Design) — visual references for hierarchy and workflow; not evidence of tested usability.

## 11. Execution decisions and remaining dependencies

- The user approved the light editorial direction, Circular XX public brand, red primary actions, full-digit INR values, responsive behavior, and implementation/PR creation. The Design Read is ENERGY 2 / RHYTHM 2 / MOTION 1.
- PR #113 is open against `master`; this branch starts from its head and the redesign PR must target `remediation/admin-crm-data-integrity-audit-hardening` to keep the review stack isolated.
- Synthetic simulator data is excluded from reporting. Unconfigured metrics, quota targets, health checks, historical comparisons, and incomplete query results are presented as unavailable rather than invented.
- The follow-up transaction migration requires application and database verification in an isolated local `_test` database. No remote migration or fixture-mutating test has been run.
- See `DESIGN.md` for the applied visual system and `IMPLEMENTATION_REVIEW.md` for current coverage, checks, and remaining evidence gaps.
