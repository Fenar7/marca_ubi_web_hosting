# Browser verification evidence

## Scope

Verification uses actual `OverviewWorkspace`, sidebar, context header, mobile drawer and launcher modules with local production font/assets, rendered in a separate loopback-only fixture harness on port 3017. A visible banner identifies sample data. No production route, authentication bypass or live database fixture was introduced.

The harness adapters replace Next navigation with history transitions and refresh fixture DTOs for selected queue/period. Account upload/logout mutations are blocked or stubbed. This proves client rendering and listed interactions, not authenticated database correctness, actual network pending timing, RLS or successful sign-out/upload.

## Repeatable result

`node docs/sales_funnel/dashboard_redesign_2026_11/verify-visual-harness.cjs` completed with exit code 0: **25 checks passed**. Full machine-readable results: `visual-check-results.json`.

| R-35 journey | Viewport/state | Observed result |
| --- | --- | --- |
| Initial queue | 1440px, admin, ready | Six real component preview rows render; runtime errors absent |
| Queue selection | Admin ready | Today URL and pressed selection update after transition |
| Outcomes period | Admin ready | 7d URL preserves selected queue |
| Definitions | Admin ready | Explanatory reporting scope expands |
| Summary export | Admin ready | Download contains snapshot/period declarations, aggregate scope and excludes sampled client names |
| Sidebar collapse | Desktop | Collapsed/expanded controls respond |
| Search launcher | Desktop keyboard | Ctrl K opens, query receives focus, lead/deal search destinations contain query, Escape closes |
| Mobile navigation | 375px | Menu opens dialog; Escape closes and returns focus to Menu |
| Responsive overflow | 320/375/768/1024/1440/1920px | No document horizontal overflow |
| Empty preview | Admin empty | Explicit empty follow-up state |
| Query failure | Admin unavailable | Explicit records-unavailable state |
| Viewer | Desktop | Active opportunities replace Tasks; export and Follow-ups destination absent |
| Sales executive | Desktop | Monetary output and export absent from restricted fixture |
| Accessibility | Desktop | axe WCAG AA checks pass; no serious/critical findings. One moderate best-practice `region` finding belongs to the fixture-only identification banner |

Screenshots were regenerated after final navigation label fixes and mobile scroll reset: `screenshots/desktop-ready.png`, `mobile-ready.png`, `desktop-empty.png`, `desktop-unavailable.png`, `desktop-viewer.png`, `desktop-sales_executive.png`.

## Limits requiring authenticated staging review

- Direct authenticated route/permission/RLS reconciliation and real aggregate-to-preview results.
- Every destination's full network-backed page behavior, actual create/follow-up transactions and sign-out/upload success.
- Persistence after a real route remount, network error/pending transitions and non-reduced-motion behavior.
- Real browser zoom and exhaustive touch-target measurement.

The read-only live loopback `/admin` smoke redirected to the sign-in page. No explicit isolated-database credentials were available, so authenticated journeys were not run or claimed. This evidence supports draft review, not unconditional production certification.
