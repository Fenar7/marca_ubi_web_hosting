# Deals board redesign

The board displays loaded deals in their saved pipeline stages. Each lane shows the count and expected value on the current result page. Search and pagination stay server-side. The Board and Table views share the same URL filters and page. Smaller screens use a stage picker and show one lane at a time.

Desktop drag and drop and the card’s Move form use the same transition handler. Ordinary moves update the card after the action succeeds. Guarded transitions open the existing confirmation workflow. The server still checks actor, portfolio, and target stage. Retired stages remain visible when they contain records. Viewers can inspect records without movement controls.

The owner notice appears beside the board when details are unavailable. The signed-in lookup can fall back to active profiles under existing database permissions. The CRM directory migration already in this PR is needed on databases where the view is absent.

## Delivery checks

| Gate | Evidence |
| --- | --- |
| Foundation | Circular headings, Graphik controls, tabular INR, full deal references and readable names. |
| Visual restraint | Stage color indicates category and overdue text carries urgency. |
| Hierarchy | Stage, deal identity, value, owner and follow-up precede card actions. |
| Interaction | Chromium fixtures passed at six widths, including desktop and mobile axe scans, drag-and-drop, the stage picker, guarded cancellation, failed saves, Board/Table navigation, and viewer gating. |

The browser click-through used fixtures with stubbed mutations. Live CRM writes and live account permissions were outside that test.

[Atlassian Kanban board patterns](https://www.atlassian.com/agile/kanban/boards/) · [W3C drag alternatives](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements)
