# Client 360° Lead & Deal Dossier Workspace: Light Luxury Redesign Plan

> **Architectural Benchmark**: Accordion Executive Advisory × Sypher Minimalist Light SaaS Architecture  
> **Aesthetic Dials**: ENERGY 2 / RHYTHM 2 / MOTION 1  
> **Scope**: Route `/admin/leads/[id]` and `/admin/deals/[id]`, Dossier Workspace components, and Shell Breadcrumb Engine  
> **Document Location**: `docs/sales_funnel/redesign/client_360_light_luxury_redesign_plan.md`  
> **Author**: Fenar7 <86710532+Fenar7@users.noreply.github.com>

---

## 1. Executive Summary & Root Cause Analysis

### 1.1 The Visual Mismatch (Screenshot `Screenshot 2026-10-20 172203.png`)
In user screenshot `Screenshot 2026-10-20 172203.png`, the newly created full-page Client 360° Lead/Deal Dossier Workspace was rendered using the **public marketing website's dark obsidian palette** (`#050505` canvas, `#0e0e11` cards, `#ff6100` glowing orange buttons and borders). 

This created a severe architectural and visual clash against the authenticated CRM workspace (`[data-admin-root="true"]`), which is strictly specified as **Accordion Executive Advisory × Sypher Minimalist Light SaaS Architecture** (`src/app/admin/styles/tokens.scss`). 

The rest of the CRM—the Executive Overview, Inbound Leads table, Pipeline Deals kanban, Team Management, and Settings—uses a clean, light anti-glare canvas (`#f7f8fa`), elevated pure white cards (`#ffffff`), high-contrast deep charcoal typography (`#1f242f`), and signature **Accordion Electric Lemon Yellow** (`#eefb87`) action CTAs.

### 1.2 The Duplicated Breadcrumb Defect
In the top shell header, `AdminBreadcrumbs.tsx` evaluates `usePathname()`. For dynamic route `/admin/leads/cc578611-07ac-4a4b-baea-4161e1b8c1f0`, segment 1 (`leads`) mapped to `Inbound Leads`, but the 36-character dynamic UUID segment had no name mapping and fell back to `segment.replace(/-/g, ' ')`, displaying an unsightly unformatted string:
```
MARCA UBI CRM / Inbound Leads / cc578611 07ac 4a4b baea 4161e1b8c1f0
```
Simultaneously, `DossierHeaderBar.tsx` hardcoded its own local breadcrumbs rail directly underneath:
```
← BACK TO LEADS / MARCA UBI CRM / INBOUND LEADS / LD-10343
```
This produced an ugly double-stacked breadcrumb artifact with confusing visual redundancy.

### 1.3 Root Cause Code Locations
1. `src/app/admin/components/DossierWorkspace/LeadDossierWorkspace.module.scss`:
   - Hardcoded `$canvas-bg: #050505;`, `$surface-card: #0e0e11;`, `$brand-orange: #ff6100;`, `$text-primary: #ffffff;`.
2. `src/app/admin/components/DossierWorkspace/CommercialKpiRibbon.tsx`:
   - Hardcoded dark status dots and hex colors (`#ff6100`, `#22c55e`, `#ef4444`).
3. `src/app/admin/components/DossierWorkspace/DossierHeaderBar.tsx`:
   - Hardcoded duplicated breadcrumb hierarchy and neon orange hover/action states.
4. `src/app/admin/(workspace)/leads/[id]/page.module.scss` and `not-found.module.scss`:
   - Hardcoded `#050505` background and `#0e0e11` cards on error/boundary states.
5. `src/app/admin/(workspace)/deals/[id]/page.module.scss` and `not-found.module.scss`:
   - Duplicate dark theme styles.
6. `src/app/admin/components/layout/AdminBreadcrumbs.tsx`:
   - Lack of UUID detection regex and dynamic lead ID token integration.

---

## 2. Design System Architecture & Token Mapping

The CRM strictly adheres to `src/app/admin/styles/tokens.scss` scoped under `[data-admin-root="true"]`. All dark obsidian rules are purged and replaced with standard CRM light tokens:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MARCA UBI ENTERPRISE CRM DESIGN TOKENS               │
├──────────────────────────┬─────────────────────────────────────────────┤
│ Foundation Canvas        │ var(--admin-canvas-bg) = #f7f8fa            │
│ Elevated Card Surface    │ var(--admin-card-bg) = #ffffff              │
│ Subdued Wells / Tabs     │ var(--admin-surface-muted) = #f0f2f5        │
│ Interactive Hover        │ var(--admin-surface-hover) = #f4f6f9        │
│ Active Selection         │ var(--admin-surface-active) = #ebeef3       │
│ Hairline Border          │ var(--admin-border-default) = #e2e5ea       │
│ Divider Subtle Border    │ var(--admin-border-subtle) = #eef0f3        │
│ High-Contrast Accent     │ var(--admin-border-strong) = #1f242f        │
│ Primary Data & Ink       │ var(--admin-text-primary) = #1f242f         │
│ Secondary Editorial Slate│ var(--admin-text-secondary) = #525965       │
│ Muted Meta & Timestamps  │ var(--admin-text-muted) = #6b7280           │
│ Signature Action CTA     │ var(--admin-accent-lemon) = #eefb87         │
│ Monospace Code Token     │ var(--font-admin-mono) on #f0f2f5           │
└──────────────────────────┴─────────────────────────────────────────────┘
```

### Complete Token Replacement Matrix

| Component Area | Current Hardcoded Dark Value | Required Accordion × Sypher Light Token | Design Rationale & Contrast |
|---|---|---|---|
| **Root Canvas** | `$canvas-bg: #050505;` | `var(--admin-canvas-bg)` (`#f7f8fa`) | Soft anti-glare foundation matching CRM shell |
| **Section Cards** | `$surface-card: #0e0e11;` | `var(--admin-card-bg)` (`#ffffff`) | Pure white elevated surfaces with 1px hairline border |
| **Card Borders** | `rgba(255, 255, 255, 0.08)` | `var(--admin-border-default)` (`#e2e5ea`) | Crisp 1px outline, zero muddy drop shadows |
| **Card Shadow** | `0 16px 36px rgba(0, 0, 0, 0.45)` | `0 1px 3px rgba(31, 36, 47, 0.04)` | Subtle Sypher micro-elevation |
| **Primary Typography** | `$text-primary: #ffffff;` | `var(--admin-text-primary)` (`#1f242f`) | **15.54:1** AAA contrast on white cards |
| **Secondary Typography**| `$text-secondary: #9ca3af;` | `var(--admin-text-secondary)` (`#525965`)| **7.1:1** AA contrast for descriptions & labels |
| **Metadata & Notes** | `$text-muted: #8e95a0;` | `var(--admin-text-muted)` (`#6b7280`) | **4.72:1** AA contrast for timestamps & tags |
| **Primary Action CTA** | `linear-gradient(#ff6100, #e05500)` | `@include accordionPillPrimary;` | Signature Electric Lemon Yellow `#eefb87`, 1px strong border, `#1f242f` text |
| **Secondary Action CTA**| `#0e0e11` + orange border | `@include accordionPillSecondary;` | Pure White `#ffffff` fill, 1px `#1f242f` border |
| **Ghost Return Pill** | `#0e0e11` back link | `@include accordionPillGhost;` | Subdued `#f0f2f5` fill, 1px `#e2e5ea` border |
| **Reference Token Chip**| `#141418` monospace chip | `@include adminMonoToken;` | Raycast Monospace micro-token chip (`#f0f2f5` fill, `#1f242f` ink) |
| **Stat Pod Icon Chips** | Dark squares with orange glow | 44px circular tinted icon chips | Emerald (`#ecfdf5`), Amber (`#fffbeb`), Slate (`#f1f5f9`) |
| **Notion Brief Callouts**| `rgba(255, 255, 255, 0.03)` | `var(--admin-surface-muted)` (`#f8fafc`)| 1px `#e2e5ea` outline with 3px solid charcoal left accent |
| **Omnichannel Tabs** | `#141418` dark segment | Subdued `#f0f2f5` pill | Segmented light tabs with pure white active tile |
| **Duration Presets** | Dark pills (`#141418`) | Single-line 5-column light buttons | Default `#ffffff` + `#e2e5ea` border; Active `#eefb87` + `#1f242f` border |
| **Form Inputs/Textareas**| `#141418` dark input | `var(--admin-card-bg)` (`#ffffff`) | Pure white well, `1px solid #e2e5ea`, `#1f242f` text |
| **Native Select Options**| `option { background: #141418; }`| `option { background: #ffffff; color: #1f242f; }` | High-contrast readable native options |
| **Mobile Action Dock** | `rgba(14, 14, 17, 0.94)` | `rgba(255, 255, 255, 0.95)` | Frosted light glass dock with top `#e2e5ea` divider |

---

## 3. Structural Wireframes & Layout Hierarchy

### 3.1 Deduplicated Navigation & Header Wireframe
```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Admin Header (AdminBreadcrumbs.tsx)                                                         │
│ MARCA UBI CRM  /  Inbound Leads  /  [ LD-10343 ]                                             │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Dossier Header Bar (DossierHeaderBar.tsx)                                                    │
│                                                                                              │
│ [ ← Back to Leads ]  │  [ LD-10343 ⧉ ]  (click to copy)                                      │
│                                                                                              │
│ ──────────────────────────────────────────────────────────────────────────────────────────── │
│                                                                                              │
│ Morar Group 8500.       [ ● Active Discovery ▾ ]       [ ⚡ Convert to Deal ]  [ Edit Scope ] │
│ (H1 Deep Charcoal #1f242f) (Pill with semantic dot)     (Accordion Lemon #eefb87) (White Pill)│
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Floating Minimalist Commercial KPI Ribbon Wireframe
```
┌───────────────────────────┬───────────────────────────┬───────────────────────────┐
│ (●) ₹35,00,000            │ (●) Standard SLA          │ (●) Strong Traction       │
│ Expected Deal Valuation   │ 6h Turnaround Benchmark   │ 70% Win Momentum Index    │
│ [Emerald 44px Icon Chip]  │ [Amber 44px Icon Chip]    │ [Slate 44px Icon Chip]    │
│ Card: White / #e2e5ea     │ Card: White / #e2e5ea     │ Card: White / #e2e5ea     │
└───────────────────────────┴───────────────────────────┴───────────────────────────┘
```

### 3.3 7:5 Asymmetric Operational Grid
```
┌───────────────────────────────────────────────────┬─────────────────────────────────────────┐
│ LEFT COLUMN (7fr) - Intelligence & Records        │ RIGHT COLUMN (5fr) - Sticky Operations  │
├───────────────────────────────────────────────────┼─────────────────────────────────────────┤
│ CARD A: Organization & Client Coordinates         │ STICKY COMPONENT 1: Rapid Touchpoint    │
│ • Full Enterprise Name (Zero truncation)          │ • Omnichannel Tabs: [Call][Email][Meet] │
│ • Primary Decision Maker                          │ • Call Outcome Select                   │
│ • Direct Phone / Email / Website                  │ • 5-Column Single-Line Duration:        │
│                                                   │   [ 5m ] [ 15m ] [ 30m ] [ 45m ] [ 60m ]│
│ CARD B: Ingestion Discovery Brief Matrix          │ • Discussion Notes Textarea             │
│ • Notion Callout: Technical Scope Narrative       │ • Quick Tag Pills: [+Qualified] [+NDA]  │
│ • Budget & Timeline Coordinates                   │ • [ Log Touchpoint ] (Charcoal CTA)     │
│ • External Assets & Figma Links                   │                                         │
│                                                   │ COMPONENT 2: Personnel & Deal Routing   │
│ CARD C: Activity Timeline & Audit Trail           │ • Designated Lead Owner Select          │
│ • Chronological Touchpoints with Author Badges    │ • Source Attribution & SLA Watch        │
└───────────────────────────────────────────────────┴─────────────────────────────────────────┘
```

---

## 4. File-by-File Implementation Plan

### 4.1 Shell Navigation: `src/app/admin/components/layout/AdminBreadcrumbs.tsx` & `.module.scss`
1. **UUID Detection**:
   Add UUID regex guard:
   ```typescript
   const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
   ```
2. **Dynamic Breadcrumb Label Listener**:
   Add event listener for custom event `admin-breadcrumb-label-update`:
   - If segment matches UUID and has an override (e.g. `LD-10343`), render the override inside `.monoSegmentChip` (`@include adminMonoToken;`).
   - If segment matches UUID with no override yet, render `Client Dossier` (graceful fallback).
3. **De-duplicate Segments**: Ensure the leaf segment displays the lead token cleanly without printing raw UUID strings.

### 4.2 Page Header: `src/app/admin/components/DossierWorkspace/DossierHeaderBar.tsx`
1. **Remove Duplicate Breadcrumb Trail**:
   Delete redundant `<span className={styles.breadcrumbItem}>MARCA UBI CRM</span>` and `<span className={styles.breadcrumbItem}>{breadcrumbSection}</span>`.
2. **Back Navigation**:
   Style `backLink` as an accessible Accordion Ghost Pill (`@include accordionPillGhost;`).
3. **Raycast Monospace Token**:
   Render `tokenChip` directly alongside the back link with high contrast and click-to-copy tooltip.
4. **Primary Actions**:
   - `btnConvertDeal`: Convert from neon orange gradient to signature Accordion Lemon Yellow (`@include accordionPillPrimary;`).
   - `btnSecondaryAction` (`Edit Scope` / `Schedule`): Convert to crisp white outline pill (`@include accordionPillSecondary;`).
5. **Status Dropdown**:
   Update dropdown menu to crisp pure white card background, subtle modal shadow (`var(--admin-shadow-modal)`), and clean dark ink.

### 4.3 Master SCSS: `src/app/admin/components/DossierWorkspace/LeadDossierWorkspace.module.scss`
1. **Import Tokens**:
   ```scss
   @use '../../styles/tokens.scss' as *;
   ```
2. **Token Variable Replacements**:
   - Canvas: `background-color: var(--admin-canvas-bg, #f7f8fa);`
   - Cards: `background: var(--admin-card-bg, #ffffff); border: 1px solid var(--admin-border-default, #e2e5ea);`
   - Text: `color: var(--admin-text-primary, #1f242f);`
   - Secondary text: `color: var(--admin-text-secondary, #525965);`
   - Dividers: `border-bottom: 1px solid var(--admin-border-subtle, #eef0f3);`
3. **Form Elements**:
   - `.composerSelect`, `.composerTextarea`: White background, hairline border, deep charcoal ink.
   - `.presetBtn`: Light button with `#eefb87` active state.
   - `.composerTabsRow`: Segmented pill container in `#f0f2f5`.
4. **Mobile Dock**:
   Frosted white glass with `#e2e5ea` top border.

### 4.4 Commercial KPIs: `src/app/admin/components/DossierWorkspace/CommercialKpiRibbon.tsx`
1. Transform 3 cards into Minimalist Stat Pods on `#ffffff` with 16px rounded corners.
2. Circular 44px icon chips:
   - Valuation Pod: Emerald chip (`#ecfdf5` fill, `#a7f3d0` border, `#065f46` icon).
   - SLA Turnaround Pod: Amber chip (`#fffbeb` fill, `#fde68a` border, `#92400e` icon).
   - Win Momentum Pod: Slate chip (`#f1f5f9` fill, `#cbd5e1` border, `#1e293b` icon).
3. Stabilize numeric figures with `font-variant-numeric: tabular-nums`.

### 4.5 Brief Matrix: `src/app/admin/components/DossierWorkspace/IngestionBriefMatrix.tsx`
1. Replace dark callout box with light Notion-callout aesthetic:
   - Fill: `var(--admin-surface-muted, #f8fafc)`
   - Border: `1px solid var(--admin-border-default, #e2e5ea)`
   - Left accent: `3px solid var(--admin-border-strong, #1f242f)`
2. Ensure technical URLs and prose render in high-contrast charcoal text with zero truncation.

### 4.6 Route Boundaries: `page.module.scss` & `not-found.module.scss`
1. Update `/admin/leads/[id]/page.module.scss` and `deals/[id]/page.module.scss`:
   - Replace `#050505` with `var(--admin-canvas-bg)`.
   - Replace `#0e0e11` with `var(--admin-card-bg)`.
   - Replace orange button with `@include accordionPillPrimary`.
2. Update `/admin/leads/[id]/not-found.module.scss` and `deals/[id]/not-found.module.scss`:
   - Replace dark 404 surfaces with clean light luxury cards.

### 4.7 Workspace Client: `LeadDossierWorkspaceClient.tsx`
1. On component mount, dispatch `admin-breadcrumb-label-update` with `{ path: window.location.pathname, label: currentLead.lead_id }`.
2. Clean up any residual inline `#6b7280` styles to use standard SCSS classes.

---

## 5. Quality Assurance, Anti-Slop & Contrast Verification

1. **Anti-AI-Slop Compliance**:
   - Zero generic blue (`#2563eb`).
   - Zero drop shadows or muddy blurs.
   - 44px minimum touch targets on all interactive buttons (Rule R-03).
   - Monospace codes for IDs and timestamps (Rule R-04).
   - Tabular numerals (`tabular-nums`) for currency and percentages (Rule R-05).
2. **WCAG Contrast Ratios**:
   - Primary text (`#1f242f`) on white card (`#ffffff`): **15.54:1** (AAA).
   - Secondary text (`#525965`) on canvas (`#f7f8fa`): **7.10:1** (AAA).
   - Lemon yellow CTA text (`#1f242f`) on lemon yellow (`#eefb87`): **13.92:1** (AAA).
3. **Automated Verification**:
   - `npx tsc --noEmit` must report 0 type errors.
   - `npm run test:unit` must pass all tests without regressions.
   - Server Action boundary audit verification.

---

## 6. Execution Safety Rules
- **DO NOT EXECUTE WITHOUT PERMISSION**: In accordance with the `STRICT BEHAVIORAL RULE: NEVER EXECUTE WITHOUT EXPLICIT PERMISSION`, this plan is presented for review. No code modifications will be executed until the user explicitly types `proceed` or `yes, do it`.
- **ZERO PR MERGES**: PR #71 and PR #72 will remain strictly OPEN.
- **GIT AUTHORSHIP**: All commits authored as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
- **NO 'FEAT' IN PR / COMMIT TITLES**: Professional titles only.
