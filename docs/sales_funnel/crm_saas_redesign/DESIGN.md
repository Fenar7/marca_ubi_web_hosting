# Marca Ubi CRM visual system

## Brand and hierarchy

The admin product follows the public Marca Ubi identity: Circular XX typography, a light neutral canvas, black primary text, fine gray dividers, and brand red `#ea002a` for the primary action. Hover and keyboard focus use darker red values with white foreground where contrast passes. The interface stays quiet: one page title, one primary action, compact metadata, and strong readable records.

The design read is ENERGY 2 / RHYTHM 2 / MOTION 1. Use red as a deliberate action cue rather than a decorative accent. Keep financial values in full Indian digit grouping with tabular numerals. Do not use `L`, `Cr`, `K`, or `M` in any money value. Keep status meaning in text and iconography as well as color.

## Tokens

The admin tokens are scoped under `[data-admin-root="true"]`; public-site styles remain isolated. Base values are canvas `#f7f7f6`, surface `#ffffff`, primary text `#111111`, secondary text `#444444`, muted text `#666666`, border `#dedede`, action red `#ea002a`, hover `#c40023`, and focus `#a5001d`. Primary red on white exceeds 4.5:1 for normal text. Maintain visible `:focus-visible`, disabled, pending, error, and selected states.

Use 4px spacing increments, 44px minimum interaction targets, 6–8px control radii, and 8–12px panel radii. Avoid nested card borders, decorative icon grids, gratuitous motion, and unnecessary shadows. Financial values use `font-variant-numeric: tabular-nums`.

## Page patterns

- **Overview and analytics:** source-labeled metrics, explicit time window, no fake baselines or quotas, a chart with keyboard access and a text equivalent, stage rows linked to filtered leads, and clear empty versus unavailable states.
- **Leads and deals:** server-side filters and stable pagination; name, reference, owner, stage, follow-up and value remain visible. Board and table views retain keyboard-operable stage actions and guarded transitions.
- **Tasks:** due-date groups use a stated timezone, expose loaded range, and reject stale completion attempts with a refreshable conflict message.
- **Works and team:** editorial lists prioritize accountable owner and next action; only persisted records and authorized actions are presented.
- **Inquiries and settings:** measured telemetry or an explicit unavailable state; simulation records are visibly identified and excluded from operational reporting; audit history states its loaded range.
- **Authentication:** compact, branded sign-in and recovery pages with labeled inputs, accessible error feedback, and a single red primary action.

## Responsive and interaction rules

At desktop widths preserve a fixed navigation rail and useful table density. At tablet widths allow the rail to collapse and toolbars to wrap. At narrow widths use stacked cards, full-width actions, and no page-level horizontal overflow. Dialogs and drawers trap focus when modal, support Escape under the documented save policy, announce errors, and return focus to the opener. Drag interactions always retain an explicit button alternative.

## Reference review

The user requested current SaaS and Dribbble design research. Dribbble CRM dashboard concepts consistently emphasize scan hierarchy and operational grouping, but their palettes and speculative widgets are not copied. The implementation uses the requested Marca Ubi red/white/black identity and retains only data-backed functions. References: [Dribbble CRM dashboard search](https://dribbble.com/search/crm-admin-dashboard), [CRM SaaS Dashboard](https://dribbble.com/shots/26812207-CRM-SaaS-Dashboard), and [Stripe dashboard charts guidance](https://support.stripe.com/questions/dashboard-home-page-charts-for-business-insights?locale=en-GB). Stripe specifically distinguishes estimates from detailed reports and notes that foreign exchange values may be estimates; the CRM therefore removes its unsupported fixed-currency toggle from pipeline pages.
