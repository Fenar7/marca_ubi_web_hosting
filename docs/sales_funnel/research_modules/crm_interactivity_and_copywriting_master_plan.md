# Marca Ubi CRM — Comprehensive Interactivity & Copywriting Master Plan
**Feature Scope**: Full Clickable Interactivity, Client 360 Lead Dossier, Cross-Workspace Drilldowns, and Professional Copywriting Detox  
**Authors**: Team Lead, Expert UI/UX Designer, Expert Frontend Architect, Backend & Security Architect  
**Branch**: `sprint-5.3/crm-workspace-shell`  
**Status**: Plan & Audit Complete — Awaiting User Approval to Execute

---

## 1. Executive Summary & Root Cause Analysis

Following visual audit and user review of the live CRM workspace at `http://localhost:3002/admin`, the system has identified two major areas requiring architectural modernization:

1. **"Dead Displays" & Missing Clickable Interactivity**:
   - In `/admin/leads`, deals and prospects are rendered as static table rows with zero `onClick` triggers, no hover pointer states, and no deal detail view.
   - In `/admin/team`, rep active deal pills (e.g. `19 deals (₹35.0L)`) are plain text rather than active filter triggers into `/admin/leads?assigned_to=...`.
   - In `/admin/analytics`, stage distribution items (e.g. `Proposal Sent: 8 deals, ₹13.6L`) are inert text rather than deep-links to `/admin/leads?stage=...`.
   - In `/admin/tasks`, task cards are static with no quick-action touchpoints (Call, WhatsApp, Mark as Done, Reschedule).
   - In `/admin` (Command Center), scorecards and activity ledger items do not link to their respective records.
   - The workspace lacks a dedicated **Lead 360 Detail Drawer** for inspecting full contact coordinates, creative brief payload JSON, stage progression, and activity ledgers.

2. **Robotic AI-Slop Copywriting & Developer Jargon**:
   - Multiple interfaces feature developer-centric jargon that confuses agency executives:
     - *"Roster"* / *"Commercial Staff Roster"* (military/sports phrasing)
     - *"Ingestion Telemetry"* / *"Webhook Ingestion Telemetry"* (IoT/telecom jargon)
     - *"24-Hour Collision Buffer"* (database engineering term)
     - *"Token Bucket Guarded"* (computer science rate-limiting jargon)
     - *"Macro-financial commercial returns"* (academic economics phrasing)
     - *"Supabase Cloud Node"* (infrastructure trivia)
   - In accordance with `antislop-copywriting` and Marca Ubi luxury design tokens, all terminology will be detoxed into natural, high-ticket agency language.

---

## 2. Professional Copywriting Detox Dictionary

All robotic and technical terms across the application will be replaced as follows:

| Current Robotic / AI Term | Professional Human Agency Replacement | Location / File |
| :--- | :--- | :--- |
| **"Commercial Staff Roster"** | **"Team Directory"** | `team/page.tsx`, `AdminSidebar.tsx` |
| **"Intelligence & Roster"** | **"Team & Analytics"** | `AdminSidebar.tsx` Navigation Group |
| **"Open Roster"** | **"View Team Directory"** | `page.tsx` Quick Launch |
| **"Roster Telemetry"** | **"Team Performance & Accounts"** | `team/page.tsx` |
| **"Agency staff roster, role authorization matrix, and portfolio deal load allocation."** | **"Manage team members, assign client portfolios, and update account permissions."** | `team/page.tsx` Subtitle |
| **"Webhook Ingestion Telemetry"** | **"Website Inquiries & Form Capture"** | `ingestion/page.tsx`, `AdminSidebar.tsx` |
| **"API Gateway & Stream Diagnostics"** | **"Form Gateway & Website Inquiries"** | `ingestion/page.tsx` Subtitle |
| **"Live endpoint telemetry, automated phone/email deduplication collision window..."** | **"Monitor incoming form submissions from the website, automatic duplicate protection, and intake health."** | `ingestion/page.tsx` Subtitle |
| **"24-Hour Collision Buffer"** | **"24-Hour Smart Merge"** | `ingestion/page.tsx` Card |
| **"Token Bucket Guarded"** | **"Automated Spam Shield Active"** | `ingestion/page.tsx` Card |
| **"Atomic E164 Phone Normalization"** | **"International Phone Formatting"** | `ingestion/page.tsx` Checklist |
| **"Case-Insensitive Lowercase Email"** | **"Automatic Email Matching"** | `ingestion/page.tsx` Checklist |
| **"Inquiry Counter Increment"** | **"Repeat Inquiry Tracking"** | `ingestion/page.tsx` Checklist |
| **"Recent Ingestion & Deduplication Feed"** | **"Recent Inbound Submissions"** | `ingestion/page.tsx` Feed |
| **"Pipeline Deals & Ingested Leads"** | **"Deals & Inquiries"** | `leads/page.tsx` Title |
| **"Full commercial inventory, stage progression, deal valuations, and account ownership."** | **"Track incoming inquiries, negotiate high-ticket proposals, and manage deal progression."** | `leads/page.tsx` Subtitle |
| **"Deal conversion velocity, stage distribution, and macro-financial commercial returns."** | **"Track win rates, deal progression, and closed revenue across all agency services."** | `analytics/page.tsx` Subtitle |
| **"Pipeline Inventory"** | **"Total Deals"** | `analytics/page.tsx` Scorecard |
| **"Converted Revenue"** | **"Closed Revenue"** | `analytics/page.tsx` Scorecard |
| **"Supabase Cloud Node"** | **"System Online / Verified Secure"** | `(workspace)/page.tsx` Meta Badge |

---

## 3. Interactive Architecture & Implementation Blueprint

### Work Package 1: Lead 360 Detail Drawer (`LeadDetailDrawer.tsx`)
Create `src/app/admin/components/drawers/LeadDetailDrawer.tsx` mounted globally in `AdminWorkspaceShell.tsx`:
- **Interaction**: Triggered via URL query param (`?leadId=<uuid>`) or row click across any page.
- **Header**: Raycast Monospace deal code (`[LD-1046]`), client name & company, funnel stage advance dropdown, live deal valuation editor, close button (`Esc` or `✕`).
- **Tab 1: Client Coordinates & Scope**: Phone (click-to-call, WhatsApp direct link), email (`mailto:`), service category, source badge, expected valuation in ₹ Lakhs, internal notes.
- **Tab 2: Web Form Submission Brief**: Formatted card displaying the client's creative brief from `/start-project` (timeline, budget bracket, requested services, project scope, extra notes).
- **Tab 3: Communication Ledger**: Chronological activity feed from `public.lead_activities` (calls, WhatsApp messages, stage transitions, notes).
- **Tab 4: Fast Touchpoint Logger**: Quick action form to log a call, meeting note, or reschedule follow-up date/time with a single click.

### Work Package 2: Leads Table Interactivity & URL Synchronization
In `src/app/admin/(workspace)/leads/LeadsWorkspaceClient.tsx` & `page.tsx`:
- Support async `searchParams` on server: `?stage=...`, `?assigned_to=...`, `?bucket=...`, `?leadId=...`.
- Add clickable row handlers (`onClick={() => openLead(lead.id)}`) with pointer cursor and subtle hover highlights.
- Support deep linking: clicking updates URL shallowly so links are shareable without full-page reloads.

### Work Package 3: Cross-Workspace Drilldown Navigation
1. **Analytics ➔ Leads (`analytics/page.tsx`)**:
   - Convert static stage distribution items (*"New: 7 deals, ₹10.2L"*, *"Proposal Sent: 8 deals"*) into clickable links pushing `/admin/leads?stage=${stage.id}`.
   - Convert top scorecards (*"Closed Revenue"*, *"Active Pipeline"*) to filter `/admin/leads?bucket=converted` or `?bucket=potential`.
2. **Team Directory ➔ Leads (`CommercialDirectoryTable.tsx`)**:
   - Convert Active Deals Load pill (`19 deals (₹35.0L)`) into a clickable button pushing `/admin/leads?assigned_to=${member.id}`.
3. **Tasks ➔ Lead Drawer (`tasks/page.tsx`)**:
   - Make task cards clickable to open the deal dossier directly.
   - Add direct `tel:` and WhatsApp links + 1-click "Mark Follow-up Done" button.
4. **Command Center ➔ Workspaces (`page.tsx`)**:
   - Wrap 4 top Stripe Scorecards in interactive `<Link>` elements.
   - Wire recent activity rows to open the corresponding lead or member.

### Work Package 4: Backend Server Actions Expansion (`src/app/actions/leads.ts`)
Implement 5 Server Actions adhering strictly to Next.js 16 Server Action boundaries and RLS policies:
1. `getLeadDetails(leadId: string)`: Fetches full lead coordinates, brief payload JSON, assignees, funnel statuses, and chronological activities.
2. `updateLeadStatus(leadId: string, newStatusId: string, reason?: string)`: Updates deal stage, updates `converted_at` if won, and appends stage change activity.
3. `updateLeadAssignee(leadId: string, newAssigneeId: string, note?: string)`: Gated to `admin` and `sales_manager`; logs reassignment.
4. `addLeadTouchpoint(leadId: string, payload: { activityType, description, nextFollowUp })`: Appends note or interaction to `public.lead_activities`.
5. `updateLeadDealParameters(leadId: string, payload: { expectedValue, priority, notes })`: Edits commercial deal terms.

---

## 4. Verification & Delivery Criteria

1. **Automated Verification**: Extend `scripts/verify-sprint-5-3.ts` to assert all interactive props, deep-link search param handlers, and copywriting replacements.
2. **Type Safety**: `tsc --noEmit` must report 0 errors.
3. **Unit Tests**: Full test suite (`tests/**/*.test.ts`) must maintain 100% pass rate.
4. **Anti-Slop AST Gate**: 0 `any` types, 0 generic blue (`#2563eb`), 0 decorative separator banners.
5. **PR State**: PR #31 remains strictly in an `OPEN` state awaiting manual human review.
