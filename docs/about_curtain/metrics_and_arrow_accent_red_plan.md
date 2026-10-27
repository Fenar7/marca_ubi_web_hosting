# About Section Metrics Symbols & Button Arrow Red Accent Plan

**Document ID**: `docs/about_curtain/metrics_and_arrow_accent_red_plan.md`  
**Target References**: `Screenshot 2026-10-27 134814.png` & `Screenshot 2026-10-27 134820.png`  
**Target Files**:
- `src/app/components/Sections/AboutCurtain.tsx`
- `src/app/components/Sections/AboutCurtain.module.scss`
**Target Branch**: `showcase/homepage-works-cutout-and-portfolio-showcase`  
**Target PR**: [Pull Request #84](https://github.com/Fenar7/marca_ubi_web_hosting/pull/84) (Strictly `OPEN`)  

---

## 1. Requirements & Visual Blueprint

Based on user review:
1. **Quantified Delivery Scope Metric Symbols (`Screenshot 134814`)**:
   - `100+`: `100` remains black (`$client-text-dark`), `+` turns brand accent red (`$client-accent-red` / `#ea002a`).
   - `12+`: `12` remains black, `+` turns brand accent red (`#ea002a`).
   - `3*`: `3` remains black, `*` turns brand accent red (`#ea002a`).
   - `360°`: `360` remains black, `°` (degree) turns brand accent red (`#ea002a`).
2. **Start a Project Brief Button Arrow (`Screenshot 134820`)**:
   - The arrow `&rarr;` inside `styles.architecturalButton` (`Start a Project Brief →`) turns brand accent red (`$client-accent-red` / `#ea002a`).

---

## 2. Technical Implementation Blueprint

### A. Update `src/app/components/Sections/AboutCurtain.tsx`

```tsx
interface MetricItem {
  number: string;
  symbol: string;
  title: string;
  desc: string;
}

const METRICS: MetricItem[] = [
  {
    number: "100",
    symbol: "+",
    title: "Brands Served",
    desc: "Across strategy, identity, digital platforms, and communication systems.",
  },
  {
    number: "12",
    symbol: "+",
    title: "Core Disciplines",
    desc: "From positioning and messaging to identity systems and digital direction.",
  },
  {
    number: "3",
    symbol: "*",
    title: "Integrated Pillars",
    desc: "Brand engineering, art direction, and experience systems working as one.",
  },
  {
    number: "360",
    symbol: "°",
    title: "Application Scope",
    desc: "End-to-end execution across digital platforms and physical touchpoints.",
  },
];
```

Rendering in JSX:
```tsx
{METRICS.map((metric) => (
  <div key={metric.title} className={styles.metricItem}>
    <span className={styles.metricValue}>
      {metric.number}
      <span className={styles.metricSymbol}>{metric.symbol}</span>
    </span>
    <h4 className={styles.metricTitle}>{metric.title}</h4>
    <p className={styles.metricDesc}>{metric.desc}</p>
  </div>
))}
```

### B. Update `src/app/components/Sections/AboutCurtain.module.scss`

1. Button Arrow Color:
```scss
.architecturalButton {
  ...
  .arrow {
    font-size: 16px;
    color: $client-accent-red; // Brand accent red (#ea002a)
    transition: transform 0.25s ease;
  }
}
```

2. Metric Symbols Color:
```scss
.metricSymbol {
  color: $client-accent-red; // Brand accent red (#ea002a)
  font-weight: 700;
  margin-left: 2px;
}
```

---

## 3. Human Factors & Accessibility Verification

- **Color Contrast**: `#ea002a` on `#ffffff` delivers a **4.61:1** contrast ratio (exceeds WCAG AA).
- **Tabular Numerals**: Numeric parts preserve `font-variant-numeric: tabular-nums` for rock-solid vertical alignment.
- **PR Governance**: PR #84 remains strictly `OPEN`, authored strictly as `Fenar7`.
