# Marca Ubi CRM — Concept Redesign Master Plan (Finalized Specification)

> **Document Status:** Finalized Implementation Plan (Awaiting Explicit User Approval to Execute)  
> **Target Branch:** `fix/crm-workspace-recovery` (PR #115)  
> **Design Dial:** `ENERGY 2 / RHYTHM 3 / MOTION 1` (Marca Ubi Luxury Editorial SaaS)  
> **Target Surfaces:** Login Portal (`/admin/login`), Left Sidebar & Shell (`AdminSidebar`), Executive Commercial Desk (`/admin`)

---

## 1. Visual Autopsy: Why the Old Design is in the Trash

### The 6 Fatal Flaws of the Current Implementation
1. **Spreadsheet-Like Flatness:** The KPI grid (`ExecutiveKpiGrid`) is rendered as a single monolithic rectangle sliced into 4 columns with razor-thin hairline borders. It has zero elevation, zero card identity, and feels like an early 2000s ERP rather than a luxury SaaS commercial desk.
2. **Lifeless, Plain Text Sidebar:** The left sidebar (`AdminSidebar`) is completely devoid of visual hierarchy, tactile depth, or modern workspace mechanics. It consists of plain black text on a stark white strip with generic uppercase category headers, lacking user profile headers, workspace switchers, or refined active pill treatments.
3. **Missing Visual Rhythm & Breathing Room:** Every component is pressed against rigid 1px dividers with zero spatial variance. There are no ambient shadows, no squircle geometry, and no layered surfaces to guide the executive eye.
4. **Disconnected Top Rail:** The top header (`AdminHeader`) feels like an isolated browser bar rather than an integrated operational command HUD.
5. **Sterile Zero-State Visuals:** When conversions or events are zero, the dashboard renders an empty axis line ("0 No conversions recorded"), offering no operational guidance, historical trajectory, or executive engagement.
6. **Prototype Login Screen:** The login page (`AdminAuthShell`) is a plain, uninspired two-box split with generic inputs that lacks the prestige and security feel of an enterprise luxury agency.

---

## 2. Synthesis of the 4 Reference Archetypes

### Cross-Reference Archetype Matrix

| Reference | Core Visual Archetype | Architectural Pattern to Adopt for Marca Ubi |
| :--- | :--- | :--- |
| **Reference 0: CONYEST** | High-Polish Floating Cards & Hero Accent | • Soft ambient canvas (`#F6F6F4`) with pure white elevated floating cards (`16px-20px` radius, `0 4px 20px rgba(0,0,0,0.03)` shadow)<br>• High-contrast feature hero element (dark luxury card with brand gradient and telemetry)<br>• Rounded pill status badges with delta comparisons (`+2.84% Last month`) |
| **Reference 1: rillo** | Precision AI Queue & Operational HUD | • Refined typography, micro-labels, badge counts (yellow pill `12`, grey pill `3`, `8`)<br>• Segmented view switchers (`Compact \| Comfortable \| Spacious`, `List \| Split \| Focus`)<br>• Floating metric cards with subtle colored icon indicators<br>• Expandable decision rows with structured sub-cards and high-contrast action CTAs |
| **Reference 2: Briefly** | Workspace-Focused Productivity | • Modern sidebar with integrated search shortcut (`⌘K`), notification badges (`10`), workspace switcher<br>• Metric cards with multi-color horizontal progress segment bars<br>• Clean timeline and data tables with assignee avatars and pill status badges |
| **Reference 3: Amirul Islam** | Luxury Admin Workspace Architecture | • Left sidebar with brand logo + user switcher, pill active navigation with clean left accent indicator, structured section groupings with muted micro-headers (`STORE.CATLYNKING.COM`, `SETTINGS`)<br>• Welcoming header ("My Dashboard · Here's an overview...")<br>• 4 distinct floating KPI scorecards with trend pills<br>• 2-column operational split (New Orders table on left, Top Customer list on right)<br>• Full-width master Customers ledger below |

---

## 3. Confirmed Architecture: Surface-by-Surface Blueprints

### Surface 1: The New Luxury Login Portal (`/admin/login`)

Replaces the sterile two-box prototype with a dual-pane luxury editorial experience:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      MARCA UBI · STAFF GATEWAY                         │
├───────────────────────────────────┬────────────────────────────────────┤
│   BRAND SHOWCASE PANEL (Left 45%) │     AUTHENTICATION DESK (Right 55%)│
│                                   │                                    │
│   [ Marca Ubi. Dark Mark ]        │   [ Welcome Back Header ]          │
│                                   │   "Sign in to your agency portal"  │
│   "Commercial intelligence,       │                                    │
│    client velocity, and agency    │   [ Email Address Input ]          │
│    operations in one place."      │   with inset icon & focus sheen    │
│                                   │                                    │
│   ┌───────────────────────────┐   │   [ Corporate Password Input ]     │
│   │ TELEMETRY GLANCE CARD     │   │   with show/hide eye toggle        │
│   │ ● Agency Network Live     │   │                                    │
│   │ Active Deals: 39          │   │   [ Remember session ] [ Help? ]   │
│   │ Pipeline: ₹ 65,40,000     │   │                                    │
│   └───────────────────────────┘   │   [ SIGN IN BUTTON (Crimson) ]     │
│                                   │   with subtle specular top-rim     │
│   © 2026 Marca Ubi Enterprise     │   Protected by Supabase SSR Guard  │
└───────────────────────────────────┴────────────────────────────────────┘
```

- **Brand Showcase (Left 45%):** Deep obsidian `#0C0C0D` background, subtle crimson ambient radial glow, official Marca Ubi logo, typography statement, and floating glass telemetry glance card showing real-time CRM metrics teaser.
- **Authentication Desk (Right 55%):** Floating pure white card (`#FFFFFF`) with 16px radius, subtle border `rgba(0,0,0,0.06)`, inset icon inputs, password reveal toggle, brute-force countdown, React 19 `useActionState`, WCAG AA live error announcements.

---

### Surface 2: Left Sidebar Overhaul (`AdminSidebar`)

**Confirmed User Decision:** Horizontal Brand Header with **Marca Ubi Logo + Compact User Switcher directly beside it**.

```
┌──────────────────────────────────────────────────┐
│  [ Marca Ubi. ]         [ (Avatar) Root Admin ▾] │  <-- Confirmed Header
├──────────────────────────────────────────────────┤
│  [ 🔍 Quick Search deals, reps...        ⌘K ]    │  <-- 36px Search Trigger
├──────────────────────────────────────────────────┤
│  TODAY                                           │
│  [■] Executive Overview                          │  <-- Active Pill (Crimson Bar)
│  [⏱] Follow-up Tasks                     [ 37 ]  │  <-- Amber Status Pill (Rillo)
├──────────────────────────────────────────────────┤
│  PIPELINE                                        │
│  [📥] Inbound Leads                      [  6 ]  │
│  [⚡] Pipeline Deals                      [ 39 ]  │
├──────────────────────────────────────────────────┤
│  DELIVERY                                        │
│  [💼] Client Works                               │
├──────────────────────────────────────────────────┤
│  INSIGHT                                         │
│  [📊] Executive Analytics                        │
│  [🌐] Website Inquiries                          │
├──────────────────────────────────────────────────┤
│  WORKSPACE                                       │
│  [👥] User Management                            │
│  [⚙️] Security & Settings                        │
├──────────────────────────────────────────────────┤
│  AGENCY TELEMETRY FOOTER                         │
│  ● Database Sync: Live (Supabase SSR)            │
│  UTC: 11:10 · v2.4.0                 [ Collapse ]│
└──────────────────────────────────────────────────┘
```

- **Top Header:** Marca Ubi official logomark (`/images/marca-ubi-dark.svg`, 130px width) on the left, directly paired with a sleek user switcher avatar trigger on the right. Clicking opens [`UserProfileDropdown`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/components/layout/UserProfileDropdown.tsx) with email, role tag, and settings.
- **Collapsed Mode (72px):** Smoothly transitions to the compact monogram `M.` with user avatar stacked directly beneath.
- **Dedicated Omni-Search Trigger (`⌘K`):** 36px keyboard-driven search trigger nestled directly beneath the header.
- **Tactile Active Pill Navigation:** 3px Marca Ubi Crimson left accent bar (`#EA002A`), soft warm-neutral pill background (`#F4F4F5`), and bold text.
- **Status Counter Pills:** Rillo-inspired status-tinted badges (amber `37 Due`, emerald `6 Qualified`, slate `39 Active`).
- **Agency Telemetry Footer:** Real-time database sync badge, UTC clock, version badge, and collapse toggle (`⌘B`).

---

### Surface 3: Executive Commercial Desk Dashboard (`/admin`)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Good morning, Root Admin 👋                                           [ Last 30 Days ▾ ]
│  Today's Commercial Overview · Agency revenue intelligence & priority work  [ + New Lead ]
├────────────────────────────────────────────────────────────────────────────────────────┤
│  [ 4 INDEPENDENT FLOATING KPI SCORECARDS ]                                             │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐   │
│  │ ACTIVE PIPELINE  │ │ CLOSED REVENUE   │ │ ACTIVE DEALS     │ │ CONVERSION RATE  │   │
│  │ ₹ 65,40,000      │ │ ₹ 0              │ │ 39               │ │ 0.0%             │   │
│  │ [↑ +14.2% MoM]   │ │ 0 wins this MoM  │ │ [====|===|==]    │ │ 0 of 6 eligible  │   │
│  │ Weighted: ₹23.5L │ │ Period: Oct-Nov  │ │ 8 New · 7 Qual   │ │ Target: 15.0%    │   │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘   │
├────────────────────────────────────────┬───────────────────────────────────────────────┤
│  HIGH-PRIORITY TRIAGE QUEUE (60%)      │  PIPELINE STAGE VELOCITY (40%)                │
│  [ All 37 ] [ Overdue 12 ] [ Today 8 ] │  [ Active Pipeline: ₹ 65,40,000 · 39 Deals ]  │
│                                        │  [==========================================] │
│  ┌──────────────────────────────────┐  │  ┌──────────────────────────────────────────┐ │
│  │ [Avatar] Acme Corp Expansion     │  │  │ 01 New               8 deals  ₹10,15,000 │ │
│  │ Due Today · ₹ 4,50,000 · Contact │  │  │ 02 Contacted         7 deals  ₹ 9,10,000 │ │
│  │ [Reschedule] [Open Dossier]      │  │  │ 03 Qualified         7 deals  ₹13,70,000 │ │
│  ├──────────────────────────────────┤  │  │ 04 Proposal Sent     8 deals  ₹13,55,000 │ │
│  │ [Avatar] FinTech Global Brief    │  │  │ 05 Negotiation       7 deals  ₹15,70,000 │ │
│  │ Overdue (2d) · ₹ 12,00,000       │  │  └──────────────────────────────────────────┘ │
│  │ [Call Rep] [Review Brief]        │  │                                               │
│  └──────────────────────────────────┘  │                                               │
├────────────────────────────────────────┴───────────────────────────────────────────────┤
│  RECENT OPPORTUNITIES & ACTIVE LEDGER (Full Width)                     [ 🔍 Search deals ]│
│  ┌──────────┬─────────────────┬──────────────┬─────────────┬──────────────┬──────────┐ │
│  │ CLIENT   │ DEAL TITLE      │ STAGE        │ VALUE (₹)   │ OWNER        │ ACTIONS  │ │
│  ├──────────┼─────────────────┼──────────────┼─────────────┼──────────────┼──────────┤ │
│  │ [Avatar] │ Nexus Redesign  │ ● Qualified  │ 12,50,000   │ John Doe     │ [ ··· ]  │ │
│  │ [Avatar] │ Horizon SaaS    │ ● Proposal   │  8,20,000   │ Sarah Smith  │ [ ··· ]  │ │
│  └──────────┴─────────────────┴──────────────┴─────────────┴──────────────┴──────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Executive Masthead:**
   - Warm, personalized greeting with live operational status pill.
   - Clean dropdown date selector (`Last 30 Days ▾`, `This Quarter`, `This Year`) synchronized with URL `?timeframe=` via React 19 non-blocking transitions.
   - High-contrast Crimson "+ New Opportunity / Lead" button with tactile hover sheen.
2. **4 Individual Floating Scorecards:**
   - 16px rounded white cards with subtle border `1px solid rgba(0,0,0,0.06)` and multi-stop ambient shadow `box-shadow: 0 4px 20px -2px rgba(12, 12, 13, 0.05), 0 1px 3px rgba(12, 12, 13, 0.02)`.
   - Bold tabular numerals with full Indian grouping (`₹ 65,40,000`).
   - Trend pills (emerald `↑ +14.2% MoM` or rose `↓ -4.7%`) and micro-breakdowns (weighted values, stage distribution bar).
   - Specular lift on hover (`translateY(-2px)`).
3. **Dual Operational Core (Two-Column Asymmetric Grid):**
   - **Left Column (60%) — High-Priority Triage Queue (Rillo Archetype):**
     - Pill filter tabs (`All 37`, `Overdue 12` with rose alert tint, `Due Today 8` with amber tint, `High Value 5`).
     - Interactive task cards with client avatars, deal values, urgency indicators, and 1-click action triggers (Reschedule, Complete, Open Dossier).
   - **Right Column (40%) — Pipeline Stage Velocity (Briefly/Conyest Archetype):**
     - Visual stage progress bar with custom color palette.
     - Interactive stage rows with deal counts, aggregate value, conversion probability, and directional chevron.
4. **Master Opportunities Ledger (Full-Width Table, Amirul Archetype):**
   - High-density, beautifully styled data table.
   - Avatar stacks, Raycast token status badges (`● Qualified`), formatted tabular currencies, owner chips, and contextual action menus (`···`).

---

## 4. File-by-File Modification Scope

| File Path | Modification Summary |
| :--- | :--- |
| [`src/app/admin/styles/tokens.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/styles/tokens.scss) | Add multi-stop ambient shadows (`--admin-shadow-card`), 16px squircle geometry, floating card background tokens. |
| [`src/app/admin/styles/mixins.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/styles/mixins.scss) | Add pure Sass mixins: `@mixin floatingCard`, `@mixin trendPill`, `@mixin raycastBadge`, `@mixin specularSheen`. |
| [`src/app/admin/components/auth/AdminAuthShell.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/components/auth/AdminAuthShell.tsx) & `.module.scss` | Transform into dual-pane luxury showcase with live CRM telemetry teaser and dark glass accents. |
| [`src/app/admin/login/LoginForm.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/login/LoginForm.tsx) & `login.module.scss` | Overhaul inputs with floating labels, inset icons, smooth password reveal toggle, and tactile crimson CTA button. |
| [`src/app/admin/components/layout/AdminSidebar.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/components/layout/AdminSidebar.tsx) & `.module.scss` | Implement horizontal Marca Ubi logo + user switcher header, 36px omni-search trigger, refined pill navigation with crimson active bar, and telemetry footer. |
| [`src/app/admin/components/layout/AdminWorkspaceShell.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/components/layout/AdminWorkspaceShell.tsx) & `.module.scss` | Update canvas background to `#F6F6F4`, adjust fluid margins and padding to accommodate 260px modern sidebar. |
| [`src/app/admin/(workspace)/page.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/\(workspace\)/page.tsx) & `page.module.scss` | Restructure layout into Masthead, 4-Card Scorecards, 60/40 Asymmetric Operational Core, and Full-Width Master Ledger. |
| [`src/app/admin/components/Dashboard/ExecutiveMasthead.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/components/Dashboard/ExecutiveMasthead.tsx) & `.module.scss` | Rebuild greeting, live network pill, date range picker, and "+ New Opportunity" button. |
| [`src/app/admin/components/Dashboard/ExecutiveKpiGrid.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/components/Dashboard/ExecutiveKpiGrid.tsx) & `.module.scss` | Replace 1px border grid with 4 independent floating squircle cards featuring tabular currencies and trend badges. |
| [`src/app/admin/components/Dashboard/AttentionQueue.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/components/Dashboard/AttentionQueue.tsx) & `.module.scss` | Upgrade to Rillo-inspired triage queue with pill tabs (`All`, `Overdue`, `Today`), avatars, and 1-click actions. |
| [`src/app/admin/components/Dashboard/PipelineAllocationCard.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/components/Dashboard/PipelineAllocationCard.tsx) & `.module.scss` | Upgrade to Briefly-inspired stage velocity visualizer with colored status dots and direct filter links. |
| [`src/app/admin/components/Dashboard/CommercialDealsTable.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/components/Dashboard/CommercialDealsTable.tsx) & `.module.scss` | Upgrade to Amirul-inspired master opportunities ledger with search toolbar, avatar stacks, and Raycast token pills. |

---

## 5. Strict 5-Point Delivery Gate

Before any work is marked complete or committed, the following gates must pass with 100% compliance:
1. `npx tsc --noEmit --incremental false --pretty false`: 0 type errors.
2. Scoped ESLint across all modified files: 0 warnings, 0 errors.
3. `npm run test:unit`: 1,309 tests passing.
4. `npm run test:boundaries`: 49 Server Action boundaries passing.
5. `npm run build`: Production build with 51 static pages generated cleanly.

---

> [!IMPORTANT]
> **Strict Behavioral Invariant:** No code will be written until the user explicitly reviews this finalized plan and replies with **"proceed"** or **"do it"**.
