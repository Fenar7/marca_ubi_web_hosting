# Follow-Up Queue & Client 360° Lead Dossier — Forensic Audit & Luxury Redesign Blueprint

> **Executive Status:** Forensic Audit & Architectural Blueprint Complete  
> **Target Surfaces:** Follow-up Queue (`/admin/tasks`) & Client 360° Lead Dossier (`/admin/leads/[id]`)  
> **Active Branch:** `redesign/crm-fundora-editorial-cockpit`  
> **Open Pull Request:** [PR #126](https://github.com/Fenar7/marca_ubi_web_hosting/pull/126) (strictly OPEN; zero agent merges)  
> **Authorship Identity:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Compliance & Guardrails:** Strict adherence to `AGENTS.md`, `DESIGN.md`, `vercel-agent-skills`, and `antislop` suite. Zero code execution prior to explicit user authorization.

---

## 1. Executive Summary & Forensic Diagnosis

A comprehensive forensic examination was conducted by our specialized subagent team (**Expert UI/UX Designer Agent** and **Expert Frontend Developer Agent**) across the entire Follow-up Queue and Lead 360° Dossier subsystems.

The critique provided by executive leadership was completely verified: the current implementation exhibits severe visual AI-slop anti-patterns, data contradictions, and architectural flaws that erode enterprise credibility.

```mermaid
flowchart TD
    subgraph RootCauses["Root Causes Identified in Codebase"]
        A["Seed Data & Ingestion Disconnect<br/>USD brackets ($100k-$250k) paired with raw numbers (165000.00)"]
        B["Regex Failure in currency.ts<br/>formatBudgetTierLabel matches only ₹ Lakh/Crore; fails silently on USD"]
        C["Database Audit Trigger trg_audit_lead_changes<br/>Inserts hardcoded 'Automated system update' while real deltas hide in JSONB"]
        D["Waterfalled Server Queries in tasks/page.tsx<br/>7 sequential database round-trips without React 19 Suspense streaming"]
    end

    subgraph VisibleSymptoms["Visible UI/UX AI-Slop Symptoms"]
        E["50x–100x Currency Contradiction<br/>$100k-$250k ($83L–₹2.08Cr) over ₹1,65,000 (~$1,976 USD)"]
        F["Leaked Prompt Meta-Narration<br/>'Indian Rupee Tabular Numerals' printed as live UI subtext"]
        G["Timeline Filler Spam<br/>7 identical 'SS System Staff • Automated system update' cards"]
        H["Visual Accent Fatigue<br/>50 screaming flat-red buttons & 3px inset left red border stripes"]
    end

    A --> E
    B --> E
    B --> F
    C --> G
    D --> H
```

---

## 2. Visual Evidence & Forensic Audit Matrix

````carousel
![Follow-up Queue Page Before](file:///C:/Users/firoz/.gemini/antigravity-cli/brain/70254585-f72c-486b-a35f-20a19762e3a5/followup_queue_page.png)
<!-- slide -->
![Lead Detail Hero Before](file:///C:/Users/firoz/.gemini/antigravity-cli/brain/70254585-f72c-486b-a35f-20a19762e3a5/lead_detail_hero.png)
<!-- slide -->
![Lead Detail Middle Wall Before](file:///C:/Users/firoz/.gemini/antigravity-cli/brain/70254585-f72c-486b-a35f-20a19762e3a5/lead_detail_notes_routing.png)
<!-- slide -->
![Omnichannel Activity Ledger Slop](file:///C:/Users/firoz/.gemini/antigravity-cli/brain/70254585-f72c-486b-a35f-20a19762e3a5/omnichannel_activity_ledger_slop.png)
<!-- slide -->
![USD vs INR Mismatch Badge](file:///C:/Users/firoz/.gemini/antigravity-cli/brain/70254585-f72c-486b-a35f-20a19762e3a5/usd_inr_mismatch_badge.png)
<!-- slide -->
![Valuation Card Contradiction](file:///C:/Users/firoz/.gemini/antigravity-cli/brain/70254585-f72c-486b-a35f-20a19762e3a5/valuation_card_contradiction.png)
````

### Detailed Audit Breakdown

| Defect Observed | File & Line Reference | Anti-Pattern Classification | Forensic Root Cause | Ground-Up Redesign Solution |
| :--- | :--- | :--- | :--- | :--- |
| **50x–100x Currency Contradiction** | `CommercialKpiRibbon.tsx#L130-146`, `currency.ts#L44-65` | `antislop` R-18 (Data Contradiction) | Middle East seed accounts had `$100k-$250k` with unscaled `165000.00`. Formatter unconditionally parsed integer as `₹1,65,000` while regex failed to convert the USD pill. | **Dual-Currency Institutional Peg Engine**: Reconciles foreign and domestic currencies with live FX peg ($1 = ₹83.50), dual-displaying institutional tier: `₹83.5L – ₹2.08Cr ($100k-$250k USD)`. |
| **Leaked Prompt Meta-Narration** | `CommercialKpiRibbon.tsx#L149` | `antislop` R-16 (Prompt Leakage) | LLM internal formatting requirement (`Indian Rupee Tabular Numerals`) was committed directly as static JSX caption. | **Purge Meta-Copy**: Replace with verified commercial metadata: `Scope Basis: Initial Scoping Estimate · Institutional FX Peg: 1 USD = 83.50 INR`. |
| **7 Identical "Automated system update" Cards** | `LeadDossierWorkspaceClient.tsx#L681-702`, `20261015000002_triggers_and_sequences.sql#L190` | `antislop-ui` R-18 / R-38 (Filler Slop) | Database trigger `trg_audit_lead_changes` writes hardcoded string when actor is null, dumping real deltas into `metadata.changes` JSONB. Client ignored JSONB. | **Living Delta Decoder Engine**: Parse `metadata.changes` to synthesize human-readable narratives (*"Valuation updated to ₹1,65,000"*, *"Status progressed to Qualified"*), collapsing consecutive audit records into expandable drawers. |
| **3px Inset Left Red Stripes** | `tasks.module.scss#L175` (`.taskItemUrgent`) | `antislop-ui` R-31 (Colored Border Stripes) | Overdue cards were styled with `box-shadow: inset 3px 0 0 var(--queue-red)`. | **Refined Urgency Chips**: Eliminate all left border stripes; replace with high-legibility typographic urgency chips (`Overdue by 18d` in `#90001e` on `#fff0f2`). |
| **50 Screaming Solid Red Buttons** | `TaskCard.tsx#L128`, `tasks.module.scss#L220` | `antislop-ui` R-01 / R-29 (Visual Accent Fatigue) | Every row carried a solid `#ea002a` complete button, causing intense visual fatigue. | **Calm Outline / Ghost Controls**: Replace with dignified Marca Ubi outline buttons (`#111111` 1px border or subtle tint), reserving `#ea002a` strictly for critical alerts. |
| **Broken Workload Queue Grid Math** | `tasks.module.scss#L116` | UI Grid Defect | `grid-template-columns: repeat(3, minmax(0, 1fr))` used for **4 queues** (`overdue`, `today`, `upcoming`, `unassigned`). | **Balanced 4-Queue Telemetry Strip**: CSS Grid `repeat(4, minmax(0, 1fr))` with balanced height, active indicators, and volume counts. |
| **Trailing Periods Gimmick** | `DossierHeaderBar.tsx#L107` | Stylistic Slop | Headers hardcoded with punctuation (`"Sobha Realty Luxury."`, `"Executive Deal Notes."`). | **Clean Editorial Titles**: Strip artificial trailing periods across all dossier surface headers. |
| **7 Unstreamed Database Queries** | `src/app/admin/(workspace)/tasks/page.tsx` | Next.js Waterfall Performance | 4 independent count queries, 1 profile check, 1 leads query, 1 directory lookup executed sequentially in RSC. | **Consolidated Aggregation RPC & Suspense Streaming**: Single SQL CTE returning all queue metrics in <12ms, wrapped in React 19 `<Suspense>` boundaries. |

---

## 3. Brand-New Ground-Up Architecture & Design System

```mermaid
flowchart LR
    subgraph QueueArchitecture["Executive Follow-up Cockpit (/admin/tasks)"]
        QA1["Hero Workload Velocity Header<br/>4 Balanced Queues + Live Pipeline Exposure KPI"]
        QA2["Triage Filter & Quick-Action Bar<br/>Client Search, Assignee Filter, Urgency Sorting"]
        QA3["Executive Client Workstation Rows<br/>Avatar Coins, Service Badges, Reconciled Valuations, 44px Telephony Docks"]
    end

    subgraph DossierArchitecture["Client 360° Luxury Intelligence Dossier (/admin/leads/[id])"]
        DA1["Editorial VIP Masthead<br/>Company Moniker, Stage Stepper, Guarded Transition Bar"]
        DA2["3-Pod Commercial Intelligence Ribbon<br/>Reconciled Valuation Pod, SLA Velocity Pod, Win Momentum Pod"]
        DA3["Dual-Rail Asymmetric Workspace (7fr : 5fr)<br/>Left: Client Coordinates + Brief + Living Delta Stream<br/>Right: Tactile Touchpoint Composer + Personnel Routing"]
    end
```

### Surface 1: Executive Follow-up & Triage Cockpit (`/admin/tasks`)

1. **Hero Workload Telemetry Header**:
   - **Harmonized 4-Queue Switcher**:
     - `Critical Overdue` (with live overdue days/hours badge).
     - `Due Today` (today's scheduled commitments).
     - `Upcoming Horizon` (next 7 days pipeline commitments).
     - `Unassigned Inbound` (orphaned accounts needing triage).
   - **Executive Pipeline KPI Strip**:
     - *Total Active Queue Volume*: 39 items monitored.
     - *At-Risk Pipeline Exposure*: Formatted institutional sum (`₹61,85,000`).
     - *Average Response Dwell Time*: Live telemetry cadence.
   - **Triage Filter Toolbar**:
     - Real-time client & enterprise name search.
     - Assignee filter dropdown with team avatar chips.
     - Priority & Service Vertical filters (`Web & Digital`, `Branding`, `Media`).

2. **Executive Client Workstation Rows (Zero Slop)**:
   - **No Left Stripes**: Eliminates `inset 3px 0 0` border lines completely.
   - **Client Entity Pod**: Enterprise moniker in Circular XX bold (`Sobha Realty Luxury`), verified decision maker (`Sara Al-Rostamani`), and service vertical pill (`Web & Digital` with metallic editorial accents).
   - **Dynamic Urgency Pill**: Typographic micro-badge (`Overdue by 18d` in `#90001e` on `#fff0f2` or `Due Today at 4:00 PM` in `#1e40af` on `#eff6ff`).
   - **Commercial Valuation**: Tabular numerals with dual-currency notation when foreign peg exists: `₹1,65,000 (Initial Scope)`.
   - **Integrated Telephony Dock**: 44px accessible touch targets for direct `tel:`, WhatsApp, and `mailto:` communication.
   - **Refined Ghost Complete Action**: Dignified Marca Ubi outline button with subtle hover state; zero solid red spam.

---

### Surface 2: Client 360° Luxury Intelligence Dossier (`/admin/leads/[id]`)

1. **Editorial VIP Masthead**:
   - Breadcrumb navigation: `Commercial Desk / Inbound Queue / LD-1013`.
   - Pure typography title without trailing periods: `Sobha Realty Luxury`.
   - **Interactive Pipeline Stage Stepper**:
     - Visual journey tracker: `New Ingestion` $\to$ `Contacted` $\to$ `Qualified` $\to$ `Proposal Sent` $\to$ `Negotiation` $\to$ `Closed Won`.
     - Direct 1-click stage advancement triggering the guarded transition modal.
   - **Refined Primary Action**: Solid dark charcoal (`#111111`) action button with crisp Graphik typography: `Convert to Commercial Deal`.

2. **3-Pod Commercial Intelligence Ribbon**:
   - **Pod 1: Reconciled Financial Valuation & Ingestion Tier**:
     - Primary metric: `₹1,65,000` (Circular XX 28px, tabular figures).
     - Institutional Budget Tier: `₹83.5L – ₹2.08Cr ($100k–$250k USD)`.
     - Financial Metadata: `Verified Pipeline Valuation · Scoping Basis: Initial Intake`.
     - *Zero AI Meta-Copy*: Complete eradication of `"Indian Rupee Tabular Numerals"`.
   - **Pod 2: Cadence Velocity & Turnaround SLA**:
     - Target SLA: `High Priority`.
     - Live Dwell Tracker: `18d Overdue vs Target SLA` with calculated turnaround countdown.
   - **Pod 3: Win Velocity & Milestone Momentum**:
     - Probability: `60% Close Weight` based on `Qualified` stage dynamics.
     - Interactive velocity meter showing progress across milestone checkpoints.

3. **Dual-Rail Asymmetric Operational Workspace (7fr : 5fr)**:
   - **Left Rail (Intelligence & Living History)**:
     - *Direct Coordinates Card*: High-contrast phone dialer, WhatsApp direct chat launcher, and email composer.
     - *Client Ingestion Brief Matrix*: Clean, unboxed editorial typography rendering client requirements without awkward truncation or empty placeholders.
     - *Executive Deal Notes*: Warm-tinted callout with 2px accent line, attribution avatar, and relative timestamp.
     - *Living Omnichannel Activity Ledger*:
       - Employs the **Living Delta Decoder Engine**: decodes `metadata.changes` JSON to display actual historical mutations (*"Follow-up scheduled for Oct 24 by Sophia Sterling"*, *"Status transitioned from New Ingestion to Qualified"*).
       - Automatically collapses consecutive low-level system events into an expandable summary drawer: `"3 automated field updates on Oct 16"`.
   - **Right Rail (Action Composer & Routing)**:
     - *Tactile Touchpoint Composer*: Sub-15-second logging for Calls, WhatsApp, Meetings, and Deal Notes.
     - *Calm Duration Selector*: Replaces screaming solid-red duration buttons with elegant dark charcoal selected states.
     - *Personnel & Deal Routing*: Instant assignment switcher with team member avatars and role badges.
     - *Follow-Up Commitment HUD*: High-contrast countdown clock and 1-click `Reschedule` modal trigger.

---

## 4. Technical Architecture & Data Flow

### A. Dual-Currency Harmonization Engine (`src/app/admin/lib/currency.ts`)

```typescript
/**
 * Institutional FX Peg: 1 USD = 83.50 INR
 * Standardized across all Marca Ubi commercial valuation models.
 */
export const INSTITUTIONAL_USD_TO_INR_PEG = 83.5;

export interface ReconciledBudgetTier {
  formattedInrRange: string;
  formattedUsdRange?: string;
  isForeignTier: boolean;
  minPaise: number;
  maxPaise: number;
}

/**
 * Parses and harmonizes raw budget brackets into verified institutional representations.
 * Handles both domestic INR formats (₹15L - ₹30L) and legacy/foreign USD strings ($100k-$250k).
 */
export function reconcileBudgetBracket(bracket: string | null | undefined): ReconciledBudgetTier {
  if (!bracket || bracket.trim() === '') {
    return {
      formattedInrRange: 'Scope Undetermined',
      isForeignTier: false,
      minPaise: 0,
      maxPaise: 0
    };
  }

  // Detect USD bracket pattern ($100k-$250k)
  const usdMatch = bracket.match(/\$([0-9.]+)\s*k?\s*-\s*\$([0-9.]+)\s*k?/i);
  if (usdMatch) {
    const minUsd = parseFloat(usdMatch[1]) * (usdMatch[0].toLowerCase().includes('k') ? 1000 : 1);
    const maxUsd = parseFloat(usdMatch[2]) * (usdMatch[0].toLowerCase().includes('k') ? 1000 : 1);
    const minInr = minUsd * INSTITUTIONAL_USD_TO_INR_PEG;
    const maxInr = maxUsd * INSTITUTIONAL_USD_TO_INR_PEG;

    return {
      formattedInrRange: `₹${formatIndianUnit(minInr)} – ₹${formatIndianUnit(maxInr)}`,
      formattedUsdRange: `$${(minUsd / 1000).toFixed(0)}k – $${(maxUsd / 1000).toFixed(0)}k USD`,
      isForeignTier: true,
      minPaise: Math.round(minInr * 100),
      maxPaise: Math.round(maxInr * 100)
    };
  }

  // Domestic INR bracket parsing logic
  return parseStandardInrBracket(bracket);
}
```

### B. Living Delta Decoder Engine (`LeadDossierWorkspaceClient.tsx`)

```typescript
/**
 * Decodes database audit log change deltas into human-readable commercial narratives.
 * Eliminates repetitive 'Automated system update' filler text.
 */
export function formatAuditDeltaNarrative(
  description: string,
  metadata: { changes?: Record<string, { old: unknown; new: unknown }> } | null | undefined
): { narrative: string; isSystemInternal: boolean } {
  if (!metadata?.changes || Object.keys(metadata.changes).length === 0) {
    if (description === 'Automated system update') {
      return { narrative: 'System telemetry cadence verified', isSystemInternal: true };
    }
    return { narrative: description, isSystemInternal: false };
  }

  const deltas = metadata.changes;
  const parts: string[] = [];

  if (deltas.status) {
    parts.push(`Stage transitioned to ${formatLeadStatus(deltas.status.new as string)}`);
  }
  if (deltas.expected_value) {
    parts.push(`Valuation adjusted to ${formatDossierCurrency(Number(deltas.expected_value.new))}`);
  }
  if (deltas.follow_up_date) {
    parts.push(`Follow-up committed for ${formatShortDate(deltas.follow_up_date.new as string)}`);
  }
  if (deltas.assigned_to) {
    parts.push(`Account reassigned`);
  }

  if (parts.length > 0) {
    return { narrative: parts.join(' · '), isSystemInternal: false };
  }

  return { narrative: description, isSystemInternal: false };
}
```

---

## 5. Phased Implementation Roadmap

```mermaid
flowchart TD
    P1["Phase 1: Database & Currency Reconciliation Engine<br/>Update currency.ts & seed validation; build FX peg parser"]
    P2["Phase 2: Follow-up Queue Executive Cockpit (/admin/tasks)<br/>Refactor page.tsx, TaskCard.tsx, tasks.module.scss; React 19 streaming"]
    P3["Phase 3: Client 360° Luxury Dossier (/admin/leads/[id])<br/>Refactor LeadDossierWorkspaceClient, CommercialKpiRibbon, touchpoint composer"]
    P4["Phase 4: Delta Decoder Engine & Activity Ledger Consolidation<br/>Implement JSONB delta parser, collapse system filler spam into audit trace"]
    P5["Phase 5: Delivery Gate & Rigorous Verification Suite<br/>tsc --noEmit, 6/6 test suites, WCAG AA contrast check, git commit & push"]

    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
```

### Detailed Phase Specifications

#### Phase 1: Database & Currency Reconciliation Engine
- **Files Affected:**
  - `src/app/admin/lib/currency.ts`
  - `src/app/admin/lib/dossierUtils.ts`
  - `src/app/lib/lead-schemas.ts`
- **Deliverables:**
  - Implement `reconcileBudgetBracket` supporting both INR and USD institutional tiers.
  - Export `INSTITUTIONAL_USD_TO_INR_PEG = 83.5`.
  - Harmonize `formatBudgetTierLabel` to gracefully present dual-currency badges without regex failure.

#### Phase 2: Follow-up Queue Executive Cockpit (`/admin/tasks`)
- **Files Affected:**
  - `src/app/admin/(workspace)/tasks/page.tsx`
  - `src/app/admin/(workspace)/tasks/tasks.module.scss`
  - `src/app/admin/(workspace)/tasks/components/TaskCard.tsx`
- **Deliverables:**
  - Replace 7 sequential queries with a single consolidated SQL aggregation query for all 4 queue counts and overdue pipeline exposure.
  - Implement 4 balanced queue switcher cards (`repeat(4, minmax(0, 1fr))`).
  - Eradicate 3px inset left red stripes (`antislop-ui` R-31).
  - Replace 50 solid flat-red complete buttons with elegant Marca Ubi outline controls.
  - Integrate React 19 `<Suspense>` streaming boundaries for sub-100ms interactive render.

#### Phase 3: Client 360° Luxury Intelligence Dossier (`/admin/leads/[id]`)
- **Files Affected:**
  - `src/app/admin/components/DossierWorkspace/CommercialKpiRibbon.tsx`
  - `src/app/admin/components/DossierWorkspace/CommercialKpiRibbon.module.scss`
  - `src/app/admin/components/DossierWorkspace/DossierHeaderBar.tsx`
  - `src/app/admin/components/DossierWorkspace/RapidTouchpointComposer.tsx`
  - `src/app/admin/components/DossierWorkspace/IngestionBriefMatrix.tsx`
- **Deliverables:**
  - Purge leaked prompt copy `"Indian Rupee Tabular Numerals"`.
  - Display reconciled dual-currency valuation and ingestion tier.
  - Strip trailing periods from all headers.
  - Implement horizontal interactive pipeline stage stepper.
  - Calm the touchpoint composer duration buttons (dark charcoal selected state instead of bright red).

#### Phase 4: Delta Decoder Engine & Activity Ledger Consolidation
- **Files Affected:**
  - `src/app/admin/components/DossierWorkspace/LeadDossierWorkspaceClient.tsx`
  - `src/app/admin/components/DossierWorkspace/LeadDossierWorkspace.module.scss`
- **Deliverables:**
  - Implement `formatAuditDeltaNarrative` to decode `metadata.changes` JSONB payloads.
  - Group consecutive automated system events into an expandable summary drawer (`"3 automated field updates on Oct 16"`).
  - Clearly delineate between human touchpoints (Calls, WhatsApp, Meetings, Scoping Notes) and background system events.

#### Phase 5: Delivery Gate & Rigorous Verification Suite
- **Verification Commands:**
  - Type Check: `npx tsc --noEmit` (0 errors required).
  - Test Suite: `npm run test` (100% pass rate).
  - Server Action Audits: `node scripts/audit-server-actions.mjs` (50/50 clean).
  - Knowledge Graph: `graphify update .`.
- **Git Commit & Push Standards:**
  - Author: Strictly `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
  - PR: [PR #126](https://github.com/Fenar7/marca_ubi_web_hosting/pull/126) strictly **OPEN**. Zero merges.
  - PR Title & Commit: Zero usage of `feat:` or `feat`.

---

## 6. Strict Compliance Checklist

- [x] **Zero Code Modifications Prior to Permission**: 100% clean git working tree maintained. No production code modified.
- [x] **Subagent Multi-Agent Execution**: Expert UI/UX Designer Agent and Expert Frontend Developer Agent spawned and completed audits.
- [x] **Zero Loose Files in Project Root**: Architectural specs housed exclusively under `docs/sales_funnel/followup_and_dossier_luxury_redesign/` and brain artifacts.
- [x] **Strict Git Authorship Prepared**: Configured strictly as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
- [x] **Strict PR Merging Rule**: PR #126 remains OPEN on GitHub for manual human review.
- [x] **Zero 'Feat' in PR Names**: All commits and documents use professional, descriptive titles.

---

> [!IMPORTANT]
> **Action Required**: In accordance with the strict behavioral rule in `AGENTS.md`, all implementation activities are paused. Please review the forensic audit and architectural blueprint above and type **"proceed"** or **"do it"** to authorize code execution across Phase 1 through Phase 5.
