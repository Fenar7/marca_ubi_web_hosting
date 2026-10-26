# Architectural Design Audit & Redesign Specification: Client 360° Workspace
**Document Reference**: `docs/sales_funnel/redesign/client_360_workspace_light_redesign_spec.md`  
**Date**: October 20, 2026  
**Author**: Staff CRM UI/UX Designer & Token Architect  
**Design Direction**: Accordion Executive Advisory × Sypher Minimalist Light SaaS Architecture  
**Dial Settings**: `ENERGY 2 / RHYTHM 2 / MOTION 1`  
**Applicable Routes**: `/admin/leads/[id]` (Inbound Lead 360°) & `/admin/deals/[id]` (Pipeline Deal 360°)

---

## 1. Executive Summary & Root Cause Analysis

### Visual Clash Diagnostics (`Screenshot 2026-10-20 172203.png`)
Visual inspection of `Screenshot 2026-10-20 172203.png` reveals a severe aesthetic discontinuity between the CRM Workspace Shell and the internal Client 360° Workspace:

1. **The CRM Shell Environment**:
   - Foundation canvas: `#f7f8fa` (soft anti-glare grey foundation).
   - Sidebar navigation: Crisp pure white (`#ffffff`) background, 1px `#e2e5ea` hairline border, deep charcoal `#1f242f` active capsule pill (`Inbound Leads`), signature lemon yellow (`#eefb87`) `+ NEW LEAD` button with `#1f242f` border.
   - Top Utility Header: Apple HIG-inspired frosted glass ribbon (`#ffffff` fill, `#e2e5ea` border), omni-search bar with `#1f242f` text, lemon yellow `+ NEW LEAD` CTA, white outline `+ ADD MEMBER` pill, and breadcrumb path (`MARCA UBI CRM / Inbound Leads / cc578611 07ac 46dc a50e a5db38e8667f`).

2. **The Injected Workspace Window**:
   - Pitch black obsidian canvas (`#050505`).
   - Dark cards (`#0e0e11`) with dark specular borders (`rgba(255, 255, 255, 0.08)`).
   - High-glow orange CTAs: `⚡ Convert to Deal` with gradient `#ff6100` to `#e05500` and diffuse orange glow shadow (`box-shadow: 0 10px 24px rgba(255, 97, 0, 0.35)`).
   - Blatant breadcrumb duplication: The header bar renders a second breadcrumb ribbon (`← BACK TO LEADS / MARCA UBI CRM / INBOUND LEADS / LD-10343 [copy icon]`) directly below the shell's top breadcrumb bar.
   - Dark interactive wells: The Rapid Touchpoint Composer has pitch-black inputs and orange accent borders.

### Root Cause
During the full-page workspace migration, the author mistakenly consumed the **Public Agency Obsidian Design System** from `DESIGN.md` (`#050505` canvas, `#0e0e11` cards, `#ff6100` glowing orange brand accents) instead of honoring the **CRM Enterprise Design Tokens** defined in `src/app/admin/styles/tokens.scss` ("Accordion Executive Advisory × Sypher Minimalist Light SaaS Architecture").

---

## 2. Design System Matrix & Token Translation Map

All Client 360° components must strictly consume the design tokens defined in `src/app/admin/styles/tokens.scss`:

| Design Dimension | Erroneous Obsidian Value | Approved Accordion / Sypher Light Token | CSS Custom Property Reference |
| :--- | :--- | :--- | :--- |
| **Workspace Canvas** | `#050505` | `#f7f8fa` (anti-glare neutral light canvas) | `var(--admin-canvas-bg, #f7f8fa)` |
| **Elevated Card Surfaces** | `#0e0e11` / `#141418` | `#ffffff` (crisp elevated card) | `var(--admin-card-bg, #ffffff)` |
| **Subdued Well Surfaces** | `#1c1c22` / `rgba(255,255,255,0.03)` | `#f0f2f5` / `#f8fafc` | `var(--admin-surface-muted, #f0f2f5)` |
| **Standard Card Outlines** | `rgba(255, 255, 255, 0.08)` | `1px solid #e2e5ea` (hairline divider) | `var(--admin-border-default, #e2e5ea)` |
| **Internal Subtle Dividers**| `rgba(255, 255, 255, 0.04)` | `1px solid #eef0f3` | `var(--admin-border-subtle, #eef0f3)` |
| **High-Contrast Border** | `1px solid #ff6100` | `1px solid #1f242f` | `var(--admin-border-strong, #1f242f)` |
| **Primary Headline Text** | `#ffffff` | `#1f242f` (Deep charcoal, 15.54:1 AAA) | `var(--admin-text-primary, #1f242f)` |
| **Secondary Field Labels** | `#9ca3af` | `#525965` (Refined executive slate, 7.1:1 AAA) | `var(--admin-text-secondary, #525965)` |
| **Muted Metadata/Timestamps**| `#8e95a0` | `#6b7280` (Fintech neutral grey, 4.72:1 AA) | `var(--admin-text-muted, #6b7280)` |
| **Primary Action Button** | `#ff6100` glowing orange gradient | `#1f242f` Dark Charcoal Pill (white text) OR `#eefb87` Electric Lemon | `@include accordionPillPrimary` / `@include accordionPillSecondary` |
| **Secondary Action Button** | Dark card outline with orange hover | White surface `#ffffff` with 1px `#e2e5ea` border | `@include accordionPillSecondary` |
| **Elevation / Box Shadows** | `0 16px 40px rgba(0, 0, 0, 0.6)` | `0 1px 3px rgba(31, 36, 47, 0.04)` | `var(--admin-shadow-subtle)` |
| **Monospace Tokens** | `#141418` with white text | `#f0f2f5` with `#1f242f` text & `#e2e5ea` border | `@include adminMonoToken` |

---

## 3. Component-by-Component Redesign Blueprint

### 3.1 Header Bar & Breadcrumb Rationalization (`DossierHeaderBar.tsx`)
**Problem**: The current header duplicates the CRM root hierarchy (`MARCA UBI CRM / INBOUND LEADS / LD-10343`), rendering directly below the shell's top breadcrumb bar. It also uses glowing orange buttons and dark dropdowns.

**Redesign Architecture**:
1. **Deduplicated Top Navigation**:
   - Remove redundant `MARCA UBI CRM / Inbound Leads /` text inside the component.
   - Left side: High-contrast back button pill: `← Back to Leads` (white `#ffffff` surface, 1px border `#e2e5ea`, hover `#f4f6f9`, text `#1f242f`, 36px height).
   - Adjacent Raycast Monospace copy chip for the reference code (`LD-10343`): background `#f0f2f5`, border `#e2e5ea`, text `#1f242f`, font-mono.
2. **Entity Heading**:
   - Font: `var(--font-admin-sans)`, size `clamp(1.5rem, 2vw, 2rem)`, weight 700, color `#1f242f`.
   - Mandatory architectural trailing period: `Morar Group 8500.`
3. **Status Selector Pill**:
   - Surface: Pure white `#ffffff`, border 1px solid `#e2e5ea`, border-radius: 9999px.
   - Text: `#1f242f`, font-size: 13px, font-weight 600.
   - Status radar dot: Semantic colors (Emerald `#10b981`, Amber `#f59e0b`, Rose `#ef4444`, Slate `#64748b`).
   - Dropdown menu: Pure white `#ffffff`, border 1px solid `#e2e5ea`, box-shadow `0 12px 32px rgba(31, 36, 47, 0.12)`, radius 12px. Options with soft hover `#f4f6f9` and active highlight `#f0f2f5`.
4. **Action Buttons Suite**:
   - `Convert to Deal`: Accordion Electric Lemon Yellow pill (`#eefb87`, 1px border `#1f242f`, text `#1f242f`, font-weight 600, 44px min-height) OR High-contrast Charcoal Pill (`#1f242f` bg, `#ffffff` text, 10px radius, hover `#333d4e`). Zero orange gradients!
   - `Edit Scope` & `Schedule Touchpoint`: Refined secondary white outline pills (bg `#ffffff`, border 1px solid `#e2e5ea`, text `#1f242f`, hover `#f4f6f9`, 44px min-height).

---

### 3.2 Commercial KPI Ribbon (`CommercialKpiRibbon.tsx`)
**Problem**: Styled with dark `#0e0e11` cards, neon orange momentum fill bars, and specular white highlight borders.

**Redesign Architecture**:
Inspired by `MinimalistStatPods.module.scss` and Logip advisory dashboards:
1. **Grid Container**: 3 equal columns (`grid-template-columns: repeat(3, 1fr)` on desktop, 1 column below 900px), gap `1.25rem`.
2. **Pod Surfaces**: Pure white `#ffffff`, 1px border `#e2e5ea`, radius 16px, shadow `0 1px 3px rgba(31, 36, 47, 0.04)`.
3. **Circular Tinted Icon Chips (44px × 44px, radius 50%)**:
   - **Pod 1: Expected Valuation**: Emerald chip (`background: #ecfdf5`, `border: 1px solid #a7f3d0`, `color: #065f46`). Value: `₹2.12 L` in deep charcoal `#1f242f` with `tabular-nums`. Subtitle: "Indian Rupee Tabular Numerals • Calculated Scope".
   - **Pod 2: Priority SLA**: Amber chip (`background: #fffbeb`, `border: 1px solid #fde68a`, `color: #92400e`). Value: `Medium Priority` with amber dot indicator. Subtitle: "6h SLA Response Target • Guaranteed".
   - **Pod 3: Win Probability & Momentum**: Slate chip (`background: #f1f5f9`, `border: 1px solid #cbd5e1`, `color: #1e293b`). Value: `70% Strong Traction`. Micro progress track: background `#eef0f3`, fill `#1f242f` (or calm emerald `#10b981`), 4px height, rounded.

---

### 3.3 Organization & Stakeholder Intelligence Card (`LeadDossierWorkspaceClient.tsx`)
**Problem**: Dark card with black background and glowing orange link icons.

**Redesign Architecture**:
1. **Container Surface**: Pure white `#ffffff`, 1px solid `#e2e5ea`, radius 16px, padding 24px, shadow `0 1px 3px rgba(31, 36, 47, 0.04)`.
2. **Card Title**: Deep charcoal `#1f242f`, 15px font-weight 600, with subtle slate icon (`color: #525965`).
3. **Key-Value Pairs**:
   - Label: 11px uppercase, letter-spacing 0.05em, font-weight 600, color `#525965`.
   - Value: 14px, font-weight 500, deep charcoal `#1f242f`, strict untruncated word break.
4. **Telephony & WhatsApp Action Coordinates**:
   - Light luxury chips: background `#f8fafc`, 1px solid `#e2e5ea`, border-radius 8px, padding 6px 12px, text `#1f242f`.
   - Hover state: background `#f0f2f5`, border `#1f242f`.
   - Phone link: RFC 3966 `tel:` protocol with subtle slate phone icon.
   - WhatsApp link: `https://wa.me/...` deep link with subtle emerald WhatsApp icon (`#059669`).
   - Domain URL: Clean external link chip `#f8fafc` with subtle link icon.

---

### 3.4 Ingestion Brief Matrix (`IngestionBriefMatrix.tsx`)
**Problem**: Uses dark `#141418` boxes with dark text and orange link highlights.

**Redesign Architecture**:
1. **Light Notion-Callout Paradigm**:
   - Background: Soft neutral anti-glare fill `#f8fafc`.
   - Border: Hairline outline `1px solid #e2e5ea` with a subtle **2px solid #1f242f** (or #525965) architectural left accent.
   - Border radius: `0 12px 12px 0`.
   - Padding: 16px 20px.
   - Paragraph text: High-contrast charcoal `#1f242f` (or `#334155`), line-height 1.62, font-size 13.5px.
2. **Questionnaire Matrix Grid**:
   - Sub-items: Pure white cards `#ffffff`, 1px solid `#e2e5ea`, radius 12px.
   - Labels: `#525965`, uppercase 11px.
   - Link chips: `#f0f2f5` pill with dark charcoal underline, hover `#e2e5ea`.

---

### 3.5 Rapid Touchpoint Studio (`RapidTouchpointComposer.tsx`)
**Problem**: Pitch black background, orange active tabs, dark select elements, orange duration active presets, and glowing orange submit button.

**Redesign Architecture**:
1. **Container**: Pure white `#ffffff`, 1px solid `#e2e5ea`, radius 16px, padding 22px, sticky top 24px in the 5fr operational column.
2. **Channel Switcher Tabs (`Call`, `WhatsApp`, `Meeting`, `Note`)**:
   - Background rail: `#f1f5f9`, border 1px solid `#e2e5ea`, radius 10px, padding 4px.
   - Inactive tabs: Transparent, text `#525965`, hover `#e2e5ea`, radius 7px.
   - Active tab: Pure white `#ffffff`, text `#1f242f`, font-weight 600, subtle shadow `0 2px 6px rgba(31, 36, 47, 0.06)`. Active icon: `#1f242f`.
3. **Form Controls**:
   - Call Outcome dropdown: Pure white `#ffffff`, border 1px solid `#e2e5ea`, radius 8px, text `#1f242f`, focus border `#1f242f` with outline-offset 2px.
   - Duration selector (single-line 5 equal columns `repeat(5, 1fr)`):
     - Inactive buttons: Background `#f8fafc`, border 1px solid `#e2e5ea`, text `#525965`, radius 8px, height 38px, tabular numerals.
     - Active button: High-contrast Dark Charcoal `#1f242f`, text `#ffffff`, font-weight 700, border `#1f242f`.
   - Discussion summary textarea: Pure white `#ffffff`, border 1px solid `#e2e5ea`, radius 8px, text `#1f242f`, placeholder `#9ca3af`, focus border `#1f242f`.
4. **Primary Submit CTA**:
   - Option A (Executive Advisory Charcoal): Background `#1f242f`, text `#ffffff`, border 1px solid `#1f242f`, radius 10px, 44px min-height, hover `#333d4e`.
   - Option B (Signature Accordion Lemon): Background `#eefb87`, text `#1f242f`, border 1px solid `#1f242f`, radius 10px, 44px min-height, hover `#e4f375`.
   - Zero orange gradient or glow!

---

### 3.6 Omnichannel Activity Ledger Timeline (`LeadDossierWorkspaceClient.tsx`)
**Problem**: Dark timeline with orange glyph dots, dark cards `#141418`, and orange tag highlights.

**Redesign Architecture**:
1. **Connector Spine**: Hairline vertical track `2px solid #e2e5ea` running continuously along the left rail.
2. **Glyph Dots**:
   - 20px circular badge, background `#ffffff`, border 1px solid `#e2e5ea`, subtle shadow `0 1px 3px rgba(31, 36, 47, 0.05)`.
   - Icons: Slate `#525965` or Charcoal `#1f242f`.
3. **Actor Avatars**:
   - 24px circular badge, background `#f0f2f5`, border 1px solid `#e2e5ea`, text `#1f242f`, font-mono 10px bold.
4. **Activity Cards**:
   - Pure white `#ffffff`, border 1px solid `#e2e5ea`, border-radius 12px, padding 14px 16px.
   - Header: Actor name `#1f242f`, event classification `#525965`, relative timestamp `#6b7280` (`tabular-nums`).
   - Body copy: Deep charcoal `#1f242f` / `#334155`, font-size 13px, line-height 1.5.
   - Tokens: `@mentions` highlighted in cobalt blue (`#2563eb`), `#tags` in executive slate (`#475569`, font-weight 600).
   - Metadata pills: Background `#f1f5f9`, border 1px solid `#e2e5ea`, text `#525965`, radius 9999px.

---

### 3.7 Responsive Layout & Mobile Dock
1. **Desktop (> 1024px)**:
   - Asymmetric 7fr : 5fr two-column operational layout.
   - Left column (7fr): Intelligence cards, Ingestion brief, Executive notes, Activity timeline.
   - Right column (5fr): Sticky Rapid Touchpoint Composer, Routing/Assignment card, Follow-up card.
2. **Tablet (768px – 1024px)**:
   - Single vertical stack, composer unpinned (`position: static`).
3. **Mobile (< 768px)**:
   - Sticky bottom action dock:
     - Surface: Light frosted glass (`background: rgba(255, 255, 255, 0.95)`, `backdrop-filter: blur(16px)`, `border-top: 1px solid #e2e5ea`, `box-shadow: 0 -4px 16px rgba(31, 36, 47, 0.08)`).
     - Action buttons: 44px touch targets. Primary CTA in high-contrast charcoal `#1f242f` (or lemon `#eefb87`), secondary actions in `#ffffff` outline.

---

## 4. Line-by-Line File Modification Scope

| File Path | Nature of Changes |
| :--- | :--- |
| `src/app/admin/components/DossierWorkspace/LeadDossierWorkspace.module.scss` | Replace all dark luxury SCSS variables (`$canvas-bg: #050505`, `$surface-card: #0e0e11`, `$brand-orange: #ff6100`) with CRM Light tokens (`var(--admin-canvas-bg)`, `var(--admin-card-bg)`, `var(--admin-border-default)`, etc.). Restyle cards, breadcrumbs, inputs, preset buttons, tabs, and action pills. |
| `src/app/admin/components/DossierWorkspace/DossierHeaderBar.tsx` | Eliminate duplicate breadcrumb path (`MARCA UBI CRM / Inbound Leads /`). Retain only the concise Back link (`← Back to Leads`) and the reference token chip (`LD-10343`). Restyle status selector dropdown and action buttons to light-mode luxury. |
| `src/app/admin/components/DossierWorkspace/CommercialKpiRibbon.tsx` | Adopt Logip-style circular tinted icon chips (emerald, amber, slate) on crisp white scorecards. Replace orange momentum bars with subtle slate/charcoal progress tracks. |
| `src/app/admin/components/DossierWorkspace/RapidTouchpointComposer.tsx` | Restyle channel switcher tabs to light track `#f1f5f9`, white active tab. Style 5-column preset buttons with light-mode active states (`#1f242f` active). Update submit button to charcoal/lemon. |
| `src/app/admin/components/DossierWorkspace/IngestionBriefMatrix.tsx` | Update Notion callout styling to light background `#f8fafc`, 1px `#e2e5ea` border, and dark left accent line. |
| `src/app/admin/components/DossierWorkspace/LeadDossierWorkspaceClient.tsx` | Replace dark deep links with light-mode coordinate pills (`#f8fafc`). Harmonize activity timeline cards, actor badges, and glyph icons to light tokens. |
| `src/app/admin/(workspace)/leads/[id]/page.module.scss` | Update denied boundary container from `#050505` to `#f7f8fa` and card from `#0e0e11` to `#ffffff`. |
| `src/app/admin/(workspace)/leads/[id]/not-found.module.scss` | Update 404 container from `#050505` to `#f7f8fa` and card from `#0e0e11` to `#ffffff`. |

---

## 5. Architectural Quality & Compliance Verification

- **Anti-AI-Slop Rules**: Zero generic blue buttons, zero drop shadows (`box-shadow: 0 1px 3px rgba(31, 36, 47, 0.04)` only), 44px minimum tap targets across all interactive buttons, strict `tabular-nums` on all currencies and metrics.
- **Accessibility & Contrast**:
  - Deep charcoal `#1f242f` on pure white `#ffffff`: **15.54:1** (WCAG AAA).
  - Executive slate `#525965` on pure white `#ffffff`: **7.1:1** (WCAG AAA).
  - Fintech grey `#6b7280` on pure white `#ffffff`: **4.72:1** (WCAG AA).
  - Signature lemon yellow `#eefb87` with charcoal `#1f242f`: **13.92:1** (WCAG AAA).
- **Execution Boundary**: In accordance with the project's strict behavioral rule (`NEVER EXECUTE WITHOUT EXPLICIT PERMISSION`), this redesign specification is presented for human audit and review. No files will be modified until explicit user authorization ("proceed" or "do it") is received.
