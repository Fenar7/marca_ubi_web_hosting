# Team & User Management Workspace Redesign Plan (`/admin/team` & `/admin/team/[id]`)

> **Design Read:** `ENERGY 1 / RHYTHM 2 / MOTION 2`  
> **Scope:** `/admin/team` (Directory & Access Roster), `/admin/team/[id]` (Personnel Dossier & Deal Ledger), `/admin/users` & `/admin/user-management` aliases, plus all Team Modals/Drawers.  
> **Governing Standards:** `DESIGN.md` (Marca Ubi Editorial Light Luxury), `AGENTS.md`, `frontend-design`, `ui-ux-pro-max`, `master-ui-ux-design-system`, `antislop` suite (`antislop`, `antislop-ui`, `antislop-human`, `antislop-layoutmobile`, `antislop-copywriting`).

---

## 1. Honest Audit of Current Implementation (Screenshots + Source Inspection)

Inspecting [Screenshot 2026-11-24 234213.png](file:///C:/Users/firoz/Pictures/Screenshots/Screenshot%202026-11-24%20234213.png), [Screenshot 2026-11-24 234229.png](file:///C:/Users/firoz/Pictures/Screenshots/Screenshot%202026-11-24%20234229.png), and the underlying files reveals **seven structural and visual defects** causing this screen to clash with the rest of the Commercial Desk (`/admin`, `/admin/analytics`, `/admin/leads`):

1. **Stale Font Stack & Heavy Bold KPIs:**
   - [team.module.scss](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/(workspace)/team/team.module.scss#L48-L216) uses `var(--font-admin-primary, 'MessinaSans', sans-serif)` and `font-weight: 700` on `.pageTitle`, `.kpiValue`, `.fullName`, and `'MessinaSansBook'` on CTA buttons, while `/admin/team/[id]` falls back to `'JetBrains Mono'` and generic system sans.
   - The rest of the Commercial Desk uses **Circular XX** (`--font-circular`) for display titles, **Helvetica Neue 300 Light** (`--font-helvetica-neue`) with `tabular-nums lining-nums` for telemetry figures, and **Graphik** (`--font-graphik`) for workspace controls and table cells.

2. **Three Redundant Stacked Headers Pushing Content Below the Fold:**
   - Breadcrumb (`AdminBreadcrumbs.tsx`) labels the route `User Management` while the sidebar and `<h1>` call it `Team`.
   - Top header renders `AGENCY OPERATIONS` / `Team` / `Manage your team and their access to the CRM.` with an empty right side.
   - Below the 4 equal KPI boxes sits a *second* sub-header (`People and access` / `Directory`) with the `+ Add Member` button parked awkwardly left-aligned above the tabs.
   - Below the underline tabs sits a *third* sub-header (`All team members` / `Search the directory...` / `4 of 4 shown`).
   - Result: Nearly 480px of vertical chrome and three competing headings push the member rows down to the bottom of a laptop viewport.

3. **Cool-Slate Tailwind Palette & Leftover Lemon Fallback Pollution:**
   - Stylesheets across `team/` and `team/[id]/` are filled with cool slate/navy hexes (`#1f242f`, `#0f172a`, `#1e293b`, `#334155`, `#475569`, `#64748b`, `#94a3b8`, `#cbd5e1`, `#e2e5ea`, `#f1f5f9`, `#f8fafc`, `#f4f6f9`, `#eef0f3`) instead of Marca Ubi's warm paper-white and architectural neutral system (`#fbfbfa`, `#ffffff`, `#f5f5f3`, `#efefed`, `#111111`, `#454542`, `#575753`, `#e7e7e4`).
   - [team.module.scss](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/(workspace)/team/team.module.scss#L814) still contains `#e4f375` (old lemon yellow) as a hover fallback on `.submitDrawerButton:hover` and `.doneButton:hover`.

4. **Equal-Card KPI Strip Redundancy (R-20 / `DESIGN.md` Violation):**
   - `MEMBERS SHOWN (4)`, `ACTIVE (4)`, `SUSPENDED (0)`, `ADMINS AND MANAGERS (2)` sit in four identical boxes directly above category tabs that already display `All Personnel 4`, `Leadership & Admins 2`, `Sales Executives 2`, `Suspended / Inactive 0`.

5. **Action Pill Overload & Redundant Controls ("Pill Soup"):**
   - Every table row displays up to 8 rounded pills/badges simultaneously: Role badge + `🔒 8/9 Tabs` pill + `19 deals (₹35,05,000) →` pill + `Reassign` pill + `Permissions` pill + `Role` pill + `Suspend`/`Self` pill.
   - Clicking `8/9 Tabs` opens `EditUserPermissionsModal` AND the adjacent `Permissions` button does the exact same thing.
   - The caller's own row renders a disabled-looking `Self` button pill inside the Actions column, even though `(You)` already renders next to the user's name.

6. **Duplicated Modal State & Context-Loss Navigation:**
   - Both [TeamWorkspaceClient.tsx](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/(workspace)/team/components/TeamWorkspaceClient.tsx) and [CommercialDirectoryTable.tsx](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/(workspace)/team/components/CommercialDirectoryTable.tsx) mount separate instances of `EditUserPermissionsModal`, `LeadReassignmentWizardModal`, and `SuspendUserModal` instead of sharing one clean modal/drawer state in the workspace coordinator.
   - Quick governance tasks (changing permissions + role + reviewing audit status) currently bounce across 3 separate centered modals or navigate away to `/admin/team/[id]`.

7. **Mobile Horizontal Table Scroll Leak & Missing `loading.tsx`:**
   - Below `768px`, `.tableResponsiveWrapper` relies on `overflow-x: auto`, forcing horizontal scrolling across a 7-column wide table with 4 action buttons per row instead of reflowing into purpose-built mobile member cards (`antislop-layoutmobile`, `DESIGN.md`).
   - There is no `src/app/admin/(workspace)/team/loading.tsx` skeleton to prevent Cumulative Layout Shift (`CLS`) on route transitions.

---

## 2. Industry & Design Benchmarks Synthesized

Grounded in current B2B SaaS user-directory and RBAC governance best practices (Linear, Vercel, Stripe, Raycast **structural patterns and density proportions only** — skinned 100% in **Marca Ubi Editorial Light Luxury** per `DESIGN.md` and `antislop` R-30):

| UX Concern | SaaS Benchmark Pattern | Marca Ubi Editorial Adaptation |
| :--- | :--- | :--- |
| **Page Masthead** | Single header rail with title, 1-line scope description, and 1 primary action (Vercel / `DESIGN.md`). | `Team` (`Circular XX`) + 1 sentence + right-aligned `+ Add Member` (`#ea002a`, 44px height). |
| **Summary Telemetry** | Purposeful operational metrics (not repeating tab counts), integrated in a compact strip. | 3-metric asymmetric summary bar: **Active Seats** (role split), **Assigned Pipeline** (live active deals + full-digit `en-IN` INR), **Security & Access** (suspended + pending password resets). |
| **Directory Table** | 5–6 purposeful columns, stacked identity cells (`Name` + `Email`), progressive disclosure for actions, `~68px` breathing rhythm. | Merged `Role + Job Title` column, clean `X / 9 tabs` inline trigger, numeric `N deals` + INR figure, static status dot + label, single `Manage` drawer trigger + `···` quick menu. |
| **Editing Flow** | Side-drawer Inspector (Linear style) for single-member governance without leaving table context; dedicated full dossier route kept for deep deal ledgers & timelines. | Slide-over **Member Governance Drawer** (`?member=<id>`) containing Role, 3-enclave Tab Permissions toggles, Security actions, and Deal Reassignment link; full profile stays at `/admin/team/[id]` (also restyled). |
| **Mobile Reflow** | Zero horizontal scroll: below `900px`, table dissolves into stacked member cards with >=44px action buttons; filters wrap cleanly. | Dedicated responsive member row cards at `< 900px` with full-width `Manage` + `44x44` `···` trigger. |

---

## 3. Target Visual & Typography System (WCAG AA Verified)

All color pairings below were mathematically verified against WCAG 2.1 thresholds (4.5:1 normal text, 3.0:1 large text & UI boundaries):

| Token Role | Exact Value | Usage & Contrast Verification |
| :--- | :--- | :--- |
| **Canvas / Shell Backing** | `#fbfbfa` (`--admin-canvas-bg`) | Outer workspace backdrop (`#111111` ink = **18.24:1 PASS**) |
| **Primary Card / Table Surface** | `#ffffff` (`--admin-card-bg`) | Unified roster container, summary bar, drawers, modals (`#111111` ink = **18.88:1 PASS**) |
| **Quiet Surface / Hover / Header Row** | `#efefed` / `#f7f7f5` | Table header rail, segmented control track, row hover (`#111111` ink = **16.40:1 PASS**) |
| **Primary Ink** | `#111111` | Headings, member names, active tab text, numeric KPIs |
| **Secondary Ink** | `#454542` | Subtitles, job titles, dropdown text (**9.62:1** on `#ffffff` **PASS**) |
| **Muted / Subtext Ink** | `#575753` (upgraded) / `#696965` | Email sublines, column headers, zero-state text (`#575753` = **7.26:1** on white / **6.30:1** on `#efefed` **PASS**) |
| **Interactive Control Border** | `#8e8e88` resting -> `#111111` focus/hover | Inputs, selects, secondary buttons (**>= 3.28:1** non-text boundary contrast **PASS**) |
| **Structural Hairlines** | `#e7e7e4` / `rgba(0,0,0,0.07)` | Table row dividers, summary cell separators |
| **Brand Accent (Strict Key Moments Only)** | `#ea002a` (hover `#c40023`) | Sole `+ Add Member` CTA (**4.63:1** white-on-red **PASS**), active tab 2px underline, critical alerts |
| **Focus Ring** | `#9c001e` (`2px solid`, `2px` offset) | All focusable controls (**7.81:1** on white **PASS**) |
| **Semantic Status Badges** | Emerald `#065f46` / `#ecfdf5` (**7.29:1**), Amber `#78350f` / `#fffbeb` (**8.75:1**), Crimson `#9c001e` / `#fff0f2` (**7.81:1**) | Always paired with explicit text labels (Active, Suspended, Roles) |

### Typography Mapping
- **Page & Drawer Display Titles (`Team`, drawer member name):** `var(--font-circular), -apple-system, sans-serif`, `font-weight: 500`–`700`, `letter-spacing: -0.03em`.
- **All Quantitative Telemetry (`Active Seats`, `37 deals`, `₹64,65,000`, `8/9 tabs`, `4 / 4` counts):** `var(--font-helvetica-neue), 'Helvetica Neue', sans-serif`, `font-weight: 300`, `letter-spacing: -0.035em`, `font-variant-numeric: tabular-nums lining-nums`.
- **Body, Column Labels, Controls, Buttons:** `var(--font-graphik), -apple-system, sans-serif` (11px `0.06em` uppercase column labels; 13–14px body/controls).

---

## 4. Detailed Architecture & Component Redesign Plan

### Phase 1: Navigation & Workspace Chrome Harmonization
1. **Unify Route Naming ([AdminBreadcrumbs.tsx](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/components/layout/AdminBreadcrumbs.tsx#L24-L26)):**
   - Update `ROUTE_NAME_MAP` for `team`, `users`, and `user-management` from `'User Management'` to `'Team'` so breadcrumb, sidebar navigation (`Team`), and page `<h1>` (`Team`) are 100% consistent.
2. **Collapsible Single Editorial Masthead ([team/page.tsx](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/(workspace)/team/page.tsx) & `TeamWorkspaceClient.tsx`):**
   - Render one crisp header row:
     - Left: `<h1>Team</h1>` (`Circular XX`) + one concise subtitle (*"Manage agency seats, pipeline ownership, and workspace permissions."*). Remove the redundant `AGENCY OPERATIONS` eyebrow, the duplicate `People and access / Directory` header, and the duplicate `All team members` heading block.
     - Right (when `role === 'admin'`): Single primary `[ + Add Member ]` button (`min-height: 44px`, `#ea002a` fill, `8px` radius). Move the trigger cleanly into the page header via `AddMemberHeaderButton.tsx` (mirroring [NewLeadHeaderButton.tsx](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/(workspace)/leads/NewLeadHeaderButton.tsx)) so no header action sits stranded below cards.
3. **Asymmetric Operational Telemetry Strip (Replaces 4 Equal KPI Boxes):**
   - Compact 3-cell horizontal strip (`#ffffff` background, `1px solid #e7e7e4`, `12px` radius, `border-right` hairline dividers, ~72px height) computing real roster metrics in `page.tsx`:
     1. **Active Seats:** `{activeCount} active` (`Helvetica Neue 300`), sublabel `{leadershipCount} leadership · {salesCount} sales · {viewerCount} viewer`.
     2. **Assigned Pipeline Load:** `{totalActiveDeals} active deals`, sublabel `₹{full en-IN valuation} across active assignees` (using `formatRupees`, zero Crore/Lakh abbreviation per `DESIGN.md`).
     3. **Governance Health:** Dynamic actionable state (`{suspendedCount} suspended · {pendingResetCount} pending first login` if `> 0` with crimson link to Suspended tab, or `All accounts verified · 0 suspended` in calm emerald/neutral).

### Phase 2: Unified Control Rail & Single-Source State Coordinator
1. **Combined Segmentation + Filter Toolbar:**
   - Top row inside the directory container: Underline tabs on left (`All`, `Leadership`, `Sales`, `Suspended` with `tabular-nums` counters and `#ea002a` 2px bottom indicator); `"Showing X of Y"` counter subtle on right.
   - Filter bar directly underneath (separated by `1px solid rgba(0,0,0,0.06)`):
     - Search input (`44px` height, `8px` radius, `/` keyboard shortcut focuses input, `Esc` clears or blurs, matching `/admin/leads`).
     - Role dropdown (`All Roles`, `Admin`, `Sales Manager`, `Sales Executive`, `Viewer`) and Status dropdown (`All Statuses`, `Active`, `Suspended`) with `8px` radius and `#8e8e88` border (`>= 3:1` boundary).
     - Segmented `Table | Cards` view toggle inside quiet `#efefed` track (`44px` hit targets).
     - Active Filter Reset chip shown whenever `activeTab !== 'all' || searchQuery || selectedRole !== 'all' || selectedStatus !== 'all'`.
2. **Eliminate Duplicated Modal State:**
   - Refactor `CommercialDirectoryTable.tsx` to become a pure presentation/interaction component accepting callbacks (`onInspectMember`, `onOpenPermissions`, `onChangeRole`, `onOpenReassign`, `onSuspend`, `onReactivate`) from `TeamWorkspaceClient.tsx` — sharing the exact same single modal/drawer tree with `PersonnelCardGrid.tsx`.
   - Extract `ModifyRoleModal` (currently inline inside `CommercialDirectoryTable.tsx`) into its own clean component with focus trap and Editorial styling.

### Phase 3: High-Density Editorial Roster Table & Card View Overhaul
1. **6-Column `CommercialDirectoryTable` (Desktop `>= 900px`):**
   - **Columns:**
     1. **Member:** `40×40px` square-rounded (`8px` radius, matching `LeadsDataGrid`) photo or monochrome `#efefed`/`#111111` initials tile + subtle hover camera icon if editable (`isSelf || isAdmin`). Name (`Circular XX` / `Graphik 500`, link to `/admin/team/[id]`) + inline `(You)` tag; email & phone below in `12px` `#575753`.
     2. **Role & Title:** Compact `6px`-radius role tag (`Admin`, `Sales Manager`, `Sales Executive`, `Viewer`) stacked above `job_title` (`#454542`), cutting horizontal clutter by 1 full column.
     3. **Workspace Access:** Clean `Helvetica Neue 300` readout (`8 / 9 tabs`) formatted as an interactive quiet button (`Configure` subtle affordance on hover for admins; disabled read-only text for non-admins). Replaces the redundant padlock pill + duplicate `Permissions` row button.
     4. **Assigned Portfolio:** `19 deals` + `₹35,05,000` (`en-IN` full-digit, `Helvetica Neue 300`, `tabular-nums`), clicking navigates to `/admin/leads?assigned_to=<id>`; `0 deals` renders cleanly in muted `#696965` without a grey pill container.
     5. **Status:** Static `6px` dot + paired text (`Active` / `Suspended`) matching `DESIGN.md`.
     6. **Actions (Max 2 controls):** `[ Manage ]` button (opens the in-context **Member Governance Drawer**) + `44×44px` `···` overflow menu (`PersonnelActionMenu` with keyboard arrow/Esc navigation for direct *Edit Tab Permissions*, *Change Role*, *Reassign Active Deals* if `>0`, *Suspend / Reactivate* omitted on Self, and *Open Full Profile*).
   - **Keyboard Row Navigation:** `J` / `K` moves focus between visible member rows, `Enter` opens the Governance Drawer (or profile for non-admins), `/` focuses search, `Esc` closes active drawer/menu.

2. **Responsive Mobile Member Stack (`< 900px`):**
   - Replace horizontal table scroll (`overflow-x: auto`) with a dedicated mobile row card stack (`display: none` desktop table below `900px`, `display: flex` mobile list):
     - Header row: `40×40` avatar tile, Name + Title + Role badge + Status badge.
     - Telemetry row: `X / 9 tabs` + `N deals (₹...)` in hairline quiet strip (`#f5f5f3`).
     - Footer row: Full-width `Manage` (`44px` height) + `44×44px` `···` trigger with `8px` gap. Zero horizontal overflow down to `320px`.

3. **Editorial Card Grid Mode (`PersonnelCard.tsx` + `PersonnelCard.module.scss`):**
   - Upgrade from generic 16px rounded slate boxes to crisp `12px` Editorial Luxury cards (`#ffffff`, `1px solid #e7e7e4`, zero rest drop shadow), square-rounded `48px` avatar, `Helvetica Neue 300` active deals & valuation numerals, clean capacity progress bar (only when `active_deals_count > 0` for sales roles), and unified `Manage` + `···` footer.

### Phase 4: New In-Context "Member Governance Drawer" (`MemberGovernanceDrawer.tsx`)
- Clicking a member row or `Manage` opens a `480px` right-hand drawer (`backdrop-filter: blur(8px)` on backdrop only per R-10 dose cap) with shallow URL sync (`?member=<id>`) so admins can manage any staff member without losing their filtered table context:
  - **Identity Header:** Avatar (with quick-upload trigger), Name, Email, Status tag, `"Full Performance Dossier ↗"` link (`/admin/team/[id]`).
  - **Role & RLS Scope Panel:** Inline role selector showing exact data visibility impact (*Own deals only*, *Global pipeline view*, *Full governance*, *Read-only*), protected by admin self-demotion guard.
  - **3-Enclave Tab Permissions Matrix:** Grouped switches (`Workspaces`, `Intelligence`, `Administration`) with plain-language descriptions and one-click save (`updateUserPermissions`) + All-Admin immunity notice.
  - **Portfolio & Lifecycle Footer:** Shows active deals count + INR value; offers direct launch triggers for *Reassign Deals Wizard*, *Suspend / Reactivate Account*, and *Security Controls* (`/admin/team/[id]#security`).

### Phase 5: Harmonize `/admin/team/[id]`, Modals, and Loading Skeleton
1. **Restyle All `/admin/team/[id]` Components & SCSS Modules:**
   - Purge `#0f172a`, `#f1f5f9`, `#cbd5e1`, `#e2e8f0`, `#64748b`, `'JetBrains Mono'` across [page.module.scss](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/(workspace)/team/%5Bid%5D/page.module.scss), [ExecutiveMasthead.module.scss](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/(workspace)/team/%5Bid%5D/components/ExecutiveMasthead.module.scss), [CommercialVelocityScorecards.module.scss](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/(workspace)/team/%5Bid%5D/components/CommercialVelocityScorecards.module.scss), [TabPermissionsEnclave.module.scss](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/(workspace)/team/%5Bid%5D/components/TabPermissionsEnclave.module.scss), [PersonnelSecurityEnclave.module.scss](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/(workspace)/team/%5Bid%5D/components/PersonnelSecurityEnclave.module.scss), [PersonnelAuditTimeline.module.scss](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/admin/(workspace)/team/%5Bid%5D/components/PersonnelAuditTimeline.module.scss), and `RepresentativeDealLedger`.
   - Upgrade KPI figures on the profile page to `Helvetica Neue 300 Light` (`tabular-nums lining-nums`), and align page container spacing with the rest of `(workspace)` (`--admin-page-max-width`).
2. **Restyle Shared Governance Modals:**
   - Align `AddTeamMemberModal.module.scss`, `EditUserPermissionsModal.module.scss`, `LeadReassignmentWizardModal`, `SuspendUserModal`, `CredentialRevealModal`, and `AvatarUploadModal` onto the exact warm Editorial token set (`#ffffff`, `#f5f5f3`, `#111111`, `#ea002a`, `8px`/`12px` radii, clean focus-visible `#9c001e` rings, `Circular XX` / `Graphik`).
3. **Create Zero-CLS Loading Skeleton (`src/app/admin/(workspace)/team/loading.tsx`):**
   - Exact spatial reservation matching Masthead (`68px`), 3-cell Summary Strip (`76px`), Filter Toolbar (`104px`), and 6 table skeleton rows (`68px` each) so `CLS = 0.000`.
   - Design clean empty states (first-run vs filtered-out with `"Reset filters"` action), non-admin view-only state (sales managers with directory access see roster read-only without broken admin controls), and retryable error banners.

---

## 5. Security, Data Rules & Regression Guardrails

- **No Synthetic Data:** Zero placeholder metrics, fabricated activity, or synthetic fallback counters (`R-17`, `DESIGN.md`). Numbers reflect live `getTeamRoster()` data only.
- **Role & Server Action Boundaries:** Keep all RBAC authorization checks (`assertActiveAdmin()`, self-demotion guard, all-admin `users`/`settings` immunity, transactional lead reassignment, `must_change_password` counting via real profile field) strictly enforced on the server in [team.ts](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/actions/team.ts).
- **Test Preservation:** Maintain full compatibility with all 7 test suites in `tests/team/` (`provisioning`, `reassignment`, `offboarding`, `avatar_and_roster_governance`, `personnel_profile_workspace`, `team-navigation-404-remediation`, `team_workspace`) plus `npm run test:boundaries`, `tsc --noEmit`, and responsive checks at `320`, `375`, `768`, `1024`, `1440`, and `1920px`.

---

## 6. Execution Sequencing (Upon Your Approval)

1. **Documentation & Tokens:** Save permanent architectural blueprint under `docs/sales_funnel/team_governance_redesign/TEAM_GOVERNANCE_REDESIGN_PLAN.md`; harmonize `AdminBreadcrumbs` & verify `team` data payload (including `must_change_password` status if available in roster DTO).
2. **Directory Core (`/admin/team`):** Build single masthead + `AddMemberHeaderButton`, 3-cell operational summary strip, unified filter rail, pure 6-column `CommercialDirectoryTable` + mobile stack cards, and upgraded `PersonnelCard`.
3. **In-Context Governance Drawer & Modals:** Implement `MemberGovernanceDrawer.tsx`, extract `ModifyRoleModal`, deduplicate modal state into `TeamWorkspaceClient.tsx`, and unify all modal SCSS modules.
4. **Dossier & Skeleton (`/admin/team/[id]` + `loading.tsx`):** Restyle all 6 profile sub-components onto Marca Ubi Editorial tokens and add zero-CLS `team/loading.tsx`.
5. **Verification Gates:** Run `npx tsc --noEmit`, `npm run test:boundaries`, `npm run test:unit` (all `tests/team/*`), Contrast Audit (`contrast-check`), and multi-viewport verification before updating PR / awaiting your manual merge review.
