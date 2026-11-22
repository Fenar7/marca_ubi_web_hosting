# Commercial overview redesign

The overview uses the public Marca Ubi font files and a single workspace search. Follow-ups and the stage summary sit above reporting. The opportunity ledger keeps long names readable and exposes stage moves through the appropriate confirmation or guarded workflow.

## Metric definitions

| Surface | Source and scope |
| --- | --- |
| Open pipeline | Expected value and count of authorized open and potential opportunities at the snapshot time. |
| Weighted pipeline | Expected value weighted by the configured qualified, proposal and negotiation probabilities. An unsupported potential stage leaves the metric unavailable. |
| Won deal value | Expected value of converted deals with a conversion timestamp in the selected period. Previous-period comparisons use corresponding elapsed windows in UTC. |
| Average time to win | Arithmetic mean of valid elapsed creation-to-conversion times in that period. |
| Follow-ups | Authorized open opportunities with a due date or qualifying for the unassigned queue. The queue and dashboard share UTC day boundaries. |
| Stage and service breakdown | Server-side aggregates across the open pipeline. The stage filter runs before selecting the 25 latest matching opportunities. Search and other ledger filters apply to that preview. |
| Recently added | Open opportunities ordered by their recorded creation time. |

A zero is a measured result. Missing financial valuations can make totals unavailable. Users without financial access receive counts where applicable, and the route omits monetary columns from their reads. The dashboard omits cash-flow and SLA-rate views because this read model lacks payment and completed-SLA events.

## Delivery gates

| Gate | Evidence |
| --- | --- |
| Foundation | Public font bindings, readable tabular figures, labeled date scope and distinct empty and unavailable states. |
| Visual restraint | One desktop search on Overview, flat panels with limited elevation, and semantic action and status styling. |
| Hierarchy | Open pipeline leads the summary, follow-ups precede reporting, and full opportunity names lead the ledger. |
| Interaction | Browser fixture checks cover keyboard chart selection, period, CSV, stage filter, stage confirmation, search, mobile navigation and restricted roles. |

## R-35 click-through

The local Chromium harness rendered the application components with labeled fixtures at 320, 390, 768, 1024 and 1440 CSS pixels. Axe checks at 390 and 1440 reported zero violations for the selected WCAG tags. The stage confirmation was opened and canceled. The harness does not authenticate or mutate a live CRM. Authenticated database and stage-mutation verification remain separate from this browser evidence.

Reproduce with `node docs/sales_funnel/dashboard_redesign_2026_11/visual-harness.cjs`, then `node docs/sales_funnel/dashboard_redesign_2026_11/verify-visual-harness.cjs`.
