# Admin CRM Dashboard Data Integrity Audit

**Date:** 5 November 2026  
**Scope:** Executive command center, CRM deal and lead workspace KPI surfaces, team display data, activity attribution, and related row-level security.  
**Reference:** `docs/sales_funnel/marca_ubi_sales_funnel_crm_master_prd.md` and `docs/sales_funnel/research_modules/sprint_6_1_architecture_spec.md`.

## Findings and changes

### Executive command center

- The original overview mixed calibrated demonstration values with persisted CRM data. KPI cards, revenue chart, pipeline stage rows, and recent deals could therefore look live while not reflecting database records.
- Replaced those values with paginated lead/status reads, conversion timestamps, persisted stage colors, and real owner labels. Aggregation errors produce unavailable states instead of partial totals.
- Added a `command_center` tab authorization check at the page boundary. Admins retain access; other roles must have the tab explicitly or through their role defaults.
- Replaced the “cash collected” implication with converted contract value. The CRM schema has no payment ledger, so converted lead valuation cannot establish cash received.
- Removed quota/target comparisons because no authoritative quota source exists. Conversion comparisons are unavailable when a valid baseline does not exist.
- Implemented CSV export from the displayed dashboard payload, quoting cell values and neutralizing spreadsheet formula prefixes.
- The converted value chart now uses persisted `converted_at` events. It does not infer revenue from creation dates or current stage counts.
- Stage-weighted potential value follows the documented coefficients: Qualified 25%, Proposal Sent 50%, Negotiation 85%. Unknown potential stages make the weighted total unavailable rather than silently assigning a probability.

### CRM workspace data and interaction

- Replaced fabricated deal rows and decorative controls with persisted lead data, active filters, search, real detail links, keyboard chart navigation, and explicit empty/error states.
- Stage colors now come from the configured funnel status records.
- Lead and deal KPI areas use the existing KPI ribbon with the persisted RPC payload and URL filters. Filtered deep links do not initially show unfiltered server totals.
- Owner and activity display queries use `crm_team_directory`, a narrow active-staff projection, instead of reading contact fields from profile records.

### Authorization and audit data

- Added a migration that binds activity `actor_id` to `auth.uid()` and limits sales executives to activities on assigned leads. Direct activity update/delete remain denied; lead deletion keeps the PRD’s cascade lifecycle behavior.
- Restricted direct profile reads to leadership and the caller’s own active identity. Added a security-barrier team directory exposing only `id`, `full_name`, `role`, and `avatar_url` for active staff.
- Updated work assignment selectors and activity history reads to use the safe directory view, avoiding regressions from the profile-table restriction.
- Extended the RLS matrix source tests for profile scope, safe directory exposure, suspended users, activity actor spoofing, and authorized lead-delete cascade behavior.

## Validation

- `npx tsc --noEmit --incremental false --pretty false` — passed with no diagnostics.
- Focused ESLint over changed actions, dashboard pages/components, and timeframe utilities — passed with no warnings after cleanup.
- `npm run test:unit` — 1,387 passed, 0 failed across 358 suites.
- `npm run test:boundaries` — passed; 49 async Server Actions across 13 modules comply.
- `git diff --check` — passed.
- `graphify update .` — completed.
- `npm run build` — Turbopack production compilation completed, then the separate Next.js type-check worker exited with a Windows process failure. The independent TypeScript check above passed. The build also emitted existing Sass `@import` and color-function deprecation warnings across the repository.

## Validation boundary

The PostgreSQL RLS matrix was not run against `.env.local`: its setup deletes and recreates remote identity and lead fixtures. The SQL migration and test changes were reviewed, but the database behavior still requires application in a disposable/local database and execution of `npm run test:rls` there.

The dashboard reports CRM contract value, not receipts or recognized accounting revenue. A payment ledger and an authoritative quota source are not present in the current schema; those metrics remain intentionally absent until those data sources exist.
