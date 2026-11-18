# Marca Ubi CRM — Commercial Desk Design Direction

**Status:** Approved product direction for the CRM workspace redesign.

**Design read:** ENERGY 1 / RHYTHM 2 / MOTION 2.
**Product:** Internal agency CRM for lead triage, pipeline decisions, client delivery, follow-ups, and operational governance.

## Brand and interface intent

Extend the public Marca Ubi identity into a focused commercial workspace. Use the public site's Circular XX type, paper-white and warm-neutral surfaces, near-black ink, and Marca Ubi red `#ea002a`. Red is reserved for primary actions, active markers, and urgent states. The interface should feel editorial, deliberate, and operational: generous page headings, compact navigation, crisp rows, calm surfaces, readable numbers, and an unmistakable hierarchy.

This is a light interface. Do not use the legacy dark-orange direction, Crore/Lakh abbreviation, generic blue-purple gradients, glowing status effects, decorative radar motifs, or a dashboard made from repeated equal cards. Do not copy reference products. References inform hierarchy and density only.

## Core layout concept

The product is **Marca Ubi Commercial Desk**. Its home page helps the team act on today's commercial work before reviewing longer-range performance.

The authenticated shell uses a persistent grouped sidebar on wide screens and a focus-managed drawer on small screens. The sidebar owns the brand, search/navigation launcher, Work and Workspace destinations, and bottom account menu. A compact context rail provides breadcrumbs. Each page owns its title, scope controls, and one primary action. Avoid duplicated prominent actions.

Overview integrates the current pipeline snapshot into its title area. The follow-up queue is the main work surface, beside a quieter unboxed stage summary. Outcomes follows with its own reporting-period control. Users without Tasks access receive a permitted opportunity preview instead of a queue. Conversion charts appear only when source events make them useful; zero-event periods get a compact explanation rather than a large blank plot. The former four-card opening, recent-ledger/allocation split, stage journey and sidebar telemetry are superseded by the approved November dashboard plan.

## Visual system

- **Canvas:** `#f5f5f3`; primary surface `#ffffff`; quiet surface `#efefed`.
- **Ink:** `#111111`; secondary `#454542`; muted text must still meet WCAG AA for its actual size.
- **Accent:** `#ea002a`; hover `#c40023`; accessible focus ring `#9c001e` on light surfaces.
- **Borders:** hairline neutral boundaries only where they clarify grouping; use row separators and whitespace before adding another container.
- **Type:** Circular XX for headings and prominent numbers; Graphik for navigation, controls and working text. Reuse public local font bindings. Metrics use tabular numerals; currency remains full-digit `en-IN` formatting with normal tracking.
- **Geometry:** 6–8px controls and 10–12px work surfaces. Avoid nested outlined cards and persistent panel shadows.
- **Motion:** brief transitions for open/close and focus only. Respect `prefers-reduced-motion`; no looping decorative animation.
- **Icons:** consistent 16–18px line icons paired with labels where meaning is not obvious. No emoji status markers.

## Responsive behavior

At 1440px, start with a 240px sidebar and fluid content. Collapse navigation when content needs the width. On narrow screens use a labeled Menu trigger and drawer, compact snapshot, queue-first order, and purpose-built mobile record rows. Do not scale a desktop table or horizontal board down until it clips. Verify at 320, 375, 768, 1024, 1440, and 1920 CSS pixels and at 200% zoom.

## Interaction and accessibility

Every page provides useful loading, empty, unavailable, error, and permission states. Errors retain a recovery action and a redacted request reference when available. Controls are keyboard-operable, have visible focus and accessible names, and meet 44px target sizing where practical. Dialogs and drawers restore focus, close with Escape, and prevent background interaction. Pair status color with text. Verify text contrast at 4.5:1 and component boundaries/focus indicators at 3:1.

## Data rules

Never show invented values, fallback owners, fabricated comparisons, or successful-empty states after query failure. Every metric states its unit, scope, and period. A zero is distinct from unavailable data. All INR values use full digits. Simulated inquiries remain visibly marked and excluded from production reporting. Role and tab permissions are enforced on the server and at each mutation boundary; presentation hiding is not authorization.

## Shared page pattern

1. Breadcrumb and route context in the shell.
2. Page title, one sentence of useful context, and one primary action.
3. Scope and filter controls directly above the data they affect.
4. Source-backed summary only when it helps a decision.
5. Main work surface with explicit row/card hierarchy.
6. Loading, empty, error, and permission variants designed alongside the success state.

The current dashboard/sidebar specifications and delivery gates live in `docs/sales_funnel/dashboard_redesign_2026_11/DASHBOARD_AND_SIDEBAR_REDESIGN_PLAN.md`. Earlier module plans remain historical context; their rejected dashboard composition is superseded.
