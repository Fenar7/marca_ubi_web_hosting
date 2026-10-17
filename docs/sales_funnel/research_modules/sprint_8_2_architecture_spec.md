# Sprint 8.2 Architectural Specification: Omnichannel Activity Timeline & Quick Action Interaction Composer

**Document ID**: `SPEC-CRM-SPRINT-8-2`  
**Target Milestone**: Phase 8 (Client 360° Dossier & Omnichannel Touchpoint Studio)  
**Sprint**: Sprint 8.2  
**Status**: IN PROGRESS  
**Authors**: Principal Systems Architect, Staff UX Architect, Senior Security Engineer  

---

## 1. Architectural Overview & Objectives

Sprint 8.2 implements the Right Column of the Client 360° slide-over drawer (`ClientDossierDrawer.tsx`): the **Omnichannel Activity Timeline** and the **Quick Action Interaction Composer** within the Marca Ubi Enterprise Agency CRM (`/admin/leads`).

### Primary Objectives
1. **Quick Action Composer (`QuickActionComposer.tsx`)**:
   - High-efficiency multi-tab interaction logger allowing sales executives and account managers to log touchpoints in under 15 seconds:
     - **Tab 1: Log Call** (Call duration in minutes/seconds, outcome selector: `Connected`, `Busy / No Answer`, `Left Voicemail`, `Meeting Scheduled`, and structured call notes).
     - **Tab 2: Log WhatsApp** (Interaction classification: `Discovery`, `Follow-up`, `Proposal Link Dispatched`, and client conversation notes).
     - **Tab 3: Meeting Notes** (Meeting typology: `Executive Discovery`, `Technical Scoping`, `Contract Review`, attendee coordinates, key decisions, and agreed next steps).
     - **Tab 4: Internal Notes** (Private internal notes supporting team member mentions e.g. `@fenar` and operational tags e.g. `#urgent`, `#high-margin`).
   - Client-side validation enforcing a minimum of 3 characters before submission can be activated.
   - Immediate button disabling upon submission click to prevent accidental duplicate activity ledger entries.
   - Sub-100ms optimistic or reactive prepend into the local timeline.

2. **Omnichannel Activity Timeline (`ActivityTimeline.tsx`)**:
   - Chronological immutable event stream linked by a vertical hairline specular border (`rgba(255, 255, 255, 0.08)`).
   - Semantic event-specific glyph badges:
     - 📞 Call (`call_logged`)
     - 💬 WhatsApp (`whatsapp_sent`)
     - 👥 Meeting (`meeting_held` / `meeting_notes`)
     - 📝 Internal Note (`note_added`)
     - ⚡ System Event / Stage Transition (`status_change`, `priority_change`, `reassignment`, `system_event`)
   - Author avatar initials badge, author full name, role pill, human-readable relative timestamp (e.g. `2 hours ago`), and absolute ISO timestamp tooltip.
   - Rich metadata display: Call duration badges, call outcome pills, meeting attendee tags, highlighted `@mentions` and `#tags`.
   - Accessible empty state when no activities are recorded.

3. **Activity Logging Server Action (`src/app/actions/leadActivityActions.ts`)**:
   - Secure server action `logLeadActivityAction` persisting to `public.lead_activities` with structured JSONB metadata.
   - Rigorous RBAC authorization:
     - Unauthenticated requests rejected (401).
     - Suspended accounts rejected (403).
     - `viewer` role rejected (403 Forbidden).
     - `sales_executive` sandboxed strictly to assigned leads (403 Forbidden on unassigned or foreign deals).
     - `admin` and `sales_manager` granted global logging privileges.
   - Input validation via Zod (`leadActivityInputSchema`) with strict sanitization of notes against script injection.
   - Atomic update of lead's `updated_at` timestamp.
   - Hydrated return payload matching `LeadActivityWithActor`.

---

## 2. Technical Component Hierarchy & State Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ClientDossierDrawer.tsx                         │
│  State: activeLead, activities: LeadActivityWithActor[], isLoading     │
├───────────────────────────────────┬────────────────────────────────────┤
│   Column 1: OrganizationDossier   │   Column 2: Activity Studio        │
│   • Company & Domain Link         │   ┌──────────────────────────────┐ │
│   • Contact Coordinates           │   │    QuickActionComposer.tsx   │ │
│   • Service Categories & Scope    │   │  • Tabs: Call, WA, Meet, Note│ │
│   • Commercial Valuation          │   │  • Duration, Outcome, Notes  │ │
│   • Expandable Brief Accordion    │   │  • Submit -> logLeadActivity │ │
│                                   │   └──────────────┬───────────────┘ │
│                                   │                  │ onActivityLogged │
│                                   │                  ▼                 │
│                                   │   ┌──────────────────────────────┐ │
│                                   │   │     ActivityTimeline.tsx     │ │
│                                   │   │  • Hairline vertical trace   │ │
│                                   │   │  • Event glyph badges        │ │
│                                   │   │  • Relative time + Author    │ │
│                                   │   │  • Mentions & Outcome tags   │ │
│                                   │   └──────────────────────────────┘ │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 3. Data Schema & Payloads

### Activity Input Zod Schema
```typescript
export const leadActivityInputSchema = z.object({
  leadId: z.string().uuid(),
  activityType: z.enum([
    'call_logged',
    'whatsapp_sent',
    'meeting_notes',
    'meeting_held',
    'note_added',
  ]),
  description: z.string().trim().min(3).max(5000),
  metadata: z.record(z.unknown()).default({}),
});
```

### Call Logging Metadata
```typescript
interface CallMetadata {
  duration_seconds: number;
  outcome: 'Connected' | 'Busy / No Answer' | 'Left Voicemail' | 'Meeting Scheduled';
}
```

### Meeting Logging Metadata
```typescript
interface MeetingMetadata {
  meeting_type: 'Executive Discovery' | 'Technical Scoping' | 'Contract Review' | 'Commercial Closing';
  attendees?: string[];
  next_steps?: string;
}
```

---

## 4. Edge Cases & Resilience Strategy

1. **Submitting Empty or Truncated Notes**:
   - Client-side validation: submit button remains disabled until `description.trim().length >= 3`.
   - Server-side validation: Zod `.min(3)` rejects whitespace-only or truncated notes.
2. **Rapid Multiple Clicks**:
   - Instant synchronous `isSubmitting` lock disables trigger on first click.
3. **Markdown & Mention Formatting**:
   - Safe parsing of `@mention` tokens and `#tags` into styled spans without `dangerouslySetInnerHTML`.
4. **Timezone & Relative Time Precision**:
   - Deterministic relative time formatter (`Just now`, `X mins ago`, `X hours ago`, `Yesterday`, `MMM D, YYYY`).
5. **Role Sandboxing Integrity**:
   - Sales executives are strictly prevented from logging activities on leads outside their portfolio.

---

## 5. Delivery Gate Assertions
1. `src/app/actions/leadActivityActions.ts` exists with authorization and audit logging.
2. `src/app/admin/components/DossierDrawer/QuickActionComposer.tsx` exists with all 4 tabs and validation.
3. `src/app/admin/components/DossierDrawer/ActivityTimeline.tsx` exists with hairline border and glyph badges.
4. `ClientDossierDrawer.tsx` mounts `QuickActionComposer` and `ActivityTimeline` in Column 2.
5. Unit tests `tests/leads/lead_activity_composer.test.ts` pass with 100% assertions.
6. Anti-slop invariants: 0 generic blue, 0 decorative comments, 0 `any` types, 0 toy emojis.
7. TypeScript compilation clean (`tsc --noEmit`).
