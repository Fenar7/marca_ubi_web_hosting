# Lead queue redesign

The redesign is scoped to the Leads queue at `/admin/leads`. It borrows Circular and Graphik typography, light Helvetica Neue figures, pale header surfaces, and restrained status accents from Commercial Desk. Desktop retains the virtualized ledger and sticky header. Mobile uses cards with visible owner names and a dedicated Dossier button. The filter bar reports the matching subset of already loaded records.

## Delivery gates

| Gate | Evidence |
| --- | --- |
| Visual hierarchy | One result heading, a single filter toolbar, title-case column labels and a stable slot for each row action. |
| Restraint | Static overdue count, tinted conversion action, and stage color used as a marker on dark readable text. |
| Responsive behavior | Chromium fixtures at 320, 390, 768, 1024, 1240 and 1640 pixels. No page-level horizontal overflow. Intermediate desktop widths can scroll the ledger. |
| Keyboard and authorization | Pressed filter states, sortable columns, visible focus, named dossier actions, and viewer action gating. |

## R-35 click-through

Chromium rendered the real filter and grid components with isolated fixture records. The checks exercised bucket selection, search, an empty result, Escape to clear search, a source option, numeric sort, a desktop dossier link, and a narrow-screen filter popover. Desktop and mobile axe scans reported zero violations under the selected WCAG tags. The server-action boundary checks passed. The fixture does not run live CRM writes or exercise an authenticated database.
