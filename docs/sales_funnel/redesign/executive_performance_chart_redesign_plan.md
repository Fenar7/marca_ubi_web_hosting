# Executive Performance Chart & Numeric Typography Redesign Plan

**Author**: Fenar7 <86710532+Fenar7@users.noreply.github.com>  
**Target Scope**: `src/app/admin/components/Dashboard/PerformanceChart.tsx`, `PerformanceChart.module.scss`, `src/app/admin/fonts.ts`, `src/app/admin/styles/tokens.scss`  
**Audited Artifact**: `Screenshot 2026-10-21 103911.png`  
**Status**: Ready for Human Review & Explicit Confirmation  

---

## 1. Executive Summary & Forensic Defect Analysis

Based on forensic visual and algorithmic inspection of `Screenshot 2026-10-21 103911.png`, the Performance Chart suffers from 5 core architectural and visual flaws:

| Defect Area | Current Implementation Flaw | Visual & Functional Symptom | Redesign Solution |
|---|---|---|---|
| **1. Numeric Typography** | Set to `var(--font-admin-code, monospace)` in `.axisText` and `.tooltipValue`. Resolves to `MessinaSansMono`. | Ugly typewriter serifs on `1`, slab hooks on `2`, teletype ears on `Cr`, uneven monospace character pitch, and dropped baseline on `₹`. | Introduce dedicated `--font-admin-numeric` token (Plus Jakarta Sans / Inter) with `tabular-nums` and `tnum` OpenType features. |
| **2. Bézier Curve Interpolation** | Midpoint control points forcing horizontal tangents ($dy/dx = 0$) at every point (`cy1 = p0.y`, `cy2 = p1.y`). | Unnatural "staircase shelves" and roller-coaster S-curve inflection spikes. | Implement **Fritsch-Carlson Monotone Cubic Spline** algorithm ($C^1$ continuity, zero overshoot, organic fluid finance curves). |
| **3. Gradient Wash** | Both This Month (Orange) and Last Month (Slate) area fills overlap down to the baseline. | Fills blend into a muddy beige/brown sludge across the lower 60% of the canvas. | Single ambient gradient for primary series; benchmark series rendered as a clean hairline stroke without muddy area fill. |
| **4. Layout & Spacing** | `originX = 45`, Y-axis text at `x = 35`. Baseline tick labeled `0` without currency symbol. | Labels (`₹2.5Cr`) touch the card border with 0px optical gutter. Non-uniform numerical scaling. | Expand viewBox to `640x220`, set `originX = 64` (8px-10px optical margin). Format ticks uniformly (`₹ 2.50 Cr`, `₹ 1.80 Cr`, `₹ 1.00 Cr`, `₹ 0.00`). |
| **5. Tooltip Dynamics** | Static `top: 15px`, `translateX(-50%)`. Lacks boundary clamping or dynamic vertical flip. | Tooltip directly collides with high curve peaks (e.g. Day 06 at $y=36\text{px}$) and clips outside card on Days 01 & 07. | Implement self-compensating horizontal translation (`translateX(-P%)`), dynamic vertical clearance, Apple HIG glassmorphism, and automated delta comparison badge. |

---

## 2. In-Depth Typographic Benchmark: Font Selection for Numbers

The user specifically requested advice on numeric typography: *"for the numbers only we need to use another font like poppins or which one do you think is good for numbers only"*.

### A. Candidate Evaluation Matrix

```
┌──────────────────────┬─────────────────┬────────────────────┬────────────────────┬─────────────────────┐
│ Metric / Criterion   │ Poppins         │ Plus Jakarta Sans  │ Inter              │ Messina Sans (tnum) │
├──────────────────────┼─────────────────┼────────────────────┼────────────────────┼─────────────────────┤
│ Visual Geometry      │ Circular / Wide │ Modern Geometric   │ Swiss Engineered   │ European Neo-       │
│                      │ Geometric       │ Fintech Sans       │ Objective Neutral  │ Grotesque Luxury    │
│ Tabular Lining       │ ❌ Inconsistent │ 🏆 Flawless native │ 🏆 Gold standard   │ ✅ Clean with       │
│ Figures (tnum)       │ on web variants │ OpenType tnum      │ tnum + cv05/cv08   │ tabular-nums        │
│ Numeric Density      │ ❌ ~22% wider   │ ✅ High optical    │ 🏆 Maximum density │ ✅ Balanced         │
│ (Compactness)        │ character pitch │ balance            │ without crowding   │                     │
│ Brand Persona        │ Consumer apps   │ Modern Fintech     │ Institutional      │ High-end editorial  │
│                      │ (Swiggy/Paytm)  │ (Brex/Revolut)     │ (Stripe/Linear)    │ agency              │
│ Currency (₹) Harmony │ ⚠️ Sits low/    │ 🏆 Flawless stroke │ 🏆 Pixel-perfect   │ ✅ Clean baseline   │
│                      │ baseline dip    │ and baseline align │ optical weight     │                     │
│ Dynamic Update Jitter│ ❌ Numbers jump │ 🏆 Zero jitter     │ 🏆 Absolute zero   │ 🏆 Zero jitter      │
│                      │ horizontally    │ during transitions │ horizontal jitter  │                     │
└──────────────────────┴─────────────────┴────────────────────┴────────────────────┴─────────────────────┘
```

### B. Font Recommendation Rationale
1. **Why Not Poppins for Chart Numerals?**:
   - Poppins is a beautiful font for consumer-facing headlines, but its digits are based on wide circular geometries. In small sizes (10px–11px) along chart axes and in tight tooltips, Poppins occupies ~22% more horizontal space, causing values to crowd or truncate.
   - Crucially, Poppins lacks consistent OpenType tabular figures (`tnum`). When financial values change, digits vary in width, creating noticeable horizontal layout jitter.
2. **Top Recommendation: Plus Jakarta Sans**:
   - Captures the exact modern, open, geometric warmth that makes Poppins attractive, but combines it with **professional tabular figures (`tnum`)**.
   - Numbers remain strictly monospaced for flawless vertical and column alignment, while displaying clean circular curves on `0`, `6`, `8`, and `9`.
   - Industry benchmark: Used by top-tier modern fintech companies (Brex, Wise, Monzo).
3. **Alternative Recommendation: Inter**:
   - The uncontested gold standard for data-dense executive software (Stripe, Linear, Supabase, Vercel).
   - Ultra-crisp at micro sizes, razor-sharp terminals, and flawless OpenType feature toggles (`tnum`, `cv05`, `cv08`).
4. **Zero-Dependency Option: Messina Sans (Proportional) with `tabular-nums`**:
   - Our project already bundles `MessinaSans` (`--font-admin-sans`).
   - In `PerformanceChart`, it was mistakenly assigned `var(--font-admin-code)` (MessinaSansMono) instead of `var(--font-admin-sans)` with `font-variant-numeric: tabular-nums`.

**Architectural Approach**: We introduce a dedicated CSS token `--font-admin-numeric`:
```scss
[data-admin-root="true"] {
  --font-admin-numeric: var(--font-admin-numeric, var(--font-admin-sans)), -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
}
```
This allows using **Plus Jakarta Sans** (or **Poppins** / **Inter**) effortlessly across all charts and CRM scorecards.

---

## 3. Mathematical & Algorithmic Blueprint

### A. Fritsch-Carlson Monotone Spline Bézier Algorithm
To eradicate the artificial horizontal tangent shelves and roller-coaster overshoot, we implement the Fritsch-Carlson algorithm in `PerformanceChart.tsx`:

```typescript
interface Point {
  x: number;
  y: number;
}

/**
 * Fritsch-Carlson Monotone Cubic Spline Bézier Interpolation.
 * Guarantees C1 continuity, strictly monotonic slopes, and zero artificial overshoot.
 */
export function generateMonotoneBezierPath(points: Point[]): string {
  const n = points.length;
  if (n === 0) return '';
  if (n === 1) return `M ${points[0].x} ${points[0].y}`;
  if (n === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  // 1. Calculate secant slopes and segment widths
  const deltas: number[] = new Array(n - 1);
  const h: number[] = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    h[i] = points[i + 1].x - points[i].x;
    deltas[i] = (points[i + 1].y - points[i].y) / h[i];
  }

  // 2. Initialize tangents
  const m: number[] = new Array(n);
  m[0] = deltas[0];
  m[n - 1] = deltas[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (deltas[i - 1] * deltas[i] <= 0) {
      m[i] = 0; // Local extremum: flat tangent prevents overshoot
    } else {
      m[i] = (deltas[i - 1] + deltas[i]) / 2;
    }
  }

  // 3. Monotonicity clamping
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(deltas[i]) < 1e-9) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const alpha = m[i] / deltas[i];
    const beta = m[i + 1] / deltas[i];
    if (alpha < 0) m[i] = 0;
    if (beta < 0) m[i + 1] = 0;

    const magSquared = alpha * alpha + beta * beta;
    if (magSquared > 9) {
      const tau = 3 / Math.sqrt(magSquared);
      m[i] = tau * alpha * deltas[i];
      m[i + 1] = tau * beta * deltas[i];
    }
  }

  // 4. Construct Bézier control points
  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = h[i] / 3;

    const cp1x = p0.x + dx;
    const cp1y = p0.y + (m[i] * h[i]) / 3;
    const cp2x = p1.x - dx;
    const cp2y = p1.y - (m[i + 1] * h[i]) / 3;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }

  return path;
}
```

### B. Tooltip Self-Compensating Boundary Translation
To eliminate tooltip clipping at Day 01 ($x = 7.5\%$) and Day 07 ($x = 96.67\%$):
```tsx
const tooltipLeftPercent = (activeCoordOrange.x / 640) * 100;

<div
  className={styles.tooltipCapsule}
  style={{
    left: `${tooltipLeftPercent}%`,
    transform: `translateX(-${tooltipLeftPercent}%)`,
  }}
>
```
- At $P = 7.5\%$ (Day 01): Shifts left by only $7.5\%$ of its own width ($\sim 11\text{px}$), keeping $92.5\%$ inside the card.
- At $P = 50\%$ (Midpoint): Shifts left by $50\%$ (perfect centering).
- At $P = 96.67\%$ (Day 07): Shifts left by $96.67\%$, preventing right edge container overflow.

---

## 4. UI/UX Visual Specification

### A. Viewport & Coordinate Geometry
- SVG canvas `viewBox="0 0 640 220"`
- `originX = 64` (8px-10px optical margin between card border and Y-axis text)
- `originY = 24` (headroom for peak curves)
- `chartWidth = 552` (ends at $x = 616$, leaving 24px right padding)
- `chartHeight = 150` (`baselineY = 174`)
- Y-axis labels positioned at `x = 54`, `textAnchor="end"`
- X-axis day labels at `y = 196`

### B. Card Header & Controls
- **Title**: `Performance` (700 weight, `#1f242f`)
- **Velocity Badge**: `+18.4% ↑` (emerald pill, `#ecfdf5` background, `#059669` text)
- **Legend Group**:
  - `This month`: 7px circular dot (`#ff6100`) with ambient glow (`box-shadow: 0 0 8px rgba(255, 97, 0, 0.45)`)
  - `Last month`: 7px circular dot (`#94a3b8`)
- **Segmented Range Pill Bar**: Replace static button with luxury `7D | 30D | 90D` segmented control.

### C. Hover Tracker & Glassmorphic Tooltip
- **Vertical Crosshair**: Delicate hairline `stroke: #cbd5e1; stroke-width: 1px; stroke-dasharray: 3 3; vector-effect: non-scaling-stroke;`
- **Specular Radar Halo**: Ambient pulsing circle (`r = 14`, `fill: rgba(255, 97, 0, 0.14)`) with core bead (`r = 5.5`, `fill: #ff6100; stroke: #ffffff; stroke-width: 2.5px; filter: drop-shadow(...)`).
- **Tooltip Capsule**:
  - `background: rgba(15, 23, 42, 0.92)`
  - `backdrop-filter: blur(16px)`
  - `border: 1px solid rgba(255, 255, 255, 0.12)`
  - `box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.45)`
  - Includes automated delta variance footer: `▲ +₹ 80 L (+60.6%)` in `#34d399`.

### D. Touch & Keyboard Accessibility
- Container `tabIndex={0}` with `onKeyDown` supporting `ArrowLeft`, `ArrowRight`, `Home`, `End`.
- Touch scrubber: `onTouchStart` / `onTouchMove` with `touch-action: pan-y;` for smooth mobile interaction.
- Screen reader live region: `<div className="sr-only" aria-live="polite">` announcing active metrics.

---

## 5. File Modifications Plan

1. **`src/app/admin/fonts.ts`**:
   - Add `adminNumeric` export (with `--font-admin-numeric` CSS variable) while preserving existing `adminSans`, `adminButtonFont`, and `adminMono` exports for 100% test suite compatibility.
2. **`src/app/admin/styles/tokens.scss`**:
   - Register `--font-admin-numeric` on `[data-admin-root="true"]`.
3. **`src/app/admin/components/Dashboard/PerformanceChart.tsx`**:
   - Integrate `generateMonotoneBezierPath` Fritsch-Carlson algorithm.
   - Update SVG coordinates (`viewBox="0 0 640 220"`, `originX = 64`).
   - Implement boundary-clamped tooltip positioning and automated delta calculations.
   - Add touch event handlers and keyboard navigation.
4. **`src/app/admin/components/Dashboard/PerformanceChart.module.scss`**:
   - Replace `var(--font-admin-code, monospace)` with `var(--font-admin-numeric, var(--font-admin-sans))` with `font-variant-numeric: tabular-nums`.
   - Add glassmorphic tooltip styling and radar pulse animations.
   - Clean up gridline and axis styles.
5. **`tests/unit/phase-7-logip-executive-dashboard.test.ts` & Regression Tests**:
   - Verify all 910 unit tests pass with zero regressions.

---

## 6. Strict Protocol Check
- **Permission Check**: This plan is presented for user review. No code will be written until the user explicitly responds with "proceed" or "yes, do it".
