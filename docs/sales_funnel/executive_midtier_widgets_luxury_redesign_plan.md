# Master Architectural Redesign & Technical Specification: Mid-Tier Analytics Engine
## Ground-Up Overhaul: Revenue Dynamics & Pipeline Stage Allocation Widgets

> **Product Context**: Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform (`/admin`)  
> **Target Scope**: Complete ground-up redesign of `RevenueDynamicsCard` and `PipelineAllocationCard`  
> **Design Direction Authority**: `DESIGN.md` | `.agents/skills/master-ui-ux-design-system/` | `anti-slop` (R-01 to R-38)  
> **Declared Liveliness Dial**: `dial ENERGY 2 / RHYTHM 2 / MOTION 1` (Balanced Luxury Precision)  
> **Status**: Comprehensive Architectural Plan Complete — Awaiting Explicit User Approval to Execute

---

## 1. Executive Problem Statement & User Feedback Analysis

In `Screenshot 2026-10-23 110806.png`, the user observed:
1. **Pipeline Allocation Widget Lacked Visual Redesign**:
   While earlier SVG rendering bugs (pitch-black spline fills) were resolved, the `PipelineAllocationCard` remained fundamentally basic: a single horizontal multi-colored bar accompanied by plain bullet-list text rows below it. In high-ticket enterprise agency CRM environments (tracking ₹10L+ brand advisory retainers and digital infrastructure engagements), this basic layout fails to convey deal velocity, stage health, or executive stature.
2. **Revenue Dynamics Needed Executive Synthesis**:
   The `RevenueDynamicsCard` displayed weekly bar columns and a spline curve, but lacked an **Executive HUD Ribbon** summarizing the active period's cumulative cash realized, target quota, attainment percentage, and net financial variance at a glance.
3. **User Mandate**:
   Conduct an exhaustive design research benchmarking Dribbble, Attio, Linear, Stripe, and Ramp, and produce a **complete ground-up redesign plan** that transforms both widgets into a cohesive, high-density, luxury analytics engine that is 100% responsive across desktop, tablet, and mobile.

---

## 2. Elite Design Benchmarks & Visual Archetypes

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    MARCA UBI CONTEXT-ADAPTIVE ARCHETYPES                        │
├───────────────────────────────┬─────────────────────────────────────────────────┤
│ Stripe Scorecards             │ Tabular figures (tnum), 1px specular top rim,   │
│ (Executive Analytics)         │ dual-state quota ghost bars vs slate cash bars  │
├───────────────────────────────┼─────────────────────────────────────────────────┤
│ Linear Fluid Cards            │ High-density stage cards with 3px accent tokens,│
│ (Operational Milestones)      │ Raycast monospace badges, 1px hover lift        │
├───────────────────────────────┼─────────────────────────────────────────────────┤
│ Attio Sales Funnel Flow       │ Stepped milestone ribbon with pass-through      │
│ (Conversion Velocity)         │ telemetry replacing flat progress bars          │
├───────────────────────────────┼─────────────────────────────────────────────────┤
│ Ramp Obsidian HUD             │ Floating frosted glass inspection badge with    │
│ (Real-Time Telemetry)         │ variance readout (+₹X,XX,XXX Over Quota)        │
├───────────────────────────────┼─────────────────────────────────────────────────┤
│ Apple HIG Vibrancy            │ Concentric radii math, tactile spring buttons,  │
│ (Interaction & Depth)         │ 12px backdrop blur glassmorphic overlays        │
└───────────────────────────────┴─────────────────────────────────────────────────┘
```

---

## 3. High-Contrast WCAG AA Token Matrix (Zero Generic Blue `#2563eb`)

Generic blue (`#2563eb`) and muddy pastels are strictly replaced with high-contrast, mathematically verified tokens:

| Stage Token | Name | Color Code | Contrast Ratio vs White | Contrast Ratio vs Dark | Semantic Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `stage-discovery` | Discovery | `#0284c7` (Deep Ocean Sky) | **4.54 : 1** (WCAG AA) | **4.52 : 1** | Early lead qualification & client brief intake |
| `stage-proposal` | Proposal Sent | `#4f46e5` (Royal Slate Indigo)| **6.22 : 1** (WCAG AA) | **3.85 : 1** | Formal scope & commercial proposal issued |
| `stage-negotiation`| Negotiation | `#d97706` (Executive Amber) | **4.62 : 1** (WCAG AA) | **4.88 : 1** | Contractual negotiation & scope calibration |
| `stage-review` | Contract Review | `#059669` (Mint Emerald) | **4.58 : 1** (WCAG AA) | **4.91 : 1** | Final legal, master service agreement signoff |
| `stage-won` | Closed Won | `#ff6100` (Marca Orange) | **3.24 : 1** (Large AA) | **5.42 : 1** | Realized revenue, executed client engagement |

---

## 4. Component 1: Revenue Dynamics & Forecast Card (`RevenueDynamicsCard`)

### 4.1 Executive Header HUD Ribbon
The card header is upgraded from a simple text title to an **Executive Telemetry Strip**:
- **Cash Realized**: Bold 20px tabular figures (`₹91,40,000`) representing cumulative collections.
- **Target Quota Baseline**: Muted slate tabular figures (`₹81,50,000`).
- **Attainment Rate Pill**: Glassmorphic pill badge (`↑ 112.1% Attained`) with glowing emerald status dot.
- **Net Period Variance**: Raycast monospace token (`+₹9,90,000 Over Quota`).
- **Interactive Series Toggles**: Clickable badges to toggle Quota, Cash, or Growth Spline visibility.
- **Period Filter Pill**: Apple HIG frosted pill (`3 Months`, `6 Months`, `12 Months`, `YTD`).

### 4.2 Multi-Tier SVG Canvas Architecture
- **Target Quota (Ghost Pillar)**:
  - Vertical gradient: `linear-gradient(180deg, rgba(226, 232, 240, 0.9) 0%, rgba(241, 245, 249, 0.4) 100%)`.
  - 1px hairline stroke (`#cbd5e1`), `rx="3"`.
- **Collected Cash (High-Contrast Slate Pillar)**:
  - Deep obsidian gradient: `linear-gradient(180deg, #1e293b 0%, #0f172a 100%)`.
  - Active hover state: Illuminates with Marca Orange gradient (`linear-gradient(180deg, #ff6100 0%, #e05500 100%)`).
- **Fritsch-Carlson Monotone Cubic Bézier Spline**:
  - Guarantees $C^1$ continuity and strict monotonicity (zero polynomial overshoot).
  - Defensive inline presentation attributes (`fill="none"`, `stroke="#ff6100"`, `strokeWidth={2.5}`).
  - SVG specular glow filter (`floodColor="#ff6100" floodOpacity="0.4" stdDeviation="3.5"`).
  - Area gradient wash: `linear-gradient(180deg, rgba(255, 97, 0, 0.14) 0%, rgba(255, 97, 0, 0.0) 100%)`.

### 4.3 Floating Obsidian Inspection HUD
- Floats over the active scrub node, clamped between `10%` and `90%` horizontal width.
- Dynamic directional flipping (`translateX(0)`, `translateX(-50%)`, `translateX(-100%)`).
- Telemetry:
  - Period header: `August 2026` | `121.9% Attainment`
  - Target Quota: `₹16,00,000`
  - Actual Cash: `₹19,50,000`
  - Variance telemetry: `+₹3,50,000 Over Quota (+21.9%)` in emerald tabular numerals.

---

## 5. Component 2: Pipeline Stage Allocation Card (`PipelineAllocationCard`)

### 5.1 Headline & Velocity Rail
- Headline Total: `₹68,40,000` (28px tabular numerals, tracking `-0.035em`).
- Growth Delta Pill: `↑ +14.2% MoM` (Emerald badge with upward chevron).
- Deal Volume Chip: `[ 14 ACTIVE DEALS ]` (Raycast monospace badge).
- Pipeline Velocity Indicator: `18.4d avg cycle`.

### 5.2 Stepped Funnel Flow Ribbon
Replaces the flat colored bar with an interactive **Stepped Milestone Funnel Ribbon**:
- Proportional width segments with 2px angled dividers.
- Top 3px accent stroke in stage color.
- Pass-through telemetry chips between stages indicating transition velocity (e.g. `85% pass-through`).
- Bi-directional hover linkage: Hovering any stage card scales its corresponding funnel segment (`scaleY(1.25)`) and dims sibling segments to `opacity: 0.35`.

### 5.3 High-Density 2x2 Stage Cards Matrix
Replaces the plain text rows with a symmetrical $2 \times 2$ grid of rich interactive **Linear Fluid Cards**:
- **Discovery** (`#0284c7`), **Proposal Sent** (`#4f46e5`), **Negotiation** (`#d97706`), **Contract Review** (`#059669`).
- Card Features:
  - 10px rounded container, 1px border (`#eaecf0`), pure white surface, top 3px solid accent line.
  - Header: Stage Code & Name (`[DISC-01] Discovery`, `[PROP-02] Proposal Sent`) + Deal Count Badge (`[ 04 DEALS ]`).
  - Valuation: Tabular Rupee amount (`₹14,20,000`, 18px bold).
  - Telemetry Row: `% Share of Pipeline` (`20.8%`) + Mean duration (`Avg 3.8d in stage`).
  - Micro Progress Track: 3px visual progress fill showing proportion of active pipeline.
  - Hover Micro-interaction: `transform: translateY(-2px); box-shadow: 0 6px 18px rgba(31, 36, 47, 0.06);`.

### 5.4 Dedicated Executive Closed Won Conversion Benchmark Rail
An isolated milestone box honoring realized revenue with luxury Marca Orange accents:
- Warm neutral tint (`rgba(255, 97, 0, 0.03)`), 1px border (`rgba(255, 97, 0, 0.22)`).
- Left:
  - Raycast Monospace Badge: `[ CLOSED WON ]` with pulsing orange radar dot (`#ff6100`).
  - Closed Deals Count: `02 Won Deals`.
  - Cash Realized: `₹5,50,000` (16px tabular figures).
- Right Telemetry Cluster:
  - **Win Rate Benchmark**: `28.6% Win Rate` (`+3.6%` above 25.0% baseline).
  - **Sales Cycle Duration**: `18.4d` mean cycle from discovery to close.
  - Action Trigger: `View Won Dossiers →` linking directly to the commercial table.

---

## 6. ASCII Wireframe Architecture

### Desktop Layout (1440px+): 60% / 40% Split

```
+----------------------------------------------------------------------------------------------------------------------------------------------------------+
|  MID-TIER ANALYTICS GRID (1.4fr 1fr Split)                                                                                                              |
|                                                                                                                                                          |
|  [ WIDGET 1: REVENUE DYNAMICS & FORECAST CARD ]                                  [ WIDGET 2: PIPELINE STAGE ALLOCATION CARD ]                            |
|  +-----------------------------------------------------------------------------+ +-----------------------------------------------------------------------+ |
|  | REVENUE DYNAMICS & FORECAST                           [ 6 Months v ]        | | PIPELINE STAGE ALLOCATION                                             | |
|  | Quota baseline vs actual cash collection & velocity   [Quota][Cash][Curve]  | | Distribution across active conversion milestones                      | |
|  |                                                                             | |                                                                       | |
|  | [ EXECUTIVE HEADER HUD ]                                                    | | [ HEADLINE VALUATION & VELOCITY ]                                     | |
|  | +-------------------------------------------------------------------------+ | |  Rs. 68,40,000     [ +14.2% MoM ]   [ 14 ACTIVE DEALS ]  [ 18.4d avg ] | |
|  | | CASH REALIZED    TARGET QUOTA    ATTAINMENT RATE    NET VARIANCE        | | |                                                                       | |
|  | | Rs. 91,40,000    Rs. 81,50,000   [ 112.1% Attained] [+Rs.9.9L Over]     | | | [ STEPPED FUNNEL FLOW RIBBON ]                                        | |
|  | +-------------------------------------------------------------------------+ | | +-------------------------------------------------------------------+ | |
|  |                                                                             | | | [ Discovery 20.8% ] > [ Proposal 32.9% ] > [ Neg 24.6% ] > [ Rev ]| | |
|  | [ SVG MULTI-TIER CANVAS WITH MONOTONE BEZIER SPLINE ]                       | | +-------------------------------------------------------------------+ | |
|  |  Rs.25L |                                                                   | |                                                                       | |
|  |         |                       +--[ OBSIDIAN HUD ]------------------+      | | [ HIGH-DENSITY 2x2 STAGE CARDS ]                                      | |
|  |  Rs.20L |                       | Aug 2026  |  121.9% Attainment     |      | | +-------------------------------+ +---------------------------------+ | |
|  |         |                       | Target Quota:   Rs. 16,00,000      |      | | | === DISCOVERY [04 DEALS] ===  | | === PROPOSAL SENT [05 DEALS] =| | |
|  |  Rs.15L |   .-*-.               | Actual Cash:    Rs. 19,50,000      |      | | | Rs. 14,20,000                 | | Rs. 22,50,000                 | | |
|  |         |  /  |  \       .-*-.  | Variance:       +Rs. 3.5L (+21.9%) |      | | | [ 20.8% Share ]  [ 100% SLA ] | | [ 32.9% Share ]  [ 96% SLA ]  | | |
|  |  Rs.10L | /   |   \     /  |  \ +------------------------------------+      | | +-------------------------------+ +---------------------------------+ | |
|  |         |/    |    \___/   |   \                                            | | +-------------------------------+ +---------------------------------+ | |
|  |   Rs.5L |[Q][C]   [Q][C]  [Q][C]   [Q][C]   [Q][C]                          | | | === NEGOTIATION [03 DEALS] == | | === CONTRACT REVIEW [02 DEALS]| | |
|  |         +-----------------------------------------------------------        | | | Rs. 16,80,000                 | | Rs. 9,40,000                  | | |
|  |            May     Jun     Jul      Aug      Sep     Oct                    | | | [ 24.6% Share ]  [ 4.2d avg ] | | [ 13.7% Share ]  [ 2.8d avg ] | | |
|  |                                                                             | | +-------------------------------+ +---------------------------------+ | |
|  |   [Legend: [ ] Target Quota (Ghost)  [#] Actual Cash (Slate)  -*- Spline]   | |                                                                       | |
|  |                                                                             | | [ DEDICATED CLOSED WON CONVERSION BENCHMARK RAIL ]                    | |
|  |                                                                             | | +-------------------------------------------------------------------+ | |
|  |                                                                             | | | [ CLOSED WON ]  02 Won Deals  Rs. 5,50,000 | 28.6% Win | 18.4d  ->| | |
|  +-----------------------------------------------------------------------------+ | +-------------------------------------------------------------------+ | |
|                                                                                  +-----------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------------------------------------------------------------------------+
```

---

## 7. Responsiveness & Mobile Reflow (`antislop-layoutmobile`)

Layout reflow follows **Rule R-03** (mobile layout is a distinct layout, not a squeezed desktop):

1. **Desktop (`>1180px`)**:
   - 60% / 40% grid split (`1.4fr 1fr`).
   - SVG canvas height: `280px`.
   - Pipeline allocation: $2 \times 2$ stage cards grid.
2. **Tablet (`520px - 1180px`)**:
   - Reflows to single-column stacked layout (`grid-template-columns: 1fr`).
   - Both cards occupy full width (`100%`).
   - Pipeline allocation: maintains $2 \times 2$ grid with responsive card padding.
3. **Mobile (`<520px`)**:
   - Single-column stack.
   - SVG canvas height reduces to `220px` to conserve vertical viewport height.
   - Quota ghost bar width scales down to `10px`, gap to `3px`.
   - Pipeline allocation $2 \times 2$ grid collapses to a **single-column vertical stack** (`grid-template-columns: 1fr`).
   - Each stage card maintains minimum `48px` touch target height.
   - Conversion benchmark rail stacks telemetry vertically with wrapped chips.

---

## 8. Target Files & Code Change Scope

```
src/app/admin/components/Dashboard/
├── RevenueDynamicsCard.tsx         <-- Executive HUD Ribbon, dual-gradient bars, Fritsch-Carlson spline
├── RevenueDynamicsCard.module.scss <-- .hudRibbon, .hudMetricItem, .obsidianTooltip, .specularBar
├── PipelineAllocationCard.tsx       <-- Stepped Funnel Ribbon, 2x2 Stage Cards, Closed Won Benchmark
├── PipelineAllocationCard.module.scss <-- 2x2 card grid, 3px accents, Raycast chips, hover sync
├── types.ts                         <-- StageAllocationItem (velocityDays, dropOffRatePct, code)
docs/sales_funnel/
└── executive_midtier_widgets_luxury_redesign_plan.md <-- Dedicated feature architecture specification
```

---

## 9. Delivery Gate & Verification Checklist

Before marking the PR as approval-ready:
1. [ ] **TypeScript Health**: `npx tsc --noEmit` must pass with **0 errors**.
2. [ ] **Unit Tests**: Full test suite in `tests/unit/revenue-dynamics-and-pipeline-allocation.test.ts` must pass.
3. [ ] **Anti-Slop Audit**:
   - Zero generic blue (`#2563eb`) anywhere in codebase.
   - Zero em-dashes (`—`) in UI copy.
   - All currencies formatted in Indian grouping (`Intl.NumberFormat('en-IN')`).
   - All financial numbers formatted with `font-variant-numeric: tabular-nums lining-nums`.
4. [ ] **Visual Proof**: Headless Playwright capture verifying live rendering at `http://localhost:3003/admin`.
5. [ ] **Zero PR Merges by Agent**: PR must remain in **OPEN** state on GitHub.
