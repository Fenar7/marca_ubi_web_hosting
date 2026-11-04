## Contact: Swiss Light Editorial Contact Suite, Live Studio Clocks, CRM Ingestion & SEO Graph

### 1. Executive Summary
This pull request introduces the production-ready public `/contact` portal for Marca Ubi, synthesizing architectural and editorial design cues from premier reference benchmarks ([160over90](https://www.160over90.com/contact/) disciplined Swiss grid and multi-office studio footprint, and [Whoa Mama](https://whoamama.com/talk-to-us/) friction-free inquiry composition and talent diversion) with Marca Ubi's signature **Swiss Light Editorial** luxury identity.

Developed completely inside an isolated Git worktree (`marca_ubi_workflow2` on branch `workflow-2`) without touching or interrupting active parallel workflows.

---

### 2. Architecture & Design Blueprint

#### Design Read & Token System (`dial ENERGY 2 / RHYTHM 2 / MOTION 1`)
- **Canvas & Surface**: Pure White `#ffffff` background with warm neutral paper container panels (`#f7f7f8`) and micro-border delineation (`#e5e5e7`).
- **Typography & Ink**: High-contrast black ink (`#0a0a0a`), subdued neutral slate (`#71717a` / `#52525b`), and surgical Brand Red (`#ea002a`) for accents, focus rings, and transmission triggers.
- **Strict Anti-Slop Hygiene**:
  - Zero internal CRM `#ff6100` orange on public pages.
  - Zero generic `#2563eb` AI blue.
  - Zero heavy drop shadows (replaced with disciplined 1px borders and subtle paper contrast).
  - Raycast/Linear fluid capsule pill selectors (`border-radius: 9999px`) with minimum 44px/52px touch targets.

#### Components Delivered:
1. **`InquiryComposer.tsx`**:
   - Tri-track inquiry classification (`[01] New Business`, `[02] Press & Speaking`, `[03] Partnerships`).
   - Frictionless open budget input (`APPROXIMATE BUDGET (e.g. ₹15,00,000 or $25,000)`) with zero complex multi-tier dropdowns.
   - React 19 `useTransition` pending state with animated Brand Red submission button (`TRANSMIT INQUIRY →`).
   - SLA guarantee strip: *"Enterprise inquiries routed to partners within 24 hours."*
2. **`StudioCorridors.tsx` & `useStudioClocks.ts`**:
   - Hydration-safe live local clocks and operating hours indicators for physical hubs (Calicut HQ IST, Trivandrum Studio IST) and international liaison corridors (London GMT/BST, Dubai GST, New York EST/EDT).
   - Real studio physical coordinates and full postal addresses.
3. **`DirectDesks.tsx`**:
   - Direct communication channels for business, press, general inquiries, and studio switchboard (+91 7012 052 472).
4. **`TalentDiversion.tsx`**:
   - Notion-callout archetype steering creative and developer candidates to `/careers`, preventing recruitment clutter in the CRM pipeline.
5. **`contactActions.ts` (Next.js 16 Server Action)**:
   - 100% compliant Server Action boundary (pure async function export).
   - Cryptographic honeypot inspection (`marca_contact_hp`) silently absorbing spam bots without database mutation.
   - In-memory sliding-window IP rate limiting (`checkRateLimit`).
   - Enterprise lead deduplication & upsert via `evaluateLeadDeduplication`.
   - Atomic logging to Supabase `leads` and `lead_activities` tables with studio notification dispatch.
6. **Technical SEO & Schema.org Graph**:
   - Full JSON-LD `@graph` containing `ContactPage`, `Organization`, `LocalBusiness` (Calicut & Trivandrum coordinates), and `BreadcrumbList`.
   - Canonical URL `https://marcaubi.com/contact`, OpenGraph, and Twitter summary cards.
   - Registered in `src/app/sitemap.ts` (`priority: 0.8`, `changeFrequency: "monthly"`).
   - Global navigation updated in `Header.tsx` and `Footer.tsx` pointing to canonical `/contact`.

---

### 3. Senior CTO 4-Block Delivery Gate Report

```
================================================================================
MARCA UBI ENTERPRISE CTO DELIVERY GATE REPORT
================================================================================
PR Title: Contact: Swiss Light Editorial Contact Suite, Live Studio Clocks, CRM Ingestion & SEO Graph
Branch: workflow-2 -> master
Author: Fenar7 <86710532+Fenar7@users.noreply.github.com>
Status: APPROVAL-READY (STRICTLY OPEN FOR HUMAN REVIEW)
================================================================================

[BLOCK 1: ARCHITECTURE, RATIONALE & INVARIANT GUARDRAILS]
  • Isolation: Work executed strictly in worktree '../marca_ubi_workflow2'.
  • Public Invariant: Swiss Light Editorial (#ffffff / #0a0a0a / #ea002a).
  • Server Action Boundaries: src/app/actions/contactActions.ts exports strictly
    async functions. Zod schema resides in src/app/lib/validations/contact.ts.
  • Spam & Security: Honeypot field 'marca_contact_hp', IP rate limiter,
    Zod input sanitization, and atomic Supabase persistence.

[BLOCK 2: ZERO AI-SLOP & DESIGN TOKEN AUDIT]
  • CRM Orange Check (#ff6100): 0 occurrences in contact stylesheets.
  • Generic Blue Check (#2563eb): 0 occurrences.
  • Drop Shadow Check: Zero fuzzy drop shadows; strictly 1px borders.
  • Pill Geometries: 9999px fluid capsules for track selectors.
  • Touch Targets: Verified >= 44px min-height across mobile and desktop.

[BLOCK 3: VERIFICATION & TEST SUITE EVIDENCE]
  • Unit Test Suite (tests/unit/contact-form.test.ts):
    ✔ 20/20 tests PASS (100% green across 5 suites).
    - Input Validation & Sanitization: 6/6 PASS
    - Cryptographic Honeypot Invariant: 2/2 PASS
    - Swiss Light Editorial Tokens: 6/6 PASS
    - Technical SEO & Schema: 4/4 PASS
    - Server Action Boundary: 2/2 PASS
  • Server Action Gatekeeper (verify-server-action-boundaries.ts):
    - Audited 13 Server Action files, 49 actions. 100% compliant.
  • TypeScript Compiler (tsc --noEmit):
    - 0 type errors across entire codebase (Exit code 0).

[BLOCK 4: R-35 CLICK-THROUGH SMOKE TEST EVIDENCE]
  • Route /contact renders SSR with light theme header and monumental footer.
  • Track switching toggles active pill styling and adapts form context smoothly.
  • Studio clocks tick monotonically without SSR hydration mismatch.
  • Submitting valid inquiry triggers transition, disables button, displays
    success card with reference token and return action.
  • Honeypot fill silently simulates success without touching database.
================================================================================
```

---

### 4. Author Identity & Commit Verification
- **Author Identity**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`
- **Commit Hash**: `5fc6c1ea9f2f535a90412d263ce2a1329f266dc5`
- **Naming Rule**: Zero occurrences of `feat` in branch names, commit titles, or PR descriptions.
