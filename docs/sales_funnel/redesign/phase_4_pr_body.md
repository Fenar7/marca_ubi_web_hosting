## Phase 4: Inbound Discovery Leads Workspace & Collision-Free 9-Column DataGrid Architecture

### Architectural Summary
Phase 4 of the Full-Platform Brand Upgrade resolves the critical layout, collision, and domain separation defects identified in **Screenshot 235046** and **Screenshot 235051** across the Inbound Discovery Workspace (`/admin/leads`).

---

### Root Cause Analysis & Rectifications

1. **Root Cause of Collision Bug (Screenshot 235051)**:
   - **Previous Layout**: The grid was structured with 7 columns where column 7 was allocated only 10% width (`grid-template-columns: 14% 22% 14% 14% 12% 14% 10%`).
   - **Defect**: `InlinePrioritySelect`, the `⚡ Convert` button, `touchpointDate` button, `OverdueBadge`, and quick hover action icons were all packed into that single 10% column. Under fixed 72px row heights, flex elements wrapped and collided vertically into each other.
   - **Remediation**: Replaced with 9 dedicated column tracks:
     ```scss
     $grid-columns: 85px minmax(180px, 1.4fr) 120px 130px 110px 130px 105px 125px 110px;
     $grid-min-width: 1095px;
     ```
     - **Col 7**: Dedicated `.priorityCol` isolating `InlinePrioritySelect`.
     - **Col 8**: Dedicated `.slaCol` isolating `touchpointDate` and `OverdueBadge`.
     - **Col 9**: Dedicated `.actionsCol` isolating `rowConvertBtn` (`⚡ Convert` for open inquiries) or `rowInspectBtn` (`View`), along with quick phone call action.
     - **Horizontal Scroll Protection**: Enabled `overflow-x: auto` on `.virtualScrollContainer` with `min-width: 1095px` to guarantee that columns never squish, overlap, or wrap.

2. **Domain Separation (Screenshot 235046)**:
   - **Defect**: The Inbound Leads workspace displayed generic pipeline tabs (`All Deals 1000`, `Deal ID`), causing conceptual confusion between Discovery inquiries and Negotiation deals.
   - **Remediation**: Added `scope?: 'leads' | 'deals'` prop to `<FilterActionBar />`:
     - On `/admin/leads`: First tab displays **\"All Inquiries\"**, table header says **\"Lead ID\"**, and copy button copies **\"Lead ID\"**.
     - On `/admin/deals`: First tab displays **\"All Deals\"**, and table header says **\"Deal ID\"**.

3. **Next SLA Sorting Engine**:
   - Added `next_follow_up` to `SortField` union and comparator engine in `LeadsDataGrid.tsx`.
   - Users can sort the pipeline ascending/descending by upcoming SLA touchpoints with interactive SVG sorting indicators.

4. **Skeleton Layout Parity (CLS < 0.005)**:
   - Synchronized `LeadsTableSkeleton.tsx` and `LeadsTableSkeleton.module.scss` to the exact 9-column metrics with `min-width: 1095px`.
   - Eliminates layout shift when React 19 server components stream commercial records.

---

### Verification & Compliance Evidence
- **TypeScript Strict Mode**: `npx tsc --noEmit` passed with 0 errors.
- **Dedicated Phase 4 Test Suite**: `tests/unit/phase-4-brand-upgrade-datagrid.test.ts` passed 11/11 tests.
- **Server Action Boundaries**: `npm run test:boundaries` passed 100% (42 valid async server actions).
- **Full Unit Test Suite**: `npm run test:unit` passed all 773 tests (226 suites).
- **Next.js Production Build**: `npm run build` passed cleanly with static page generation across all 28 routes.
- **Author Identity**: Commits authored strictly as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
- **Anti-Slop Commandments**: Zero generic blue (`#2563eb`), zero raw unicode arrows, all tap targets >= 44px.
