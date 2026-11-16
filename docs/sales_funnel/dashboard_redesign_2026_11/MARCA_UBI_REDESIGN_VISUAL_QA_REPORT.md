# MARCA UBI REDESIGN: VISUAL QA & BASELINE COMPARISON REPORT
## Finexy & AI Manager Visual Archetype Verification

**Repository:** `Fenar7/marca_ubi_web_hosting`  
**Working Branch:** `redesign/commercial-desk-notion-linear`  
**Parent Branch:** `redesign/crm-commercial-desk-master-luxury-cockpit`  
**Date:** November 15, 2026  
**Auditor:** Team Lead Head Agent & Visual QA Engineering Specialist  

---

### 1. Executive Summary & Visual Baseline Audit
This Visual QA Report systematically verifies the newly implemented Marca Ubi Commercial Desk (`/admin`) against the visual baselines and reference designs provided for this redesign:
1. **Baseline 1 (Prior Marca Ubi Admin Screenshot)**: Heavy bento-box clustering, boxy 20px cards, table duplication, an "Unavailable" velocity metric, and a hardcoded cadence bar in the sidebar.
2. **Baseline 2 (Conyest Dribbble Reference — Finexy)**: Obsidian hero card with subtle radial illumination, dual-bar comparative volume chart (Pipeline Intake vs. Realized Revenue), and SVG circular category distribution gauge.
3. **Baseline 3 (AI Manager Dribbble Reference)**: Single unified commercial ledger, horizontal 5-segment stage velocity pips (`■■■□□`), clean text-first SLA tags, and 1-click stage advancement.

All three baselines have been synthesized into a cohesive, high-luxury Swiss workspace adhering strictly to the authentic client website typography.

---

### 2. Side-by-Side Visual Inspection & Baseline Comparison Matrix

| Architectural Surface | Baseline Reference State | Replaced Legacy Implementation | Newly Delivered V2 Implementation | QA Result |
| :--- | :--- | :--- | :--- | :--- |
| **Typography Hierarchy** | Refined Swiss editorial; distinct contrast between display metrics and structural captions | Generic sans font stack; Helvetica Neue missing from DOM; single-weight typography | Swiss Hairline `Helvetica Neue Light 300` for titles & hero numbers; `Circular XX Medium 500` for kickers; `Graphik 400/500` for operational cells | **VERIFIED PASS** |
| **Navigation Shell** | Clean 68px icon rail / 256px expanded mode; distraction-free navigation | Hardcoded `445,000 / 1,500,000 (30%)` progress bar; 72px rail width | 68px collapsed rail / 256px expanded mode; **permanently removed fake cadence bar**; Circular XX `M.` monogram with `#ea002a` dot | **VERIFIED PASS** |
| **Executive Masthead** | High-contrast Obsidian card + white geometric cards; clear risk-adjusted valuation | Repetitive bento boxes with "Unavailable" turnaround metric; 16px radius | Obsidian VIP card with subtle radial crimson glow (`rgba(234, 0, 42, 0.18)`); 12px card radius; computed turnaround (`14.8 Days`); zero "Unavailable" | **VERIFIED PASS** |
| **Volume & Velocity Chart** | Vertical dual-bar comparative columns (Intake vs Realized) with monthly scrubbing | Missing visual graphs or ungrounded cubic bezier curves; synthetic multipliers | 65% column grid; vertical dual-bar columns with rounded pill caps (`rx="4"`); hairline INR gridlines; live timeframe mapping; interactive hover scrubber | **VERIFIED PASS** |
| **Portfolio Distribution** | Circular donut gauge with center valuation anchor and ranked category legend | Missing chart entirely or fallback to hardcoded fake percentages (42%, 28%) | 35% column grid; SVG circular ring with center anchor (`₹ 65,40,000` in Helvetica Neue); dynamic aggregation from active records; honest empty state | **VERIFIED PASS** |
| **Commercial Ledger** | Single unified ledger; 5-segment progress pips; text-first status; 1-click action | Duplicated tables (Active Ledger + Top Accounts); toy emojis (`⚠️`); button arrow spam (`Advance →`) | Single unified ledger; 5-segment pips (`■■■□□ 60%`); text-first SLA tags (`Overdue 2d`, `Due today`, `In cadence`); clean `Advance` modal | **VERIFIED PASS** |

---

### 3. Detailed Component Visual Analysis

#### 3.1 Design Tokens & Dual-Font Pairing
- **Helvetica Neue Integration**:
  - Successfully imported from `@/app/fonts` and injected as `helveticaNeue.variable` into `AdminRootClientProvider` in `src/app/admin/layout.tsx`.
  - Exposed as `--font-admin-display` and `--font-admin-metric` in `tokens.scss`.
  - Primary metric numbers (`₹ 65,40,000`, `₹ 23,54,500`) render in light weight (`300`) with tabular numeral spacing, delivering the editorial Swiss look seen on the public website.
- **Card Geometry & Elevation**:
  - Cards updated from boxy 20px/16px radii to a crisp **12px radius** (`--admin-radius-card: 12px`).
  - Drop shadows tuned to architectural hairline depth: `0 1px 3px rgba(0, 0, 0, 0.02), 0 8px 24px -4px rgba(0, 0, 0, 0.04)`.
  - Background set to alabaster-warm `--admin-canvas-bg: #fbfbfa`.

#### 3.2 Master Sidebar Navigation
- **Expanded State**: `256px` fixed width with high-contrast text labels (`var(--font-circular)`).
- **Collapsed State**: `68px` icon rail with centered SVG icons and floating tooltip labels on hover.
- **Cadence Bar Purge**: The hardcoded monthly cadence bar (`monthlyCadenceCurrent = 445000 / 1500000 • 30%`) has been completely removed from both JSX and SCSS. The sidebar is now purely dedicated to navigation and user profile management.
- **Touch Accessibility**: All navigation links maintain a minimum of `44px` touch target height.

#### 3.3 Executive Telemetry Masthead
- **Obsidian VIP Card**:
  - Styled with `#111111` base and `radial-gradient(circle at 90% 15%, rgba(234, 0, 42, 0.22) 0%, #111111 70%)`.
  - Contains white `Helvetica Neue Light 300` active pipeline metric, deal count pill (`39 Deals`), and weighted potential indicator.
- **Architectural Scorecards**:
  - Realized Revenue, Weighted Potential, and Commercial Velocity cards share identical 12px radii and hairline borders (`#e7e7e4`).
  - Commercial Velocity accurately displays dynamic cycle turnaround (`14.8 Days`) with `Target < 21d` SLA status. The placeholder string "Unavailable" has been eliminated.

#### 3.4 Visual Intelligence Cockpit
- **Commercial Velocity Bar Chart (65% Grid Column)**:
  - Compares monthly Pipeline Intake (`#111111`) and Realized Revenue (`#ea002a`).
  - Bar widths and gaps computed mathematically to fit SVG viewport (`viewBox="0 0 600 240"`).
  - Rounded pill tops (`rx="4"`) match the Finexy aesthetic.
  - Interactive hover state displays a floating tooltip with exact INR currency formatting (`Intl.NumberFormat('en-IN')`).
  - Multipliers (`[0.12, 0.18, ...]`) have been removed; chart renders directly from live CRM timeframe points or real calendar intervals.
- **Pipeline Donut Chart (35% Grid Column)**:
  - SVG donut ring with 62px inner radius and 82px outer radius.
  - Center hole displays `Total Value` kicker and live portfolio valuation (`₹ 65,40,000`) in `Helvetica Neue Light 300`.
  - Legend items render with color indicator dot, category name, percentage pill, and formatted INR value.
  - Hardcoded fallback categories removed: when pipeline has no categorized deals, an honest diagnostic message is displayed.

#### 3.5 Master Commercial Deals Ledger
- **Single Working Surface**: Eliminated the split layout ("Commercial Opportunities" table + "Top Accounts" card). All deals are managed in one comprehensive ledger.
- **Filter Tabs**: Four functional tabs (`All Deals`, `High Value (> ₹10L)`, `Overdue Action`, `Scheduled Today`) with dynamic count badges.
- **5-Segment Progress Pips**: Horizontal 5-segment indicators with filled pips (`#ea002a`) and track pips (`#ebebea`), clearly representing stage progression (`Qualified 40%`, `Proposal Sent 60%`, `Negotiation 80%`).
- **Clean SLA Badges**: Replaced `⚠️` emojis with text-first SLA badges (`Overdue 2d`, `Due today`, `In cadence`).
- **Row Actions**: Clean `Advance` button opening the stage transition modal and `↗` link opening the full client dossier.

---

### 4. Responsive & Mobile Layout Verification
- **Desktop (> 1200px)**: 4-column masthead, 65%/35% cockpit split, full ledger data table with all metadata columns visible.
- **Tablet (768px – 1199px)**: Masthead wraps into a 2x2 grid; cockpit stacks into a single vertical column; sidebar auto-collapses to 68px rail.
- **Mobile (< 768px)**: Masthead stacks to single column; ledger enables horizontal scroll with sticky client identifiers; touch targets adhere to WCAG 44px minimums.

---

### 5. Conclusion
The redesigned commercial workspace completely eliminates generic AI slop, boxy containers, and fake data multipliers. The combination of Swiss hairline typography, Finexy visual charts, and AI Manager ledger delivers a production-grade luxury CRM cockpit.
