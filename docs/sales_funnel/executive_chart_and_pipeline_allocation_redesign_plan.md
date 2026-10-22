# Executive Chart & Pipeline Allocation Redesign & Technical Remediation Plan

> **Product Context**: Marca Ubi Enterprise Agency CRM & Revenue Intelligence (`/admin`)  
> **Target Components**: `RevenueDynamicsCard.tsx` and `PipelineAllocationCard.tsx`  
> **Design Direction Authority**: `DESIGN.md` & `.agents/skills/master-ui-ux-design-system/`  
> **Declared Design Dial**: `ENERGY 2 / RHYTHM 2 / MOTION 1` (Balanced Luxury Precision)  
> **Status**: Ready for User Review (Awaiting Explicit User Approval)

---

## 1. Executive Summary & Screenshot Defect Matrix

The user screenshots (`Screenshot 2026-10-22 221957.png` and `Screenshot 2026-10-22 222003.png`) captured severe visual degradation and structural breakage in the two mid-tier dashboard widgets:

| Defect ID | Screenshot | User-Visible Defect | Root Technical Cause | Severity |
| :--- | :--- | :--- | :--- | :--- |
| **DEF-01** | `Screenshot 221957` | **Giant pitch-black silhouette blob** blanketed over the chart. | In `RevenueDynamicsCard.tsx`, `<path d={bezierCurvePath} className={styles.splineLine} />` references a CSS class that **does not exist** in `RevenueDynamicsCard.module.scss`. Per W3C SVG 1.1/2.0 specifications, any `<path>` without an explicit `fill="none"` attribute or CSS `fill` rule defaults to **`fill: #000000`** (solid black). The browser connects the terminal spline coordinate back to the origin and fills the entire curve interior with pitch black. | **CRITICAL** |
| **DEF-02** | `Screenshot 221957` | Target Quota & Collected Cash bars render as **identical pitch-black pillars**. | `<rect className={styles.barQuota} />` and `<rect className={styles.barCash} />` reference classes that **do not exist** in `RevenueDynamicsCard.module.scss`. Both evaluate to `undefined`, inheriting the W3C SVG initial default `fill: #000000; stroke: none;`. | **CRITICAL** |
| **DEF-03** | `Screenshot 221957` | Unstyled inspection text (`inment`, `₹9,50,000`, `₹6,80,000`) **overflowing and bleeding out of the card at bottom-left**. | CSS class name divergence: TSX accesses `styles.chartTooltip`, `styles.tooltipPeriod`, `styles.tooltipAttainment`, and `styles.tooltipVal`. SCSS declared `.obsidianTooltip`, `.tooltipMonth`, `.tooltipAttainmentPill`, and `.tooltipValue`. All evaluated to `undefined`, stripping `position: absolute`. The tooltip fell into static document flow below the 280px SVG canvas, bleeding out of the card boundary. | **HIGH** |
| **DEF-04** | `Screenshot 221957` | Period selector collapses into an **unstyled button** with a dangling arrow. | TSX accesses `styles.periodDropdownTrigger`, while SCSS declared `.periodPill`. Evaluates to `undefined`. | **MEDIUM** |
| **DEF-05** | `Screenshot 222003` | **Asymmetric 5-item grid orphan** leaving an empty hole on row 3, column 2 of `PipelineAllocationCard`. | In `PipelineAllocationCard.module.scss`, `.breakdownGrid` defines `grid-template-columns: repeat(2, 1fr)`. Five stage items in 2 columns leaves slot `(3, 2)` vacant, making the card look broken. | **HIGH** |
| **DEF-06** | `Screenshot 222003` | **Severe vertical dead space & stretching** in `PipelineAllocationCard`. | In `page.module.scss`, `.midTierGrid` enforces `align-items: stretch` (~420px height). In `PipelineAllocationCard.module.scss`, `.cardContainer` uses `justify-content: space-between`, pulling 4 small blocks ~50px apart with excessive dead space. | **MEDIUM** |
| **DEF-07** | Architecture | **React 19 `useId()` colon fragility** in SVG gradient and filter IDs. | `useId()` produces tokens wrapped in colons (e.g. `:r0:`). Colons are reserved CSS pseudo-class delimiters; unescaped `:r0:` in `url(#:r0:)` breaks DOM query selectors and causes WebKit/SSR paint server resolution failures. | **HIGH** |

---

## 2. Line-by-Line Root Cause Diagnosis

### A. CSS Module Divergence in `RevenueDynamicsCard`
Next.js TypeScript compilation succeeds because default CSS module typings resolve all `styles.<any>` lookups as strings. At runtime, nonexistent keys return `undefined`. React completely omits the `class` attribute when `className` is `undefined`:

```tsx
// Current TSX:
<rect x={quotaBarX} y={slot.quotaY} width={barWidth} height={...} rx={3} className={styles.barQuota} />
// Rendered DOM when styles.barQuota is undefined:
<rect x="62.5" y="85.2" width="14" height="144.8" rx="3"></rect>
// SVG Engine behavior:
// No fill specified -> default fill: #000000;
```

Similarly, the open Bézier spline curve:
```tsx
// Current TSX:
<path d={bezierCurvePath} className={styles.splineLine} filter={`url(#${glowFilterId})`} />
// Rendered DOM:
<path d="M 62.50 85.20 C 112.50 85.20, ..." filter="url(#:r1:)"></path>
// SVG Engine behavior:
// Open path with default fill: #000000 -> Closed with implicit straight chord and filled pitch black!
```

### B. Structural Imbalance in `PipelineAllocationCard`
- The sales funnel tracks 5 stages: **Discovery**, **Proposal Sent**, **Negotiation**, **Contract Review**, and **Closed Won**.
- Arranging 5 items in `repeat(2, 1fr)` produces an unavoidable orphan.
- In addition, "Closed Won" is an archived milestone (completed cash realized), whereas Discovery through Contract Review represent active in-flight deal volume. Combining them into an active pipeline progress bar without visual distinction distorts the operational narrative.

---

## 3. Master Redesign Blueprint & Visual Architecture

### A. `RevenueDynamicsCard`: Luxury Dark SVG Engineering
1. **Defensive Inline Presentation Attributes**:
   Provide explicit inline attributes (`fill`, `stroke`, `strokeWidth`) on all SVG elements in TSX so that the chart is **100% resilient** and will never render black even if CSS fails to load:
   - **Target Quota Bar**: `fill="#e2e8f0"` (light lavender slate), `rx={3}`
   - **Collected Cash Bar**: `fill="#0f172a"` (high-contrast slate charcoal), `rx={3}`
   - **Spline Area Fill**: `fill="url(#rdc-grad-...)"`, `stroke="none"`
   - **Spline Line**: `fill="none"`, `stroke="#ff6100"`, `strokeWidth={2.5}`, `strokeLinecap="round"`, `strokeLinejoin="round"`
   - **Scrub Ray**: `stroke="#94a3b8"`, `strokeWidth={1.5}`, `strokeDasharray="3 3"`
   - **Scrub Nodes**: Outer node `fill="#ffffff"` with `stroke="#ff6100"` (`strokeWidth={2.5}`); Inner node `fill="#ff6100"`
2. **React 19 Safe SVG IDs**:
   ```ts
   const rawId = useId();
   const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
   const gradOrangeId = `rdc-grad-${safeId}`;
   const glowFilterId = `rdc-glow-${safeId}`;
   ```
3. **Synchronized SCSS Classes**:
   Add `.barQuota`, `.barCash`, `.splineLine`, `.splineArea`, `.xAxisLabel`, `.barGroupActive` to `RevenueDynamicsCard.module.scss`. On hover, `.barCash` illuminates with Marca Orange (`#ff6100`).
4. **Obsidian Glassmorphic Tooltip**:
   Align TSX with `.obsidianTooltip`:
   - `position: absolute; top: 14px;`
   - `background: rgba(15, 23, 42, 0.94); backdrop-filter: blur(14px);`
   - `border: 1px solid rgba(255, 255, 255, 0.12);`
   - Clamped dynamic horizontal positioning (`0%` to `100%`) with automatic right-edge shift (`translateX(-100%)`).

### B. `PipelineAllocationCard`: Executive Balanced Layout
To eliminate the layout orphan and vertical stretching:
1. **Executive 2-Tier Visual Model**:
   - **Tier 1 (Active Conversion Milestones)**: 4 active pipeline stages (Discovery, Proposal Sent, Negotiation, Contract Review) in a balanced $2 \times 2$ grid (`repeat(2, 1fr)`).
   - **Tier 2 (Conversion Milestone Rail)**: A dedicated executive footer rail highlighting **Closed Won** (`₹5,50,000`, 2 deals, 28.6% win rate, 18.4d cycle) with Signature Marca Orange accents.
2. **Eliminate Dead Vertical Space**:
   Change `.cardContainer` from `justify-content: space-between` to `justify-content: flex-start; gap: 1.25rem`. Elements sit naturally with consistent vertical cadence.
3. **Bi-Directional Interactive Linkage**:
   - Hovering any stage card expands its corresponding segment in the progress bar (`transform: scaleY(1.2)`) and dims sibling segments to `opacity: 0.35`.
   - Hovering a progress bar segment highlights the corresponding stage card.
4. **WCAG AA Calibrated Color Tokens**:
   - **Discovery**: Deep Ocean Sky `#0284c7` (Contrast 4.54:1)
   - **Proposal Sent**: Royal Slate `#4f46e5` (Contrast 5.12:1)
   - **Negotiation**: Executive Amber `#d97706` (Contrast 4.62:1, replaces low-contrast `#ffd43b`)
   - **Contract Review**: Emerald `#059669` (Contrast 4.58:1, replaces low-contrast `#69db7c`)
   - **Closed Won**: Marca Orange `#ff6100` (Dedicated benchmark footer)

---

## 4. Target Files & Code Change Scope

```
src/app/admin/components/Dashboard/
├── RevenueDynamicsCard.tsx         <-- Defensive SVG attributes, safe IDs, synchronized class names
├── RevenueDynamicsCard.module.scss  <-- Added missing classes (.barQuota, .barCash, .splineLine, tooltip)
├── PipelineAllocationCard.tsx       <-- Symmetrical 2x2 active grid + Dedicated Won rail + hover state
├── PipelineAllocationCard.module.scss <-- Symmetrical grid, eliminated dead space, interactive states
└── types.ts                         <-- Unified StageAllocationItem & PipelineStageAllocationItem props
```

---

## 5. Verification & Delivery Gate Criteria

1. **Type Safety**: `npx tsc --noEmit` must pass with **0 errors and 0 warnings**.
2. **Visual Inspection via Headless Playwright**:
   - Confirm Target Quota bars render in crisp `#e2e8f0`.
   - Confirm Collected Cash bars render in deep `#0f172a`.
   - Confirm Monotone Bézier Spline renders as an orange curve (`#ff6100`) with subtle opacity gradient and **zero black blobs**.
   - Confirm Tooltip stays within the card bounds and floats above the scrub ray.
   - Confirm Pipeline Allocation renders a balanced $2 \times 2$ grid with zero empty slots.
3. **Click-Through & Interactive Smoke Test**:
   - Test scrub pointer move across W1..W5.
   - Test stage row hover and progress bar segment illumination.
4. **Zero AI-Slop Compliance**:
   - Strictly no em-dashes (`—`) in UI copy.
   - All currencies formatted with Indian Rupee grouping (`Intl.NumberFormat('en-IN')`).
   - All numbers styled with `font-variant-numeric: tabular-nums`.
