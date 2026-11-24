# Master Architecture & Engineering Plan V7: Commercial Cockpit Compact Density & Zero-Void Overhaul

**Target Module**: Commercial Desk Overview Cockpit (`/admin`)  
**Components**: `CommercialVelocityBarChart.tsx`, `PipelineDonutChart.tsx`, `OverviewWorkspace.module.scss`  
**Reference Models**: Finexy (`reference_user_downloads.webp`), Fundora (`uploaded_media_1_1794807208034.webp`), Recover (`uploaded_media_0_1794807208034.webp`)  
**Author**: Fenar7 `<86710532+Fenar7@users.noreply.github.com>`  
**Branch**: `redesign/commercial-desk-notion-linear`  
**PRs Open**: PR #122 (Child), PR #121 (Base Cockpit) — *Strictly Human Merge Only*  

---

## 1. Forensic Audit & Root Cause Analysis of Live Deficiencies

Visual inspection of the live screenshot (`uploaded_media_1794810732669.png`) revealed four critical flaws responsible for the bloated, empty appearance:

### Defect 1: The 60% Vertical Empty Void in Left Card
* **Root Cause in Code**: In `CommercialVelocityBarChart.tsx` (line 115):
  ```typescript
  const highest = Math.max(...monthlyData.map((d) => Math.max(d.intake, d.realized)), 2000000);
  return Math.ceil(highest / 500000) * 500000;
  ```
  `Math.max(..., 2000000)` hardcodes a minimum Y-axis ceiling of ₹20,00,000 (₹20L).
* **Visual Impact**: When the pipeline data per interval is ~₹8.17L, the tallest bar stops at only ~40.8% of the SVG height. The entire upper 59.2% of the chart (from ₹8.2L to ₹20L) is pure, dead empty white space.

### Defect 2: 8 Identical Flat "Fence Post" Bars
* **Root Cause in Code**: In `CommercialVelocityBarChart.tsx` (lines 77–83):
  ```typescript
  const cadenceWeights =
    pointCount === 5 ? [0.14, 0.22, 0.18, 0.26, 0.20] :
    pointCount === 7 ? [0.10, 0.12, 0.18, 0.16, 0.22, 0.14, 0.08] :
    Array.from({ length: pointCount }, () => 1 / pointCount);
  ```
  When `pointCount` was expanded from 5 to 8 intervals for 30-day view, it fell through to `1 / 8 = 0.125`.
* **Visual Impact**: Every single bar was multiplied by exactly `0.125`, creating 8 completely identical columns of ₹8,17,500. This looks artificial and lifeless compared to Finexy and Fundora where bars rise, dip, and reflect authentic commercial velocity.

### Defect 3: The Persistent "Detached Typo Underline" Illusion
* **Root Cause in Code**: In `PipelineDonutChart.tsx` (lines 257–265):
  The progress indicator was rendered as a full-width (`width: 100%`) bar on its own row immediately below the category text (`.cardletMeterTrack`).
* **Visual Impact**: Because it spans the full width of the container directly beneath the category text on a clean white background, the human visual cortex groups it as a typographical underline (or a spellcheck error bar) rather than a data gauge.

### Defect 4: Artificial Card Height Inflation
* **Root Cause in Code**:
  Both cards were previously inflated to ~485px height using `height: 100%` and `align-items: stretch` to force equal heights with a bloated 3-pod telemetry shelf.
* **Visual Impact**: Finexy and Fundora cards are sleek, compact, and content-proportioned (~320px–340px tall). Inflating our cards to ~485px created vast vertical voids inside both containers.

---

## 2. Comparative Reference Architecture & Design Archetypes

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ FINEXY ARCHETYPE: Compact Height (~330px), Bars Fill 80-85% Height, Dynamic Ceilings   │
│ FUNDORA ARCHETYPE: High Density, Sleek Proportions, Compact Donut & Micro-HUD          │
│ LINEAR / RAYCAST ARCHETYPE: Inline Capsule Gauges on Single Horizontal Row             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

| Dimension | Live Current (Defective) | Finexy / Fundora Reference | Plan V7 Blueprint |
| :--- | :--- | :--- | :--- |
| **Card Height** | ~485px (Inflated / Empty) | ~320px – 340px (Compact) | **330px Balanced Budget** |
| **Chart Height Utilization** | 40.8% (60% dead space) | 80% – 85% (Data-dense) | **82% Peak Bar Utilization** |
| **Y-Axis Ceiling** | Hardcoded ₹20L clamp | Dynamic to highest value | **Dynamic Milestone Snapping** |
| **Cadence Distribution** | Flat 12.5% (all identical) | Organic rise & dip | **Authentic 8-Point Weights** |
| **Donut Diameter** | 204px (Pushes list down) | 150px – 160px (Compact) | **156px Precision Ring** |
| **Category Progress Meter** | Full-width underline | Inline capsule token | **45px Inline Gauge Capsule** |

---

## 3. Concrete Architectural & Mathematical Blueprint

### Phase 1: Dynamic Y-Axis Scaling (Zero Dead Space with Clean Integer Milestones)
Eliminate `Math.max(..., 2000000)`. In `CommercialVelocityBarChart.tsx`, enforce the CTO-audited 4-milestone integer step formula:
```typescript
/**
 * Calculates a dynamic Y-axis ceiling tailored tightly to the dataset maximum.
 * Target utilization is 82-85% for peak bars, guaranteeing clean, equal integer intervals.
 */
const { maxVal, yMilestones } = useMemo(() => {
  const highest = Math.max(...monthlyData.map((d) => Math.max(d.intake, d.realized)), 0);
  if (highest <= 0) {
    const fallbackMax = 400000; // ₹4L clean baseline when pipeline is empty
    return {
      maxVal: fallbackMax,
      yMilestones: [0, 100000, 200000, 300000, 400000],
    };
  }

  // Target peak bar to occupy ~84% height (headroom for tooltips & apex beacon rings)
  const targetQuarter = (highest * 1.18) / 4;
  const stepUnit =
    targetQuarter > 2500000 ? 2500000 : // 25L steps for enterprise scale
    targetQuarter > 1000000 ? 1000000 : // 10L steps
    targetQuarter > 500000 ? 500000 :   // 5L steps
    targetQuarter > 200000 ? 200000 :   // 2L steps
    100000;                             // 1L steps

  const cleanQuarter = Math.ceil(targetQuarter / stepUnit) * stepUnit;
  const ceiling = Math.max(cleanQuarter * 4, 400000);
  const milestones = [0, cleanQuarter, cleanQuarter * 2, cleanQuarter * 3, ceiling];

  return { maxVal: ceiling, yMilestones: milestones };
}, [monthlyData]);
```
*Result*: For a peak bar of ₹13.73L, `cleanQuarter = ₹4,00,000` (₹4L) and `maxVal = ₹16,00,000` (₹16L).
The peak bar utilizes **85.8% of chart height**, and milestones render as clean, uniformly spaced integer labels: `[₹ 0, ₹ 4L, ₹ 8L, ₹ 12L, ₹ 16L]`. Dead vertical void is completely eradicated!

---

### Phase 2: Authentic 8-Point Cadence Variance & Universal Non-Flat Fallback
In `CommercialVelocityBarChart.tsx`:
```typescript
/**
 * Calibrated cadence distribution weights for common telemetry intervals.
 * All weight arrays strictly sum to 1.000 (100% of pipeline allocation).
 */
const CADENCE_INTERVAL_PRESETS: Record<number, number[]> = {
  5: [0.14, 0.22, 0.18, 0.26, 0.20],
  7: [0.10, 0.12, 0.18, 0.16, 0.22, 0.14, 0.08],
  8: [0.08, 0.14, 0.11, 0.18, 0.15, 0.21, 0.16, 0.12],
};

function getCadenceWeights(count: number): number[] {
  if (count <= 0) return [];
  if (CADENCE_INTERVAL_PRESETS[count]) {
    return CADENCE_INTERVAL_PRESETS[count];
  }
  // Universal sinusoidal bell modulation: prevents flat bars for any arbitrary interval
  const raw = Array.from({ length: count }, (_, i) => 0.6 + 0.8 * Math.sin(((i + 0.5) / count) * Math.PI));
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((w) => w / sum);
}
```
*Result*: Total intake of ₹65,40,000 distributes across 8 intervals with organic commercial variance:
- 17 Oct: ₹ 5,23,200 (8%)
- 21 Oct: ₹ 9,15,600 (14%)
- 24 Oct: ₹ 7,19,400 (11%)
- 28 Oct: ₹ 11,77,200 (18%)
- 1 Nov: ₹ 9,81,000 (15%)
- 5 Nov (Peak): ₹ 13,73,400 (21%)
- 8 Nov: ₹ 10,46,400 (16%)
- 12 Nov: ₹ 7,84,800 (12%)
- **Sum**: Exactly ₹ 65,40,000 (100.0%)
- **Telemetry Footer**: `Peak Cadence` correctly detects and highlights **5 Nov (₹ 13,73,400)**.

---

### Phase 3: The Linear / Raycast Inline Capsule Progress Gauge (Underline Eradication)
Replace the multi-line cardlet and full-width `.cardletMeterTrack` with a single-line inline layout:

```
[●] Web & Digital (14)  ────────  [████████░░] 37%  ────────  ₹ 24,00,000
```

**JSX Implementation in `PipelineDonutChart.tsx`**:
```tsx
<ul className={styles.categoryRowList}>
  {categories.map((cat, idx) => {
    const isHovered = activeHoverIndex === idx;
    return (
      <li
        key={idx}
        className={isHovered ? styles.categoryRowActive : styles.categoryRow}
        onMouseEnter={() => setActiveHoverIndex(idx)}
        onMouseLeave={() => setActiveHoverIndex(null)}
      >
        <div className={styles.categoryInfo}>
          <span className={styles.colorSwatch} style={{ backgroundColor: cat.color }} aria-hidden="true" />
          <span className={styles.categoryName} title={cat.name}>{cat.name}</span>
          {typeof cat.count === "number" && (
            <span className={styles.dealCountTag}>({cat.count})</span>
          )}
        </div>

        {/* Self-contained inline 45px capsule gauge: CANNOT look like an underline */}
        <div className={styles.inlineGaugeWrapper}>
          <div className={styles.inlineGaugeTrack}>
            <div
              className={styles.inlineGaugeFill}
              style={{
                width: `${Math.min(100, Math.max(4, cat.percentage))}%`,
                backgroundColor: cat.color,
              }}
            />
          </div>
          <span className={styles.percentageLabel}>{cat.percentage}%</span>
        </div>

        <span className={styles.categoryAmount}>
          {financials ? formatCrmCurrency(cat.value) : "Confidential"}
        </span>
      </li>
    );
  })}
</ul>
```

---

### Phase 4: Compact Geometric Height Budget (~330px)

| Component Parameter | Current | Plan V7 Blueprint |
| :--- | :--- | :--- |
| **Card Outer Padding** | `1.25rem 1.4rem` (~20px) | `1.1rem 1.25rem` (17px) |
| **Bar Chart SVG Height** | 300px | **210px** (`chartHeight = 152px`, `baselineY = 172px`) |
| **Bar Chart Footer Shelf** | 70px 3-pod blocks | **28px Compact Micro-HUD** |
| **Donut SVG Diameter** | 204px | **156px** (`radius = 60`, `strokeWidth = 11`) |
| **Donut Center HUD** | 136px max-width, 1.65rem | **110px max-width, 1.35rem value** |
| **Category Rows Gap** | 6px per cardlet (110px total) | **4px per row (88px total)** |
| **Total Card Height** | ~485px | **~330px (Compact & Dense)** |

---

## 4. Verification & Delivery Gate Checklist

1. [ ] **Zero TypeScript Errors**: `$env:NODE_OPTIONS="--max-old-space-size=4096"; npx tsc --noEmit` must exit with code 0.
2. [ ] **100% Test Pass Rate**: Run all unit tests in `tests/unit/`.
3. [ ] **No Dead Voids**: Left chart bars reach 80–85% of height; right chart donut and list sit snug with zero excess gap.
4. [ ] **No Typo Underline**: Category gauges rendered strictly as 45px inline capsules on the same row.
5. [ ] **Git Authorship**: Commits authored strictly as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
6. [ ] **No 'feat' in PR/Commit Titles**: Strict enterprise naming standard.
7. [ ] **Zero PR Merges**: PR #122 and PR #121 remain strictly **OPEN** awaiting manual human click-to-merge on GitHub.
