# Marca Ubi Commercial Desk — Forensic Design Audit & Ground-Up Luxury Redesign Specification
**Surfaces Covered:** Follow-up Queue (`/admin/tasks`) & Client 360° Lead/Deal Dossier (`/admin/leads/[id]`)  
**Document Identity:** `docs/sales_funnel/followup_and_dossier_luxury_redesign/FORENSIC_DESIGN_AUDIT_AND_REDESIGN_SPEC.md`  
**Author:** Expert UI/UX Designer Agent (Commercial Desk)  
**Date:** November 20, 2026  
**Status:** Architectural Specification & Audit Complete (Awaiting User Proceed Approval)  

---

## Executive Summary & Design Read

A comprehensive forensic audit of the **Follow-up Queue** (`/admin/tasks`) and **Lead 360° Commercial Dossier** (`/admin/leads/[id]`) revealed severe visual AI-slop anti-patterns, data integrity conflicts, and usability defects that directly contradict the approved product direction in `DESIGN.md`. 

Both interfaces suffer from:
1. **Critical Currency Contradiction**: A $100k–$250k USD ingestion tier displayed directly above a ₹1,65,000 INR valuation (~$1,976 USD), representing a **50x to 100x disconnect** that degrades credibility.
2. **Production Leaks of AI Meta-Narration**: Verbatim internal instructions like `"Indian Rupee Tabular Numerals"` printed as visible card captions.
3. **Severe Repetitive Timeline Slop**: 7 identical cards reading `"SS System Staff • system event • Automated system update"` dominating the history ledger without parsing underlying delta payloads.
4. **Blinding Accent Saturation**: 50 screaming flat-red `#ea002a` `"Complete"` buttons repeated on every table row, alongside an all-caps `"⚡ CONVERT TO DEAL"` button in the header bar.
5. **Rule-Violating Decorative Stripes**: 3px left inset red border stripes on task cards (an explicit violation of `antislop-ui` R-31).
6. **Rigid Bento Layout Fractures**: Broken 3-column grid for 4 queue tabs, forced trailing periods on all headings (`"Sobha Realty Luxury."`), and mismatched column heights creating dead space.

This document establishes the **full ground-up architectural blueprint and editorial luxury redesign** for both surfaces, aligning them 1:1 with the approved Marca Ubi Commercial Desk design language (**Circular XX, Graphik, #ffffff canvas, #f5f5f3 quiet surfaces, #111111 ink, purposeful #ea002a accents, and zero generic slop**).

---

## Part 1: Forensic Visual & UX Audit (Every Defect Cataloged)

### 1.1 Surface 1: Follow-Up Queue (`/admin/tasks`)

| Component / File | Specific Code Line / Visual Tell | Violation Rule | Root Cause & Real-World Impact |
| :--- | :--- | :--- | :--- |
| **Urgent Row Treatment**<br>`tasks.module.scss` | Line 175:<br>`.taskItemUrgent { box-shadow: inset 3px 0 0 var(--queue-red); }` | **antislop-ui R-31**<br>(Colored Left Stripe) | Inset 3px red stripe on every overdue row. Pure decorative AI-slop shorthand that cheapens the interface and provides no meaningful urgency stratification. |
| **Row Action Buttons**<br>`TaskCard.tsx` & `tasks.module.scss` | Lines 133 & 200:<br>`<button className={styles.completeButton}>Complete</button>`<br>Solid `#ea002a` background. | **antislop-ui R-29, R-01**<br>(Excessive Accent Color) | When 50 items load, there are 50 identical solid red buttons down the viewport. Blinds the user, induces decision fatigue, and violates the core commandment: *Red is reserved for primary actions, active markers, and urgent states*. |
| **Queue Tab Bar Grid**<br>`tasks.module.scss` | Line 116:<br>`grid-template-columns: repeat(3, minmax(0, 1fr));` | **Layout Math Collision**<br>(RHYTHM failure) | There are 4 queues (`overdue`, `today`, `upcoming`, `unassigned`), but CSS specifies `repeat(3, ...)`. The 4th item wraps awkwardly or breaks boundary alignments. |
| **Table Head / Card Hybrid**<br>`tasks.module.scss` | Lines 150-165:<br>`grid-template-columns: minmax(240px, 2.1fr) minmax(100px, .8fr) minmax(140px, 1.1fr) minmax(150px, 1fr) minmax(168px, 1fr);` | **Rigid Data Columns**<br>(antislop-ui App rules) | Excessive horizontal white space between stage and owner; rigid column fractions clip phone/email contact links and cause awkward wrapping at intermediate viewports (1024px–1280px). |
| **Zero Urgency Stratification**<br>`TaskCard.tsx` | All overdue rows are grouped under a single red banner with identical styling. | **Operational Blindness** | A deal overdue by 2 hours looks identical to a deal overdue by 35 days. No calculation of elapsed hours, no visual tiers for high-margin deals vs. routine touches. |
| **Single-Row Completion Friction**<br>`TaskCard.tsx` | Lines 71-88: Single transition on individual button. | **Workflow Inefficiency** | Commercial agents triaging 37 overdue follow-ups must click and wait for individual row mutations. No bulk triage or inline rescheduling capability. |

---

### 1.2 Surface 2: Client 360° Dossier (`/admin/leads/[id]`)

| Component / File | Specific Code Line / Visual Tell | Violation Rule | Root Cause & Real-World Impact |
| :--- | :--- | :--- | :--- |
| **Expected Valuation Pod**<br>`CommercialKpiRibbon.tsx` | Line 130-146:<br>Pill: `"$100k-$250k"`<br>Primary: `"₹1,65,000"`<br>Icon: `$` vector glyph | **Severe Currency Contradiction & Data Mismatch** | Seed payload had USD string (`"$100k-$250k"`), while database had INR integer (`165000`). `formatBudgetTierLabel` failed to convert USD values. Result: A $100k–$250k badge sits over ₹1.65 Lakh ($1,976), creating a **50x–100x credibility gap**. |
| **Leaked AI Meta-Narration**<br>`CommercialKpiRibbon.tsx` | Line 149:<br>`<span>Indian Rupee Tabular Numerals</span>` | **antislop R-16**<br>(Zero AI Workflow Meta-Narration) | The developer's internal instruction or LLM scaffolding prompt was copy-pasted directly into the card footer, destroying executive polish. |
| **Redundant "Calculated Scope"**<br>`CommercialKpiRibbon.tsx` | Lines 131 & 150:<br>Repeated `"Calculated Scope"` on both top badge and bottom meta line. | **Generic Copy Slop** | Empty fallback placeholder echoed multiple times in the same card pod. |
| **Repetitive Filler Activity Ledger**<br>`LeadDossierWorkspaceClient.tsx` & DB Triggers | 7 identical cards:<br>`"SS System Staff • system event"`<br>`"Automated system update"` | **antislop-ui R-18, R-38**<br>(Filler Activity Feed) | Migration `20261015000002` logs `change_desc := 'Automated system update'` whenever `current_actor IS NULL`. The client component never parses `metadata.changes` JSON, rendering 7 blank, identical cards that look like broken dummy data. |
| **Forced Trailing Periods**<br>`DossierHeaderBar.tsx` & `LeadDossierWorkspaceClient.tsx` | Lines 107 in HeaderBar & lines 149, 468, 586, 623, 729, 789:<br>`"Sobha Realty Luxury."`, `"Executive Deal Notes."`, etc. | **Superficial Stylistic Gimmick** | Hardcoding trailing `.` on every single heading and company title is a pseudo-editorial gimmick that looks unnatural and rigid. |
| **Loud Header Action Button**<br>`DossierHeaderBar.tsx` | Line 220-230:<br>`<button className={styles.btnConvertDeal}><svg>⚡</svg><span>Convert to Deal</span></button>` | **antislop-ui R-02, R-04**<br>(Loud Flat Neon / Toy Emoji) | Solid bright red background with lightning bolt glyph overpowers the clean masthead, clashing with the secondary action buttons. |
| **Asymmetric 7:5 Column Disconnect**<br>`LeadDossierWorkspace.module.scss` | Grid: `minmax(0, 7fr) minmax(360px, 5fr)` | **Broken Bento Geometry** | Left cards (Org Intelligence, Ingestion Brief, Notes, Activity) and right cards (Composer, Personnel, Follow-Up) have unequal heights, producing jagged vertical gaps and awkward scroll tracking. |
| **Composer Duration Alert Styling**<br>`RapidTouchpointComposer.tsx` | Lines 50-56 & SCSS: Selected `15m` preset button is filled with solid `#ea002a`. | **antislop-ui R-29** | Selecting a call duration looks like activating an emergency stop button. Destroys the calm operational feeling. |

---

## Part 2: Brand-New Architectural Redesign Blueprint

The redesign completely replaces both surfaces with custom-crafted, editorial luxury architectures built on **Circular XX, Graphik, paper-white cards, warm-neutral `#f5f5f3` canvas, and razor-sharp typographic hierarchy**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ SURFACE 1: EXECUTIVE FOLLOW-UP & TRIAGE COMMAND COCKPIT (/admin/tasks)                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Telemetry Masthead : 4 Balanced Queues + SLA Countdown + At-Risk Pipeline Value    │
│ 2. Command Triage Bar : Real-time Search + Owner Filter + Priority Filter + Quick-Sort│
│ 3. Luxury Triage Matrix: Fluid Editorial Rows + Semantic Urgency Tags + Action Dock    │
│ 4. Batch Triage Drawer: Multi-select reschedule / reassign for high-volume days       │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ SURFACE 2: CLIENT 360° LUXURY INTELLIGENCE DOSSIER (/admin/leads/[id])                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Unified Masthead   : Breadcrumb Rail + Account Entity + Pipeline Stage Stepper      │
│ 2. Harmonized Valuation: Reconciled Currency + True SLA Clock + Deal Momentum Index    │
│ 3. Asymmetric Split   : Left: Verified Coordinates + Living History (Parsed Deltas)   │
│                         Right: Tactile Touchpoint Composer + Ownership & Follow-up HUD│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.1 Surface 1: The Executive Follow-Up & Triage Command Cockpit

#### Layout Architecture
1. **Hero Workload Telemetry Header**:
   - **4-Segment Harmonized Queue Nav**:
     - `Overdue` (Red tag with total overdue count, e.g. `37`, plus total overdue pipeline value `₹61,85,000`).
     - `Due Today` (Amber tag with count and today's commitments).
     - `Upcoming` (Neutral slate tag with next 7 days pipeline volume).
     - `Unassigned` (Indigo tag with orphaned leads needing immediate sales dispatch).
   - **Operational Telemetry Ribbon**:
     - *Total Active Queue Volume*: 39 leads requiring action.
     - *At-Risk Pipeline Exposure*: ₹61,85,000 in delayed touchpoints.
     - *Average Response Dwell*: 2.8 days overdue.
2. **Command Triage & Filter Toolbar**:
   - Real-time client name / company search input.
   - Filter dropdowns:
     - Assignee (`All Owners`, or specific commercial staff).
     - Priority (`High`, `Medium`, `Low`).
     - Service Category (`Web & Digital`, `Branding`, `Mobile Apps`, `Full-Suite Advisory`).
   - Sort selector: `Urgency (Most Overdue First)`, `Value (Highest First)`, `Newest Addition`.
3. **The Dynamic Urgency Matrix (The Work Surface)**:
   - **Zero Inset Red Stripes!** Replace with sophisticated typographic urgency status:
     - Extreme Overdue (> 7 days): Subtle tinted chip `#fff0f2`, text `#90001e` (`Overdue by 18d`).
     - Standard Overdue (< 48 hrs): Tinted chip `#fff5e4`, text `#704300` (`Overdue by 14h`).
     - Today: Calm neutral chip `#f0f9ff`, text `#0369a1` (`Due at 2:30 PM UTC`).
   - **Account & Decision Maker Block**:
     - Company Name in bold Circular XX (e.g. `Sobha Realty Luxury`).
     - Decision Maker (`Sara Al-Rostamani`) and Service Vertical badge with curated colors (`Web & Digital`).
   - **Stage & Ownership**:
     - Active stage badge with subtle border (e.g. `Qualified Scope` in purple `#7c3aed`).
     - Owner with high-contrast circular avatar (`SS Sophia Sterling`) or 1-click `Assign Representative`.
   - **Expected Valuation**:
     - Full Indian Rupee tabular formatting: `₹1,65,000`.
     - Subdued secondary reference when applicable: `(Scope Tier: ₹1L - ₹2.5L)`.
   - **Contextual Action Dock**:
     - Direct communications: 1-click Phone `tel:`, WhatsApp deep link `wa.me`, Email `mailto:`.
     - `Open Dossier` secondary button.
     - `Complete Follow-up` button: Elegant ghost/outline button with smooth hover state (`#111111` border on hover), NOT blinding solid red!
     - 1-click `Reschedule` trigger opening the precision scheduler.

---

### 2.2 Surface 2: The Client 360° Luxury Intelligence Dossier

#### Layout Architecture
1. **Unified Executive Masthead**:
   - Breadcrumb context: `Commercial Desk / Inbound Leads / LD-1013`.
   - Clean entity title: `Sobha Realty Luxury` (No trailing period!).
   - Monospace Copy Token: `LD-1013` with subtle 1-click clipboard confirmation tooltip.
   - **Interactive Pipeline Stage Stepper**:
     - Replaces isolated dropdown pill with a sleek horizontal journey stepper:
       `New Ingestion` → `Contacted` → `Qualified` (Active) → `Proposal Sent` → `Negotiation` → `Closed Won`.
     - Clicking an advanced stage opens the guarded `StageTransitionModal` with audit tracking.
   - **Primary Action Cluster**:
     - `Convert to Deal`: Refined brand primary button meeting WCAG standards (dark charcoal base `#111111` with crisp white ink or deliberate `#ea002a` hairline border, active tactile spring `scale(0.98)`).
     - `Edit Scope` & `Schedule Touchpoint` secondary actions.
2. **Harmonized Financial & SLA Intelligence Ribbon**:
   - **Pod 1: Contract Valuation & Budget Harmonization**:
     - Main Metric: `₹1,65,000` (`font-variant-numeric: tabular-nums`, Circular XX 28px).
     - Indicated Range Badge: Reconciled into INR: `Indicated Budget: ₹83.5L – ₹2.08Cr ($100k-$250k)`.
     - Scope Status: `Initial Scoping Quote` (Replacing leaked `"Indian Rupee Tabular Numerals"`).
     - Currency Peg Reference: `Institutional Peg: 1 USD = 83.50 INR`.
   - **Pod 2: Priority & SLA Target**:
     - Semantic indicator: `High Priority` with `#ea002a` status dot.
     - SLA Target: `2h SLA Target` with live countdown (`Elapsed: 18d Overdue`).
   - **Pod 3: Win Momentum & Pipeline Velocity**:
     - Close probability: `60%` based on `Qualified` stage dynamics.
     - Multi-segment velocity bar with stage color system.
3. **2-Column Asymmetric Operational Grid (7fr : 5fr)**:
   - **Left Column (Primary Intelligence & Living History)**:
     - **Card A: Organization & Decision Maker Coordinates**:
       - Company Name, Verified Web Domain with external link glyph.
       - Decision Maker full name and executive title.
       - Telephony row: Direct dialer `tel:`, WhatsApp chat launcher, and primary email dispatch.
     - **Card B: Ingestion Brief & Project Scope**:
       - Render structured brief data without truncation.
       - Graceful handling when brief is empty: A clean, quiet, unboxed note explaining the manual intake method, rather than a jarring dashed empty box.
     - **Card C: Executive Notes**:
       - Warm-tinted callout with 2px left accent, author attribution, and last updated timestamp.
     - **Card D: Living Activity Stream (Zero AI Slop!)**:
       - **Parse `metadata.changes`** for system events! E.g.:
         - Instead of `"Automated system update"`, display:
           `"Revisit date updated to Oct 13"`, `"Expected value set to ₹1,65,000"`, `"Assigned to Sophia Sterling"`.
       - Visually group consecutive system updates into a clean, collapsible audit trail (`+ 5 system updates on Oct 16`).
       - Feature distinct icons for Calls, WhatsApp, Meetings, and Strategic Notes.
   - **Right Column (Contextual Action Dock & Governance)**:
     - **Component 1: Tactile Rapid Touchpoint Composer**:
       - Channels: `Call`, `WhatsApp`, `Meeting`, `Note`.
       - Duration presets: `5m`, `15m`, `30m`, `45m`, `60m` with calm neutral selected styling (`#111111` dark surface or subtle border, NOT bright red!).
       - 1-click submit with optimistic update to the living activity feed.
     - **Component 2: Commercial Personnel & Deal Routing**:
       - Assignee selector with real-time update.
       - Service category badge and lead source attribution.
     - **Component 3: Follow-Up Commitment HUD**:
       - Next scheduled touchpoint with high-contrast countdown clock.
       - 1-click `Reschedule` button triggering the modal.

---

## Part 3: Design Tokens & Visual Specs

| Token Category | Value | Usage Guideline |
| :--- | :--- | :--- |
| **Canvas Background** | `#f5f5f3` | Quiet warm neutral canvas across all workspace views. |
| **Primary Card Surface**| `#ffffff` | Pure white background with 1px hairline border (`#e5e5e3`). |
| **Quiet Card Surface**  | `#efefed` | Secondary grouping surfaces, callouts, and disabled controls. |
| **Primary Ink**         | `#111111` | Headings, primary values, active navigation items. |
| **Secondary Ink**       | `#454542` | Field labels, metadata lines (guaranteed >= 5.5:1 contrast). |
| **Muted Ink**           | `#6e6e6a` | Timestamps, tertiary breadcrumbs (guaranteed >= 4.5:1 contrast). |
| **Brand Accent**        | `#ea002a` | Reserved for primary CTA highlights, active indicators, and critical SLA breaches. |
| **Accent Hover**        | `#c40023` | Active button hover transition. |
| **Focus Ring**          | `#9c001e` | 2px solid offset outline for keyboard accessibility. |
| **Typography - Primary**| `Circular XX` | Page titles (28–36px), entity headings (24–28px), metric values (26–32px). |
| **Typography - Text**   | `Graphik` | Navigation, table cells, form controls, working body copy. |
| **Typography - Numbers**| `tabular-nums` | All monetary amounts, dates, percentages, and counters. |
| **Corner Radii**        | 6px / 8px / 12px | Controls = 6–8px; Cards/Containers = 10–12px; zero nested pill collisions. |

---

## Part 4: Implementation Phasing Plan (Upon Explicit User Approval)

- **Phase 1: Database & Currency Reconciliation Engine**:
  - Update `currency.ts` to parse and reconcile dual-currency inputs (USD strings and INR integers).
  - Update trigger audit formatting or provide client-side JSONB delta parser to extract human-readable change logs from `metadata.changes`.
- **Phase 2: Follow-Up Queue Re-Engineering (`/admin/tasks`)**:
  - Rebuild `page.tsx`, `TaskCard.tsx`, and `tasks.module.scss`.
  - Implement 4-Queue balanced telemetry header, urgency tags, search/filter controls, and elegant outline action buttons.
- **Phase 3: Lead 360° Dossier Luxury Redesign (`/admin/leads/[id]`)**:
  - Rebuild `LeadDossierWorkspaceClient.tsx`, `CommercialKpiRibbon.tsx`, `DossierHeaderBar.tsx`, and `RapidTouchpointComposer.tsx`.
  - Harmonize financial valuation pods, remove meta-narration copy, eliminate trailing periods, and implement the living activity stream with delta decoding.
- **Phase 4: Responsive, Accessibility & Delivery Gate Verification**:
  - Verify WCAG AA contrast (4.5:1 text, 3:1 components).
  - Verify 44px tap targets on mobile action dock and touch controls.
  - Zero TypeScript errors (`tsc --noEmit`), zero unit test regressions.

---
*Report filed by Expert UI/UX Designer Agent. Standing by for user instruction.*
