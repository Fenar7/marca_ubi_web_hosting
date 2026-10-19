## Phase 6: Slide-out Dossier Drawer & Centered Modals Architecture

### Executive Summary
Phase 6 visual and architectural modernization refactors the primary slide-out drawer and centered modal dialog architecture across the entire CRM platform (`/admin`). It replaces the remaining legacy dark sci-fi UI with the **Accordion PE Advisory & Sypher Minimalist Light Canvas** design language (`MessinaSans`, `MessinaSansBook`, `#1f242f`, `#525965`, `#eefb87`, `#ffffff`, `#f7f8fa`, `#e2e5ea`).

All data-fetching contracts, Server Actions (`actions/leads.ts`, `actions/deals.ts`, `actions/team.ts`, `actions/reassignment.ts`), and Supabase Row Level Security boundaries remain strictly preserved and hardened with defense-in-depth authorization checks and robust client-side `try/catch` error boundaries.

---

### Workspaces & Components Modernized

#### 1. Slide-out Client 360° Dossier Drawer (`ClientDossierDrawer.tsx`, `DossierDrawer.module.scss`, `OrganizationDossier.tsx`)
- **Accordion PE Advisory Light Surface**: Converted slide-out panel to a floating white card (`#ffffff`) on a clean light canvas with 1px border (`#e2e5ea`) and subtle elevation.
- **Accordion Pill CTA**: Primary action button styled with Lemon Yellow accent (`#eefb87` background, `1px solid #1f242f` border, `MessinaSansBook` uppercase, `min-height: 44px`).
- **Editorial Trailing Period**: Primary title formatted as `Commercial Deal Dossier.` and section headings formatted with deliberate punctuation (`Commercial Organization Entity.`, `Commercial Activity Chronology.`, `Representative Touchpoints.`, `Commercial Stage Progression.`).
- **Resilient Clipboard Copy**: Added cross-environment fallback for clipboard copying supporting non-secure and local development contexts.
- **Total Eradication of Legacy Orange**: Purged all occurrences of `#ff6100` and orange `rgba(255, 97, 0, ...)` in favor of `#1f242f` and `#eefb87`.

#### 2. Prospective Commercial Lead Modal (`NewLeadModal.tsx`, `NewLeadModal.module.scss`)
- **Modal Geometry & Headings**: Centered 680px dialog with pure white card surface and heading `New Prospective Commercial Lead.`.
- **Vector SVGs**: Replaced legacy unicode `✕` close glyph with a 100% clean inline vector SVG close button.
- **Touch Target Compliance (Rule R-03)**: Enforced `min-height: 44px` on all form inputs, select dropdowns, cancel button, and submit pill button.
- **Robust Exception Handling**: Wrapped `createManualLead` in structured `try/catch` with user-facing alert notifications.

#### 3. Convert Lead to Deal Modal (`ConvertLeadToDealModal.tsx`, `ConvertLeadToDealModal.module.scss`)
- **Modal Geometry & Headings**: Centered dialog with heading `Convert Lead to Deal.`.
- **Accordion PE CTA**: Lemon Yellow pill button (`#eefb87`, `1px solid #1f242f`, text `#1f242f`, 44px min-height).
- **Error Guarding**: Wrapped `convertInboundLeadToDealAction` in structured `try/catch` block.

#### 4. Pipeline Lead Reassignment Modal (`BatchReassignModal.tsx`, `BatchReassignModal.module.scss`)
- **Modal Geometry & Headings**: Centered dialog with heading `Reassign Active Pipeline Leads.`.
- **Table Modernization**: Replaced dark table styling with clean Sypher 1px bordered light data grid.
- **Server Action Boundaries**: Wrapped `batchReassignOverdueLeadsAction` in structured `try/catch` block with live error banner.

#### 5. Pipeline Progression & Stage Modals (`StageTransitionModal.tsx`, `ConvertedCelebrationModal.tsx`, `LostReasonModal.tsx`, `StageModals.module.scss`)
- **Modal Headings**: Added editorial trailing periods (`Stage Transition.`, `Convert Deal to Won Client.`, `Close Deal as Lost.`).
- **Celebration Confetti Palette**: Modernized confetti particles from legacy `#ff6100` to Accordion Lemon Yellow `#eefb87`, emerald, and royal dark charcoal.
- **Sanitized Colors**: Removed hardcoded dark `#ffffff` and `#0b0b0d` inline styles.

#### 6. Personnel Governance & Offboarding Modals (`AddTeamMemberModal.tsx`, `CredentialRevealModal.tsx`, `SuspendUserModal.tsx`)
- **Headings**: Modernized to `Provision Commercial Personnel.`, `One-Time Credential Reveal.`, and `Confirm Account Offboarding & Suspension.`.
- **Raycast Monospace Container**: High-contrast token container with single-click copying and 60-second clipboard memory auto-purge timer.
- **Inline Style Sanitization**: Replaced legacy inline dark backgrounds (`#0b0b0d`) with light canvas tokens (`var(--admin-surface-muted, #f0f2f5)` and `var(--admin-text-primary, #1f242f)`).

#### 7. Centered Lead Detail Modal Compatibility Adapter (`LeadDetailModal.tsx`, `LeadDetailModal.module.scss`)
- **Streamlined Architecture**: 43-line clean backward-compatible component adapter delegating directly to `ClientDossierDrawer`.
- **SCSS Modernization**: SCSS module refactored to light canvas tokens, 44px touch targets, and zero `#ff6100` tokens.

---

### Official 4-Block Delivery Gate Report

```
================================================================================
           MARCA UBI ENTERPRISE CRM — 4-BLOCK DELIVERY GATE REPORT
================================================================================

[BLOCK 1: STATIC TYPE SAFETY & COMPILATION]
- TypeScript Compiler: 0 errors (tsc --noEmit PASSED)
- Type Safety: Zero 'any' types introduced
- App Router Suspense: All dynamic components wrapped in Suspense boundaries

[BLOCK 2: ZERO-TOLERANCE ANTI-SLOP & TOKEN MATHEMATICS]
- Rule R-01 (Generic Blue): 0 occurrences of #2563eb / #1d4ed8
- Rule R-01b (Legacy Orange): 0 occurrences of #ff6100 and 0 orange rgba across all 18 Phase 6 files
- Rule R-02 (Em Dash Prohibition): 0 decorative em dashes in titles or badges
- Rule R-03 (Touch Targets): min-height: 44px enforced on all interactive elements
- Rule R-12 (Unicode Prohibition): 0 raw unicode arrows or crosses; 100% clean vector SVGs
- Rule R-25 (WCAG Contrast):
  * Primary Ink #1f242f on #ffffff Canvas: 15.54:1 (Exceeds AAA >= 7.0:1)
  * Secondary Slate #525965 on #ffffff Canvas: 7.10:1 (Exceeds AAA >= 7.0:1)
  * Primary Ink #1f242f on Lemon Yellow #eefb87: 13.92:1 (Exceeds AAA >= 7.0:1)
  * Emerald Success #065f46 on #ecfdf5: 7.82:1 (Exceeds AAA >= 7.0:1)
  * Amber Warning #92400e on #fffbeb: 6.84:1 (Exceeds AA >= 4.5:1)
  * Destructive #991b1b on #fef2f2: 7.60:1 (Exceeds AAA >= 7.0:1)
- Accordion Aesthetic: Signature editorial trailing periods applied to all primary drawer & modal headings

[BLOCK 3: SECURITY & AUTHORIZATION BOUNDARIES]
- Session Authentication: Strict server-side createClient() verification
- Account State Guard: Defensive active status checks and role gating
- Server Action Boundaries: All mutations executed through isolated async Server Actions
- Credential Security: 60s clipboard auto-purge timer; zero plaintext credentials in DOM events
- SVG Vectors: Free from inline script execution, onload/onerror handlers

[BLOCK 4: AUTOMATED TEST COVERAGE]
- Test Suite: tests/unit/phase-6-redesign-dossier-and-modals.test.ts
- Test Suites: 7 / 7 passed
- Tests Executed: 61 / 61 passed (100% pass rate, 0 failed, 0 skipped)
- Boundaries Audit: npm run test:boundaries PASSED (42/42 valid actions)
================================================================================
```

---

### R-35 Click-Through Smoke Test Evidence Matrix

| Surface / Flow | Trigger / Action | Expected Result | Verified Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Client Dossier Drawer** | Click on any lead/deal record in pipeline | Drawer slides in from right; displays `Commercial Deal Dossier.` | Verified: Floating white card, Lemon Yellow CTA, 15.54:1 AAA contrast | PASS |
| **Dossier Drawer Escape** | Press `Escape` key while drawer is active | Drawer closes smoothly; body scroll unlocked | Verified: Clean keyboard event listener and scroll lock removal | PASS |
| **New Lead Modal** | Click `+ New Lead` or primary action pill | Centered 680px modal opens with `New Prospective Commercial Lead.` | Verified: Pure white surface, 44px inputs, vector close SVG | PASS |
| **Convert to Deal Modal** | Trigger deal conversion from lead card | Centered dialog displays `Convert Lead to Deal.` with deal value inputs | Verified: Error boundary active, Lemon Yellow CTA pill | PASS |
| **Batch Reassignment** | Click Reassign button in Overdue Rep banner | Centered dialog displays `Reassign Active Pipeline Leads.` | Verified: Sypher light table, 0 legacy orange, try/catch active | PASS |
| **Stage Progression** | Drag or advance deal to next stage | Centered dialog displays `Stage Transition.` | Verified: Clean light canvas, high-contrast typography | PASS |
| **Won Client Modal** | Advance deal to Won stage | Celebration modal displays `Convert Deal to Won Client.` | Verified: Accordion Lemon Yellow confetti, 13.92:1 contrast | PASS |
| **Add Team Member** | Click `+ Add Team Member` in `/admin/team` | Centered modal displays `Provision Commercial Personnel.` | Verified: 560px white card, 44px touch targets, vector close SVG | PASS |
| **Credential Reveal** | Complete new team member provisioning | Modal reveals temporary credentials with `One-Time Credential Reveal.` | Verified: Single-click copy, 60s auto-purge timer active | PASS |
| **Suspend User Dialog** | Click Suspend User in user options menu | Centered dialog displays `Confirm Account Offboarding & Suspension.` | Verified: Active deals impact breakdown, light tokens | PASS |
