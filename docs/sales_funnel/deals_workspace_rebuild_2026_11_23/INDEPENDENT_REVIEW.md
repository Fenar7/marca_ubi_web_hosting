# Independent Deals rebuild review

Review date: 2026-11-23. Scope: the approved Deals workspace replacement on the current PR branch. This is a source and rendered component review, not certification of a live authenticated environment.

## Findings and disposition

| Finding | Impact | Disposition |
| --- | --- | --- |
| Null deal or stage query payloads were treated as successful empty results | False empty pipeline and totals instead of an unavailable state | Fixed with `dealsPayloadAvailable`. Real empty arrays remain valid, and each missing payload identifies the affected operation. |
| Blank or negative stored expected amounts could be presented as valid numbers | Blank string became zero; malformed values entered financial summaries | Fixed with `normalizeDealAmount`; finite nonnegative numbers and numeric strings are accepted, zero preserved, unavailable values become null. |
| Query mutations merge the committed browser URL while navigation is asynchronous | Search debounce or rapid bucket/view/filter changes can replace a preceding uncommitted filter | The workspace folds changes into the latest requested query until it commits. Popstate cancels a stale search debounce. |
| Initial desktop board expanded the document to 2544px | Board scrolling escaped its intended rail | Constrained grid tracks keep overflow in the rail. The final browser check passed at all six viewport widths. |

## Source review

Reviewed the workspace controller, board/card, shared action dialog, table, toolbar, presentation/query helpers, and permission-aware server assembly. Financial select columns exclude expected amounts for restricted users and restricted DTOs carry null amounts. Lane and table financial presentation honor that capability. Guarded destinations retain the existing transition modal; ordinary moves keep the record in its prior position until server success. Duplicate submission is locked, failures remain visible, and mutations still call existing guarded server actions.

The table uses semantic headers and sorting state, with page-local sorting explicitly labeled. The board retains a non-drag movement alternative, occupied inactive stages, and page-scoped lane totals. Filter changes reset pagination while view switching preserves it.

## Rendered review

Inspected actual component screenshots from the labeled isolated harness: desktop board, desktop table, mobile board, and the move dialog. Cards now present company identity, amount, follow-up and owner/reference without the persistent move form. Calendar, owner, action and movement icons carry functional meaning. Cards, toolbar controls and dialogs use light rounded geometry. Mobile uses one complete lane rather than compressed desktop columns. The searchable move dialog provides an explicit confirmation action.

The final captures remove the duplicate fixture heading and reflect the corrected desktop rail. The browser report records the refreshed click-through.

## Limits and verdict

Final source review found no blocking regression. The existing ordinary stage mutation updates the lead and writes the ledger entry separately. The guarded forms and all action authorization remain in the existing server flows. The fixture evidence covers component behavior. Live RLS, authenticated profile variants, database writes, device keyboards and the shared application shell require an authenticated environment.
