# Marca Ubi CRM — Inbound Leads, Dossier Data & Stacking Remediation Master Plan

**Module Target**: Commercial Discovery & Inbound Leads Workspace (`/admin/leads`) & Client 360° Dossier Drawer (`ClientDossierDrawer.tsx`)  
**Design Authority**: `DESIGN.md`, `.agents/skills/master-ui-ux-design-system/`, `.agents/skills/antislop-ui/`, `.agents/skills/antislop-layoutmobile/`  
**Brand Design Tokens**:
- `#ffffff` Card Base & Surfaces
- `#1f242f` Primary Typography & Obsidian Badges
- `#eefb87` / `#e4f375` Signature Accordion Lemon Yellow (Primary Action CTAs)
- `#ff6100` Marca Orange Accents
- `#e2e5ea` Hairline Borders

---

## 1. Executive Summary & Root Cause Matrix

Based on user feedback across `Screenshot 2026-10-20 133037.png`, `Screenshot 2026-10-20 134039.png`, and `Screenshot 2026-10-20 133810.png`, the issues are diagnosed as follows:

| Issue | Root Cause | Architectural Fix |
| :--- | :--- | :--- |
| **1. Missing "+ Log New Lead" CTA** | Page header on `/admin/leads` only renders title/subtitle with zero action buttons. | Add unmissable `+ Log New Lead` primary CTA button in header with `#eefb87` styling and `⌘L` shortcut opening `NewLeadModal`. |
| **2. Inability to Add Notes or View Dossier on New Leads** | In `LeadsDataGrid.tsx`, for all `open` leads (100% of new discovery inquiries), the Actions column exclusively renders `⚡ CONVERT`, hiding `View >`. | Render both `Convert` and `View >` (or `Dossier & Notes`) on all rows. Clicking opens `ClientDossierDrawer` with `QuickActionComposer` actively accessible. |
| **3. Funnel Stage Dropdown Menu Clipped** | `.virtualScrollContainer` has `overflow-y: auto`. Status menu in `InlineStatusSelect` opens downward with 260px fixed height, sliced by scroll container boundary. | Implement dynamic viewport collision detection: flip upward (`bottom: calc(100% + 6px)`) if space below is `< 270px`, or attach via React Portal to `document.body`. |
| **4. Row LD-10347 Blank Stage** | Status `'New'` was seeded with `color_code: '#ffffff'`. White text on white card background is 100% invisible. | Add contrast guard: if color code is `#ffffff` or white, default to Slate `#475569`. Update database seed. |
| **5. Filter Dropdown Sliced by Table Header** (`Screenshot 134039`) | `FilterActionBar` (`z-index: 20`) and `.tableHeader` (`z-index: 20`) share the same stacking context. Because `LeadsDataGrid` is later in DOM, `.tableHeader` paints on top of the open dropdown. | Elevate `FilterActionBar` to `z-index: 60`, `.popoverMenu` to `z-index: 70`, and isolate `LeadsDataGrid` with `isolation: isolate; z-index: 1;`. |
| **6. Questionnaire Shows `BATCH ID` & `SYNTHETIC BENCHMARK`** (`Screenshot 133810`) | Synthetic benchmark test seeder injected test keys into `brief_payload`. `dossierUtils.ts` did not filter these keys, converting them to uppercase. | Add synthetic key denylist in `extractBriefEntries`, map legitimate website questionnaire fields to friendly labels, and provide professional empty state. |
| **7. No Way to Edit or Manage Lead Scope** (`Screenshot 133810`) | Dossier drawer is 100% read-only. Backend `updateLeadDealParameters` is orphaned and not hooked to UI. | Add "Edit Scope" action in drawer header backed by `updateLeadDetailsAction` allowing staff to edit company, contacts, valuation, category, and notes. |
| **8. Latin Lorem Ipsum in Deal Notes** (`Screenshot 133810`) | Seeder script used `faker.lorem.sentence()` for synthetic benchmark records. | Replace seeder with realistic agency notes and provide direct inline editing for `Executive Deal Notes`. |
| **9. Horizontal Scrollbar Leaking in Drawer** (`Screenshot 133810`) | `.drawerBody` has `overflow-y: auto` without `overflow-x: hidden`. Children lack `min-width: 0;` and grid tracks use `1fr 1fr` instead of `minmax(0, 1fr)`. | Add `overflow-x: hidden; scrollbar-gutter: stable;` and `minmax(0, 1fr)` to grid columns. |
| **10. Valuation Font Spacing (`₹ 2.06 L`)** (`Screenshot 133810`) | `.valuationBadge` was misclassified as monospace (`$font-mono`) with positive `letter-spacing: 0.02em`. | Switch to Stripe Scorecard token (`var(--font-admin-sans)` with `font-variant-numeric: tabular-nums; letter-spacing: -0.015em;`). |

---

## 2. Detailed Technical Specifications

### Phase 1: Filter Dropdown & Table Header Stacking Hierarchy Fix
- **File**: `src/app/admin/components/FilterActionBar/FilterActionBar.module.scss`
  ```scss
  .filterActionBar {
    z-index: 60; // Elevated above table headers
  }
  .popoverMenu {
    z-index: 70; // Elevated within FilterActionBar
  }
  ```
- **File**: `src/app/admin/components/LeadsTable/LeadsDataGrid.module.scss`
  ```scss
  .virtualScrollContainer {
    z-index: 1;
    isolation: isolate; // Prevents sticky tableHeader (z-index 20) from escaping into parent stacking context
  }
  ```
- **File**: `src/app/admin/components/layout/AdminHeader.module.scss`
  ```scss
  .header {
    z-index: 100; // Above workspace content when scrolling
  }
  ```

### Phase 2: Inbound Leads Header & Action Controls
- **File**: `src/app/admin/(workspace)/leads/page.tsx` & `leads.module.scss`
  - Add `headerRight` with `[ + Log New Lead ]` primary button:
    * Background: `#eefb87` (Accordion Lemon Yellow).
    * Hover: `#e4f375`.
    * Text/Border: `#1f242f`.
    * Shortcut indicator: `⌘L`.
    * Opens `NewLeadModal`.
- **File**: `src/app/admin/components/LeadsTable/LeadsDataGrid.tsx`
  - In Column 9 (Actions):
    * For `open` leads: render BOTH `⚡ Convert` AND `View >` (or `Dossier & Notes`).
    * Clicking `View >` opens `ClientDossierDrawer` where users can view brief details and log notes.

### Phase 3: Status Dropdown Clipping & Invisible 'New' Status Fix
- **File**: `src/app/admin/components/LeadsTable/InlineStatusSelect.tsx` & `.module.scss`
  - Add collision detection: if trigger distance to bottom is `< 270px`, apply `popoverMenuUp` (`bottom: calc(100% + 6px); top: auto;`) or render via React Portal.
  - Add color contrast guard:
    ```tsx
    const rawColor = optimisticStatus.color_code?.toLowerCase().trim();
    const isWhite = !rawColor || rawColor === '#ffffff' || rawColor === '#fff' || rawColor === 'white';
    const statusColor = isWhite ? '#475569' : optimisticStatus.color_code;
    ```
- **Database Migration**:
  - Update seed for `'New'` from `#ffffff` to `#475569`.

### Phase 4: Brief Questionnaire Sanitization & Data Management
- **File**: `src/app/admin/components/DossierDrawer/dossierUtils.ts`
  - Expand exclusion list in `extractBriefEntries`:
    ```ts
    const EXCLUDED_KEYS = [
      'synthetic_benchmark', 'batch_id', 'lead_index', 'benchmark_run',
      'simulated', 'simulated_at', 'simulated_by', 'submissionId',
      'submitted_at', '_timestamp', 'created_at', 'creator_id',
      'created_via', 'creator_name', 'creator_role', 'phone_warning',
      'idempotencyKey', 'idempotency_key',
    ];
    ```
  - Map genuine website brief fields to clean labels:
    * `projectDescription` &rarr; "Project Scope & Goals"
    * `category` &rarr; "Requested Category"
    * `service` &rarr; "Deliverable Focus"
    * `timeline` &rarr; "Target Launch Window"
    * `inspirationLinks` &rarr; "Inspiration References"
    * `extraNotes` &rarr; "Additional Client Notes"
- **Server Action**: `src/app/actions/leads.ts`
  - Implement `updateLeadDetailsAction`: updates company, website, contact info, valuation, priority, budget tier, notes, and brief fields with validation and activity logging.
- **Component**: `src/app/admin/components/DossierDrawer/`
  - Add **"Edit Lead Scope"** button in drawer header.
  - Add inline editing for `Executive Deal Notes` with instant save.

### Phase 5: Drawer Layout & Typography Polish
- **File**: `src/app/admin/components/DossierDrawer/DossierDrawer.module.scss`
  - Add `overflow-x: hidden; scrollbar-gutter: stable;` to `.drawerBody`.
  - Add `min-width: 0;` to `.dossierColumn` and `.sectionCard`.
  - Use `repeat(2, minmax(0, 1fr))` for grid columns.
  - Fix valuation typography:
    ```scss
    .valuationBadge {
      font-family: var(--font-admin-sans, -apple-system, sans-serif);
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--admin-status-emerald-text, #065f46);
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.015em;
    }
    ```

---

## 3. Verification & Quality Gate Matrix

| Test Gate | Verification Criteria | Target |
| :--- | :--- | :--- |
| **Filter Dropdown Stacking** | Open Representative dropdown in `FilterActionBar`. | Dropdown floats cleanly above table header without slicing. |
| **New Lead Manual Intake** | Click `+ Log New Lead` on `/admin/leads`, enter info, submit. | Lead is created, appears in table with status `New`. |
| **Lead Dossier & Notes** | Click `View >` on any row. | Slide-over drawer opens, note composer is immediately usable. |
| **Status Dropdown Clipping** | Click status on bottom table row (LD-10349). | Dropdown flips upward cleanly, 100% visible. |
| **'New' Status Contrast** | Check row LD-10347. | Pill displays `● New` in slate `#475569` (passes WCAG AA). |
| **Questionnaire Sanitization** | Open drawer for any lead. | Zero synthetic keys (`BATCH ID`, etc.). Real brief answers shown. |
| **Drawer Layout & Kerning** | Inspect drawer on Windows. | Zero horizontal scrollbars. Currency renders with crisp tabular kerning (`₹2.06 L`). |
| **Full Test Suite** | Run `tsc --noEmit` and `npm run test:unit`. | 0 type errors, 100% test pass rate. |
