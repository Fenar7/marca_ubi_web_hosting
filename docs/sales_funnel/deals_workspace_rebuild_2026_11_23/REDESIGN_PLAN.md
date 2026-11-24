# Deals workspace: reference-led rebuild

Date: 2026-11-23. Status: planning only, awaiting explicit approval to implement.

## Direction and scope

Rebuild `/admin/deals`: page heading, toolbar, filters, Board/Table switch, lane presentation, deal cards, move-stage interaction, table, loading and responsive states. Replace the presentation structure instead of restyling its existing mini-forms. Preserve authorized workflows and server invariants.

References 8–9 establish the desired visual language: soft white surfaces, lightly rounded controls, compact cards with distinct content groups, meaningful icons, modest status accents, quieter metadata and deliberate spacing. They are project-task references; translate their information hierarchy into commercial deals rather than copying unsupported task features.

Design Read: ENERGY 2 / RHYTHM 2 / MOTION 2. Light operational workspace with tangible, compact cards. Circular XX headings/identity and Graphik working text. Normal and medium weights; no thin small-text treatment. Latest user direction supersedes conflicting borderless/flat presentation decisions in older context records. No changes to global typography or other routes in this slice.

The current branch is `redesign/crm-fundora-editorial-cockpit`. The context register identifies PR #126; its live status was not checked for this planning task. No branch switch, code change, database mutation, commit or PR update is part of this deliverable.

## Source-grounded diagnosis

| Current implementation | Problem | Replacement |
| --- | --- | --- |
| `DealsKanbanBoard.tsx`: each card contains reference, priority, identity, value, labeled owner/follow-up rows, contact links and a Move form | Repetitive controls dominate every card; the card behaves like a miniature settings form | Identity-first card; icon metadata; single footer; contextual actions |
| Board `.lane` and `.card` both have outlines and filled containers | Nested boxes make columns look like tall form panels | Lightweight lane header and nearly borderless lane background; individual cards carry the boundary |
| Board grid uses minimum 272px lanes and shared two-axis overflow | Later stages are partially visible, tall cards reduce scanning density and scroll ownership is unclear | Explicit content-width lanes, horizontal navigation and one documented vertical scroll model |
| Stage selector calls `jumpToLane` | Label looks like a filter, but it scrolls/selects a lane | Desktop lane navigation labeled `Jump to stage`; mobile selected-stage control; actual filter remains separate |
| Toolbar SCSS uses 3–4px radii across search and segmented controls | Controls look sharp and disconnected from the requested style | Consistent 8–10px control radii and coherent grouping |
| Table uses div grids with a large flexible client column and eight columns | Excessive blank identity space; weak alignment and semantic sort structure | Semantic table with deliberate column budgets, shared identity cell and explicit sorting scope |
| Board title prefers company, table leads with contact name | Same record appears to have a different identity between views | Company-first when present, contact-name fallback everywhere |
| Server loads 100 records/page, counts overall results, Board sums loaded rows; Table sorts client-side | Lane totals and sorting cannot be represented as all-matching results | Explicit loaded-page scope in both views; no invented global totals |
| `handleMoveStage` routes guarded transitions into existing modals and commits ordinary moves after success | This is valuable business behavior | Retain the handler contract while replacing its entry controls |

Files inspected: `deals/page.tsx`, `DealsWorkspaceClient.tsx`, `DealsKanbanBoard.tsx`, both associated module styles, `DESIGN.md`, current context and the previous Deals delivery record. Knowledge graph queried before source inspection. Screenshots 1–7 are current-state evidence; 8–9 provide direction. No fresh browser session or live database verification was performed for this plan.

## 1. Page composition

```text
Deals                                                   [New lead*]
Track opportunities and move the next conversation forward.

[Board icon Board] [Table icon Table]       Search…    [Filter icon Filters 2]
All stages   Open   Potential   Converted   Lost
[Owner: … ×] [Priority: … ×] [Clear filters]         Showing 1–100 of …

Stage icon New 11          Stage icon Contacted 18         …
₹16,90,328 · this page     ₹27,46,446 · this page

┌──────────────────────┐  ┌──────────────────────┐
│ Branding    High  ···│  │ Web & Digital     ···│
│ Alserkal Foundation  │  │ SLS Dubai            │
│ Contact name         │  │ Contact name         │
│ ₹65,000              │  │ ₹75,000              │
│ Calendar Follow-up…  │  │ Calendar Tomorrow…   │
│──────────────────────│  │──────────────────────│
│ [TA] Tariq       LD… │  │ [SS] Sophia      LD… │
└──────────────────────┘  └──────────────────────┘

Horizontal board navigation                  Result pagination
```

Wireframe text/numbers illustrate structure, not final data. `New lead` appears only when the existing Leads/create workflow is authorized. If unavailable, omit it; do not invent a standalone deal-creation flow.

The toolbar occupies one coherent work region, with controlled wrapping at intermediate widths. Board/Table are view tabs; bucket filters are a separate secondary row. Search and Filters retain stable positions in both views. Avoid a title followed by large empty bands or multiple boxed toggle groups fighting for attention.

## 2. Card blueprint

Each card uses this order:

1. **Classification row:** one source-backed classification when useful, priority, trailing ellipsis menu. Initial classification can use existing `source_name`; service category requires adding its actual source field to the typed query/DTO. Do not fake a service category or duplicate the lane's stage tag on every card.
2. **Identity:** company-first title, contact name below only when different. No company uses the contact name as title. Long names wrap naturally; desktop title may use a measured two-line preview only if the complete name remains reachable by focus/tap in detail. No hover-only access to essential identity.
3. **Expected value:** one clear full-digit INR figure, medium weight and tabular numbers. Label it `Expected value`, not signed contract value before conversion. Permission-restricted variants omit money from the source payload and render count/operational information.
4. **Follow-up:** calendar/clock icon with date or `Not scheduled`. Overdue states use one understandable label and text color, not duplicate date-plus-multiple alert pills. On Hold shows the recorded revisit context and does not claim overdue when existing eligibility suppresses it.
5. **Footer:** real owner avatar if supported, otherwise honest initials; readable owner name; compact copyable deal reference. Unassigned uses a person-outline icon and `Unassigned`; missing lookup uses `Owner unavailable`, which is a different state.

Starting dimensions: 288–312px lane/card context, 14–16px card padding, 10–12px card radius, 12px card gaps. Aim for roughly 190–230px typical card height, expanding for content rather than enforcing fixed-height clipping. Name 15–16px, money 19–21px, metadata 13px, controls 14px. Card identity and working text use real loaded 400/500 cuts.

The reference's progress bars, assignee stacks and document/comment counters will not be copied. A CRM stage position is not measured project completion. Current records do not include those task counters.

### Icons and actions

Use consistent 16px outlined glyphs for calendar, owner/unassigned, phone, WhatsApp, copy, filter, columns/list and overflow. Icons clarify meaning or expose actions; do not add an icon beside every text fragment. Pair less familiar actions with labels. No emoji, invented portraits or glow markers.

Card title opens the existing deal detail. The card itself is an article, not a giant button containing other buttons. Overflow actions: Open deal, Move to stage, Copy reference, Call, WhatsApp, and Schedule follow-up only if the real authorized scheduler entry is available. Invalid/missing phone numbers remove contact actions. Phone and WhatsApp can be convenient hover/focus controls on desktop, but remain accessible through the menu on touch and keyboard.

Dragging uses a discrete handle so text selection and ordinary links work. During drag, show a compact ghost, a clear drop slot and eligible lane highlight. No persistent row of drag dots, dropdown and disabled Move button across every resting card.

## 3. Lane and scrolling design

Lane heading: meaningful stage marker/icon, stage title, compact count; expected-value subtotal beneath when permitted. No decorative plus unless creating in that stage is supported by the real create workflow. Do not offer lane rename/delete from this screen without an existing authorized operation.

Use a quiet lane background with no enclosing heavy outline. Cards retain a fine neutral boundary. Board is a purposeful collection of draggable records, not a decorative nested bento grid.

Desktop: horizontally scrollable board rail with stable 288–312px lanes and 16px gaps. Do not shrink eight stages to unreadable widths. Showing four or five complete columns plus a deliberate continuation cue is acceptable; horizontal board navigation must be obvious and keyboard-operable. Add scroll buttons/jump control with accessible labels rather than relying on a narrow bottom scrollbar alone.

Choose one vertical scroll owner: page/document vertically; board rail horizontally, without the current shared fixed-height two-axis viewport. Verify actual CSS overflow behavior in the browser; if the application requires a bounded board canvas, switch to a single board-owned vertical area deliberately and document that choice rather than mixing both. Lane headings remain associated with their records without sticky overlap.

Keep empty lanes visible under All stages with a small `No deals on this page` state. Preserve occupied inactive stages and unmatched records in `Other stages`; the presentation must not make saved records disappear.

## 4. Move-to-stage interaction

Remove the persistent native select from the card. `Move to stage` opens one anchored, lightly rounded searchable destination popover. Header names the current record; current stage is marked and not actionable. Inactive or ambiguous guarded destinations remain excluded according to the existing transition rules.

Ordinary destination: selecting it stages the choice; an explicit `Move to Qualified` action commits it. This prevents arrow-key navigation or accidental menu selection from changing data. Guarded destination: Continue opens the existing stage-specific modal; no duplicate generic confirmation layered over it. Never bypass negotiation fields, On Hold revisit dates, loss reasons or converted-contract requirements.

Popover behavior: aligned icon/label rows, current-stage check, obvious focus state, Escape, outside-dismiss, collision-aware viewport placement and focus restoration. Portaled menus must escape board clipping. Use the existing proven accessible primitive if available; otherwise implement a complete keyboard model, not a styled div with incomplete listbox roles. Mobile uses a labeled bottom sheet with the same explicit confirmation.

Persist the old card position until server confirmation, matching current behavior. Disable duplicate submission while pending; show progress on the affected card/action. On rejection, retain the record and chosen input with an actionable error. Cancel leaves stage/totals unchanged. After success, refresh applicable totals and preserve useful focus. Announce movement to screen readers. No claim of conflict protection unless the action actually supports a version check; inspect `updated_at` handling before implementation.

## 5. Table rebuild

Use a real `<table>` with scoped column headers and `aria-sort`. Shared fields/labels with Board:

| Column | Presentation |
| --- | --- |
| Deal | Company-first title plus contact and compact reference; normal readable hierarchy |
| Stage | Small stage icon and lightly tinted short label |
| Expected value | Right-aligned full grouped amount; financial permission applied before client serialization |
| Owner | Initials/real avatar plus readable name; clear missing/unassigned distinction |
| Follow-up | Calendar icon, recorded date and a single overdue/revisit label |
| Priority | Restrained semantic tag with text |
| Actions | Discreet Open action and overflow menu, sharing the card action contract |

Start with 64–72px rows, 14px main text, 12–13px secondary text, generous identity width without the current huge blank gap. Fine row separators, quiet header, 10–12px outer radius, no pill-shaped View 360° button in every row. Row hover helps scanning without implying an unsupported whole-row click.

Current sorting is local to the loaded page. Preserve and visibly label `Sort this page` initially; do not advertise global sorting. If full-result sorting is included during implementation, add an allowlisted server sort/order contract, deterministic ID tiebreaker and pagination reset first. Table and Board preserve the same filters and result page when switching. Table-only sort state should not change pipeline stage order.

## 6. Filters and result honesty

Support only the actual server filters: search, bucket, stage, owner, source and priority. Expose them in a rounded Filters popover/sheet with clear labels and removable applied chips. Keep `Jump to stage` separate from actual `Stage` filtering. Filter changes reset the result page; view changes preserve it. Preserve aliases/deep links and browser back/forward behavior.

Server currently loads 100 records/page. First release retains that reliable pagination contract. Display `Showing 1–100 of N`; lane totals explicitly say `This page`. Do not imply complete pipeline totals or silently fetch all records. Selecting a sparse later page may legitimately produce empty lanes. A future per-lane paginated board or global aggregate requires separate query and reconciliation work, not a visual shortcut.

Query errors, invalid filters, missing directory/source lookups and no matching results remain distinct. Clear filters recovers an empty filtered result; Retry recovers a failed request. Owner/source lookup failures must not block otherwise available records.

## 7. Visual tokens

| Role | Starting specification |
| --- | --- |
| Canvas / card | `#f5f5f3` / `#ffffff` |
| Main ink / secondary | `#111111` / `#454542` |
| Brand action | `#ea002a`, darken hover/focus using established tokens |
| Borders | Quiet neutral decorative boundaries; interactive identification/focus meets 3:1 where required |
| Controls | 8px radius; 10px toolbar/popover surfaces; no 3px selected segments |
| Deal cards | 10–12px radius with 14–16px padding |
| Tags | 4–6px, modest tint with readable text; distinguish priority and stage |
| Menus/sheets | 12px / 16px radius, solid surfaces and visible boundaries |

Status tokens may add limited semantic colors beyond the core palette where states require them; arbitrary configured stage colors must be checked, not trusted for text contrast. No broad gradients, backdrop glow or dark cards. Do not copy the references' purple branding; Marca Ubi red remains the deliberate primary accent. No permanent drop shadows on every card; use boundary/tint for rest and interaction states.

## 8. Responsive, motion and state contracts

Wide desktop: several full columns with explicit horizontal movement. Tablet: fewer full columns and wrapped toolbar; no shrinking all lanes to fit. Mobile: stage selector with counts and one complete lane, clear previous/next-stage controls, filter sheet and readable cards. Table mobile mode becomes a compact record list retaining essential fields and sorting controls; it does not reproduce a clipped eight-column desktop grid.

All menu/contact/drag alternatives remain reachable by keyboard and touch. Visual icons may be 16px, hit areas 44px on touch. Text contrast 4.5:1, relevant control/focus contrast 3:1, visible focus, reduced motion, 200% zoom and 320px reflow. Contained intentional desktop board scrolling is acceptable; accidental document overflow is not.

Transitions: 120–160ms control tint/focus, 160–200ms menu open, short card relocation only after confirmed move. Reduced motion removes translation/animated scrolling. No perpetual pulses or choreographed page entrance.

Design together: initial skeleton matching card structure; filter-pending state without relabeling stale results; empty board/lane; no matches; failed request; lookup partial failure; pending/failed/guarded move; retired stage; long names/amounts; unassigned/missing owner; missing phone; invalid due date; viewer/read-only; financial restriction; session expiry and unavailable destination.

## 9. Engineering and security boundaries

Rebuild components around `DealsToolbar`, `DealCard`, `DealsBoard`, `DealsTable`, `DealActionsMenu` and `MoveDealPopover` responsibilities, using direct imports and SCSS Modules. Names are proposed boundaries, not permission to create an unnecessary component framework. Keep calculations and normalized permissions outside presentation; share one identity/date/action model across both views.

Keep current authenticated Supabase client, profile/tab checks, RLS and guarded Server Actions. Current Deals profile query reads role/status/tabs but does not load feature permissions; financial visibility needs an explicit server/DTO contract, including amounts in lane totals, sorting, menus and transition forms. Inspect permission semantics and all mutation inputs before claiming enforcement. Do not trust hidden UI as authorization.

Preserve the server's existing parallel reads. The current Suspense boundary is below the awaited queries; it does not stream those queries. If changing loading architecture, read matching installed Next documentation first, then structure a real async boundary rather than adding decorative Suspense. No framework code is written during this plan.

Critical modification surfaces: `deals/page.tsx`, `DealsWorkspaceClient.tsx` and its styles, `DealsKanbanBoard.tsx` and styles, route loading states and focused tests. Reuse existing detail, scheduler and guarded transition workflows. Shared shell and other module designs are regression surfaces, not additional redesign scope.

## 10. Execution and acceptance gates after approval

1. **Visual proof:** create desktop Board, desktop Table, mobile Board and open move-popover compositions using the proposed production component structure and clearly labeled fixtures. Include long title, zero value, overdue and unassigned examples. Review against screenshots 8–9 before full integration.
2. **Data/action contracts:** establish shared identity, permission-aware fields, exact result scope and move state machine; verify existing guard APIs and query validation.
3. **Toolbar and card rebuild:** replace layout and repeated controls; implement consistent rounded controls and meaningful iconography.
4. **Board and Table integration:** preserve URL filters/pagination, guarded moves and stable record identity; add the accessible movement alternative and mobile composition.
5. **QA and independent critique:** source-backed data tests, server-action boundaries, typecheck, focused lint, production build; actual browser click-through and visual comparison. Use specialists if requested or needed; do not substitute persona headings for review.

Acceptance is not “tests pass.” The rendered resting card must contain no permanent move form, stage controls must have unambiguous purpose, both views must share identity/labels, rounded geometry must be consistent, and a reviewer must see a complete presentation replacement. Record desktop/mobile screenshots plus open menus, pending/failed move, empty and restricted states.

Test drag and non-drag movement, ordinary and guarded destinations, cancellation, failed and duplicate submissions, stale/deleted/retired stages, keyboard focus restoration, filter/search races, back/forward, view switching and pagination. Verify exact totals only within the declared scope. Do not mutate live CRM data for fixture testing. Browser fixtures must be labeled and cannot certify real RLS or mutations; authenticated staging checks need separate evidence.

Produce the four-block antislop delivery report and R-35 click-through evidence before an approval-ready claim. No auto-merge. Implementation/PR target must be rechecked at execution time because the current workspace has advanced well beyond the earlier PR #118.

## Anti-cliché review

The repeated shape is justified by a real Kanban record collection. This does not justify repeating form controls or adding progress bars to imitate the reference. The memorable feature is a compact deal card whose identity, follow-up and owner remain immediately legible across Board and Table. Icons replace repetitive field labels where meaning stays clear; rounded geometry creates cohesion rather than decoration.

This plan replaces the previous Deals presentation prescription only. No application files or shared design guidance were modified. Stop here for user review and explicit `proceed` or `do it` before implementation.
