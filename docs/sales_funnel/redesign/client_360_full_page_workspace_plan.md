# Architectural Specification & Master Plan: Full-Page Client 360° Lead/Deal Dossier Workspace
**Document Reference**: `docs/sales_funnel/redesign/client_360_full_page_workspace_plan.md`  
**Author**: Staff UI/UX Designer, Senior Fullstack Route Engineer & Head Agent  
**Design Tokens**: Accordion Executive Advisory × Sypher Minimalist Light Canvas × Marca Ubi Dark Luxury Brand Archetypes  
**Target Routes**: `/admin/leads/[id]` (Inbound Lead Dossier) and `/admin/deals/[id]` (Pipeline Deal Dossier)

---

## 1. Executive Summary & Problem Audit

### Shortcomings of the 840px Slide-Over Drawer
Inspection of the current drawer implementation (`ClientDossierDrawer.tsx`, `DossierDrawer.module.scss`) and user telemetry (`Screenshot 2026-10-20 161140.png`) revealed critical operational limitations:

1. **Extreme Horizontal Cramping**: The 840px drawer splits its content into two narrow ~380px columns (usable inner width ~340px). This causes fields such as `Business Email: synthetic_8500_u5vv3hrj@bench.mar...` to be severely truncated with an ellipsis.
2. **Awkward Text & Pill Wrapping**: High-priority CTAs (`RECORD TOUCHPOINT`) and interaction tabs (`Internal Note`) wrap onto two lines when width is constrained. Duration pills wrap into 2 disjointed rows (`5m, 15m, 30m` above `45m, 60m`).
3. **Questionnaire Bottleneck**: Ingestion brief questionnaires are crushed into a tiny accordion at the bottom of the left column. Paragraph answers cause vertical stretching and high friction.
4. **Stacked Scroll Tax**: Users must scroll dual narrow columns asynchronously; scrolling the activity history hides the deal valuation and client details.
5. **No Deep-Linking or Parallel Tabbing**: Account executives cannot middle-click or open multiple client dossiers in separate browser tabs for deal comparison.

---

## 2. Proposed Architecture: Dedicated Full-Page Workspace

Instead of an overlay drawer that occludes the data table, clicking a lead row or "View >" navigates to a dedicated, full-page workspace at `/admin/leads/[id]` (and `/admin/deals/[id]`).

```
+---------------------------------------------------------------------------------------------------------------------------+
| MARCA UBI CRM  /  Inbound Leads  /  [ LD-10343 (copy) ]                                         [ ← Back to Leads ]        |
+---------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                           |
| Morar Group 8500.   (● Proposal Sent ▾)   [ ⚡ Convert to Deal ]   [ ✎ Edit Scope ]   [ ◷ Schedule Touchpoint ]            |
|                                                                                                                           |
+-------------------------------------------------------------+-------------------------------------------------------------+
| LEFT RAIL: COMMERCIAL & OPERATIONAL INTELLIGENCE (7 Cols)   | RIGHT RAIL: TOUCHPOINT STUDIO & ACTIVITY LEDGER (5 Cols)    |
+-------------------------------------------------------------+-------------------------------------------------------------+
| [ STRIPE SCORECARDS: COMMERCIAL KPI RIBBON ]                | [ RAPID TOUCHPOINT STUDIO (Sticky) ]                        |
| +---------------------+-------------------+---------------+ | +---------------------------------------------------------+ |
| | EXPECTED VALUATION  | PIPELINE PRIORITY | CLOSING PROB. | | | [✆ Call]   [💬 WhatsApp]   [📅 Meeting]   [📝 Note]    | |
| | ₹ 2.12 L            | HIGH PRIORITY     | 65% (Weighted)| | +---------------------------------------------------------+ |
| | Retainer Tier 2     | SLA: < 4h Due     | ₹ 1.38L Ev    | | | CALL OUTCOME: [ Connected                        ▾ ]  | |
| +---------------------+-------------------+---------------+ | | CALL DURATION:                                          | |
|                                                             | | [ 5m ]   [ 15m (active) ]   [ 30m ]   [ 45m ]   [ 60m ]   | |
| [ ORGANIZATION & MARKET CARD ]                              | |                                                         | |
| Company:          Morar Group 8500                          | | DISCUSSION SUMMARY:                                     | |
| Verified Domain:  https://aware-coal.com [↗ Visit] [Live]  | | +-----------------------------------------------------+ | |
| Industry Sector:  SaaS Enterprise / Digital Infrastructure  | | | Discussed technical scoping for Phase 2 retainer.   | | |
| Account Segment:  Enterprise Tier-1 Client                  | | | Key objection: delivery timeline requires 3 wks.   | | |
| Inbound Source:   Direct Website Inquiry (/start-project)   | | +-----------------------------------------------------+ | |
|                                                             | | 124 chars  •  [#urgent] [#retainer]  [ RECORD TOUCHPOINT ]| |
| [ PRIMARY DECISION MAKER & STAKEHOLDER MATRIX ]             | +---------------------------------------------------------+ |
| Full Name:        Melvina Bogisich                          |                                                             |
| Role / Title:     VP Technology & Infrastructure            | [ SCHEDULE & PIPELINE COORDINATES ]                         |
| Direct Phone:     +971 50 042 6330  [E.164 Verified]        | Next Touchpoint:   Tomorrow, 10:30 AM (Follow-up Call)      |
| Business Email:   synthetic_8500_u5vv3hrj@bench.marcau.com  | Inquiry Date:      Oct 18, 2026 (2 days ago)                |
|                   [Click to Copy]  [Compose Email ↗]        | Last Update:       Oct 20, 2026, 11:52 AM                   |
| Actions:          [ ✆ Call Client ]   [ 💬 WhatsApp Chat ]  | Assigned Staff:    UN Unassigned [Reassign ▾]               |
|                                                             |                                                             |
| [ COMMERCIAL ENGAGEMENT SCOPE ]                             | [ OMNICHANNEL ACTIVITY TIMELINE (8) ]                       |
| Services:         [ Full-Suite Advisory ] [ Web & Digital ] | |                                                           |
| Budget Bracket:   Custom Retainer (₹ 2.0L - ₹ 5.0L / mo)    | | ● [✆ Call]  Connected (15m)  •  Oct 20, 11:52 AM          |
| Contract Model:   Fixed Monthly Retainer                    | |   Discussed delivery roadmap with Melvina Bogisich.       |
|                                                             | |   by System Staff (SS)                                    |
| [ INGESTION & ORIGINAL BRIEF QUESTIONNAIRE (EXPANDED) ]     | |                                                           |
| +---------------------------------------------------------+ | | ● [⚡ Event] Deal Reassigned  •  Oct 18, 04:30 PM          |
| | Project Objectives: Full headless Next.js digital       | | |   Reassigned to Commercial Team Alpha.                      |
| | architecture for global multi-region luxury deployment.  | | |   by Lead Router Service                                  |
| | Deliverables: 14 High-fidelity pages, CMS integration.  | | |                                                           |
| | Launch Deadline: Q1 2027 (Strict enterprise milestone). | | | ● [📥 Brief] Inbound Brief Dispatched  •  Oct 18, 09:15 AM   |
| | Budget Ceiling: ₹ 2.50L upfront + ₹ 50k monthly retainer | | |   Ingested from /start-project form.                      |
| +---------------------------------------------------------+ | +---------------------------------------------------------+ |
|                                                             |                                                             |
| [ EXECUTIVE STRATEGIC NOTES (NOTION CALLOUT CARD) ]         |                                                             |
| +---------------------------------------------------------+ |                                                             |
| | ✎ Executive Deal Takeaways: Client has immediate budget | |                                                             |
| | approval. Fast-track proposal draft before Oct 24.      | |                                                             |
| | [ Save Notes ]   •   Last edited 3h ago by Admin        | |                                                             |
| +---------------------------------------------------------+ |                                                             |
+-------------------------------------------------------------+-------------------------------------------------------------+
```

---

## 3. Directory & Route Layout (Next.js 16 App Router)

```
src/app/admin/(workspace)/
├── leads/
│   ├── page.tsx                           # Inbound discovery data grid (with ?leadId= auto-redirect)
│   ├── leads.module.scss
│   ├── LeadsWorkspaceClient.tsx
│   └── [id]/
│       ├── page.tsx                       # Server Component (RSC): Direct server fetch, RBAC guard, dynamic metadata
│       ├── loading.tsx                    # Zero-CLS Streaming Suspense fallback skeleton
│       ├── not-found.tsx                  # Bespoke 404 Deal Not Found surface
│       └── error.tsx                      # Route error boundary
├── deals/
│   ├── page.tsx                           # Pipeline deals Kanban & table (with ?dealId= auto-redirect)
│   ├── deals.module.scss
│   ├── DealsWorkspaceClient.tsx
│   └── [id]/
│       ├── page.tsx                       # Server Component (RSC): Pipeline deal dossier
│       ├── loading.tsx                    # Zero-CLS Streaming Suspense fallback skeleton
│       └── not-found.tsx                  # 404 Deal Not Found surface
└── components/
    └── DossierWorkspace/                  # Unified Full-Page Client 360° Dossier Engine
        ├── LeadDossierWorkspaceClient.tsx  # Master interactive client component
        ├── LeadDossierWorkspace.module.scss# Responsive layout tokens (7:5 asymmetric split)
        ├── DossierHeaderBar.tsx           # Sticky executive command header
        ├── CommercialKpiRibbon.tsx        # 3 Stripe Scorecards (Valuation, Priority, Probability)
        ├── OrganizationDossier.tsx        # Organization, market, primary contact, scope coordinates
        ├── QuickActionComposer.tsx        # Call, WhatsApp, meeting, note rapid logger
        ├── ActivityTimeline.tsx           # Chronological omnichannel touchpoint audit log
        └── RawBriefAccordion.tsx          # Expanded inbound brief questionnaire answers
```

---

## 4. Key Engineering Invariants & Data Flow

1. **Direct RSC Data Fetching (0ms Network Waterfall)**:
   - In `src/app/admin/(workspace)/leads/[id]/page.tsx`, `getLeadDetails(id)` is called directly server-side during RSC execution.
   - Dynamic metadata (`generateMetadata`) titles the page with the company name and deal token (e.g. `Morar Group 8500 (LD-10343) | Client 360° Dossier`).
   - Page hydrates immediately with zero Cumulative Layout Shift (CLS: 0.00).

2. **Table & Kanban Navigation**:
   - In `LeadsDataGrid.tsx`: Clicking a row or clicking the "View >" inspect button navigates via `router.push('/admin/leads/' + lead.id)`.
   - In `LeadMobileCard.tsx`: Tapping a mobile card navigates directly to `/admin/leads/${lead.id}`.
   - In `DealsWorkspaceClient.tsx` & `CurrentDealsTable.tsx`: Clicking any deal card or row navigates to `/admin/deals/${deal.id}`.

3. **Zero-Loss Backward Compatibility**:
   - Visiting `/admin/leads?leadId=UUID` automatically redirects (HTTP 307) to `/admin/leads/UUID`.
   - Visiting `/admin/deals?dealId=UUID` redirects to `/admin/deals/UUID`.
   - Global event listener for `open-lead-drawer` in `AdminWorkspaceShell.tsx` navigates to `/admin/leads/${id}`, ensuring all legacy components work without modification.

4. **Role-Based Access Control (RBAC)**:
   - `admin` & `sales_manager`: Unrestricted access across all leads and deals.
   - `sales_executive`: Sandboxed to leads assigned to their portfolio (`lead.assigned_to === user.id`). Attempting to view unassigned leads displays a dedicated 403 access-denied state with return navigation.
   - `viewer`: Read-only access; mutation controls ("Edit Scope", "Schedule Touchpoint", "Convert", and interaction loggers) are disabled.

5. **Server Action Cache Invalidation**:
   - `updateLeadDetailsAction`, `logLeadActivityAction`, `scheduleFollowUpAction`, and `convertInboundLeadToDealAction` revalidate both `/admin/leads/[id]` and `/admin/deals/[id]`.

---

## 5. Responsive Design & Touch Targets

- **Desktop (> 1280px)**: 7:5 Asymmetric Two-Rail Layout (60% commercial cards / 40% sticky interaction studio and timeline).
- **Tablet / Small Laptop (768px - 1279px)**: Clean single-column stacked layout with responsive full-width cards.
- **Mobile (< 768px)**:
  - 100% fluid card stack with 16px viewport padding.
  - Sticky bottom mobile action dock (`[ ✆ Call ]`, `[ 💬 WhatsApp ]`, `[ ⚡ Convert ]`) with 44px tap targets.
  - Zero auto-zoom: all inputs enforce `font-size: 16px`.
