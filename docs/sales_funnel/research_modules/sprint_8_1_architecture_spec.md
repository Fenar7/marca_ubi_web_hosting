# Sprint 8.1 Architectural Specification: Client 360° Sliding Drawer Shell & Organization Dossier

**Document ID**: `SPEC-CRM-SPRINT-8-1`  
**Target Milestone**: Phase 8 (Client 360° Dossier & Omnichannel Touchpoint Studio)  
**Sprint**: Sprint 8.1  
**Status**: IN PROGRESS  
**Authors**: Principal Systems Architect, Staff UX Architect, Senior Security Engineer  

---

## 1. Architectural Overview & Objectives
Sprint 8.1 establishes the foundational interaction surface for commercial deal inspection: the **Client 360° Sliding Drawer Shell** and the **Left Column Organization & Brand Dossier** within the Marca Ubi Enterprise Agency CRM (`/admin/leads`).

### Primary Objectives
1. **Slide-over Drawer Shell (`ClientDossierDrawer.tsx`)**:
   - Construct a high-performance, focus-trapped sliding drawer executing at 60fps with zero layout shift.
   - Enforce an 840px desktop width (`min(840px, 100vw)`) and 100vw mobile width with a frosted glass backdrop scrim (`backdrop-filter: blur(12px)`).
   - Implement seamless event-driven hydration responding to `open-lead-drawer` window custom events and direct selection props.
   - Enforce strict keyboard isolation: `Escape` key closes the drawer cleanly, and keyboard focus is trapped within the active surface.
2. **Left Column Organization & Brand Dossier (`OrganizationDossier.tsx`)**:
   - **Company & Market Intelligence**: Company name, domain external link, and industry classification badge.
   - **Primary Decision Maker Directory**: Contact name, corporate designation, direct business email, and telephone coordinates.
   - **Native Deep Links**:
     - RFC 3966 sanitized Click-to-Call (`tel:`) protocol.
     - Direct WhatsApp inquiry URL (`https://wa.me/`) with pre-filled deal ID reference.
   - **Engagement Scope & Commercial Valuation**:
     - Service category tags with dark luxury outline styling.
     - Expected valuation formatted in Indian Lakhs/Crores (`₹XX.XX L/Cr`) with `tabular-nums`.
     - Budget bracket and target launch timeline.
     - Assigned representative profile card with avatar initials.
3. **Expandable Raw Brief Viewer (`RawBriefAccordion.tsx`)**:
   - Expandable accordion surfacing the original raw client questionnaire payload submitted via `/start-project` (`brief_payload` JSONB).
   - Handles empty or legacy objects gracefully with informative empty states.
4. **Dark Luxury Token Adherence (`DossierDrawer.module.scss`)**:
   - Deep obsidian background (`#0a0a0a`), surface cards (`#121212`), specular highlights (`rgba(255,255,255,0.08)`), brand accent (`#ff6100`), pure white text (`#ffffff`), and muted typography (`#7c7c7c`).
   - Zero occurrences of generic blue (`#2563eb`), zero toy emojis, and 44px+ minimum mobile tap targets.

---

## 2. Component Topology & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LeadsWorkspaceClient.tsx                        │
│   (Listens for 'open-lead-drawer' custom event or active lead ID)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ mounts
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ClientDossierDrawer.tsx                         │
│   • Focus trap & backdrop scrim (backdrop-filter: blur(12px))          │
│   • Slide-in physics: cubic-bezier(0.16, 1, 0.3, 1), 60fps             │
│   • Top Header Rail: Deal ID token (click-to-copy), Stage badge, Close │
├───────────────────────────────────┬────────────────────────────────────┤
│ COLUMN 1: OrganizationDossier.tsx │ COLUMN 2: Activity Studio (Future) │
│   • Company & verified domain     │   • Omnichannel Timeline           │
│   • Decision Maker directory      │   • Quick Action Composer          │
│   • Click-to-Call (tel:)          │     (Sprint 8.2 Deliverable)       │
│   • Click-to-WhatsApp (wa.me)     │                                    │
│   • Service scope outline badges  │                                    │
│   • Commercial valuation & rep    │                                    │
│   • RawBriefAccordion.tsx         │                                    │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 3. Data Contract & Hydration Interface

```typescript
export interface LeadDossierData {
  id: string;
  lead_id: string;
  name: string;
  company: string | null;
  company_website: string | null;
  industry: string | null;
  phone: string | null;
  email: string | null;
  preferred_channel: 'Phone' | 'WhatsApp' | 'Email' | 'Meeting';
  service_category: string;
  budget_bracket: string | null;
  priority: 'High' | 'Medium' | 'Low';
  status_id: string;
  status_name: string;
  status_color: string;
  bucket: 'open' | 'potential' | 'converted' | 'lost';
  assigned_to: string | null;
  assigned_to_name: string | null;
  assigned_to_email?: string | null;
  expected_value: number;
  next_follow_up: string | null;
  lost_reason: string | null;
  revisit_date: string | null;
  notes: string | null;
  brief_payload: Record<string, unknown> | null;
  created_at: string;
  converted_at: string | null;
  updated_at: string;
}
```

---

## 4. Deep-Link Protocol Invariants

1. **Click-to-Call (`tel:`)**:
   - Sanitized via RFC 3966 regex `/[^\d+]/g`.
   - Minimum length check: at least 7 digits required to construct a valid telephony URI.
   - Fallback: Gracefully disables trigger and renders placeholder state if phone number is absent.
2. **Click-to-WhatsApp (`https://wa.me/`)**:
   - Strips non-digit characters (`replace(/\D/g, '')`).
   - Generates pre-filled text payload:
     `Hello {name}, this is regarding your inquiry with Marca Ubi (Ref: {lead_id}).`
   - Target opened with `rel="noopener noreferrer"` and `target="_blank"`.

---

## 5. Delivery Gate Verification Suite
Before marking Sprint 8.1 as complete, the following assertions must be validated:
1. `ClientDossierDrawer.tsx` exists and renders correctly.
2. `OrganizationDossier.tsx` exists and formats company, contact, and brief context.
3. `RawBriefAccordion.tsx` exists and renders JSONB brief answers.
4. `DossierDrawer.module.scss` exists with dark luxury tokens (0 generic blue `#2563eb`).
5. Deep-link triggers conform to RFC 3966 `tel:` and WhatsApp `wa.me`.
6. Unit test suite `tests/leads/client_dossier_drawer.test.ts` passes 100%.
7. TypeScript compilation clean (`tsc --noEmit` returns 0 errors).
8. Anti-AI-slop AST checks: 0 `any` types, 0 decorative comment banners, 0 toy emojis.
