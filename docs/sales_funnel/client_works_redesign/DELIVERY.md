# Client Works redesign

The authenticated `/admin/works` route is a delivery register. The six-stage pipeline applies a stage filter, and the attention queue opens blocked and at-risk projects directly. The project list combines search, health, and stage filters. Each row shows the client identity, current stage, health, completed milestones, and target date. Opening a row reveals the checklist, project contacts and dates, contract value, and controls permitted for that project.

## Sample projects

In local development, an authenticated admin sees samples automatically when the live project query succeeds with zero rows. **Back to live projects** opens `/admin/works?sample=0`, and **View sample projects** explicitly opens `/admin/works?sample=1`. The six fictional projects cover every stage and health state. The sample view is labeled and read-only. Its identifiers fail the real mutation schemas. Production continues to read authorized CRM records, which are created when their deals convert.

## Design and verification

| Gate | Evidence |
| --- | --- |
| Hard gate | Loading, failed, empty, filtered-empty, read-only, and populated states are separate. The retry performs a fresh request. Final fixture results are recorded in [browser-results.json](./browser-results.json). |
| Purpose | A pipeline stage is a filter. The attention queue opens a specific project. A status marker conveys health and each disclosure reveals project-specific detail. |
| Liveliness | Energy 2, Rhythm 2, Motion 1. Circular XX distinguishes titles and stage totals. Graphik keeps operational text legible. Motion is limited to the disclosure indicator and respects reduced motion. |
| Craft | Stage, health, and milestone editing use the existing guarded actions. The director dialog uses native modal focus and Escape handling. On narrow screens, records stack their stage, health, milestones, and date. |

See [desktop](./screenshots/works-desktop.png), [mobile](./screenshots/works-mobile.png), [project details](./screenshots/works-details.png), and [empty portfolio](./screenshots/works-empty.png). The [browser report](./BROWSER_QA.md) records the 21 checks and how to reproduce them. The fixture browser suite exercises real project components with simulated writes. No live CRM records were seeded or changed.

TypeScript, focused ESLint, 78 repository tests, and the 50-action boundary audit passed.
