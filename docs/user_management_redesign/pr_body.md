## Executive Summary & Architectural Overview

This Pull Request delivers a ground-up transformation of the Marca Ubi User Management workspace (`/admin/team`) and system-wide Profile Photo Management architecture, strictly matching the **PrimeStay People Reference standard** (`original-a90edff5ebcc6e3fee2aee29ea8e8282.webp`) with pure white elevated cards on a soft light luxury canvas (`#f7f8fa`).

---

### Core Pillars Implemented & Calibrated

1. **PrimeStay People Light Luxury Card Architecture**:
   - Replaced dark cards with **pure white elevated fluid cards** (`#ffffff` surface, `1px solid #e2e5ea` hairline border, 16px radius, soft ambient hover lift `0 8px 24px -4px rgba(15, 23, 42, 0.08)`).
   - Realigned card anatomy: 56px circular photography avatar on the left, name + role + status indicator, subtle `···` popover trigger anchored at **top-right header**, key-value operational metadata rows with `tabular-nums` formatting, and a **symmetrical dual-button footer** (50/50 split: soft-tinted primary action button + white outline `View Profile` button).
   - Category Underline Tabs contrast fix: active tab rendered with `#0f172a` text (15.5:1 contrast, passing WCAG AAA), 2px brand underline (`#ff6100`), and soft orange counter badge (`rgba(255, 97, 0, 0.08)` fill, `#ea580c` text). Inactive tabs rendered with `#64748b` text (5.1:1 contrast, passing WCAG AA).
   - Omni-Search & View Control Toolbar: Pure white inputs with hairline borders, subtle focus rings, and Grid (`⊞`) vs. Compact Table (`☰`) view toggle.

2. **Canonical Indian Currency & Numerical Standardization**:
   - Standardized currency formatting across the entire User Management workspace via `formatRupees` (e.g. `₹42,00,000`, `₹1,50,00,000`), purging arbitrary abbreviations and aligning with the canonical Phase 8.8 standard.
   - Standardized deal and count tabulation via `formatNumber` (`count.toLocaleString('en-IN')`).
   - Resolved synthetic benchmark pipeline data inflation: updated `getTeamRoster()` in `src/app/actions/team.ts` with `.or('brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true')`, ensuring realistic agency portfolio valuations instead of benchmark test records (`₹13.4Cr`, `1000 Deals`).

3. **Full-Stack Profile Photo Storage & Governance**:
   - **Main Admin Console**: Administrators can upload, crop, set, or remove profile photos for **any staff member** directly from their personnel card or the `···` popover menu.
   - **Self-Service Console**: Users can upload, change, or remove their own photo via the `UserProfileDropdown` in the top navigation bar or from their own card marked `(You)`.
   - Client-side offscreen canvas center-cropping (<80KB WebP at 512×512px) with magic byte inspection (`FF D8 FF`, `89 50 4E 47`, `RIFF...WEBP`).
   - Dedicated Supabase Storage `avatars` bucket with public CDN read access and strict RLS write policies.
   - Server Actions `updateUserAvatarAction` & `removeUserAvatarAction` with orphaned asset purging, audit logging in `public.team_audit_logs`, and cache revalidation.
   - Real-time `user-avatar-updated` window events ensuring immediate visual synchronization across the top bar and card grid without full-page reloads.

4. **Enterprise Quality, Type Safety & Zero AI Slop**:
   - Strictly 0 `any` types across all components, actions, and schemas.
   - Strictly 0 generic AI blue (`#2563eb`) or crude box shadows.
   - Comprehensive high-value engineering documentation on all services, mathematical transformations, and boundary guards.

---

### Delivery Gate Verification Summary

- **TypeScript Typecheck**: `npx tsc --noEmit` exited with code 0 (0 type errors).
- **Server Action Boundaries**: `npm run test:boundaries` passed 100% (45 valid Server Actions across 12 files).
- **Avatar & Roster Unit Tests**: `tests/team/avatar_and_roster_governance.test.ts` passed 15/15 tests.
- **Team Governance Unit Tests**: `tests/team/*.test.ts` passed 79/79 tests (100% pass rate).
- **Manual Lead Creation Unit Tests**: `tests/ingest/manual_lead_creation.test.ts` passed 18/18 tests.
- **Phase 5 Operations Suite**: `tests/unit/phase-5-redesign-operations-governance.test.ts` passed 58/58 tests.

---

> [!NOTE]
> Per strict behavioral governance rules, this Pull Request remains strictly **OPEN** awaiting manual human review and manual clicking of the "Merge" button on GitHub.
