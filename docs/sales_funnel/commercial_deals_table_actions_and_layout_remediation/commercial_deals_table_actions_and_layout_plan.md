# Master Architectural Plan: Commercial Deals Table Context Action Menu & Inline Search Layout Remediation

> **Document ID**: `docs/sales_funnel/commercial_deals_table_actions_and_layout_remediation/commercial_deals_table_actions_and_layout_plan.md`  
> **Status**: PROPOSAL & ARCHITECTURAL SPECIFICATION (Awaiting User "Proceed")  
> **Target Branch**: `brand-upgrade-phase-8/inbound-leads-triage-and-dossier-remediation`  
> **PR Number**: PR #71 (Strictly OPEN)  
> **Author Identity**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Design Standard**: Marca Ubi Dark Luxury Design Tokens (`#000000`, `#ff6100`, `#ffffff`, Raycast Monospace, Apple HIG Vibrancy)

---

## 1. Executive Summary & Root Cause Diagnostic

### 1.1 Issue A: Inactive 3-Dots Action Button (`...`) on Commercial Deals Table
- **User Finding**: Clicking on the 3-dots icon button (`...`) on any row in the Commercial Deals Table produces zero visible UI feedback ([Screenshot 2026-10-22 105658.png](file:///C:/Users/firoz/Pictures/Screenshots/Screenshot%202026-10-22%20105658.png)).
- **Root Cause**: In [`CommercialDealsTable.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/components/Dashboard/CommercialDealsTable.tsx#L176-L182):
  ```tsx
  const handleActionClick = (e: React.MouseEvent, dealId: string) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent('open-lead-drawer', { detail: { id: dealId } })
    );
  };
  ```
  1. The component solely dispatches an undocumented window event (`open-lead-drawer`) for which there is **no listener** mounted anywhere in the `/admin` workspace.
  2. There is **no context dropdown menu UI component** or state machine built to render actionable operations for that row.
  3. In a world-class enterprise CRM (Notion / Linear / Stripe / MedTrackr), the 3-dots trigger must open an anchored, floating action popover menu offering high-frequency deal operations.

---

### 1.2 Issue B: Search Pill & Filter Button Wrapping to 2 Lines
- **User Finding**: The search pill `[ 🔍 Search deals, clients, or reps... ⌘K ]` and the `[ ⚡ Filter ]` button are breaking into two awkward vertical lines ([Screenshot 2026-10-22 105738.png](file:///C:/Users/firoz/Pictures/Screenshots/Screenshot%202026-10-22%20105738.png)).
- **Root Cause**: In [`CommercialDealsTable.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/components/Dashboard/CommercialDealsTable.module.scss#L60-L78):
  ```scss
  .searchAndFilterGroup {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap; // <-- Defect: permits items to break onto separate lines
  }

  .searchPillWrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;     // <-- Defect: claims 100% parent width, pushing siblings down
    max-width: 320px;
  }
  ```
  Because `.searchPillWrapper` has `width: 100%`, flexbox gives it priority over the full width of the parent container before respecting max-width. In combination with `flex-wrap: wrap;`, this forces the adjacent `.filterPillBtn` onto a second line whenever horizontal space is contested by the title cluster.

---

## 2. Architectural Blueprint & Target UX Behavior

### 2.1 Issue A: Functional 3-Dots Context Action Menu
1. **State Machine & Anchoring**:
   - Track `activeMenuDealId: string | null` in `CommercialDealsTable.tsx`.
   - Each action button is wrapped in a relative container (`.actionContainer`), anchoring the context menu directly below the trigger (`top: calc(100% + 6px); right: 0; z-index: 60;`).
2. **Context Menu Actions**:
   - **View Client Dossier**: Navigates to `/admin/leads?id=${deal.id}` or opens the full-screen Client 360 workspace drawer.
   - **Update Stage**: Quick interactive stage transition (Discovery → Proposal → Negotiation → Contract Review → Closed Won).
   - **Copy Deal ID & Link**: Copies `LD-10492` or deep-link URL to the clipboard with visual confirmation feedback.
   - **Reassign Deal Owner**: Quick selection of rep (Tariq, Sarah, Elena, Marcus).
   - **Mark as Closed Won / Closed Lost**: Quick status change trigger.
3. **Event & Accessibility Guards**:
   - Outside click detection (`mousedown`) via `useRef`.
   - Keyboard dismissal (`Escape` key closes the menu).
   - Click event propagation stopped (`e.stopPropagation()`) so clicking the menu does not trigger the parent row's navigation.

---

### 2.2 Issue B: Locked Inline Search & Filter Baseline
1. **Flex Alignment & No-Wrap Guarantee**:
   ```scss
   .searchAndFilterGroup {
     display: flex;
     align-items: center;
     gap: 0.65rem;
     flex-wrap: nowrap; // Guarantees single-line horizontal alignment
     flex-shrink: 0;
   }

   .searchPillWrapper {
     position: relative;
     display: flex;
     align-items: center;
     width: 260px;      // Clean, fixed responsive width
     min-width: 180px;
     flex-shrink: 1;

     @media (min-width: 1200px) {
       width: 280px;
     }

     @media (max-width: 640px) {
       width: 100%;
     }
   }

   .filterPillBtn {
     flex-shrink: 0;    // Never squeezes or breaks below
     white-space: nowrap;
   }
   ```
2. **Visual Rhythm**:
   - `[ 🔍 Search deals... ⌘K ]` and `[ ⚡ Filter ]` will permanently stay locked side-by-side on the exact same horizontal baseline on all desktop, laptop, and tablet viewports.
   - Mobile breakpoint (<640px) cleanly adapts without ragged stacking.

---

## 3. Step-by-Step Implementation Matrix

| File | Change Scope | Architectural Rationale |
| :--- | :--- | :--- |
| [`CommercialDealsTable.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/components/Dashboard/CommercialDealsTable.tsx) | Add `activeMenuDealId` state, context dropdown component, outside-click listener, and clipboard copy handler. | Replaces dead `window.dispatchEvent` with an interactive, fully functional Notion/Linear-grade context menu. |
| [`CommercialDealsTable.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/components/Dashboard/CommercialDealsTable.module.scss) | Update `.searchAndFilterGroup` to `flex-wrap: nowrap; flex-shrink: 0;`. Set `.searchPillWrapper` to `width: 260px; min-width: 180px;`. Style `.contextMenuDropdown`, `.menuItem`, `.menuDivider`. | Fixes 2-line break defect and styles the floating context dropdown with luxury dark obsidian/light tokens. |

---

## 4. Verification & Testing Protocol

1. **Click-Through Verification**:
   - Click `...` on any row: Verify dropdown opens smoothly anchored to the button.
   - Click "Copy Deal ID": Verify clipboard is populated and checkmark feedback shows.
   - Click outside the menu or press `Escape`: Verify menu closes instantly.
2. **Layout & Viewport Verification**:
   - Inspect search bar and filter button at 1440px, 1280px, 1024px, 840px, and 768px.
   - Verify `[ 🔍 Search deals... ⌘K ]` and `[ ⚡ Filter ]` remain 100% inline on the same horizontal line.
3. **TypeScript Compilation**:
   - Verify `npx tsc --noEmit` exits with code 0 and zero type errors.

---

## 5. Architectural Approval Gate

> [!IMPORTANT]
> **Strict Behavioral Rule Enforced**: This detailed diagnostic and remediation plan has been compiled and saved. No code changes for these two specific UI fixes will be executed until you review the plan and explicitly reply with **"proceed"** or **"do it"**.
