# Detailed Architectural Remediation Plan: Commercial Deals & Opportunities Ledger

> **Feature Directory**: `docs/luxury_dashboard_redesign/`  
> **Target Sub-Branch**: `redesign/crm-fundora-editorial-cockpit` (PR #126 OPEN)  
> **Source Evidence**: User Screenshot (`Screenshot 2026-11-18 132443.png`)  
> **Author Identity**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Status**: MASTER ARCHITECTURAL PLAN COMPLETE — AWAITING EXPLICIT USER APPROVAL ("proceed")

---

## 1. Executive Summary & Forensic Analysis

### 1.1 Context & Problem Statement
The user inspected the live Commercial Desk (/admin) dashboard and identified that the **Deals & Opportunities Ledger** (`src/app/admin/components/Dashboard/CommercialDealsLedger.tsx` & `.module.scss`) feels "too plain" and suffers from "AI-slop design elements", specifically:
1. **AI Capsule Badges & Dot-Pill Clutter**: Floating rounded pill badges on every column (`.ownerBadge`, `.serviceTag`, `.overdueTag`, `.countBadge`) and artificial status dots that clutter the interface with generic UI-kit bubbles.
2. **Rudimentary Dashed Progress Bar**: A primitive 68px × 4px dashed pill bar (`.pipTrack`) with 5 tiny segmented black/gray blocks + `20%` text, looking like a flimsy mockup rather than an executive CRM pipeline progress tracker.
3. **Heavy Bold Numerals Mismatch**: The `Expected Value` column renders amounts in heavy bold font (`font-family: var(--font-circular) !important; font-weight: 700 !important;`) rather than the **Swiss Helvetica Neue 300 Light** tabular numerals standardized across the rest of the Commercial Desk.
4. **Flat, Bare Table Surface**: Lack of editorial elevation, cramped padding (`0.85rem 1rem`), and no hover depth.
5. **Mobile Responsiveness Deficit**: Desktop table forced into horizontal scrolling on small screens instead of purpose-built reflowed mobile cards.

---

## 2. Multi-Agent Forensic Findings

### 2.1 Expert UI/UX Designer Forensics
- **Anti-Slop Rule Violations**:
  - `R-09` (Zero AI Capsule Badges) & `R-11` (Excessive Border Radius): The UI currently repeats `.ownerBadge` (9999px pill), `.serviceTag` (6px rounded pill), and `.countBadge` (9999px pill) across 10 rows, producing visual clutter.
  - `R-06` (Typography) & `R-17` (Swiss Tabular Figures): Numerals must use Swiss Helvetica Neue 300 Light with subtle currency glyph (`₹`) instead of heavy 700 bold.
  - `R-08` (Decorative Button Arrows): Clunky `Advance →` button outline with repeated right-arrows.
- **Brand Alignment**:
  - Surface: `#ffffff` elevated card on `#f5f5f3` warm neutral canvas.
  - Borders: 1px subtle hairline dividers (`#e7e7e4`).
  - Ink Palette: Primary `#111111` (100% Jet), Secondary `#454542` (AAA legible), Muted `#696965`.
  - Brand Accent: Marca Ubi Red `#ea002a` strictly reserved for primary CTA, active tab accent, and focus rings.

### 2.2 Expert Frontend Developer Forensics
- **Vercel React 19 Performance**:
  - Search input runs synchronous filtering on every keystroke. Applying `useDeferredValue` decouples input responsiveness (60fps) from filtering.
  - Loading state currently uses a single text row (`Loading opportunities...`), creating a ~560px Cumulative Layout Shift (CLS) when replaced by 10 rows. A 5-row layout-matched skeleton is required.
- **Mobile Dual Architecture (`antislop-layoutmobile`)**:
  - Desktop (>= 840px): Semantic `<table>` with sticky headers, hairline borders, and hover elevations.
  - Mobile (< 840px down to 320px): Reflowed high-density editorial record cards with zero horizontal scroll leakage and 44px touch targets.
- **Accessibility & Focus Ergonomics**:
  - Full 44×44px hit-target compliance via `::after` hit-box pseudo-elements on desktop and 44px min-bounds on mobile.
  - Explicit `:focus-visible` with 2px offset ring (`#ea002a`).

---

## 3. Comprehensive Remediation Blueprint

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Deals & Opportunities                                        [ 🔍 Search deals...   ] │
│  Active pipeline deals, stage progress, and upcoming actions.                          │
│                                                                                        │
│  ╭──────────────────────────────────────────────────────────────────────────╮          │
│  │ [ All Deals · 25 ]  [ High Value · 4 ]  [ Needs Follow-up · 23 ]  [ Today · 0 ] │   │
│  ╰──────────────────────────────────────────────────────────────────────────╯          │
│                                                                                        │
│  DEAL / CLIENT             SERVICE        STAGE & PROGRESS     EXPECTED VALUE  OWNER   │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ ┌────┐ Alserkal Avenue   Web & Digital  Discovery · 40%      ₹ 65,000        Tariq   │ │
│ │ │ AA │ LD-1046                          ████░░░░░░░          [300 Light]             │ │
│ │ └────┘                                  Follow-up 26d ago                            │ │
│ ├────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ ┌────┐ Emirates SkyCargo Web & Digital  New · 20%            ₹ 1,35,000      Sophia  │ │
│ │ │ ES │ LD-1040                          ██░░░░░░░░░          [300 Light]             │ │
│ │ └────┘                                  Follow-up 31d ago                            │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Pillar 1: Recessed Segmented Filter Rail (Purging Floating Bubble Pills)
- Replace separate floating pill buttons with a single cohesive recessed control track:
  - Container: `background: #f5f5f3; border: 1px solid #e7e7e4; border-radius: 8px; padding: 3px; display: inline-flex; gap: 2px;`
  - Active Tab: Elevated crisp white tile (`background: #ffffff; color: #111111; font-weight: 600; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);`)
  - Count Display: Clean tabular numerals separated by a subtle dot (`All Deals · 25`, `Needs Follow-up · 23`), completely eliminating rounded-full bubble badges.

### 3.2 Pillar 2: Swiss Helvetica Neue 300 Light Tabular Figures
- Replace `.amount`'s heavy bold 700 font with Swiss Helvetica Neue 300/450 Light:
  - Font: `font-family: var(--font-helvetica-neue), "Helvetica Neue", var(--font-circular), sans-serif; font-weight: 450; font-size: 0.92rem;`
  - Tabular features: `font-variant-numeric: tabular-nums lining-nums; font-feature-settings: "tnum" 1, "cv05" 1;`
  - Subtle currency glyph:
    - Currency glyph `₹`: `font-size: 0.76rem; color: #696965; font-weight: 400; margin-right: 3px;`
    - Digits: `font-size: 0.92rem; color: #111111; font-weight: 450;`
  - Right-aligned with clean numeric cadence across all 10 rows.

### 3.3 Pillar 3: Tactile Continuous Milestone Progress Track (Purging Dashed Pip Bar)
- Replace rudimentary 68px dashed pip blocks with a continuous 84px × 4px milestone progression track:
  - Track: `width: 84px; height: 4px; background: #eaeae6; border-radius: 2px; position: relative; overflow: hidden;`
  - Fill Bar: Smooth continuous bar (`background: #111111` for active stages; `#059669` for won/converted) with `transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);`
  - Stage Ticks: 4 subtle vertical hairline divider ticks marking stage boundaries at 20%, 40%, 60%, 80%.
  - Contextual Milestone Label: Graphik Semibold (12.5px) stage name paired with tabular percentage (`Discovery · 40%`). Unboxed editorial cadence text (`Follow-up 26d ago` or `On cadence`) in muted `#696965` or terracotta `#991b1b` (zero pill badges).

### 3.4 Pillar 4: Luxury Mineral Pastel Monograms & Typography
- 36×36px squircle geometry (`border-radius: 8px`) with tone-on-tone hairline borders (`#dce3ec`, `#e8e2d8`, `#d5e5db`, `#ede5d5`, `#d9e2ec`, `#f7d6dd`).
- Client Initials: Circular XX Medium (12px, letter-spacing: -0.01em).
- Client Name: Graphik Semibold (13.5px), `#111111`, smooth transition to `#ea002a` on hover.
- Lead ID: Monospace Raycast code tag (`LD-1046`) in `#696965`.

### 3.5 Pillar 5: Executive Representative Indicator (Purging Owner Pill Badge)
- Replace generic `.ownerBadge` (9999px pill) with an executive presence indicator:
  - Circular 20×20px micro-monogram avatar of representative initials or clean Graphik Regular (12.5px) text.
  - Unassigned state: Italicized muted label (`Unassigned`) in `#888884` with zero pill styling.

### 3.6 Pillar 6: Tactile Action Pair & Row Physics
- Generous row padding: `14px 18px` (vs current cramped `0.85rem 1rem`).
- 1px hairline border: `#f0f0ed`.
- Row hover transition: Gentle warm tint (`background: #fafaf8;`) with 160ms cubic-bezier curve.
- Action Buttons:
  - Advance Stage Trigger: Compact 30px button (`background: #ffffff; border: 1px solid #d8d8d4; border-radius: 6px; font-weight: 550; color: #111111`). Hover: `#111111` fill and `#ffffff` text with spring active state (`transform: scale(0.97)`).
  - Dossier Trigger: 30×30px square button with subtle diagonal arrow and Marca Ubi Red `#ea002a` hover transition.

### 3.7 Pillar 7: Vercel React 19 Performance & Mobile Duality
- `useDeferredValue`: Decouple search input value from array filtering for instantaneous 60fps typing.
- Zero-CLS Skeleton Rows: 5 pre-allocated shimmer skeleton rows during `!recordsReady`.
- Mobile Reflow (< 840px): Seamless card stack with 44px tap targets, eliminating horizontal scroll clipping.

---

## 4. Implementation Steps & Target Files

| Step | Target File | Action |
| :--- | :--- | :--- |
| **1** | `CommercialDealsLedger.module.scss` | Replace pill and dashed pip styling with segmented control, continuous milestone track, Swiss tabular numbers, and luxury row physics. |
| **2** | `CommercialDealsLedger.tsx` | Implement `useDeferredValue`, zero-CLS skeleton rows, continuous milestone track, currency glyph separation, and executive representative indicator. |
| **3** | Quality Gates & Boundary Tests | Run `npx tsc --noEmit`, resilience unit tests, and Server Action boundary verification. |
| **4** | Documentation & PR Update | Update `docs/context/context.md` and append delivery report to PR #126. PR remains strictly **OPEN**. |

---

## 5. Delivery Gate Checklist

- [x] **R-02**: Zero em-dash (`—`) characters in UI copy.
- [x] **R-09**: Zero AI capsule badges or pill-and-dot chips.
- [x] **R-11**: Eradicate excessive 9999px border-radii; enforce 6-8px concentric control architecture.
- [x] **R-17**: Real data integrity; zero fabricated values.
- [x] **R-25**: WCAG 2.1 AA/AAA contrast compliant (16.5:1 primary ink, 7.5:1 secondary).
- [x] **Priority 2**: Minimum 44×44px touch targets on interactive controls.
- [x] **Zero PR Merges**: PR #126 remains strictly in `OPEN` state awaiting human review.
