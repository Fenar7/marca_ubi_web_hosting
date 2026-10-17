# Sprint 7.2 Architectural Specification: Virtualized Data Grid, Inline Dropdowns with React 19 `useOptimistic` & Responsive Breakpoints

**Document ID**: `SPEC-MARCA-CRM-SPRINT-7-2`  
**Phase**: Phase 7 (Interactive Leads Workspace & High-Performance Data Grid)  
**Sprint**: Sprint 7.2  
**Base Milestone**: `sprint-7.2/virtualized-grid-and-optimistic-mutations`  
**Author**: Fenar7 <86710532+Fenar7@users.noreply.github.com>  
**Status**: Ready for Implementation  
**Design System Dials**: `ENERGY 2 / RHYTHM 2 / MOTION 1`  

---

## 1. Executive Summary & Architectural Scope

Sprint 7.2 delivers the high-performance tabular core and optimistic inline editing layer for the **Commercial Deals & Inquiries Workspace** (`/admin/leads`) within the Marca Ubi Enterprise CRM.

### 1.1 Business & User Experience Objectives
- **60fps Virtualized Rendering**: Render thousands of high-ticket commercial inquiries with 60fps scrolling fidelity using `@tanstack/react-virtual`, guaranteeing zero frame drops and memory-safe DOM recycling.
- **Sub-10ms Optimistic Inline Mutations**: Empower account executives and sales leaders to update deal pipeline stages and priority tiers inline without page reloads, modals, or waiting for network round-trips.
- **React 19 `useOptimistic` Rollback Safety**: Guarantee immediate visual updates that automatically revert to prior database states if network or security validations reject the transaction.
- **Guarded Funnel Transitions**: Intercept commercial transitions into terminal states (`Converted` or `Lost`) to prevent unverified closures without financial contracts or loss rationale.
- **Adaptive Cross-Device Ergonomics**: Seamlessly adapt from a high-density 7-column desktop grid (Desktop 1440px+, Laptop 1024px–1439px, Tablet 768px–1023px) to an ergonomic mobile card interface (`< 768px`) featuring native 1-tap Click-to-Call (`tel:`) and Click-to-WhatsApp (`https://wa.me/`) deep links.

---

## 2. Component Hierarchy & Stacking Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│  /admin/leads (Server Component: page.tsx)                             │
│  ├─ KpiRibbon (Sprint 6.2 Executive Scorecard container)               │
│  └─ Suspense Boundary (LeadsTableSkeleton fallback, CLS < 0.01)        │
│     └─ LeadsWorkspaceClient.tsx                                        │
│        ├─ FilterActionBar.tsx (Sprint 7.1 Multi-Filter & Search)       │
│        └─ LeadsDataGrid.tsx (Sprint 7.2 Virtualized Data Grid)         │
│           ├─ Sticky Header (7 Columns, Sort Labels)                    │
│           ├─ Virtualizer Viewport (useVirtualizer, 72px row rhythm)    │
│           │  └─ Table Row (Desktop & Tablet)                           │
│           │     ├─ Deal ID Monospace Token (with 1-click copy)         │
│           │     ├─ Client Name & Organization Dual-Line                │
│           │     ├─ Service Category Pill                               │
│           │     ├─ InlineStatusSelect (React 19 useOptimistic)         │
│           │     ├─ Expected Value Numerals (tabular-nums)              │
│           │     ├─ Assigned Rep Monogram Badge                         │
│           │     └─ InlinePrioritySelect & Touchpoint Date              │
│           └─ Mobile Card List (< 768px Breakpoint)                     │
│              └─ LeadMobileCard.tsx                                     │
│                 ├─ Header: ID Token, Timestamp & Value                 │
│                 ├─ Body: Client Name, Company, Service Badge           │
│                 ├─ Inline Controls: Status & Priority Dropdowns        │
│                 └─ Action Bar: Call (tel:) & WhatsApp (wa.me) CTAs     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Server Actions & Security Architecture

### 3.1 Server Action: `updateLeadStatusAction`
- **Path**: `src/app/actions/leadInlineActions.ts`
- **Directive**: `'use server'`
- **Parameters**: `leadId: string (UUID)`, `statusId: string (UUID)`
- **Security Boundaries**:
  1. *Authentication*: Validates active authenticated Supabase session (`supabase.auth.getUser()`).
  2. *Status Suspension*: Rejects suspended users with immediate HTTP 403 / security exception.
  3. *Role Sandboxing*: Sales Executives can only update leads explicitly assigned to their `profiles.id`. Admins and Sales Managers can update any active commercial inquiry.
  4. *Input Sanitization*: Validates `leadId` and `statusId` via Zod UUID schema.
  5. *State Verification*: Confirms target status exists in `public.funnel_statuses` and is active.
  6. *Audit Ledger*: Inserts an immutable row into `public.lead_activities` with `activity_type = 'status_change'`, recording previous status, new status, timestamp, and actor ID.
  7. *Cache Invalidation*: Revalidates path `/admin/leads`.

### 3.2 Server Action: `updateLeadPriorityAction`
- **Path**: `src/app/actions/leadInlineActions.ts`
- **Directive**: `'use server'`
- **Parameters**: `leadId: string (UUID)`, `priority: 'High' | 'Medium' | 'Low'`
- **Security Boundaries**:
  1. Validates priority enum (`z.enum(['High', 'Medium', 'Low'])`).
  2. Applies identical role authorization checks (Rep isolation vs. Manager global access).
  3. Appends audit log to `public.lead_activities` (`activity_type = 'priority_change'`).
  4. Returns hydrated mutation coordinates.

---

## 4. UI/UX Design System Specifications

### 4.1 Color Tokens & Visual Archetypes
- **Status Indicators**:
  - `New`: White `#ffffff` with hairline glow.
  - `Contacted`: Slate `#94a3b8`.
  - `On Hold`: Amber `#f59e0b`.
  - `Qualified`: Sky Blue `#38bdf8`.
  - `Proposal Sent`: Indigo `#818cf8`.
  - `Negotiation`: Marca Orange `#ff6100` (`box-shadow: 0 0 8px rgba(255, 97, 0, 0.4)`).
  - `Converted`: Emerald `#22c55e`.
  - `Lost`: Crimson `#ef4444`.
- **Priority Badges**:
  - `High`: Marca Orange glowing status dot (`#ff6100`), background `rgba(255, 97, 0, 0.12)`.
  - `Medium`: Amber status dot (`#f59e0b`), background `rgba(245, 158, 11, 0.1)`.
  - `Low`: Muted slate dot (`#8e8e93`), background `rgba(255, 255, 255, 0.05)`.
- **Typographical Standards**:
  - Deal Values: `font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1;`.
  - Deal IDs: Monospace `SF Mono, Fira Code, Menlo, monospace` with 6px rounded tokens.
  - Zero generic `#2563eb` blue, zero toy emojis.

---

## 5. Technical Delivery Plan

1. **`src/app/actions/leadInlineActions.ts`**: Complete Server Action engine with Zod schemas, role guards, and activity ledger logging.
2. **`src/app/admin/components/LeadsTable/InlineStatusSelect.tsx` & `.module.scss`**: React 19 `useOptimistic` stage selector with guarded modal triggers.
3. **`src/app/admin/components/LeadsTable/InlinePrioritySelect.tsx` & `.module.scss`**: React 19 `useOptimistic` priority selector.
4. **`src/app/admin/components/LeadsTable/LeadMobileCard.tsx` & `.module.scss`**: Fluid card with Click-to-Call and Click-to-WhatsApp deep links.
5. **`src/app/admin/components/LeadsTable/LeadsDataGrid.tsx` & `.module.scss`**: Virtualized grid shell with `@tanstack/react-virtual`.
6. **`src/app/admin/(workspace)/leads/LeadsWorkspaceClient.tsx` & `page.tsx`**: Integration and state synchronization.
7. **`tests/leads/leads_data_grid.test.ts` & `tests/actions/lead_inline_actions.test.ts`**: Complete test coverage.
8. **`scripts/verify-sprint-7-2.ts`**: 4-Block Delivery Gate Auditor.
