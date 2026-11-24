# Deals rebuild verification

The installed Next package is16.1.6; its dist/docs directory is absent. Read the matching official [server/client component guide](https://github.com/vercel/next.js/blob/v16.1.6/docs/01-app/01-getting-started/05-server-and-client-components.mdx), downloaded to OS temp `marca-next-16.1.6-guides/server-and-client-components.mdx`, before framework work.

Interaction guidance: [W3C dragging alternatives](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) and [W3C modal dialog keyboard/focus pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). The stage move must work without dragging; an open modal owns keyboard focus and restores it on dismissal.

Browser verification uses an isolated loopback harness with actual production Deals modules. Sample records are labeled; mutations are stubbed. This cannot certify live RLS or authenticated mutation behavior. No production auth bypass or live database fixture writes are introduced.

## Recorded browser result

`verify-browser.cjs` passed 16 checks and `verify-edge-browser.cjs` passed ten checks. Machine-readable evidence is in `browser-results.json` and `edge-browser-results.json`.

| Journey | Observed fixture outcome |
| --- | --- |
| Board resting cards | No permanent native Move form; identity, amount, follow-up and owner footer render |
| Explicit stage move | Selecting Contacted then explicit Move calls the fixture action and commits the record to destination |
| Failed move and retry | Source lane retained; selected destination retained when reopening; no false success |
| Guarded transition | Negotiation enters guarded fixture dialog; cancellation leaves record unchanged |
| Drag | Real Chromium mouse input from the card body timed out before the fix. After the fix, dropping moves the card and updates the count. A guarded drop opens its form and cancellation keeps the card. Viewer cards are not draggable. |
| Menu dismissal | Escape restores focus to the originating card's action trigger |
| Table | Semantic table and column headers render; view switch preserves search |
| Filters | Explicit application preserves view/search and adds owner filter; Escape closes filter dialog |
| Overlapping filter requests | With 650 ms fixture navigation latency, the final URL keeps the requested Table view, Open bucket and debounced search |
| Read-only/restricted | Viewer action menu contains no move; restricted fixture emits no rupee amounts |
| Empty | Explicit no-deals presentation |
| Responsive | No document overflow at320,375,768,1024,1440,1920 CSS pixels |
| Accessibility/runtime | Axe serious/critical violations0; browser runtime errors0 |
| Magnification | CSS zoom200% has no document overflow; native browser zoom was not certified |

First render uncovered actual desktop overflow: grid min-content sizing expanded the document to all lanes. Implementation corrected containment; final six-width rerun passed. Initial axe helper failure was corrected by creating an explicit browser context. These preliminary failures were not called passes.

## Visual artifacts

Latest production-component renders are in `screenshots/`: `board-desktop.png`, `table-desktop.png`, `board-mobile.png`, `table-mobile.png`, `move-popover.png`, `filters-desktop.png`, `restricted-desktop.png`, `empty-desktop.png`, `zoom-200-css.png`.

The first screenshots contained a duplicate fixture heading; final images remove it because the production workspace owns its page header. Fonts are loaded from actual local Circular XX/Graphik assets.

## Repeatability and limits

Start `node docs/sales_funnel/deals_workspace_rebuild_2026_11_23/visual-harness.cjs`, then run the two verification scripts in the same directory. Harness binds loopback3021 and writes its bundle into the OS temp folder; it adds no production route. On a memory-constrained machine, set `GOMAXPROCS=2` for esbuild before starting.

Next navigation is represented by history transitions and fixture filtering. Ordinary and guarded mutation responses are stubbed. Real database/RLS enforcement, contact launching, guarded form validation, authenticated save success, native browser zoom and physical-device input remain outside this fixture evidence. No live data was changed.
