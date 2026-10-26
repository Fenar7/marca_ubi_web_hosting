## Phase 8 Milestone: Client 360° Dossier, Omnichannel Touchpoint Studio & State Machine Record Locking

### 1. Executive Summary
This Pull Request delivers **Phase 8: Client 360° Dossier, Omnichannel Touchpoint Studio & State Machine Record Locking** of the Marca Ubi Enterprise Agency CRM & Sales Intelligence Platform into the base branch `feature/sales-funnel-crm`. Phase 8 establishes the deal management, client inspection, and omnichannel engagement surface (`/admin/leads`), giving agency leadership and closers a complete interactive workspace for deal dossiers, communication logging, and commercial governance.

The architecture integrates a high-performance slide-over dossier drawer (`min(840px, 100vw)`), an omnichannel interaction composer (Phone Call, WhatsApp, Email, Internal Notes), a specular hairline activity timeline with live @mention and #tag tokenization, guarded stage transition modals (Negotiation, Lost, Converted), and dual-layer post-conversion record locking enforced across Next.js 16 Server Actions and PostgreSQL Row Level Security (RLS).

---

### 2. Comprehensive Phase 8 Scope Breakdown

#### Sprint 8.1: Client 360 Sliding Drawer Shell & Organization Dossier
- **Slide-over Drawer Shell (`ClientDossierDrawer.tsx` & `DossierDrawer.module.scss`)**:
  - Implements a responsive sliding drawer shell (`min(840px, 100vw)` on desktop, `100vw` on mobile) with smooth cubic-bezier transitions (`cubic-bezier(0.16, 1, 0.3, 1)`).
  - Specular frosted backdrop scrim (`backdrop-filter: blur(12px)`), WCAG 2.1 AA focus trap (`Tab`/`Shift+Tab` loop), `Escape` key dismissal, and scroll lock with scrollbar width compensation.
  - Shell-level custom event routing (`open-lead-drawer`, `close-lead-drawer`) connecting Data Grid rows and mobile cards to the dossier.
- **Organization Dossier (`OrganizationDossier.tsx` & `dossierUtils.ts`)**:
  - Monospace Deal ID token (`LD-XXXX`) with one-click clipboard copying and toast notification.
  - Deep-link communication protocols: RFC 3966 sanitized Click-to-Call (`tel:`) and prefilled WhatsApp Click-to-Chat (`https://wa.me/`).
  - Strict website URL protocol enforcement (`https://` / `http://`) with `rel="noopener noreferrer"`.
  - Tabular currency formatting supporting Indian Lakhs and Crores (`₹12.50 L`, `₹1.50 Cr`).
- **Raw Brief Accordion (`RawBriefAccordion.tsx`)**:
  - Interactive questionnaire accordion parsing client brief payloads safely without `dangerouslySetInnerHTML`.
  - Filters internal metadata keys (`submitted_at`, `creator_id`, `created_via`) and formats questions into human-readable agency titles.

#### Sprint 8.2: Omnichannel Activity Timeline & Quick Action Interaction Composer
- **Quick Action Interaction Composer (`QuickActionComposer.tsx`)**:
  - 4-Tab interaction composer supporting **Phone Call** (with live duration stopwatch and outcome selector), **WhatsApp** (with message template presets), **Email** (subject line + message body), and **Internal Notes**.
  - Synchronous ref submission lock blocking rapid duplicate multi-click submissions.
  - 44px+ minimum tap target geometry meeting Apple HIG and WCAG 2.5.5 standards.
- **Omnichannel Activity Timeline (`ActivityTimeline.tsx`)**:
  - Specular hairline vertical track with glowing activity glyphs for calls, chats, emails, notes, and system stage transitions.
  - Live tokenization of `@teammate` mentions and `#operational` tags into styled pills without raw HTML injection.
  - Relative timestamp display with RFC 3339 absolute date tooltips and empty state presentation.
- **Server Actions & Activity Ledger Engine (`src/app/actions/leadActivityActions.ts`)**:
  - `recordLeadActivityAction` and `getLeadActivitiesAction` with strict Zod validation and length bounds.
  - Caller session verification and active status check (`profile.status === 'active'`).
  - 4-Tier RBAC: `viewer` blocked with 403 Forbidden; `sales_executive` sandboxed to assigned accounts; `sales_manager` and `admin` maintain global access.
  - Atomic touchpoint synchronization updating `leads.updated_at` on every logged activity.

#### Sprint 8.3: Guarded Stage Transition Modals, Input Validation & State Machine Record Locking
- **Guarded Stage Transition Coordinator (`StageTransitionModal.tsx`)**:
  - Central modal coordinator handling backdrop blur scrim, WCAG AA focus trapping, and stage-specific dialog mounting.
  - Negotiation Stage dialog enforcing positive deal valuation (`expected_value > 0`) and target close date.
- **Lost Reason Attribution Modal (`LostReasonModal.tsx`)**:
  - Standardized 7-option loss catalog (`Budget Incompatible`, `Selected Competitor`, `Project Cancelled`, `Timeline Mismatch`, `Unresponsive / Ghosted`, `Terms Inflexible`, `Other`).
  - Real-time character counter enforcing $\ge 10$ characters for explanatory notes when selecting 'Other'.
- **Converted Celebration Modal (`ConvertedCelebrationModal.tsx`)**:
  - Requires signed contract value (`finalRevenue > 0`), signed date, and commercial payment terms.
  - High-performance 60fps canvas particle celebration burst (75 particles with gravity physics and alpha decay).
  - Prominent post-conversion record locking notice.
- **Dual-Layer Record Locking Architecture**:
  - Server Action Layer (`stageTransitionActions.ts`, `leadInlineActions.ts`, `leads.ts`): Blocks non-admins (`sales_manager`, `sales_executive`, `viewer`) from mutating converted leads.
  - Database Layer (`20261015000012_converted_lead_locking_policy.sql`): PostgreSQL RLS policy `USING` clause requires `converted_at IS NULL` for non-admins.
  - Linear State Machine Progression: Strictly blocks illegal direct jumps (`New`/`Contacted` $\rightarrow$ `Converted`) and prevents converting `Lost` deals without reopening.
  - Administrative unlock workflow (`unlockConvertedLeadAction`) with security audit logging.

---

### 3. Automated Verification Matrix
- **Sprint 8.1 Delivery Gate (`scripts/verify-sprint-8-1.ts`)**: **20 / 20 checks passed (100%)**.
- **Sprint 8.2 Delivery Gate (`scripts/verify-sprint-8-2.ts`)**: **30 / 30 checks passed (100%)**.
- **Sprint 8.3 Delivery Gate (`scripts/verify-sprint-8-3.ts`)**: **24 / 24 checks passed (100%)**.
- **Automated Regression Suite**: **126 / 126 unit tests passed cleanly across Sprints 7.1 through 8.3**.
- **TypeScript Static Verification (`tsc --noEmit`)**: **0 errors**.
- **Anti-AI-Slop AST Gate**: 0 `any` types, 0 generic blue (`#2563eb`), 0 decorative comment banners, 0 toy emojis, 0 em-dashes.
- **Git Authorship**: Authored strictly as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
- **Merge State**: Strict zero-merge policy enforced; PR remains strictly OPEN awaiting manual human review on GitHub.
