# Sprint 8.3 Architectural Specification: Guarded Stage Transition Modals, Input Validation & State Machine Locking

**Document ID**: `SPEC-CRM-SPRINT-8-3`  
**Target Milestone**: Phase 8 (Client 360° Dossier & Omnichannel Touchpoint Studio)  
**Sprint**: Sprint 8.3  
**Status**: APPROVED FOR EXECUTION  
**Authors**: Principal Systems Architect, Staff UX Architect, Senior Security Engineer  

---

## 1. Architectural Overview & Objectives

Sprint 8.3 implements the commercial governance engine of the Marca Ubi Enterprise Agency CRM (`/admin/leads`). It enforces required financial disclosures and loss attribution for critical stage transitions (`Negotiation`, `Lost`, `Converted`) and applies strict post-conversion record locking to protect commercial audit integrity.

### Primary Objectives
1. **Stage Transition Modals (`StageTransitionModal.tsx`, `LostReasonModal.tsx`, `ConvertedCelebrationModal.tsx`)**:
   - Provide focused, Linear-style modal surfaces with backdrop blur (`backdrop-filter: blur(12px)`), WCAG 2.1 AA focus trapping (`Tab` / `Shift+Tab`), Escape key dismissal, and scroll lock compensation.
   - **Negotiation Modal**: Requires entry of a strictly positive numerical deal valuation (`expected_value > 0`) and an anticipated close date. Advancing to `Negotiation` without valuation is strictly blocked.
   - **Lost Reason Modal**: Enforces selection from the standardized `lost_reason` enum (`Budget Incompatible`, `Selected Competitor`, `Project Cancelled`, `Timeline Mismatch`, `Unresponsive / Ghosted`, `Terms Inflexible`, `Other`). Requires explanatory notes with minimum length $\ge 10$ characters if `Other` is selected.
   - **Converted Celebration Modal**: Requires final signed contract value (`final_revenue > 0`), signed contract date, and agreed commercial payment terms. Triggers a high-performance 60fps canvas particle celebration animation and clearly informs the user that the record will be locked from non-admin modifications.

2. **State Machine Locking & RBAC (`src/app/actions/stageTransitionActions.ts`)**:
   - Server Actions verifying session authentication, user status (`active`), and role sandboxing:
     - `viewer`: Strictly blocked from mutations with 403 Forbidden.
     - `sales_executive`: Sandboxed strictly to assigned deals (403 Unauthorized on unassigned or foreign deals).
     - **Post-Conversion Record Lock**: Any lead with `converted_at IS NOT NULL` is immutable to non-admin roles (`sales_manager`, `sales_executive`). Any modification attempt returns 403 Forbidden.
   - Prevents illegal state jumps:
     - Direct jump from `New` or `Contacted` to `Converted` is strictly blocked (must reach at least `Qualified` or `Negotiation`).
     - Direct jump from `Lost` to `Converted` is blocked (must be reactivated to `Qualified` first).

3. **Database-Level Defense-in-Depth (`supabase/migrations/20261015000012_converted_lead_locking_policy.sql`)**:
   - Upgrades `public.leads` update RLS policy so non-admin roles cannot mutate records where `converted_at IS NOT NULL`.

4. **Audit Trail & Activity Ledger Invariants**:
   - Every stage transition writes an atomic, append-only row to `public.lead_activities` with `activity_type: 'status_change'`, actor ID, human-readable summary, and comprehensive metadata (`previous_status`, `new_status`, `expected_value`, `lost_reason`, `payment_terms`).

---

## 2. Technical Component Hierarchy & State Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LeadsWorkspaceClient.tsx                        │
│  State: activeStageModal: { isOpen, leadId, targetStatus }            │
├────────────────────────────────────────────────────────────────────────┤
│  Custom Event Listeners:                                               │
│  • 'open-stage-modal' <- from InlineStatusSelect or ClientDossierDrawer │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    StageTransitionModal.tsx                      │  │
│  │  (Modal Shell, Backdrop Scrim, Focus Trap, Escape Key Listener)  │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│             ┌───────────────────────┼────────────────────────┐         │
│             ▼                       ▼                        ▼         │
│  ┌────────────────────┐   ┌───────────────────┐   ┌──────────────────┐ │
│  │  NegotiationModal  │   │  LostReasonModal  │   │ ConvertedModal   │ │
│  │ • Expected Value   │   │ • Lost Reason Enum│   │ • Final Value    │ │
│  │ • Target Date      │   │ • Notes (>=10 chr)│   │ • Contract Date  │ │
│  │ • Transition Notes │   │ • Loss Attribution│   │ • Payment Terms  │ │
│  │                    │   │                   │   │ • Confetti Canvas│ │
│  └──────────┬─────────┘   └─────────┬─────────┘   └────────┬─────────┘ │
│             │                       │                      │           │
│             ▼                       ▼                      ▼           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │         stageTransitionActions.ts (Next.js Server Actions)       │  │
│  │  • transitionToNegotiationAction                                 │  │
│  │  • transitionToLostAction                                        │  │
│  │  • transitionToConvertedAction                                   │  │
│  │  • unlockConvertedLeadAction                                     │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │    PostgreSQL Database (RLS Converted Lock & Activity Ledger)    │  │
│  │  • public.leads.converted_at NOT NULL -> Admin Only Mutation     │  │
│  │  • public.lead_activities append-only audit trail                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Schemas & Zod Validation Specifications

```typescript
// Zod Schema: Negotiation Stage Transition
export const transitionToNegotiationSchema = z.object({
  leadId: z.string().trim().regex(UUID_REGEX, { message: 'Invalid lead UUID format.' }),
  expectedValue: z
    .number({ invalid_type_error: 'Deal valuation must be a valid number.' })
    .positive({ message: 'Advancing to Negotiation requires a positive deal valuation (> 0).' }),
  anticipatedCloseDate: z
    .string()
    .trim()
    .min(1, { message: 'Anticipated close date is required.' }),
  notes: z.string().trim().max(1000).optional().nullable(),
});

// Zod Schema: Lost Stage Transition
export const LOST_REASON_OPTIONS = [
  'Budget Incompatible',
  'Selected Competitor',
  'Project Cancelled',
  'Timeline Mismatch',
  'Unresponsive / Ghosted',
  'Terms Inflexible',
  'Other',
] as const;

export const transitionToLostSchema = z
  .object({
    leadId: z.string().trim().regex(UUID_REGEX, { message: 'Invalid lead UUID format.' }),
    lostReason: z.enum(LOST_REASON_OPTIONS, { message: 'Please select a standardized lost reason.' }),
    lostNotes: z.string().trim().max(2000).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.lostReason === 'Other') {
        return !!data.lostNotes && data.lostNotes.trim().length >= 10;
      }
      return true;
    },
    {
      message: 'Detailed explanatory notes (minimum 10 characters) are required when selecting "Other".',
      path: ['lostNotes'],
    }
  );

// Zod Schema: Converted Stage Transition
export const transitionToConvertedSchema = z.object({
  leadId: z.string().trim().regex(UUID_REGEX, { message: 'Invalid lead UUID format.' }),
  finalRevenue: z
    .number({ invalid_type_error: 'Final contract revenue must be a valid number.' })
    .positive({ message: 'Conversion requires a positive signed contract value (> 0).' }),
  signedContractDate: z
    .string()
    .trim()
    .min(1, { message: 'Signed contract date is required.' }),
  paymentTerms: z
    .string()
    .trim()
    .min(3, { message: 'Commercial payment terms are required (e.g. 50% upfront, 50% completion).' }),
  notes: z.string().trim().max(1000).optional().nullable(),
});
```

---

## 4. Security Invariants & Role Boundaries

1. **Viewer Read-Only Invariance**:
   - Any mutation through `stageTransitionActions.ts` by a user with role `viewer` is immediately rejected with 403 Forbidden.
2. **Sales Executive Sandboxing**:
   - `sales_executive` can only transition deals where `lead.assigned_to === caller.id`.
3. **Post-Conversion Record Lock**:
   - If `lead.converted_at` is set, only users with `admin` role can execute modifications. Attempts by `sales_executive` or `sales_manager` are rejected with:
     `"Forbidden: Converted deals are locked from non-admin modifications."`
4. **State Machine Linear Progression**:
   - Transitions directly from `New` or `Contacted` to `Converted` are rejected to prevent unvetted revenue figures from corrupting financial reporting.
   - Leads with status `Lost` cannot be converted directly without reactivation to `Qualified`.

---

## 5. Marca Ubi Dark Luxury Design Tokens

- **Surface Base**: `#0a0a0c` deep void black
- **Elevated Card**: `#121216` obsidian slate
- **Brand Accent**: `#ff6100` warm luxury amber
- **Conversion Emerald**: `#10b981` high-ticket celebration green
- **Lost Crimson**: `#ef4444` terminal inactive indicator
- **Specular Hairline**: `rgba(255, 255, 255, 0.08)`
- **Backdrop Blur**: `backdrop-filter: blur(12px); background: rgba(0, 0, 0, 0.75)`
- **Minimum Tap Target**: $\ge 44\text{px}$ on all interactive controls

---

## 6. Delivery Gate & Verification Checklist

1. **Block 1: Deliverable Files**:
   - `src/app/actions/stageTransitionActions.ts`
   - `src/app/admin/components/modals/StageTransitionModal.tsx`
   - `src/app/admin/components/modals/LostReasonModal.tsx`
   - `src/app/admin/components/modals/ConvertedCelebrationModal.tsx`
   - `src/app/admin/components/modals/StageModals.module.scss`
   - `src/app/admin/components/modals/index.ts`
   - `supabase/migrations/20261015000012_converted_lead_locking_policy.sql`
   - `tests/actions/stage_transition_actions.test.ts`
   - `tests/leads/stage_transition_modals.test.ts`
   - `scripts/verify-sprint-8-3.ts`
2. **Block 2: Anti-AI-Slop Hygiene**:
   - 0 occurrences of `#2563eb`
   - 0 decorative comment separators (`// ===`)
   - 0 `any` types
   - 0 toy emojis
   - 0 em-dashes `—`
3. **Block 3: Test Suites Execution**:
   - 100% test pass rate on automated transition actions and modals.
4. **Block 4: TypeScript Strictness**:
   - `npx tsc --noEmit` exits with 0 errors.
