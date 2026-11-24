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

## Full Inbound Leads page

The page now opens with the title, one creation action, and a single workspace containing the toolbar, ledger, and pagination. The opening counts duplicated the filters and were removed. Page-specific results and lookup errors remain visible near the records they affect. The owner directory falls back to active profiles under the same signed-in client and reports incomplete lookups without replacing lead records.

| Gate | Evidence |
| --- | --- |
| Foundation | Circular headings, Graphik controls, existing dashboard slate and status tones. |
| Visual restraint | Removed the duplicate introduction, count strip, and conversion banner copy. |
| Hierarchy | Filters sit immediately above the ledger. Pagination preserves active filters. |
| Interaction | Chromium fixtures at six widths, with desktop and mobile axe checks. Creation event, overdue selection, pagination, and retry verified. |

The fixture exercises the layout and navigation with sample data. Live account writes and directory permissions require authenticated verification.

References include [Carbon data-table layout](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/specifications) and [Atlassian section messages](https://atlassian.design/components/section-message/usage).
