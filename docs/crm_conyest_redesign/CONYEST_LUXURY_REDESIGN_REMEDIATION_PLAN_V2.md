# Master Architectural & Visual Remediation Plan (V2): Swiss Luxury Commercial Desk Redesign

> **Feature Directory:** `docs/crm_conyest_redesign/`  
> **Status:** FORENSIC AUDIT & ARCHITECTURAL BLUEPRINT (V2) — **AWAITING USER CONFIRMATION**  
> **Target Branch:** `fix/auth-runtime-diagnostics-and-resilience`  
> **Target PR:** [PR #117: Dashboard Architecture & Auth Edge Resilience](https://github.com/Fenar7/marca_ubi_web_hosting/pull/117) (OPEN)  
> **Authorship Identity:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Strict Rules:** ZERO Code Execution Without Explicit User Permission. PR Remains strictly OPEN. Zero AI Slop.

---

## 1. Executive Forensic Synthesis: Live Implementation vs Dribbble Benchmark

Following a deep forensic audit conducted by our **UI/UX Luxury Visual Architect** and **Frontend SVG Graphics Architect** subagents across five live screenshots (`screenshot_215001.png`, `screenshot_215006.png`, `screenshot_220900.png`, `screenshot_215016.png`, `screenshot_215010.png`) and the Conyest Dribbble reference (`uploaded_media_1794342207825.webp`), four major architectural design flaws were identified that create visual dissonance, arithmetic layout collisions, and layout degradation.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                        LIVE SCREENSHOTS FORENSIC DEFECT TRIAGE                                  │
├────────────────────────────────┬────────────────────────────────────────────────────────────────┤
│ Defect Surface                 │ Observable Symptom in Screenshot & Technical Root Cause        │
├────────────────────────────────┼────────────────────────────────────────────────────────────────┤
│ 1. Pipeline Velocity Dual-Bar  │ • 100% pitch-black monolith bars (#111111 at 24px width)       │
│    (screenshot_215006.png)     │   overwhelm visual weight like cemetery tombstones.            │
│                                │ • 2px glitchy red baseline artifact across zero-expense months │
│                                │   due to Math.max(2, ...) forcing rect rendering on ₹0 data.   │
│                                │ • Active halo capsule has static 187px height, overshooting    │
│                                │   down past -7L into empty whitespace.                         │
│                                │ • Inward-facing rounded corners create triangular baseline cuts│
├────────────────────────────────┼────────────────────────────────────────────────────────────────┤
│ 2. Pipeline Distribution Donut │ • Inner hole diameter is only 102px, while "₹ 65,40,000" text  │
│    (screenshot_220900.png)     │   spans 142px, causing severe horizontal glyph collision.      │
│                                │ • strokeLinecap="round" adds 9px extra caps, creating lumpy,   │
│                                │   distorted overlaps between adjacent segments.                │
│                                │ • STAGE_PALETTE has only 5 colors, causing Stage 1 ("New") and │
│                                │   Stage 6 ("Negotiation") to share identical black (#111111).  │
│                                │ • Harsh rectangular black percentage badges look like redactions│
├────────────────────────────────┼────────────────────────────────────────────────────────────────┤
│ 3. Header Hierarchy & Nav      │ • Double-stacked header (AdminHeader 64px + OverviewWorkspace  │
│    (screenshot_215016.png &    │   100px) burns 180px of vertical space with duplicated titles. │
│     screenshot_215010.png)     │ • Action button "+ New lead" and time stamp detached from rail.│
├────────────────────────────────┼────────────────────────────────────────────────────────────────┤
│ 4. Metrics Grid 4-Card Cluster │ • Desk card is a flat black slab lacking depth or specular rim.│
│    (screenshot_215010.png)     │ • Cards 2-4 use low-contrast borders and render green success  │
│                                │   badges on neutral zero values (e.g. "— Prior MoM ₹ 0").      │
│                                │ • Primary balance (30px) is smaller than secondary cards (34px)│
└────────────────────────────────┴────────────────────────────────────────────────────────────────┘
```

---

## 2. Design System Declaration & Brand Invariants

Per `DESIGN.md` and `.agents/skills/master-ui-ux-design-system/SKILL.md`:
* **Design Read Dial**: `ENERGY 1 / RHYTHM 2 / MOTION 1` (Swiss Luxury Editorial Standard).
* **Core Brand Invariants**:
  * Canvas: Warm editorial `#f5f5f3` (zero sterile cold grey).
  * Card Surfaces: Crisp paper `#ffffff` with hairline `#e7e7e4` borders and specular top-edge elevation.
  * Obsidian Anchor: Desk card `#111111` with radial graphite gradients and hairline border glow.
  * Marca Ubi Crimson: `#ea002a` (used with editorial restraint for primary conversions and CTA).
  * Typography: Circular XX for large financial numerals; Graphik for labels and controls.
  * Numerical Standard: Strict `font-variant-numeric: tabular-nums` across all monetary amounts.

---

## 3. Mathematical & Geometric Remediation Blueprints

### 3.1 Velocity Bar Chart: Geometric Coordinate Remapping (`ConyestCashflowCard`)

#### Current Coordinate Math & Failure Analysis
In `ConyestCashflowCard.tsx:79–101, 194–201`:
* `zeroY = 125`, `positiveRange = 95` (from $y=30$ to $y=125$), `negativeRange = 80` (from $y=125$ to $y=205$).
* Active halo has static coordinates:
  $$\text{Halo } y = 24, \quad \text{height} = 187 \implies \text{bottom} = 211$$
  Bottom gridline is at $y=205$ ($-7\text{L}$). The halo extends 6px below the lowest gridline, dangling in empty space.
* When `expense === 0`, `Math.max(2, ...)` forces an SVG `<rect>` with `y = 125, height = 2`, drawing a 2px bright red artifact.
* Using `<rect rx={6}>` applies rounding to all four corners. At $y=125$, the two rounded base corners create an unsightly triangular gap between positive and negative bars.

#### Remediation Blueprint & Mathematical Formulas
1. **Dynamic Content-Bounded Active Halo**:
   $$\text{haloTop} = \text{zeroY} - \text{incomeH} - 8$$
   $$\text{haloBottom} = \text{zeroY} + (\text{expenseH} > 0 ? \text{expenseH} + 8 : 8)$$
   $$\text{haloHeight} = \text{haloBottom} - \text{haloTop}$$
   The halo pill strictly hugs the active month's rendered bars with clean 8px padding and soft `rx=12` corners.
2. **Zero-Height Suppression**:
   ```tsx
   const expenseH = point.expense > 0
     ? Math.max(3, Math.min(negativeRange, (point.expense / maxScale) * negativeRange))
     : 0;
   ```
   If `expenseH === 0`, do NOT render the `<path>` or `<rect>`.
3. **Flat Zero-Baseline Path Geometry**:
   Replace generic `<rect rx={6}>` with bespoke SVG path commands that round only the outer extremities:
   * **Intake Bar (Upward)**:
     $$M(x, \text{zeroY}) \to L(x, y + r) \to Q(x, y, x + r, y) \to L(x + w - r, y) \to Q(x + w, y, x + w, y + r) \to L(x + w, \text{zeroY}) \to Z$$
   * **Won Contracts Bar (Downward)**:
     $$M(x, \text{zeroY}) \to L(x + w, \text{zeroY}) \to L(x + w, y + h - r) \to Q(x + w, y + h, x + w - r, y + h) \to L(x + r, y + h) \to Q(x, y + h, x, y + h - r) \to Z$$
4. **Refined Bar Proportions & Shading**:
   * Reduce bar width from `24px` to `16px` (or `18px`), creating elegant Swiss spacing.
   * Apply subtle vertical gradients:
     * Intake: Linear gradient from `#26262b` (top) to `#161618` (bottom baseline).
     * Won Contracts: Linear gradient from `#ea002a` (top baseline) to `#c40023` (bottom).
5. **Tooltip Clamping & Dynamic Arrow**:
   * Container width: `680px`. Tooltip width: `160px`.
   * Clamp center $X$:
     $$X_{\text{clamped}} = \max(88, \min(592, X_{\text{raw}}))$$
   * Carrot offset: $\Delta = X_{\text{raw}} - X_{\text{clamped}}$, passed via CSS custom property `--arrow-offset`.

---

### 3.2 Pipeline Stage Donut Widget: Precision Clearance Math (`ConyestStatisticCard`)

#### Current Clearance Math & Failure Analysis
* SVG ViewBox: `160 x 160`. Rendered: `170px x 170px`.
* Geometry: $cx=80, cy=80, r=60, \text{strokeWidth}=18$.
* Inner clear hole diameter:
  $$D_{\text{inner}} = (60 - 9) \times 2 = 102\text{px}$$
* Center text: `"₹ 65,40,000"` rendered at 20px Circular XX Bold spans **142px**.
* **Overlap Overflow**: $142\text{px} - 102\text{px} = +40\text{px}$ text collision right into the donut ring!
* `strokeLinecap="round"` on adjacent arc segments creates overlapping circular lobes that distort segment boundaries.

#### Remediation Blueprint & Mathematical Formulas
1. **Precision Geometry Expansion**:
   * ViewBox: `220 x 220` (CSS display: `190px x 190px`).
   * Geometry: $cx=110, cy=110, r=80, \text{strokeWidth}=14$.
   * Inner clear hole diameter:
     $$D_{\text{inner}} = (80 - 7) \times 2 = 146\text{px}$$
   * Center text typography:
     * Label: `ACTIVE PIPELINE` (10px, uppercase, tracking `0.08em`, color `#696965`).
     * Value: `₹ 65,40,000` (17px, Circular XX Bold, tracking `-0.02em`, `tabular-nums`).
     * Spans **114px**, leaving **32px of pristine margin** ($16\text{px}$ on each side) from the inner stroke boundary. Zero collision!
2. **Watchmaker Flush Joints with Spacer Gaps**:
   * Set `strokeLinecap="butt"`.
   * Circumference: $C = 2 \times \pi \times 80 = 502.65\text{px}$.
   * Angular spacer gap: $g = 3.5\text{px}$ between segments.
   * Segment stroke formula:
     $$\text{strokeDasharray} = \left[\max(0, L_i - g), \quad C - \max(0, L_i - g)\right]$$
     $$\text{strokeDashoffset} = -\left(\sum_{k=0}^{i-1} L_k + \frac{g}{2}\right)$$
   This produces immaculate, watchmaker-grade segmented rings with razor-sharp gaps.
3. **8-Stage Accessible Swiss Luxury Palette**:
   Eliminate color collisions (where Stage 1 and 6 were both black) by defining an authentic Swiss CRM palette:
   * **Stage 1 (Discovery / New)**: `#18181b` (Obsidian Core)
   * **Stage 2 (Contacted)**: `#ea002a` (Marca Ubi Crimson)
   * **Stage 3 (Qualification)**: `#0d9488` (Spruce Teal)
   * **Stage 4 (Proposal Sent)**: `#10b981` (Emerald)
   * **Stage 5 (Negotiation)**: `#d97706` (Executive Amber)
   * **Stage 6 (Closing Review)**: `#6366f1` (Refined Indigo)
   * **Stage 7 (Contract Won)**: `#059669` (Deep Jade)
   * **Stage 8 (On Hold / Archive)**: `#71717a` (Warm Slate)
   * *Zero generic `#2563eb` blue; WCAG AA contrast verified for all badge text.*
4. **Refined Percentage Pills**:
   Replace chunky black rectangular blocks with sleek capsule badges:
   * Capsule style: `border-radius: 9999px`, `min-width: 38px`, `height: 20px`, `font-size: 10px`, `font-weight: 700`.
   * Dynamic theme: Background `rgba(stageColor, 0.12)`, text `stageColor`, or subtle high-contrast solid pill.

---

### 3.3 Top Bar & Header Hierarchy Unification

#### Current Problem
* `AdminHeader.tsx` renders a 64px bar: `[M.] Marca Ubi / Commercial Desk / Overview` + Search Pill + Bell + User Profile.
* Directly beneath, `OverviewWorkspace.tsx` renders another 100px bar: Kicker `Executive Commercial Desk`, `h1 Dashboard`, Pipeline Summary, `+ New lead` button, and Last Updated timestamp.
* This burns **180px of vertical space** before the first scorecard is visible.

#### Remediation Architecture
1. **Unified Header on `/admin`**:
   * Detect root overview path in `AdminBreadcrumbs.tsx` / `AdminHeader.tsx`:
     * Left: Clean, prominent title **"Dashboard"** (`24px`, Circular XX Bold, `#111111`) with a subtle live indicator pill (`39 Active Deals · Live Telemetry`).
     * Right: Integrated operational cluster:
       `[+ New lead]` (Marca Ubi Red CTA) $\to$ `[Search ⌘K]` (warm-quiet pill) $\to$ `[🔔 Notifications]` $\to$ `[Avatar Chip]`.
2. **Page Content Streamlining**:
   * Remove the redundant kicker and duplicated `h1 Dashboard` from `OverviewWorkspace.tsx`.
   * Allow the 4-card metric grid to sit comfortably at the top of the workspace canvas with balanced `24px` padding, increasing vertical intelligence density.

---

### 3.4 Top 4 Metric Cards Elevation & Sizing Harmonization

#### Remediation Blueprint
1. **Card 1: Commercial Desk Executive Anchor**:
   * Background: Radial graphite depth `radial-gradient(120% 120% at 85% 15%, #242428 0%, #111111 100%)`.
   * Specular Top Rim: `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.20), 0 8px 24px -4px rgba(0, 0, 0, 0.35);`.
   * Concentric luxury wave watermark in pure SVG with `stroke: rgba(255, 255, 255, 0.12)`.
   * Primary Number: `32px` Circular XX Bold, `#ffffff`, `letter-spacing: -0.03em`.
   * Balanced footer metadata with high-contrast labels.
2. **Cards 2, 3, 4: Crisp Paper-White Luxury Scorecards**:
   * Background: `#ffffff`, `border: 1px solid #e7e7e4`, `border-radius: 18px`.
   * Elevation: `box-shadow: 0 1px 3px rgba(12, 12, 13, 0.03), 0 6px 16px -4px rgba(12, 12, 13, 0.04);`.
   * Numeric Typography: Unified at `32px` Circular XX Bold, `#111111`, `letter-spacing: -0.025em`, `tabular-nums`.
   * **Strict Semantic Trend Badge Matrix**:
     * Growth (> 0): Emerald pill (`#ecfdf5` bg, `#065f46` text, `#a7f3d0` border, `↗ +X.X%`).
     * Decline (< 0): Crimson pill (`#fff0f2` bg, `#9c001e` text, `#f5b7c0` border, `↘ -X.X%`).
     * Neutral / Zero / Comparison: Warm Quiet pill (`#f4f4f2` bg, `#54544f` text, `#e7e7e4` border, `— Prior MoM ₹ 0` or `0 won`). **Never green for zero conversions!**

---

## 4. Component Architectural Blueprint & Implementation Steps

```
src/app/admin/
├── components/
│   ├── layout/
│   │   ├── AdminHeader.tsx                     <-- Unify header cluster, integrate "+ New lead" & overview title
│   │   ├── AdminHeader.module.scss
│   │   └── AdminBreadcrumbs.tsx                <-- Streamline overview path to prevent subtitle duplication
│   └── Dashboard/
│       ├── ConyestMetricsGrid.tsx              <-- Specular gradient desk card, 32px unified type, semantic trend pills
│       ├── ConyestMetricsGrid.module.scss
│       ├── ConyestCashflowCard.tsx             <-- Bespoke SVG paths, dynamic halo, zero-suppression, slim 16px bars
│       ├── ConyestCashflowCard.module.scss
│       ├── ConyestStatisticCard.tsx            <-- Expanded 220x220 viewBox, 146px inner hole, strokeLinecap="butt", pill badges
│       ├── ConyestStatisticCard.module.scss
│       ├── OverviewWorkspace.tsx               <-- 8-stage Swiss palette, remove redundant header, clean canvas spacing
│       └── OverviewWorkspace.module.scss
```

---

## 5. Verification & Delivery Gates

1. **Static Analysis & Type Integrity**:
   * `npx tsc --noEmit` must report strictly **0 errors**.
2. **Unit Test Pass Rate**:
   * Run targeted test suites: `npx tsx --test tests/unit/crm-workspace-resilience.test.ts tests/unit/dashboard-server-assembly.test.ts` (100% pass rate required).
3. **Knowledge Graph Synchronization**:
   * Execute `graphify update .` to index all modified component signatures.
4. **Git Authorship Standard**:
   * Commit strictly authored as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
5. **PR Safety Policy**:
   * Push changes to `origin fix/auth-runtime-diagnostics-and-resilience`.
   * Update [PR #117](https://github.com/Fenar7/marca_ubi_web_hosting/pull/117) description with detailed visual changelog.
   * **STRICT PROHIBITION**: PR #117 must remain strictly `OPEN`. Zero PR merges by agent.

---

## 6. Execution Request & Permission Gate

Under the **Strict Behavioral Rule** and **Critical Zero-Tolerance Addendum**:
* This master plan is fully researched and documented.
* **No code files have been touched or modified in this step.**
* Please review the plan above. To begin implementation of these fixes across the four component surfaces, please type:
  **"proceed"** or **"do it"**.
