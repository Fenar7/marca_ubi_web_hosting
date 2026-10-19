# Sprint 7.1 Architectural Specification: Multi-Filter Action Bar, Pipeline Bucket Tabs & Suspense Skeletons

**Document ID**: `SPEC-MARCA-CRM-SPRINT-7-1`  
**Phase**: Phase 7 (Interactive Leads Workspace & High-Performance Data Grid)  
**Sprint**: Sprint 7.1  
**Base Milestone**: `sprint-7.1/filter-action-bar-and-skeletons`  
**Author**: Fenar7 <86710532+Fenar7@users.noreply.github.com>  
**Status**: Ready for Implementation  
**Design System Dials**: `ENERGY 2 / RHYTHM 2 / MOTION 1`  

---

## 1. Executive Summary & Architectural Scope

Sprint 7.1 establishes the primary filtering, search discovery, and streaming layout shell of the **Interactive Leads Workspace** (`/admin/leads`) within the Marca Ubi Enterprise CRM.

### 1.1 Business & User Experience Objectives
- **Zero-Latency In-Memory Querying**: Enable agency sales directors and account representatives to slice, search, and navigate hundreds of high-ticket commercial inquiries with sub-16ms responsiveness.
- **Deep-Link State Preservation**: Ensure all search queries, bucket tabs, and multi-dimensional filter selections seamlessly hydrate from and write to URL query parameters (`?bucket=potential&priority=High&source=...`), allowing 1-click sharing of exact commercial pipeline views.
- **Zero Cumulative Layout Shift (CLS < 0.01)**: Deliver a React 19 `<Suspense>` streaming skeleton architecture (`LeadsTableSkeleton`) whose geometry, hairline borders, and fixed 72px row rhythms perfectly mirror the live data grid.
- **Strict Anti-AI-Slop Visual Luxury**: Enforce Marca Ubi’s dark luxury visual tokens—obsidian surfaces (`#000000`, `#111111`), hairline dividers (`rgba(255, 255, 255, 0.08)`), Marca Orange (`#ff6100`) accents, Raycast Monospace token chips, and Apple HIG Vibrancy frosted popovers—with zero generic `#2563eb` blue or toy emojis.

---

## 2. Spatial Hierarchy & Stacking Architecture

The Leads Workspace coordinates five functional layers arranged in a clean vertical layout to avoid nested bento-box clutter:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│  MARCA UBI  •  ENTERPRISE CRM WORKSPACE                             👤 Fenar (Admin)             │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  [ LAYER 1: WORKSPACE HEADER & CONTEXT ]                                                        │
│  Commercial Pipeline & Staging  •  Deals & Inquiries                                             │
│                                                                                                  │
│  [ LAYER 2: EXECUTIVE KPI SUMMARY RIBBON (KpiRibbon.tsx) ]                                      │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┬────────────────┐                  │
│  │ TOTAL LEADS  │  POTENTIAL   │  CONVERTED   │  CONV. RATE  │ OVERDUE TODAY  │                  │
│  │     142      │  38 (₹48.5L) │  19 (₹32.0L) │    13.4%     │   4 LEADS ⚠️   │                  │
│  └──────────────┴──────────────┴──────────────┴──────────────┴────────────────┘                  │
│                                                                                                  │
│  [ LAYER 3: MULTI-FILTER ACTION BAR (FilterActionBar.tsx) ]                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐                  │
│  │ Tabs: [ All 142 ] [ Open 52 ] [ Potential 38 ] [ Won 19 ] [ Lost 33 ] [ ⚠️ 4 ]│                  │
│  │ Controls: [ 🔍 Search deals, company, rep... ✕ ] [ Source ▼ ] [ Rep ▼ ] [ Priority ▼ ]        │
│  │ Active Chips: [ Source: Website Form ✕ ] [ Priority: High ✕ ] [ Clear All Filters ]           │
│  └────────────────────────────────────────────────────────────────────────────┘                  │
│                                                                                                  │
│  [ LAYER 4: STREAMING DATA GRID BOUNDARY (React 19 <Suspense>) ]                                 │
│  Fallback: <LeadsTableSkeleton /> (72px fixed rows, hairline shimmers)                          │
│  Hydrated: <LeadsDataGrid /> / <LeadsWorkspaceClient />                                          │
│  ┌─────────┬──────────────────┬─────────────────┬───────────┬───────────┬──────────────┬───────┐ │
│  │ DEAL ID │ CLIENT & COMPANY │ SERVICE         │ STAGE     │ VALUATION │ ASSIGNED REP │ NEXT  │ │
│  ├─────────┼──────────────────┼─────────────────┼───────────┼───────────┼──────────────┼───────┤ │
│  │ LD-1042 │ Zayd Al-Hadi     │ Web & Digital   │ ● Negot.  │ ₹35.0L    │ (ZA) Zayd A. │ Oct 18│ │
│  └─────────┴──────────────────┴─────────────────┴───────────┴───────────┴──────────────┴───────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Stacking Index Matrix (`z-index`)
To prevent visual clipping, modal bleed, or overlapping popovers, z-index boundaries are strictly partitioned:

| Layer | Component / Element | `z-index` | Rationale |
|---|---|---|---|
| **Base Surface** | Page container, table body rows | `1` | Default rendering plane |
| **Grid Header** | Sticky table header (`th`) | `10` | Remains visible above scrolling rows |
| **Action Bar** | `FilterActionBar` container | `20` | Anchors filter bar above data grid elements |
| **Popovers** | Source, Assignee, Priority dropdowns | `40` | Floats directly above table headers and chips |
| **Drawer Backdrops**| Client 360 Dossier scrim | `50` | Dims all background elements |
| **Slide Drawers** | Client 360 Dossier drawer | `60` | Slides over entire workspace |
| **Modals** | Stage transition confirmation modals | `70` | Highest user interaction layer |
| **System Toasts** | Toast notifications & alerts | `100` | Always top-most notification plane |

---

## 3. Component Contract 1: `FilterActionBar`

`FilterActionBar` is an autonomous Client Component (`'use client'`) that manages pipeline state filters, debounced text search, popover dropdowns, active filter pill chips, and shallow URL synchronization.

### 3.1 Pipeline Bucket Navigation Tabs
The bucket tab bar renders 6 segmented buttons reflecting the commercial stages and urgent follow-up queues:

1. **All Deals** (`'all'`): Aggregates total accessible inquiries.
2. **Open** (`'open'`): Deals in early intake stages (`New`, `Contacted`, `On Hold`).
3. **Potential** (`'potential'`): Qualified deals undergoing scoping or active negotiation (`Qualified`, `Proposal Sent`, `Negotiation`).
4. **Won** (`'converted'`): Successfully closed engagements (`Converted`).
5. **Lost** (`'lost'`): Inactive, disqualified, or lost opportunities (`Lost`).
6. **Overdue Today** (`'overdue'`): Deals where `next_follow_up < CURRENT_TIMESTAMP` and stage is neither `Converted` nor `Lost` (and not suppressed by `revisit_date`).
   - **Urgent Visual Cue**: When `overdueCount > 0`, the tab displays an active Marca Orange (`#ff6100`) radar alert dot and subtle border glow.

```scss
// Bucket Tab Urgent Pulse Animation Token
@keyframes overduePulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 97, 0, 0.5);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.02);
    box-shadow: 0 0 10px 2px rgba(255, 97, 0, 0.4);
  }
}
```

#### Numeric Badge Token Formula
Each bucket tab displays a high-contrast count badge formatted with `font-variant-numeric: tabular-nums` (Raycast Monospace token archetype) to guarantee zero layout shift when counts update:
- Inactive tab badge: `background: rgba(255, 255, 255, 0.08)`, `color: #cccccc`.
- Active tab badge: `background: #ff6100`, `color: #ffffff`.
- Active Overdue badge: `background: #ef4444`, `color: #ffffff`.

---

### 3.2 Debounced Multi-Field Search Engine
- **Debounce Window**: 250 milliseconds using React 19 `useTransition` and a timer ref.
- **Search Scope**: Evaluates search query `q` case-insensitively across:
  1. `lead_id`: Exact or partial Deal ID match (e.g., `LD-1042`).
  2. `name`: Client or primary stakeholder full name.
  3. `company`: Organization or enterprise brand name.
  4. `email`: Corporate email address.
  5. `phone`: Direct telephone or sanitized digit sequence.
  6. `assigned_to_name`: Assigned sales representative.
- **Interactive Controls**:
  - Leading search vector glyph (14px stroke).
  - Trailing quick-clear `✕` button rendered when query is non-empty.
  - Keyboard shortcut: Pressing `Escape` while focused clears search query immediately.

---

### 3.3 Dark Luxury Popover Filter Dropdowns
Three popover menus provide multi-dimensional filtering, built with Apple HIG Vibrancy tokens:

1. **Source Dropdown**:
   - Filter by acquisition channel (`Website Form`, `WhatsApp Inbound`, `Direct Referral`, `Founder / Executive Outreach`, `Cold Campaign`).
   - Colored channel badges matching database `color_code`.
2. **Assignee Dropdown**:
   - Filter by team member profile (`Anita Nair`, `Zayd Al-Hadi`) or "Unassigned".
   - 20px uppercase monogram avatars (`AN`, `ZA`, `UN`).
3. **Priority Dropdown**:
   - Filter by `High` (Marca Orange `#ff6100`), `Medium` (Amber `#f59e0b`), or `Low` (Slate `#71717a`).
   - 6px semantic radar pulse dots.

#### Popover Interaction Physics
- **Backdrop & Blur**: `background: rgba(18, 18, 22, 0.95)`, `backdrop-filter: blur(24px)`.
- **Specular Border**: `1px solid rgba(255, 255, 255, 0.1)`, `box-shadow: 0 20px 48px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.1)`.
- **Keyboard & Click-Outside**: Automatically closes on click outside container or pressing `Escape`.
- **Mutual Exclusion**: Opening any popover automatically closes any currently open sibling popover.

---

### 3.4 Active Filter Chips & Global Reset
Whenever any filter parameter deviates from default, an active filter summary ribbon renders directly below the controls bar:
- Individual chips display parameter label, formatted value, and `✕` removal button.
- Global **Clear All Filters** trigger button resets all filters, search query, and tab back to `'all'` with a single click.

---

### 3.5 URL State Synchronization Engine
To maintain deep-link integrity:
- **Write Latency**: Updates occur within 16ms of user interaction.
- **Method**: Utilizes `window.history.replaceState` or Next.js `router.replace` with `{ scroll: false }` to prevent viewport jumps.
- **Param Map**:
  - `bucket`: `'all' | 'open' | 'potential' | 'converted' | 'lost' | 'overdue'`
  - `search`: Trimmed text string
  - `source`: Selected `lead_source_id`
  - `assigned_to`: Selected `assigned_to` profile UUID
  - `priority`: `'High' | 'Medium' | 'Low'`
  - `stage`: Retained when navigating from deep links or KPI ribbon cards
- **Reactive Bus**: Dispatches standard `popstate` or custom event so `KpiRibbon` immediately recalculates metrics in sync.

---

### 3.6 TypeScript Component Interface & Props Contract

```typescript
/**
 * @file FilterActionBar.tsx
 * @description Master multi-filter action bar component contract.
 * @module app/admin/components/FilterActionBar
 */

export type BucketTabId = 'all' | 'open' | 'potential' | 'converted' | 'lost' | 'overdue';

export interface BucketCounts {
  all: number;
  open: number;
  potential: number;
  converted: number;
  lost: number;
  overdue: number;
}

export interface FilterDropdownOption {
  id: string;
  label: string;
  colorCode?: string;
  avatarText?: string;
  subtext?: string;
}

export interface ActiveFiltersState {
  bucket: BucketTabId;
  searchQuery: string;
  sourceId: string | null;
  assigneeId: string | null;
  priority: string | null;
  stageId: string | null;
}

export interface FilterActionBarProps {
  /** Real-time aggregated record count per bucket */
  counts: BucketCounts;
  /** Currently selected pipeline bucket */
  selectedBucket: BucketTabId;
  /** Current search input value */
  searchQuery: string;
  /** Active source filter ID (UUID) */
  selectedSourceId: string | null;
  /** Active assignee profile UUID */
  selectedAssigneeId: string | null;
  /** Active priority level */
  selectedPriority: string | null;
  /** Active specific stage filter (from KPI ribbon or deep links) */
  selectedStageId: string | null;
  /** Available lead acquisition sources from database lookup */
  availableSources: FilterDropdownOption[];
  /** Available agency staff representatives */
  availableAssignees: FilterDropdownOption[];
  /** Event handlers for filter changes */
  onBucketChange: (bucket: BucketTabId) => void;
  onSearchChange: (query: string) => void;
  onSourceChange: (sourceId: string | null) => void;
  onAssigneeChange: (assigneeId: string | null) => void;
  onPriorityChange: (priority: string | null) => void;
  onStageClear: () => void;
  onClearAll: () => void;
  /** Optional custom class name */
  className?: string;
}
```

---

## 4. Component Contract 2: `LeadsTableSkeleton`

`LeadsTableSkeleton` is a zero-dependency, ultra-smooth skeleton loading component designed to prevent Cumulative Layout Shift (CLS score < 0.01) while Next.js 16/React 19 Server Components stream commercial lead records.

### 4.1 Structural & Dimensional Precision
- **Row Height**: Fixed `72px` (matching exact hydrated table row dimensions).
- **Default Render Count**: 8 rows.
- **Container Geometry**: Deep obsidian `#111111` canvas, `border: 1px solid rgba(255, 255, 255, 0.08)`, `border-radius: 12px`, `overflow: hidden`.
- **Zero-Bento Principle**: Flat tabular columns separated by hairline dividers (`rgba(255, 255, 255, 0.04)`), zero nested double-bordered cards.

### 4.2 Column-by-Column Alignment Matrix

| Column Index | Column Header | Width % | Live Element Geometry | Skeleton Element Spec |
|---|---|---|---|---|
| **Col 1** | **Deal ID** | 14% | Raycast Monospace token chip | 76px × 22px rounded pill (radius 4px) |
| **Col 2** | **Client & Company** | 22% | 2-tier stacked title + company | Two bars: 130px × 15px (title) + 90px × 12px (sub) |
| **Col 3** | **Service** | 14% | Service category label | 96px × 14px rounded rectangle |
| **Col 4** | **Stage** | 14% | Status pill badge | 108px × 24px pill (radius 9999px) |
| **Col 5** | **Valuation** | 12% | Tabular currency amount | 84px × 16px tabular numeral block |
| **Col 6** | **Assigned Rep** | 14% | Avatar monogram + full name | 22px × 22px circle + 80px × 14px text |
| **Col 7** | **Next Touchpoint** | 10% | Monospace date text | 64px × 13px monospace date block |

### 4.3 Dark Shimmer Keyframe Token

```scss
// SCSS Module: LeadsTableSkeleton.module.scss
.skeletonRow {
  height: 72px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  padding: 0 1.25rem;
}

.shimmerBox {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.02) 25%,
    rgba(255, 255, 255, 0.07) 50%,
    rgba(255, 255, 255, 0.02) 75%
  );
  background-size: 200% 100%;
  animation: skeletonShimmer 1.8s infinite linear;
  border-radius: 4px;
}

@keyframes skeletonShimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

### 4.4 TypeScript Component Interface

```typescript
/**
 * @file LeadsTableSkeleton.tsx
 * @description Zero-CLS loading skeleton for the Commercial Deals Table.
 * @module app/admin/components/LeadsTable
 */

export interface LeadsTableSkeletonProps {
  /** Number of placeholder rows to render (default: 8) */
  rowCount?: number;
  /** Optional custom class name */
  className?: string;
}
```

---

## 5. React 19 `<Suspense>` Streaming Integration (`page.tsx`)

In accordance with Next.js 16 and React 19 Server Component standards, data fetching is partitioned to enable immediate initial shell rendering and streaming table hydration.

### 5.1 Component Topology

```tsx
// Architectural Pattern: src/app/admin/(workspace)/leads/page.tsx
export default async function AdminLeadsPage(props: AdminLeadsPageProps) {
  const resolvedParams = props.searchParams ? await props.searchParams : undefined;
  const supabase = await createClient();

  // 1. Fetch metadata in parallel for instant shell render
  const [rpcPromise, sourcesPromise, profilesPromise] = await Promise.all([
    supabase.rpc('get_pipeline_kpis'),
    supabase.from('lead_sources').select('id, name, color_code').eq('is_active', true),
    supabase.from('profiles').select('id, full_name, role').eq('status', 'active'),
  ]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        {/* Workspace Title & Operational Metadata */}
      </header>

      {/* Immediate Render: Executive KPI Ribbon */}
      <KpiRibbon initialData={rpcPromise.data} syncWithUrlParams={true} />

      {/* Streaming Suspense Boundary: Leads Table & Filter Bar */}
      <Suspense fallback={<LeadsTableSkeleton rowCount={8} />}>
        <LeadsWorkspaceDataLoader
          resolvedParams={resolvedParams}
          sources={sourcesPromise.data || []}
          profiles={profilesPromise.data || []}
        />
      </Suspense>
    </div>
  );
}
```

### 5.2 Benefits of Partitioned Streaming
1. **Instant First Paint**: The page header, breadcrumbs, and KPI ribbon render immediately from server cache or lightweight RPC.
2. **Graceful Hydration**: While full lead records (with complex JSONB payloads and relationship joins) load, the user sees an identical hairline skeleton with zero layout shift.
3. **Deep-Link Parity**: Initial search parameters (`stage`, `bucket`, `assigned_to`, `source`, `priority`) are passed to the server query, ensuring server-rendered HTML reflects requested filters.

---

## 6. Complete SCSS Design Blueprints

### 6.1 `FilterActionBar.module.scss`

```scss
// SCSS Module: FilterActionBar.module.scss
// Aesthetic: Apple HIG Vibrancy & Linear Fluid Controls
// Dials: ENERGY 2 / RHYTHM 2 / MOTION 1

$marca-orange: #ff6100;
$obsidian-base: #111111;
$obsidian-popover: rgba(18, 18, 22, 0.95);
$hairline-border: rgba(255, 255, 255, 0.08);
$hairline-active: rgba(255, 97, 0, 0.4);
$text-primary: #ffffff;
$text-secondary: #a1a1aa;
$text-muted: #71717a;

.filterActionBar {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  width: 100%;
  position: relative;
  z-index: 20;
}

// 1. Top Controls Row: Bucket Tabs & Action Buttons
.controlsRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: stretch;
  }
}

// 2. Bucket Segmented Tabs
.bucketTabs {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid $hairline-border;
  border-radius: 10px;
  padding: 0.25rem;
  overflow-x: auto;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tabBtn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.75rem;
  border-radius: 7px;
  background: transparent;
  border: 1px solid transparent;
  color: $text-secondary;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;

  &:hover {
    color: $text-primary;
    background: rgba(255, 255, 255, 0.05);
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: 2px solid $marca-orange;
    outline-offset: -2px;
  }

  &.activeTab {
    background: rgba(255, 97, 0, 0.12);
    color: $text-primary;
    border-color: rgba(255, 97, 0, 0.3);

    .tabCount {
      background: $marca-orange;
      color: #ffffff;
    }
  }

  &.urgentTab {
    border-color: rgba(255, 97, 0, 0.4);

    &.hasOverdue {
      animation: tabAlertGlow 2.5s infinite ease-in-out;
    }
  }
}

@keyframes tabAlertGlow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 97, 0, 0);
  }
  50% {
    box-shadow: 0 0 10px 1px rgba(255, 97, 0, 0.35);
  }
}

.tabCount {
  font-family: 'SF Mono', 'Fira Code', Menlo, monospace;
  font-size: 0.64rem;
  font-weight: 700;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  color: #cccccc;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.urgentPulseDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: $marca-orange;
  box-shadow: 0 0 6px rgba(255, 97, 0, 0.8);
  animation: dotPulse 1.8s infinite ease-in-out;
}

@keyframes dotPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.6; }
}

// 3. Search Bar & Dropdown Group
.controlsRight {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    width: 100%;
  }
}

.searchBox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: $obsidian-base;
  border: 1px solid $hairline-border;
  border-radius: 8px;
  padding: 0.4rem 0.75rem;
  min-width: 260px;
  position: relative;
  transition: all 0.15s ease;

  &:focus-within {
    border-color: rgba(255, 97, 0, 0.5);
    box-shadow: 0 0 0 1px rgba(255, 97, 0, 0.3);
  }

  @media (max-width: 640px) {
    width: 100%;
    min-width: 0;
  }
}

.searchIcon {
  color: $text-muted;
  flex-shrink: 0;
}

.searchInput {
  background: transparent;
  border: none;
  color: $text-primary;
  font-size: 0.82rem;
  width: 100%;
  outline: none;

  &::placeholder {
    color: $text-muted;
  }
}

.clearSearchBtn {
  background: transparent;
  border: none;
  color: $text-muted;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.1rem 0.25rem;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: $text-primary;
    background: rgba(255, 255, 255, 0.1);
  }
}

// 4. Filter Dropdown Trigger Buttons
.filterDropdownContainer {
  position: relative;
}

.dropdownTrigger {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: $obsidian-base;
  border: 1px solid $hairline-border;
  border-radius: 8px;
  padding: 0.42rem 0.75rem;
  color: $text-secondary;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: $text-primary;
    border-color: rgba(255, 255, 255, 0.16);
  }

  &.activeFilter {
    background: rgba(255, 97, 0, 0.08);
    border-color: $hairline-active;
    color: $text-primary;
  }

  &:focus-visible {
    outline: 2px solid $marca-orange;
    outline-offset: 1px;
  }
}

.dropdownChevron {
  font-size: 0.65rem;
  color: $text-muted;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.chevronOpen {
  transform: rotate(180deg);
}

// 5. Apple HIG Vibrancy Popover Menu
.popoverMenu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 220px;
  max-width: 320px;
  max-height: 320px;
  overflow-y: auto;
  background: $obsidian-popover;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.1);
  padding: 0.4rem;
  z-index: 40;
  animation: popoverFade 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes popoverFade {
  from { opacity: 0; transform: translateY(-4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.popoverItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.45rem 0.65rem;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: $text-secondary;
  font-size: 0.78rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.12s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: $text-primary;
  }

  &.selectedItem {
    background: rgba(255, 97, 0, 0.15);
    color: $text-primary;
    font-weight: 600;
  }
}

.itemLeft {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

// 6. Active Filter Chips Ribbon
.activeFiltersRibbon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.45rem 0.75rem;
  background: rgba(255, 97, 0, 0.05);
  border: 1px solid rgba(255, 97, 0, 0.2);
  border-radius: 8px;
  font-size: 0.76rem;
}

.activeFiltersLabel {
  color: $marca-orange;
  font-weight: 600;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filterChip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: $text-primary;
  font-size: 0.74rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.chipRemoveBtn {
  background: transparent;
  border: none;
  color: $marca-orange;
  font-size: 0.7rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;

  &:hover {
    color: #ffffff;
  }
}

.clearAllBtn {
  background: transparent;
  border: none;
  color: $text-secondary;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  margin-left: auto;

  &:hover {
    color: $marca-orange;
  }
}
```

---

### 6.2 `LeadsTableSkeleton.module.scss`

```scss
// SCSS Module: LeadsTableSkeleton.module.scss
// Aesthetic: Obsidian Data Grid with Hairline Shimmer
// Dials: ENERGY 2 / RHYTHM 2 / MOTION 1

$obsidian-container: #111111;
$hairline-border: rgba(255, 255, 255, 0.08);
$hairline-divider: rgba(255, 255, 255, 0.04);

.skeletonWrapper {
  background: $obsidian-container;
  border: 1px solid $hairline-border;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);
  width: 100%;
}

.tableHeadSkeleton {
  display: grid;
  grid-template-columns: 14% 22% 14% 14% 12% 14% 10%;
  align-items: center;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid $hairline-border;
  padding: 0.85rem 1.25rem;
  gap: 0.5rem;

  @media (max-width: 900px) {
    display: none;
  }
}

.headLabelSkeleton {
  height: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.skeletonRow {
  display: grid;
  grid-template-columns: 14% 22% 14% 14% 12% 14% 10%;
  align-items: center;
  height: 72px;
  padding: 0 1.25rem;
  gap: 0.5rem;
  border-bottom: 1px solid $hairline-divider;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 900px) {
    display: flex;
    flex-direction: column;
    height: auto;
    padding: 1rem;
    gap: 0.65rem;
    align-items: flex-start;
  }
}

.shimmerBox {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.02) 25%,
    rgba(255, 255, 255, 0.07) 50%,
    rgba(255, 255, 255, 0.02) 75%
  );
  background-size: 200% 100%;
  animation: skeletonShimmer 1.8s infinite linear;
  border-radius: 4px;
}

@keyframes skeletonShimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// Column 1: Deal ID Pill Skeleton
.dealIdPill {
  width: 76px;
  height: 22px;
  border-radius: 4px;
}

// Column 2: Client & Organization Dual-Line Skeleton
.clientMetaCol {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.clientNameBar {
  width: 120px;
  height: 14px;
}

.companyTitleBar {
  width: 85px;
  height: 11px;
  opacity: 0.7;
}

// Column 3: Service Category Skeleton
.serviceBar {
  width: 90px;
  height: 14px;
}

// Column 4: Funnel Stage Pill Skeleton
.statusPill {
  width: 104px;
  height: 24px;
  border-radius: 9999px;
}

// Column 5: Deal Valuation Numerals Skeleton
.dealValueBar {
  width: 80px;
  height: 16px;
}

// Column 6: Representative Avatar & Monogram Skeleton
.repBadge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.repAvatarCircle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex-shrink: 0;
}

.repNameBar {
  width: 75px;
  height: 13px;
}

// Column 7: Next Touchpoint Monospace Date Skeleton
.touchpointBar {
  width: 60px;
  height: 13px;
}
```

---

## 7. Responsive Viewport Adaptations

| Viewport Dimension | Adaptive Presentation Specifications |
|---|---|
| **Desktop (1280px+)** | Horizontal bucket tabs, full 7-column grid layout, right-aligned popover menus. |
| **Laptop (1024px - 1279px)** | Bucket tabs scroll horizontally with hidden scrollbar. Multi-field search box scales to 220px. |
| **Tablet (768px - 1023px)** | Top controls wrap into two tiers: Tier 1 (Bucket tabs), Tier 2 (Search + Filter popovers). Table header remains visible. |
| **Mobile (< 768px)** | Controls row stacks vertically with 100% width inputs. Filter popovers open full width. Table rows transform to mobile card geometry. |

---

## 8. Anti-AI-Slop Governance & Verification Matrix

In accordance with Marca Ubi design standards (`AGENTS.md`, `DESIGN.md`, `.agents/skills/antislop/`):

| Anti-AI-Slop Principle | Enforcement Mechanism | Verification Standard |
|---|---|---|
| **No Bento Inception** | Single outer table card container (`#111111`) with flat hairline dividers. | Zero nested bordered cards within the table rows or controls bar. |
| **No Generic Blue (`#2563eb`)** | All active states, alerts, and borders use Marca Orange (`#ff6100`) or emerald (`#22c55e`). | Zero instances of `#2563eb` in SCSS or CSS modules. |
| **Tabular Numerals** | All counter badges, deal counts, and valuation figures declare `font-variant-numeric: tabular-nums`. | Zero jitter during numeric state mutations. |
| **No Toy Emojis** | Vector SVG search glyphs and 6px glowing radar dots used exclusively. | Zero decorative Unicode emojis in UI controls or status badges. |
| **Concentric Radii** | Math: Outer container (`12px`) $\rightarrow$ Controls bar (`10px`) $\rightarrow$ Buttons (`7-8px`) $\rightarrow$ Badges (`4px`). | Harmonious radii ratios verified. |
| **Zero Em-Dashes in UI Copy** | Clear, factual labels without pretentious em-dashes. | Factual copy: "Search deals, company, or rep...". |
| **WCAG AA Contrast** | All white text on obsidian canvas meets 4.5:1 ratio; secondary metadata (`#a1a1aa`) meets 3:1 ratio. | Contrast verified with `antislop-human`. |

---

## 9. Delivery Gate Acceptance Criteria

Before marking Sprint 7.1 as complete, the following deliverables and assertions must be validated:

1. **Component Delivery**:
   - `src/app/admin/components/FilterActionBar/FilterActionBar.tsx`
   - `src/app/admin/components/FilterActionBar/FilterActionBar.module.scss`
   - `src/app/admin/components/FilterActionBar/index.ts`
   - `src/app/admin/components/LeadsTable/LeadsTableSkeleton.tsx`
   - `src/app/admin/components/LeadsTable/LeadsTableSkeleton.module.scss`
   - `src/app/admin/components/LeadsTable/index.ts`
2. **Integration Verification**:
   - `src/app/admin/(workspace)/leads/page.tsx` renders React 19 `<Suspense fallback={<LeadsTableSkeleton />}>`.
   - `LeadsWorkspaceClient.tsx` seamlessly consumes `FilterActionBar`.
3. **TypeScript Static Check**:
   - `npx tsc --noEmit` completes with **0 errors**.
4. **URL Synchronization**:
   - Adjusting bucket tabs, typing in search, or selecting dropdown filters updates browser URL parameters without a full page reload in `< 16ms`.
   - Refreshing the page preserves the filtered view.
5. **Overdue Pulse**:
   - When overdue leads exist, the Overdue Today tab badge and border glow with Marca Orange `#ff6100`.
