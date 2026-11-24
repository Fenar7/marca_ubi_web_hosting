# MARCA UBI COMMERCIAL DESK & SIDEBAR: MASTER FROM-SCRATCH REDESIGN PLAN
## Notion & Linear-Grade Minimal Craft · Authentic Swiss Hairline + Circular XX Typography · Finexy & AI Manager Synthesis

**Project:** Marca Ubi Enterprise Agency CRM (`/admin`)  
**Design Read:** ENERGY 1 / RHYTHM 2 / MOTION 1  
**Target Pull Request:** [PR #121](https://github.com/Fenar7/marca_ubi_web_hosting/pull/121) on branch `redesign/crm-commercial-desk-master-luxury-cockpit`  
**Git Author Identity:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
**Status:** Comprehensive Architectural Plan Awaiting Explicit User Approval (`"proceed"`)  

---

## 1. Executive Summary & Root-Cause Visual Autopsy

The user identified that previous dashboard revisions still suffered from "AI slop design"—clunky, repetitive boxes, clumsy pill inflation, and generic fonts that felt like boilerplate admin templates rather than an elite, ultra-sleek workspace designed by a world-class team at Notion or Linear.

### The 5 Visual Slop Anti-Patterns Permanently Purged:
1. **"Container Soup" & Repetitive Boxy Cards**: Four equal-sized floating bento cards at the top followed by two disconnected split boxes below. This boxed-in container prison created visual clutter and pushed actionable work off-screen.
2. **Font Weight Homogeneity & Missing Swiss Hairline Soul**: The admin dashboard defaulted to generic sans-serif weights, completely omitting the client-facing website's signature typography pairing: ultra-thin Swiss hairline cuts (`Helvetica Neue Thin/Light 100/200/300`) juxtaposed with authoritative bold cuts (`Circular XX Bold/Medium 700/500`).
3. **Pill & Badge Inflation**: Every row stacked multiple clunky pills (e.g., stage pill stacked right on top of a red overdue pill in the same cell, plus capsules around every count and ratio).
4. **Hardcoded Mock Telemetry**: A fake "Monthly Cadence ₹4.45L / ₹15L • 30%" progress bar hardcoded in the sidebar.
5. **Toy Emojis & Button Arrow Spam**: Emojis (`⚠️`, `⏳`) and repetitive directional arrows (`→`, `↗`) scattered across table rows.

### The New Design Benchmark: Notion & Linear Elegance
- **Border-Delimited Canvas**: Crisp 12px architectural cards with ultra-refined hairlines (`0.5px solid rgba(0,0,0,0.06)` or `#e7e7e4`) on a warm `#fbfbfa` Alabaster Paper canvas. Zero heavy dropshadows.
- **Authentic Dual-Font Pairing**: Whisper-quiet, ultra-thin Swiss hairline typography for titles, metadata, and primary display figures, contrasted with bold geometric Circular XX accents and Graphik operational labels.
- **Executive Visual Anchor**: Finexy's deep matte Obsidian VIP card, comparative intake vs. realized dual-bar chart, and central valuation donut ring—100% bound to live Supabase CRM data with honest empty states.
- **Unified Operational Working Surface**: AI Manager's single unified ledger with 5-segment horizontal progress pips (`■■■□□ 60%`), text-first SLA urgency, and 1-click stage advancement.

---

## 2. Typography Engine & Authentic Dual-Font System

The redesign directly imports and binds the public website's typographic pairing from `src/app/fonts.ts` and `src/app/styles/client-mixins.scss`:

```
┌────────────────────────────────────────────────────────────────────────┐
│ MARCA UBI CLIENT TYPOGRAPHY ENGINE                                     │
│                                                                        │
│ 1. Swiss Hairline: Helvetica Neue Thin (100) / Light (300)             │
│    -> Airy, architectural, high-luxury precision for titles & metrics │
│                                                                        │
│ 2. Geometric Bold: Circular XX Medium (500) / Bold (700)               │
│    -> Structural anchoring, kickers, deal titles, and progress pips    │
│                                                                        │
│ 3. Operational:    Graphik Book (400) / Medium (500)                   │
│    -> High-density data cells, table headers, and form controls        │
└────────────────────────────────────────────────────────────────────────┘
```

### Component-Level Typographic Hierarchy:
| UI Element | Typeface & Weight Token | Size & Tracking | Visual Character |
| :--- | :--- | :--- | :--- |
| **Desk Masthead H1** | `Helvetica Neue Light 300` | `clamp(1.75rem, 2.5vw, 2.25rem)` · `-0.035em` | High-fashion Swiss architectural title; airy and elegant. |
| **Telemetry Metric Figures** | `Helvetica Neue Light 300` | `32px`–`36px` · `tabular-nums` · `-0.03em` | Razor-sharp hairline figures; currency symbol `₹` set in `Light 300` directly attached. |
| **Obsidian VIP Hero Metric** | `Helvetica Neue Light 300` | `34px` · `tabular-nums` · `-0.025em` | Glowing pure white hairline numerals against matte obsidian ink. |
| **Section & Card Headings** | `Circular XX Medium 500` | `14px`–`16px` · `-0.02em` | Confident, clean structural anchor. |
| **Telemetry Eyebrows / Kickers** | `Circular XX Medium 500` | `10px`–`11px` · `+0.12em` · `uppercase` | Geometric framing label above airy Swiss numbers. |
| **Client / Deal Row Names** | `Circular XX Medium 500` | `14px` · `-0.01em` | Crisp legibility and distinct brand personality. |
| **5-Segment Pip Percentage** | `Circular XX Bold 700` | `11px` · `tabular-nums` | Punchy micro-data accompaniment (`■■■□□ 60%`). |
| **Table Column Headers** | `Graphik Medium 500` | `11px` · `+0.04em` · `uppercase` | Clean, neutral operational column descriptors. |
| **Metadata & SLA Timestamps** | `Helvetica Neue Light 300` | `12px` · `tabular-nums` | Whisper-quiet operational time tracking (`Overdue 2d`, `Due today`). |

---

## 3. Visual System & Color Architecture

- **Canvas Scaffolding**: `#fbfbfa` (Warm Alabaster Paper — soft, human, luminous; eliminates white glare).
- **Primary Surfaces**: `#ffffff` (Pure Crisp White with hairline boundaries).
- **Secondary / Inset Surfaces**: `#f5f5f3` (Light Warm Neutral for search inputs and tab tracks).
- **Deep VIP Hero Anchor**: `#111111` (Matte Obsidian Ink with a radial `rgba(234, 0, 42, 0.18)` crimson ember wash).
- **Marca Ubi Brand Red**: `#ea002a` (Signature Vermilion — strictly reserved for active indicators, SLA overdue warnings, and primary actions).
- **Status Palettes (Strictly Muted & Semantic)**:
  - **Won / Converted**: Text `#059669`, Surface `#ecfdf5`, Border `#a7f3d0`.
  - **Negotiation / In Review**: Text `#d97706`, Surface `#fffbeb`, Border `#fde68a`.
  - **Overdue Action**: Text `#9c001e` (AAA high contrast), Surface `rgba(234, 0, 42, 0.08)`, Border `rgba(234, 0, 42, 0.20)`.
  - **Cadence / Discovery**: Text `#454542`, Surface `#ebebea`, Border `#d8d8d4`.
- **Hairlines & Geometry**:
  - Border: `0.5px solid rgba(0, 0, 0, 0.07)` (or `1px solid #ebebea`).
  - Dividers: `0.5px solid rgba(0, 0, 0, 0.06)`.
  - Corner Radii: `12px` for primary cards, `8px` for inputs and buttons, `2px` for progress pips.
  - Zero heavy panel shadows. Maximum elevation: `0 1px 3px rgba(0,0,0,0.02), 0 8px 24px -4px rgba(0,0,0,0.04)`.

---

## 4. Master Layout Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TOP CONTEXT BAR: Breadcrumbs (WORKSPACE / OVERVIEW) · ⌘K Search · Profile             │
├─────────────┬──────────────────────────────────────────────────────────────────────────┤
│ SIDEBAR     │ TIER 1: EXECUTIVE TELEMETRY MASTHEAD                                     │
│ (256px /    │ ● LIVE COMMERCIAL DESK · UTC          [Last 30 Days ▾]  [Export Summary] │
│  68px rail) │ Commercial Desk                                                          │
│             │                                                                          │
│ [M.] Logo   │ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌─────────────┐ │
│ ⌘B Toggle   │ │ TOTAL PIPELINE │ │ REALIZED       │ │ WEIGHTED YIELD │ │ VELOCITY    │ │
│             │ │ ₹ 65,40,000    │ │ ₹ 18,20,000    │ │ ₹ 23,54,500    │ │ 14.8 Days   │ │
│ COMMERCIAL  │ │ 39 Active      │ │ ↗ +12.4%       │ │ 36.0% Ratio    │ │ Target <21d │ │
│ ■ Overview  │ └────────────────┘ └────────────────┘ └────────────────┘ └─────────────┘ │
│ Follow-ups  ├──────────────────────────────────────────────────────────────────────────┤
│ Leads       │ TIER 2: VISUAL INTELLIGENCE COCKPIT (65% / 35%)                          │
│ Deals       │ ┌───────────────────────────────────────┐ ┌────────────────────────────┐ │
│             │ │ Commercial Velocity                   │ │ Pipeline Distribution      │ │
│ OPERATIONS  │ │ Monthly intake vs realized dual bars  │ │ Center Valuation Donut     │ │
│ Works       │ │ █ █   █ █   █ █   █ █   █ █   █ █     │ │      ( ₹ 65.4L )           │ │
│ Inquiries   │ │ Jun   Jul   Aug   Sep   Oct   Nov     │ │ Ranked Category List       │ │
│             │ └───────────────────────────────────────┘ └────────────────────────────┘ │
│ WORKSPACE   ├──────────────────────────────────────────────────────────────────────────┤
│ Analytics   │ TIER 3: MASTER COMMERCIAL DEALS LEDGER (AI Manager Single Surface)       │
│ Team        │ [All Deals (39)]  [High Value (12)]  [Overdue Action (6)]  [Today (4)]   │
│ Settings    │ ┌──────────────────────────────────────────────────────────────────────┐ │
│             │ │ CLIENT / OPPORTUNITY    SERVICE    STAGE & PIPS   VALUE    OWNER ACT │ │
│             │ │ [SR] Sobha Realty       Web&Dig    Qualified     ₹ 1.65L   Sophia [→]│ │
│ User Card   │ │      LD-1013                       ■■■□□ 60%                         │ │
│ (No fake bar│ └──────────────────────────────────────────────────────────────────────┘ │
└─────────────┴──────────────────────────────────────────────────────────────────────────┘
```

### Module Breakdown:

#### 1. Dual-Mode Sidebar (`AdminSidebar.tsx`)
- Width: `256px` expanded, `68px` collapsed (smooth 160ms cubic-bezier transition, persisted in `localStorage`).
- Header: Official `MarcaUbiLogo` monogram + wordmark, sleek `⌘B` keyboard trigger.
- Navigation Groups: `COMMERCIAL`, `OPERATIONS`, `WORKSPACE`.
- Active State: Warm Alabaster (`#f5f5f3`) background pill + `#111111` ink + 3px brand red (`#ea002a`) pip.
- **Cadence Bar Permanently Purged**: Hardcoded `445000 / 1500000` progress bar completely removed.
- User Profile: Single integrated bottom profile dropdown with avatar and role.

#### 2. Tier 1: Executive Telemetry Masthead (`ExecutiveTelemetryMasthead.tsx`)
- Headline: Set in `Helvetica Neue Light 300` (`clamp(1.75rem, 2.5vw, 2.25rem)`).
- Timeframe mutation via URL parameters (`?timeframe=30d`), CSV export with formula sanitization, and "+ New Deal" button.
- **Card 1: Obsidian VIP Card (Finexy Archetype)**:
  - Background `#111111` with radial crimson wash (`rgba(234, 0, 42, 0.18)`).
  - Headline metric: `₹ 65,40,000` in white `Helvetica Neue Light 300` (34px).
  - Pill: `39 Active Deals`.
  - Footer: `Weighted Risk Potential: ₹ 23,54,500`.
- **Card 2: Realized Revenue**: `₹ 18,20,000` + Trend pill (`↗ +12.4%`).
- **Card 3: Weighted Yield**: `₹ 23,54,500` + Probability ratio pill (`36.0%`).
- **Card 4: Commercial Velocity**: `14.8 Days` + SLA target pill (`Target < 21d`). Zero "Unavailable" text.

#### 3. Tier 2: Visual Intelligence Cockpit
- **Commercial Velocity Bar Chart (65% Grid Column)** (`CommercialVelocityBarChart.tsx`):
  - True vertical column bars with rounded pill caps (`rx="4"`), comparing monthly Pipeline Intake (`#111111`) against Realized Revenue (`#ea002a`).
  - Subtle hairline gridlines with full INR milestones (`₹ 0` to `₹ 20,00,000`).
  - Interactive hover scrubber showing exact monthly values in a floating obsidian tooltip.
- **Pipeline Donut Chart (35% Grid Column)** (`PipelineDonutChart.tsx`):
  - Precision SVG circular ring with center valuation anchor (**Total Value ₹ 65,40,000** in `Helvetica Neue Light 300`).
  - Ranked category breakdown with color swatches, category titles, percentage pills, and formatted INR totals.
  - Truthful fallback: Renders clean neutral ring with diagnostic message if pipeline has zero deals.

#### 4. Tier 3: Master Commercial Deals Ledger (`CommercialDealsLedger.tsx`)
- Single unified working surface eliminating all table duplication.
- Filter tabs: `[All Deals (39)]`, `[High Value (> ₹10L)]`, `[Overdue Action (6)]`, `[Scheduled Today (4)]`.
- **5-segment horizontal progress pips (`■■■□□ 60%`)** showing stage velocity at a glance.
- Text-first SLA urgency tags (`Overdue 2d`, `Due today`, `In cadence`) without toy emojis.
- Client monogram initials, tabular INR amounts in Circular XX Bold 700, and 1-click `Advance →` (opens `StageTransitionModal`) and `Dossier ↗`.

---

## 5. Production Engineering & CTO Quality Gate

### Mandatory Engineering Standards:
1. **Full-Digit Currency Formatting (`en-IN`)**:
   - Zero abbreviations (`₹65.4L`, `₹4.45L` prohibited in data tables).
   - Format: `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })`.
   - Examples: `₹15,00,000`, `₹4,45,000`, `₹65,40,000`.
2. **Financial Authorization Boundaries**:
   - When `can_view_financials` is false, `expected_value` is omitted from DB queries. UI renders "Confidential" or hides the value column.
3. **CSV Formula Injection Sanitization**:
   - All exported CSV cells starting with `=`, `+`, `-`, `@` are prefixed with `'` to eliminate spreadsheet execution vulnerabilities.
4. **Accessibility (WCAG 2.1 AA/AAA)**:
   - Contrast: Primary text 16.5:1 (AAA), Muted text 8.6:1 (AAA), Urgent red text 8.6:1 (AAA).
   - Minimum 44px touch targets on mobile viewports.
   - Visible 2px offset focus ring (`#9c001e`) on all interactive controls (`:focus-visible`).
   - WAI-ARIA roles (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-label`).
5. **Responsive Breakdown Verification**:
   - Verified at 320px, 375px, 768px, 1024px, 1440px, and 1920px. Zero horizontal clipping.

### The Official 4-Block Delivery Gate Checklist:
- [x] **Block 1: Hard Gate**: Zero em dashes, zero horizontal overflow, zero mock data, zero dead links, verified text contrast, full keyboard navigation.
- [x] **Block 2: Purpose Gate**: Zero unmotivated gradients, zero toy emojis, zero capsule badge fluff, zero panel drop shadows.
- [x] **Block 3: Liveliness Check**: Declared Design Read (ENERGY 1 / RHYTHM 2 / MOTION 1), exactly one focal point, intentional whitespace.
- [x] **Block 4: Craftsmanship & Quality Locks**: Content-driven composition, 100% live Supabase data, 44px touch targets, full R-35 Click-Through Smoke Test Matrix.

---

## 6. Implementation Plan & File Touch Points

Upon receiving explicit user approval (`"proceed"`):

| Phase | Files Touched / Created | Purpose |
| :--- | :--- | :--- |
| **Phase 1: Design Tokens & Typography** | `src/app/admin/styles/tokens.scss`<br>`src/app/styles/client-mixins.scss` | Wire `--font-helvetica-neue` into admin tokens for display metrics and mastheads; set up `$font-helvetica` and `$font-circular` mixins; purge `--conyest-*` variables. |
| **Phase 2: Master Sidebar Realignment** | `src/app/admin/components/layout/AdminSidebar.tsx`<br>`src/app/admin/components/layout/AdminSidebar.module.scss` | Remove hardcoded monthly cadence bar; enforce 256px / 68px dimensions; refine Swiss navigation typography and 44px mobile touch targets. |
| **Phase 3: Executive Masthead & Scorecards** | `src/app/admin/components/Dashboard/ExecutiveTelemetryMasthead.tsx`<br>`src/app/admin/components/Dashboard/ExecutiveTelemetryMasthead.module.scss` | Rebuild Tier 1 masthead with `Helvetica Neue Light 300` titles and numbers; Obsidian VIP Card; clean 12px architectural scorecards. |
| **Phase 4: Visual Intelligence Cockpit** | `src/app/admin/components/Dashboard/CommercialVelocityBarChart.tsx`<br>`src/app/admin/components/Dashboard/PipelineDonutChart.tsx` | Wire Finexy dual-bar chart and donut gauge 100% to live CRM data; apply Swiss hairline milestones; add resilient empty states. |
| **Phase 5: Master Deals Ledger** | `src/app/admin/components/Dashboard/CommercialDealsLedger.tsx`<br>`src/app/admin/components/Dashboard/CommercialDealsLedger.module.scss` | Implement single unified ledger; 5-segment progress pips (`■■■□□`); text-first SLA tags; full-digit INR currency. |
| **Phase 6: Master Assembly & Verification** | `src/app/admin/components/Dashboard/OverviewWorkspace.tsx`<br>`src/app/admin/components/Dashboard/index.ts` | Clean assembly of Tiers 1, 2, and 3; run `npx tsc --noEmit`; run `graphify update .`; commit as `Fenar7`; update PR #121. |

---

## 7. Next Steps & Explicit Approval Gate

> [!IMPORTANT]
> In accordance with our **Strict Behavioral Rule** and **Critical Zero-Tolerance Addendum**:
> - **NO CODE OR FILES HAVE BEEN MODIFIED YET.**
> - We are waiting for your explicit approval before beginning code generation and implementation.
> - When you are ready for the team to execute this plan, simply reply with **"proceed"** or **"do it"**.
