# Master Blueprint: Logip Executive Dashboard Ground-Up Architecture

> **Document ID**: `docs/sales_funnel/redesign/executive_dashboard_logip_redesign_plan.md`  
> **Reference Design**: [`original-f0a51857256dd5802cfc7a47a6f070a2.webp`](file:///C:/Users/firoz/Downloads/original-f0a51857256dd5802cfc7a47a6f070a2.webp) (Logip Modern SaaS Dashboard)  
> **Brand & Color Authority**: 100% Marca Ubi Brand Identity (`DESIGN.md` & `tokens.scss`)  
> **Primary Pill Accent**: Signature Accordion Lemon Yellow (`#eefb87`, hover `#e4f375`, ink `#1f242f`)  
> **Brand Accent**: Marca Orange (`#ff6100`)  
> **Canvas & Surfaces**: Neutral anti-glare canvas (`#f7f8fa`), Pure white card surfaces (`#ffffff`), Hairline borders (`#e2e5ea`)  
> **Typography**: `MessinaSansBook`, Tabular Numerals (`font-variant-numeric: tabular-nums`)  
> **Governing Standards**: `AGENTS.md` (Zero PR Merges by Agent, Never Use 'Feat', Fenar7 Git Identity, Explicit Permission Before Execution)

---

## 1. Core Alignment & Color Integrity

### Keeping Our Authentic Brand Palette:
- **NO color eradication**: We are **100% keeping our signature colors**!
  - **Primary CTAs & Action Pills**: Signature Accordion Lemon Yellow (`#eefb87`, hover `#e4f375`, border `1px solid #1f242f`, ink `#1f242f`, active `scale(0.98)`).
  - **Brand Brand/Accent**: Marca Orange (`#ff6100`) used for telemetry highlights, live radar dots, and chart trendlines.
  - **Surfaces**: Crisp white (`#ffffff`) floating cards on a neutral anti-glare background (`#f7f8fa`).
  - **Borders & Inks**: Hairline specular borders (`#e2e5ea`), deep charcoal headline ink (`#1f242f`), secondary slate (`#525965`).
  - **Typography**: `MessinaSansBook`, modern monospace for Lead/Deal tokens, and mandatory `tabular-nums` for all metrics.

---

## 2. Exactly WHERE Every New Widget & Graph Lives

The entire old dashboard layout (the rigid 5-card ribbon and the giant raw table) is deleted from `/admin`. In its place, we construct the **3-column Logip architecture**:

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                          MARCA UBI EXECUTIVE OVERVIEW (/admin)                                                         │
├────────────────────────────┬──────────────────────────────────────────────────────────────────────────┬───────────────────────────────────────────────┤
│ [COLUMN 1: NAV RAIL]       │ [COLUMN 2: CENTRAL EXECUTIVE WORKSPACE]                                  │ [COLUMN 3: RIGHT INTELLIGENCE RAIL]           │
├────────────────────────────┼──────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
│ ❖ MARCA UBI. (Logo)        │ ① PERSONALIZED EXECUTIVE GREETING                                        │ ⑤ USER PROFILE SPOTLIGHT                      │
│                            │   "Hello, [User Name]"                                                   │   ┌─────────────────────────────────────────┐ │
│ ⌂ Home (Executive)         │   "Track team progress and commercial deal velocity here."               │   │ [Avatar] Megan Norton / Tariq           │ │
│ ⎔ Inbound Discovery        │   [Right: Live Date Capsule • Tuesday, 20 Oct 2026 📅]                   │   │ @exec1 • Sales Executive                │ │
│ ⑂ Pipeline Deals           │                                                                          │   │ [ 📞 Call ]  [ 📹 Meet ]  [ ••• More ]  │ │
│ ⎇ Client Works             │ ② FLOATING MINIMALIST STAT PODS (Replaces old 5-card ribbon)             │   └─────────────────────────────────────────┘ │
│ ⏱ Follow-up Tasks (Due)    │   ┌────────────────────┬────────────────────┬────────────────────┐   │                                               │
│                            │   │ 🏆 Converted Rev   │ $ Active Pipeline  │ ⚡ Win Efficiency  │   │ ⑥ REAL-TIME ACTIVITY STREAM                   │
│ ── Agency Operations ──    │   │ ₹ 17.15 Cr         │ ₹ 50.12 Cr         │ 12.5%              │   │   Activity                              10:15 │
│ 👥 User Management         │   │ 1,257 Won (↑+8.4%) │ W: ₹26.86Cr (3,771)│ +0.5% vs Benchmark │   │   ┌─────────────────────────────────────────┐ │
│ ⚙ Security & Settings     │   └────────────────────┴────────────────────┴────────────────────┘   │   │ Floyd Miles                             │ │
│                            │                                                                          │   │ Commented on Stark Retainer             │ │
│ ── Bottom Capsule ──       │ ③ INTERACTIVE PERFORMANCE AREA GRAPH                                     │   │ "Sent revised scope deck to client..." │ │
│ ┌────────────────────────┐ │   Heading: "Performance"                     Filter: [ This Month ⌵ ]    │   │ [👍 2]                                  │ │
│ │ ⚡ Upgrade / Admin Hub  │ │   ┌──────────────────────────────────────────────────────────────────┐   │   ├─────────────────────────────────────────┤ │
│ │ Manage Permissions     │ │   │  ₹2.0Cr ──┐                                                      │   │   Guy Hawkins                               │ │
│ │ [ Lemon Yellow Pill ]  │ │   │           │   /──\  [03 Oct: ₹1.4Cr] (Tooltip Capsule)       │   │   Attached Proposal:                        │ │
│ └────────────────────────┘ │   │  ₹1.0Cr ──┴──/────\──────/\─────── This Month (Orange #ff6100)   │   │   [📄 Brand_Proposal_v2.pdf 13.4MB ⬇]       │ │
│                            │   │  ₹0.0Cr ────────────────────────── Last Month (Slate #94a3b8)    │   │   ├─────────────────────────────────────────┤ │
│ ⓘ Help & Docs              │   └──────────────────────────────────────────────────────────────────┘   │   │ Quick Note Composer:                    │ │
│ ↪ Sign Out                 │                                                                          │   │ [ Write a commercial note... 💬 🎙 ]    │ │
│                            │ ④ ACTIVE COMMERCIAL PIPELINE WIDGET (Logip "Current Tasks" Style)        │   │ [ POST (Lemon Yellow Pill) ]            │ │
│                            │   Heading: "Active Pipeline Deals"       Progress: [ Done 30% ] [Week ⌵] │   └─────────────────────────────────────────┘ │
│                            │   ┌──────────────────────────────────────────────────────────────────┐   │                                               │
│                            │   │ 🎨 Stark Industries • Brand Strategy      ● Negotiation   ₹45L • │   │                                               │
│                            │   │ 💻 Acme Fintech • Digital Infrastructure  ● In Review     ₹28L • │   │                                               │
│                            │   │ 🌐 Horizon AI • Web Architecture          ● Proposal Sent ₹1.2Cr•│   │                                               │
│                            │   └──────────────────────────────────────────────────────────────────┘   │                                               │
└────────────────────────────┴──────────────────────────────────────────────────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 3. Deep Dive: The 4 New Sections & Widgets

### Widget 1: Floating Minimalist Stat Pods (Top Ribbon Replacement)
- **Problem Solved**: Replaces the rigid 5-box spreadsheet card strip (`Screenshot 2026-10-20 121359.png`).
- **New Location**: Directly below the personalized greeting header.
- **Visual Architecture**:
  - A single, light, floating card container (`border-radius: 16px`, `background: #ffffff`, `box-shadow: 0 1px 3px rgba(31, 36, 47, 0.05)`).
  - Divided by clean vertical 1px hairline dividers (`#e2e5ea`).
  - 3 airy pods:
    1. **Converted Revenue Pod**: Circular mint-tinted trophy icon (`#ecfdf5`), bold tabular value (`₹ 17.15 Cr`), subtext `1,257 Closed Deals (↑ +8.4%)`.
    2. **Active Pipeline Valuation Pod**: Circular amber-tinted currency icon (`#fffbeb`), bold tabular value (`₹ 50.12 Cr`), subtext `W: ₹ 26.86 Cr weighted (3,771 active)`.
    3. **Win Efficiency Pod**: Circular slate-tinted pulse icon (`#f1f5f9`), bold percentage (`12.5%`), subtext `+0.5% above studio benchmark (12.0%)`.
  - Generous whitespace (24px padding), zero clutter, zero squished text.

---

### Widget 2: Interactive Dual-Month Performance Area Graph (`PerformanceChart.tsx`)
- **Problem Solved**: Adds the rich performance telemetry graph featured in Logip.
- **New Location**: Center of the workspace, directly below the Stat Pods.
- **Visual Architecture**:
  - Header: `Performance` (20px bold) with a clean date-range dropdown (`This Month ⌵`, `Last 30 Days`, `Quarterly`).
  - **Fluid Dual-Curve SVG Area Chart**:
    - **Curve 1 (This Month)**: Rendered in **Marca Orange (`#ff6100`)** with a subtle semi-transparent gradient glow (`rgba(255, 97, 0, 0.12)` $\rightarrow$ `rgba(255, 97, 0, 0)`).
    - **Curve 2 (Last Month)**: Rendered in **Refined Slate (`#94a3b8`)** for instant comparative velocity.
  - **Interactive Hover Capsule**: Hovering anywhere along the curve reveals an elegant dark obsidian tooltip capsule displaying the date, current month revenue, and previous month revenue (e.g. `03 Oct 2026 | This Month: ₹1.4 Cr | Last Month: ₹92L`).
  - 100% lightweight native SVG with React state (zero bulky external libraries, 0ms hydration lag).

---

### Widget 3: Active Commercial Pipeline Accounts (`CurrentDealsTable.tsx`)
- **Problem Solved**: Replaces the raw `ManagerWorkloadCard` table with Logip's sleek task-list aesthetic.
- **New Location**: Center column, directly below the Performance Area Graph.
- **Visual Architecture**:
  - Header: `Active Pipeline Deals` with a completion pill (`Won 42%`) and period filter (`This Week ⌵`).
  - List Rows:
    - **Circular Category Icon Chip**: Distinct soft-tinted icons for each service category (Branding, Web & Digital, Strategy, Campaign).
    - **Deal Identity**: Account Name (`Stark Creative Retainer`) + Service Category.
    - **Funnel Stage Dot Pill**: Dynamic status pill with colored pulse dot (`● Negotiation`, `● Proposal Sent`, `● Contract Review`).
    - **Valuation**: High-contrast tabular currency (`₹ 45,00,000`).
    - **Touchpoint Health**: SLA indicator (`🔴 Overdue 4h` or `🟢 On Track`).
    - **Context Menu Trigger**: Tactile `•••` action button for 1-click stage advancement or quick review.

---

### Widget 4: Dedicated Executive Intelligence Right Rail (`ExecutiveActivityRail.tsx`)
- **Problem Solved**: Relocates activity from the bottom of the page into an elegant, high-utility sidebar rail (matching Logip's right column).
- **New Location**: Right side of the dashboard (docked alongside the center column).
- **Visual Architecture**:
  1. **Profile Spotlight Card**:
     - User Avatar, Full Name (`Megan Norton` / `Tariq Al-Mansoor`), Role Badge (`Agency Principal` / `Sales Executive`).
     - Quick-Action Icon Buttons: Call (phone SVG), Meeting (calendar SVG), New Lead (plus SVG).
  2. **Live Activity & Interaction Feed**:
     - Chronological timeline with actor avatars, timestamps (`10:15 AM`), action badges, and comment speech bubbles.
     - Document attachment cards: e.g. `[📄 Brand_Proposal_v2.pdf • 13.4 MB ⬇]`.
     - **Live Quick-Note Composer**: An embedded input area (`"Write a note... 💬 🎙"`) with a **Signature Lemon Yellow `[ Post Note ]` button** for immediate commercial logging without opening a modal!

---

## 4. Total Button & Action Hierarchy

| Surface / Component | Action Button | Visual Style | Interaction Physics |
|---|---|---|---|
| **AdminSidebar** (Top) | `+ New Lead` | **Signature Accordion Lemon Yellow (`#eefb87`)** | 44px min-height, 1px `#1f242f` border, black text, active `scale(0.98)` |
| **AdminHeader** (Right) | `+ New Lead` | **Signature Accordion Lemon Yellow (`#eefb87`)** | 44px min-height, black text, active `scale(0.98)` |
| **AdminHeader** (Right) | `+ Add Member` | **Crisp White Outline Pill** | 44px min-height, 1px `#e2e5ea` border, dark text, active `scale(0.98)` |
| **Dashboard** (Header) | `Inbound Leads` | **Signature Accordion Lemon Yellow (`#eefb87`)** | 44px min-height, black text, active `scale(0.98)` |
| **Activity Rail** (Composer) | `Post Note` | **Signature Accordion Lemon Yellow (`#eefb87`)** | 36px height, black text, active `scale(0.98)` |
| **Modals** (Submit) | `Submit / Confirm` | **Obsidian `#0f172a`** | 44px min-height, white text, active `scale(0.98)` |

---

## 5. Implementation Roadmap (Phased Execution)

1. **Phase 7A: Layout Structure & Sidebar Header Polish**:
   - Establish the 3-column CSS Grid layout (`sidebar 260px | main 1fr | right-rail 340px`).
   - Fix sidebar logo header truncation and breathing room.
   - Standardize all action buttons to Signature Lemon Yellow (`#eefb87`) pills.
2. **Phase 7B: Delete Old 5-Card Ribbon & Build Floating Stat Pods**:
   - Remove legacy `KpiRibbon.tsx`.
   - Implement the 3 minimalist Logip stat pods (Converted Revenue, Active Pipeline, Win Velocity).
3. **Phase 7C: Native Interactive Performance Area Graph**:
   - Build `PerformanceChart.tsx` with dual-curve SVG area fill (Marca Orange `#ff6100` vs Slate `#94a3b8`).
   - Implement floating dark obsidian tooltip capsule with cursor tracking.
4. **Phase 7D: Active Pipeline Deals Table & Right Intelligence Rail**:
   - Build `CurrentDealsTable.tsx` with category icon chips, stage pills, and SLA indicators.
   - Build `ExecutiveActivityRail.tsx` with user profile spotlight, live chronological feed, and quick note composer.
5. **Phase 7E: Quality Gates & PR Delivery**:
   - Verify 0 TypeScript errors (`npx tsc --noEmit`), 100% test pass rate, and production build.
   - Open GitHub Pull Request authored strictly as `Fenar7` (strictly NO `feat`).
