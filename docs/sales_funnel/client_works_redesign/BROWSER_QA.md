# Client Works browser verification

The Chromium run passed 21 checks against the real Client Works component and styles in a loopback-only fixture server. Fixtures used the same fictional projects as the development preview. Mutation handlers returned success or failure through the fixture adapter. Authenticated production rendering and live database writes were outside this run.

| Journey | Observed result |
| --- | --- |
| Portfolio and details | Loaded all six sample projects and expanded the selected project to its milestone list. |
| Search and filters | Health and search worked together, the delivery stage narrowed the list, and an attention shortcut cleared filters, expanded the target and focused its trigger. |
| Permissions | Viewers and sample users had no edit controls. An assigned director could edit their project and read another project. |
| Project updates | Milestone, stage, health and director changes invoked the corresponding stub writes. A rejected milestone returned to its previous state and showed an alert. |
| Assignment dialog | Escape dismissed the dialog and restored trigger focus. Successful fixture assignment updated the project. |
| Empty state | No sample records appeared with the empty fixture. |
| Responsive behavior | No document overflow at 320, 375, 768, 1024, 1440 or 1920 CSS pixels. Expanded project content also reflowed at 320 pixels. |
| Accessibility and runtime | Axe reported zero serious or critical violations. Chromium reported zero page errors. |

An initial pass found a disclosure-button name that hid visible card text from its accessible name and a clipped mobile filter label. The final pass ran after both fixes.

[Desktop sample](./screenshots/works-desktop.png) · [Project details](./screenshots/works-details.png) · [Mobile sample](./screenshots/works-mobile.png) · [Empty state](./screenshots/works-empty.png) · [Machine-readable results](./browser-results.json)

From the repository root, start `node docs/sales_funnel/client_works_redesign/visual-harness.cjs`, then run `node docs/sales_funnel/client_works_redesign/verify-browser.cjs` in a second terminal. The server binds to `127.0.0.1:3026`. Stop it after the checks finish.
