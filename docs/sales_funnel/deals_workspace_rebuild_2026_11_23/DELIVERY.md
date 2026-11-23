# Deals workspace delivery

## Implementation

- Board cards group company/contact identity, source-backed classification, expected value, follow-up and owner/reference. The action dialog exposes contact, copy, detail and allowed stage movement. It provides a click or tap alternative to dragging.
- Board lanes scroll within the workspace on desktop. Narrow screens show one lane with stage navigation. The semantic Table exposes page-local sorting, and mobile Table mode uses a readable record list.
- Shared URL filters preserve the result page when switching views and reset it when changing query scope. Pending URL updates are composed before navigation commits. Invalid filters, unavailable query payloads, missing lookup data and genuinely empty results have distinct paths.
- Financially restricted Deals reads omit expected value from the database select and keep the serialized amount unavailable. Existing role checks and server action boundaries remain in use. Fixture tests use synthetic records without writing CRM data.

## Four-block delivery gate

| Block | Evidence |
| --- | --- |
| Hard gate | Fixture browser runs passed 23 checks. No document overflow at 320, 375, 768, 1024, 1440 and 1920 CSS px. Axe reported zero serious or critical violations and the page reported zero runtime errors. R-35 evidence and limits follow below. |
| Purpose gate | Stage navigation chevrons move between lanes, calendar glyphs identify follow-up, and the ellipsis opens record actions. Card geometry follows record grouping. Circular XX establishes identity and Graphik carries controls and metadata. |
| Liveliness | Design Read was ENERGY 2 / RHYTHM 2 / MOTION 2. Identity leads each card, spacing distinguishes lanes from records, and Marca Ubi red identifies selected controls and important statuses. Motion is limited to interaction feedback and respects reduced-motion preferences. |
| Craftsmanship and quality locks | Shared data and action presentation keeps Board, Table and mobile records aligned. Documented checks cover keyboard dismissal, visible focus, empty, restricted, failed and pending paths. The native zoom and live verification limits below apply. |

## R-35 click-through

The [browser report](./RESEARCH_AND_QA.md) records each verified journey. The [primary results](./browser-results.json) and [edge results](./edge-browser-results.json) capture observed outcomes. [Desktop Board](./screenshots/board-desktop.png), [mobile Board](./screenshots/board-mobile.png), [desktop Table](./screenshots/table-desktop.png) and [stage movement](./screenshots/move-popover.png) use the production components with labeled fixtures.

Fixture checks included ordinary movement, failed move and retry, Escape and focus restoration, guarded cancellation, a DOM-dispatched drag, filters, view switching and read-only restrictions. The harness stubs Next navigation and writes. Authenticated CRM operations, database RLS, guarded form submission, external contact launch, hardware drag and native browser zoom require separate end-to-end evidence.

## Repository verification

- Repository tests: 1,337 passed across 330 suites.
- Server action boundary audit: 50 valid async actions across 13 modules.
- Independent source audit: missing query attribution, in-flight filter composition and rail containment confirmed. The existing ordinary stage action performs the update and audit insert separately.
- Production build and authenticated end-to-end verification are tracked on the PR.
