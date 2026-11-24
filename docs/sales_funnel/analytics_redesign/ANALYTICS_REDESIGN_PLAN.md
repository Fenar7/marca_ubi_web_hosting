# Revenue & Pipeline Analytics (`/admin/analytics`) Editorial Redesign Plan

> **Target Route:** `/admin/analytics` (`src/app/admin/(workspace)/analytics/`)  
> **Design System:** `DESIGN.md` Editorial Light Luxury (`#fbfbfa` canvas, `#ffffff` crisp surfaces, `#e7e7e4` hairlines, `Circular XX`, `Graphik`, `Helvetica Neue` 300 Light `tabular-nums lining-nums`) + multi-color semantic accents anchored in **Marca Ubi Red** (`#ea002a`).

---

## 1. Problems Diagnosed (From Screenshot & Code Audit)

1. **Equal-Card KPI Bento Grid (`AnalyticsMasthead.tsx`):**
   - Renders 4 identical bordered boxes (`Active Pipeline`, `Realized Revenue`, `Average Sales Cycle`, `Commercial Win Rate`) with redundant corner pill badges (`Open Scope`, `Closed Won`, `Velocity`, `Win/Loss`) — violating `DESIGN.md` ("zero equal-card KPI dashboards").
2. **Clipped Horizontal-Scroll Card-in-Card Funnel (`FunnelVisualizer.tsx`):**
   - Horizontal overflow clips the final `Converted` stage off the right edge of the viewport (`funnelRail` scrollbar).
   - Deeply nested card-in-card structure (`funnelSection` -> `stagePod` -> `podMetrics` -> `dropOffBar`), colored `stageDot` AI-slop circles, repetitive `Inspect deals ->` links, and `0.0%` step conversion / `0 (0.0%)` drop-off readouts.
3. **Inconsistent Typography, Visual Noise & Mobile Reflow:**
   - Mixes heavy boxed pills with inconsistent spacing instead of the sleek, minimal, multi-color editorial strip design established on `/admin/team` and `/admin/team/[id]`.

---

## 2. Redesign Architecture

### A. Tier 1 — Editorial Masthead & 4-Cell Semantic Telemetry Strip (`AnalyticsMasthead`)
- Clean top masthead (`Revenue & Pipeline Analytics`, window subtitle, and crisp 44px timeframe selector `7D / 30D / 90D / Q1–Q4 / YTD`).
- Replace the 4 equal rounded boxes with a **unified horizontal 4-column `<dl>` telemetry strip** separated by subtle vertical hairlines and 3px top semantic accent bars (no floating corner pills, no nested cards):
  1. **Active Pipeline** (Editorial Indigo `#4338ca`) — INR total + active deal count
  2. **Realized Revenue** (Emerald `#059669`) — INR total + signed contracts
  3. **Average Sales Cycle** (Teal `#0f766e`) — Days + INR/day throughput
  4. **Commercial Win Rate** (Marca Red `#ea002a`) — `%` + won/closed decision count

### B. Tier 2 — Zero-Overflow Stepped Editorial Funnel (`FunnelVisualizer` + `page.tsx` Math Audit)
- Eliminate the horizontal scrollbar and nested white-box pods completely.
- Render a **full-width proportional Conversion Funnel Table / Bars**:
  - Each stage is a clean single horizontal row (clickable `<Link href="/admin/leads?status_id=...">` with 44px height) showing:
    1. Stage Name with 3px left semantic color bar (**zero status dots**)
    2. Proportional horizontal bar fill (`leadsCurrentlyInStage` / `cumulativeReachedCount`)
    3. `In Stage` count + `Reached` count (`tabular-nums`)
    4. `Step Conversion %` and `Drop-off` cleanly formatted
  - Audit `FunnelDropoffRpcRow` mapping in `analytics/page.tsx` so stage step-conversion and drop-off calculations reflect true stage-to-stage progression cleanly when deals exist.

### C. Tier 3 & 4 — Revenue Realization Spline, Practice Allocation & Stage Dwell Matrix
- Harmonize `RevenueSpline`, `PracticeMatrix`, and `StageDwellMatrix` onto the same clean Editorial Light Luxury card surfaces (`#ffffff`, `1px solid #e7e7e4`, zero nested borders, zero colored dots, clean multi-color bar fills in `#ea002a`, `#059669`, `#4338ca`, `#0f766e`, `#d97706`).
- Full mobile responsiveness (`< 1024px` single-column stack, `< 640px` clean mobile layout with zero horizontal overflow) and `prefers-reduced-motion` support.

---

## 3. Verification Plan
- `npx tsc --noEmit` (`EXIT: 0`), `npm run test:boundaries`, `npm run test:unit`, Sass compilation of all analytics `.module.scss` modules, `graphify update .`, Senior CTO PR Auditor verification, and push to open PR #131 (`redesign/personnel-dossier-login-telemetry`).
