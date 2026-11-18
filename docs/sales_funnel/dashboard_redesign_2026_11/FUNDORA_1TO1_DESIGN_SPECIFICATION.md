# Benchmark 1:1 Design Token & Component Specification: Fundora Archetype

**Benchmark Source**: `uploaded_media_0_1794984976228.jpg`  
**Target Module**: Marca Ubi Commercial Desk Overview Workspace (`/admin`)  
**Design Read**: ENERGY 1 / RHYTHM 2 / MOTION 2 (Editorial Swiss Precision)  
**Author**: Expert UI/UX Designer Agent (`Fenar7 <86710532+Fenar7@users.noreply.github.com>`)  
**Status**: APPROVED DESIGN SPECIFICATION  

---

## 1. Executive Visual Philosophy & Color Palette

The interface adheres strictly to the **Swiss International Style** and **Marca Ubi Commercial Desk Luxury Standards**:
- **Canvas Backdrop**: `#f8fafc` / `#f5f5f3` (clean neutral light surface).
- **Card Background**: `#ffffff` (pure paper white).
- **Borders**: `1px solid #e2e8f0` / `rgba(0, 0, 0, 0.05)` (subtle hairline boundaries).
- **Drop Shadows**: `0 1px 3px rgba(0, 0, 0, 0.02), 0 6px 16px rgba(0, 0, 0, 0.03)` (whisper-soft elevation).
- **Primary Ink**: `#111111` / `#0f172a` (near-black, high legibility).
- **Secondary Ink**: `#64748b` (slate gray for captions and metadata).
- **Muted Ink**: `#94a3b8` (cool gray for axis ticks and inactive labels).
- **Brand Accent**: `#ea002a` (Marca Ubi Red, reserved for focus, primary actions, and critical alerts).
- **Vibrant Blue Accent**: `#2563eb` / `#3b82f6` (for financial splines, active bars, and category 1).
- **Soft Periwinkle Blue**: `#93c5fd` (for category 2 and secondary chart fills).
- **Neutral Capsule Gray**: `#e2e8f0` (for category 3 and inactive bars).

---

## 2. Layout Grid Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TOP TIER: TWO EQUAL-WIDTH COMPANION METRICS (Row 1)                                              │
├─────────────────────────────────────────────────┬────────────────────────────────────────────────┤
│ 1. EarningOverviewSplineCard (50% / 6 cols)     │ 2. SpendingOverviewBarCard (50% / 6 cols)      │
│    • Swiss Hairline $20,520.32                  │    • Swiss Hairline $20,520.32                 │
│    • SVG Cubic Bezier Spline + Linear Fill      │    • Horizontal Legend (Rent, Food, Other)     │
│    • Apex Circle + Stem + Floating Card Tooltip │    • 38px Continuous Gradient Capsule Bar      │
├─────────────────────────────────────────────────┴────────────────────────────────────────────────┤
│ SPLIT WORKING TIER (Row 2 & Row 3)                                                               │
├───────────────────────────────────────────────────────────────┬──────────────────────────────────┤
│ LEFT MAJOR COLUMN (68% / 8 cols)                              │ RIGHT TALL COLUMN (32% / 4 cols) │
├───────────────────────────────────────────────────────────────┼──────────────────────────────────┤
│ 3. CashFlowCard (Height ~340px)                               │ 4. UpcomingSlaCard (Tall Card)   │
│    • Swiss Hairline $342,323.44                               │    • Spans across Row 2 + Row 3  │
│    • Segmented Pill Controls (Income / Expense / Savings)     │    • Height ~640px to 680px      │
│    • 12-Month Bars with Active Hover Bar + Floating Tooltip   │    • 3 Priority Milestone Items  │
├───────────────────────────────────────────────────────────────┤    • Monogram Brand Avatars      │
│ 5. RecentTransactionsTable (Height ~280px)                    │    • Urgency / Scheduled Badges  │
│    • Filter Trigger Button                                    │    • Chevron '>' Navigation      │
│    • Clean Tabular Layout (Activity, Date, Amount, Status)    │    • Full-Width 'View All' Btn   │
│    • Monospace Timestamps & Emerald Status Pills              │                                  │
└───────────────────────────────────────────────────────────────┴──────────────────────────────────┘
```

---

## 3. Deep Component Specifications

### Specification 1: Restoration of Swiss Hairline Helvetica Neue 300 Light
- **Typography Token**:
  ```scss
  @mixin swissHairlineMetric($fontSize: 30px) {
    font-family: var(--font-helvetica-neue), "Helvetica Neue", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: $fontSize;
    font-weight: 300;
    letter-spacing: -0.035em;
    line-height: 1.1;
    color: #111111;
    font-variant-numeric: tabular-nums lining-nums;
    font-feature-settings: "tnum" 1, "lnum" 1;
  }
  ```
- **Application Matrix**:
  - `LuxuryVirtualCard`: `$65,40,000` / `₹ 65,40,000` (White `#ffffff`, `28px`, `font-weight: 300`).
  - `EarningOverviewSplineCard`: `$20,520.32` (`#111111`, `30px`, `font-weight: 300`).
  - `SpendingOverviewBarCard`: `$20,520.32` (`#111111`, `30px`, `font-weight: 300`).
  - `CashFlowCard`: `$342,323.44` (`#111111`, `34px`, `font-weight: 300`).
  - Tooltips: `$8,689.20` (`#0f172a`, `12px–13px`, `font-weight: 700`, `tabular-nums`).
  - Recent Transactions Amount: `+$25,500` (`#0f172a`, `13px`, `font-weight: 600`, `tabular-nums`).
  - Upcoming SLA Amounts: `$15.99`, `$9.99`, `$52.99` (`#0f172a`, `15px`, `font-weight: 600`, `tabular-nums`).

---

### Specification 2: Complete Eradication of AI-Slop from LuxuryVirtualCard
- **Deleted Slop Artifacts**:
  - Eradicate `.liveBadge`, `.pulsingDot`, `@keyframes pulse`, and neon green glowing pills.
- **Architectural Enhancements**:
  - **Tactile iOS/Linear Style Toggle Switch**:
    - Track: `width: 38px`, `height: 22px`, `padding: 2px`, `background: rgba(255, 255, 255, 0.16)`, `border-radius: 9999px`, `border: 1px solid rgba(255, 255, 255, 0.1)`.
    - Active State: `background: #ea002a` (Marca Ubi Red) or `#10b981` (Executive Emerald).
    - Thumb: `width: 16px`, `height: 16px`, `background: #ffffff`, `border-radius: 50%`, `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3)`.
  - **Concentric Vector Watermark**:
    - Concentric SVG rings at `cx="280" cy="40"` (`r="140"`, `r="100"`, `r="60"`, `r="24"`), opacity `0.04 - 0.12`.
  - **Executive Metadata Chips**:
    - `PERIOD: Q4 2026`, `WIN RATE: 84%`, `ACTIVE: 39 DEALS` in frosted chips (`background: rgba(255, 255, 255, 0.05)`, `border: 1px solid rgba(255, 255, 255, 0.06)`).

---

### Specification 3: EarningOverviewSplineCard
- **Card Container**: `padding: 24px`, `border-radius: 16px`, `background: #ffffff`, `border: 1px solid #e2e8f0`.
- **Card Header**:
  - Title: "Earning Overview" (`font-size: 14px`, `font-weight: 600`, `color: #111111`).
  - Info Icon `(i)`: `14px`, `color: #94a3b8`.
  - Dropdown: "This Month v" (`border: 1px solid #e2e8f0`, `border-radius: 8px`, `padding: 6px 12px`, `font-size: 12px`).
- **Metric Valuation**:
  - Amount: `$20,520.32` (`@include swissHairlineMetric(30px)`).
  - Trend Badge: `+1.5% ↑` (`background: #111111`, `color: #ffffff`, `border-radius: 9999px`, `padding: 2px 8px`, `font-size: 11px`, `font-weight: 600`).
- **Interactive SVG Spline Curve**:
  - ViewBox: `0 0 380 130`.
  - Cubic Bezier Path:
    `d="M 10 100 C 45 100 60 50 85 50 C 110 50 125 50 145 50 C 165 50 175 75 195 75 C 215 75 225 40 245 40 C 265 40 280 75 305 75 C 330 75 345 45 370 30"`
  - Stroke: `#2563eb`, `stroke-width: 2.5px`, `stroke-linecap: round`.
  - Area Fill Gradient:
    - `<linearGradient id="earningGradient" x1="0" y1="0" x2="0" y2="1">`
    - Stop 0%: `#3b82f6` (opacity 0.18) -> Stop 50%: `#60a5fa` (opacity 0.06) -> Stop 100%: `#ffffff` (opacity 0.00).
- **Apex Circle, Vertical Stem & Tooltip**:
  - Apex at `x=245, y=40` (Month Apr/May).
  - Dashed Stem: `<line x1="245" y1="40" x2="245" y2="115" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.6" />`.
  - Apex Circle: `<circle cx="245" cy="40" r="4.5" fill="#2563eb" stroke="#ffffff" stroke-width="2" />`.
  - Floating Tooltip Card:
    - `background: #ffffff`, `border: 1px solid #e2e8f0`, `border-radius: 8px`, `padding: 6px 12px`, `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)`.
    - Text: `May 2025 : ` (`color: #64748b`, `font-size: 11px`) `**$8,689.20**` (`color: #0f172a`, `font-size: 12px`, `font-weight: 700`, `tabular-nums`).
- **X-Axis Ticks**: `Jan`, `Feb`, `Mar`, `Apr`, `May`, `Jun` (`font-size: 11px`, `font-weight: 500`, `color: #94a3b8`).

---

### Specification 4: SpendingOverviewBarCard
- **Card Header**:
  - Title: "Spending Overview" (`font-size: 14px`, `font-weight: 600`, `color: #111111`).
  - Info Icon `(i)`: `14px`, `color: #94a3b8`.
  - Dropdown: "This Month v".
- **Metric Valuation**:
  - Amount: `$20,520.32` (`@include swissHairlineMetric(30px)`).
  - Trend Badge: `+1.5% ↓` (`background: #fef2f2`, `color: #ef4444`, `border-radius: 9999px`, `padding: 2px 8px`, `font-size: 11px`, `font-weight: 600`).
- **Subtitle**: "Spending Breakdown" (`font-size: 12px`, `font-weight: 600`, `color: #111111`, `margin-top: 16px`, `margin-bottom: 10px`).
- **Horizontal Breakdown Legend (No Vertical Table)**:
  - Flex container: `display: flex`, `gap: 24px`, `margin-bottom: 14px`.
  - Item 1: `House Rent` (Dot: `8px` `#2563eb`, Label: `House Rent`, Value: `$2,000.00`).
  - Item 2: `Foods` (Dot: `8px` `#93c5fd`, Label: `Foods`, Value: `$1,500.00`).
  - Item 3: `Others` (Dot: `8px` `#e2e8f0`, Label: `Others`, Value: `$800.00`).
- **Continuous Rounded Gradient Capsule Bar**:
  - Dimensions: `width: 100%`, `height: 38px`, `border-radius: 10px`, `overflow: hidden`, `display: flex`.
  - Segment 1 (~46%): `background: linear-gradient(90deg, #1d4ed8 0%, #3b82f6 100%)`.
  - Segment 2 (~35%): `background: #93c5fd`.
  - Segment 3 (~19%): `background: #e2e8f0`.
  - **ZERO vertical table rows underneath**.

---

### Specification 5: RecentTransactionsTable
- **Card Header**:
  - Title: "Recent Transaction" (`font-size: 15px`, `font-weight: 600`, `color: #111111`).
  - Filter Trigger: "Filter" (`padding: 6px 12px`, `border: 1px solid #e2e8f0`, `border-radius: 8px`, `background: #ffffff`, `font-size: 12px`).
- **Table Structure**:
  - Table Header (`thead`):
    - Height `38px`, `background: #f8fafc`, `border-radius: 8px`.
    - Columns: `Activity`, `Date`, `Total Amount`, `Status`, `...`.
    - Font: `font-size: 11px`, `font-weight: 500`, `color: #64748b`.
  - Table Rows (`tbody tr`):
    - Height: `56px`, `border-bottom: 1px solid #f1f5f9`.
    - Hover: `background-color: #f8fafc`.
  - Columns Breakdown:
    1. `Activity`:
       - Icon Badge: `32px x 32px`, `border-radius: 8px` (App Store blue / Adobe red).
       - Activity Title: `font-size: 13px`, `font-weight: 600`, `color: #0f172a`.
    2. `Date`:
       - Text: `Wed 10:29 AM` (`font-size: 12px`, `font-weight: 500`, `color: #64748b`, `tabular-nums`).
    3. `Total Amount`:
       - Text: `+$25,500` (`font-size: 13px`, `font-weight: 600`, `color: #0f172a`, `tabular-nums`).
    4. `Status`:
       - Pill: `● Success` (`background: #ecfdf5`, `color: #059669`, `border-radius: 9999px`, `padding: 4px 10px`, `font-size: 11px`, `font-weight: 600`).
    5. Action Menu: Ghost button with `...` icon.

---

### Specification 6: UpcomingSlaCard (Tall Card Spanning Cash Flow + Transactions)
- **Position & Sizing**:
  - Aligned in the right column, spanning full vertical height alongside Cash Flow and Recent Transactions (`min-height: 640px`).
- **Card Header**:
  - Title: "Upcoming Bill & Payment" (or "Upcoming SLA & Retainers").
  - Button: `+` action button (`width: 28px`, `height: 28px`, `border: 1px solid #e2e8f0`, `border-radius: 8px`, `background: #ffffff`).
- **Milestone Items (3 Benchmark Items)**:
  - Container: `padding: 14px 16px`, `border: 1px solid #f1f5f9`, `border-radius: 12px`, `margin-bottom: 12px`, `background: #ffffff`.
  - Item Top Row:
    - Monogram Avatar: `38px x 38px`, `border-radius: 10px` (Netflix `N`, Spotify green, Adobe red).
    - Title: `Netflix Subcription` / `Spotify Premium` / `Adobe Creative Cloud` (`font-size: 13px`, `font-weight: 600`, `color: #0f172a`).
    - Date Subtitle: `June 28, 2026` (`font-size: 11px`, `font-weight: 500`, `color: #64748b`).
    - Chevron: `>` (`stroke: #94a3b8`, `width: 14px`).
  - Item Bottom Row:
    - Amount: `$15.99`, `$9.99`, `$52.99` (`font-size: 15px`, `font-weight: 600`, `color: #0f172a`, `tabular-nums`).
    - Status Pill: `Scheduled` (`background: #f1f5f9`, `color: #475569`, `border: 1px solid #e2e8f0`, `border-radius: 9999px`, `padding: 4px 10px`, `font-size: 11px`).
- **Full-Width Action Button**:
  - Position: Pinned to the bottom of the card.
  - Dimensions: `width: 100%`, `height: 42px`.
  - Styling: `border: 1px solid #cbd5e1`, `border-radius: 10px`, `background: #ffffff`, `color: #0f172a`, `font-size: 13px`, `font-weight: 600`, `cursor: pointer`.
  - Hover: `background: #f8fafc`, `border-color: #94a3b8`.
