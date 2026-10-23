## Executive Summary & Architectural Overview

This Pull Request delivers a ground-up transformation of the Marca Ubi User Management workspace (`/admin/team`) and system-wide Profile Photo Management architecture, eliminating the previous corporate spreadsheet and Accordion lemon yellow pill button in favor of the **PrimeStay People Reference standard** (`original-a90edff5ebcc6e3fee2aee29ea8e8282.webp`).

---

### Core Pillars Implemented

1. **PrimeStay People Card Grid**:
   - Replaced 7-column spreadsheet table with a **4-column responsive fluid grid** (`#0e1013` surface, `1px solid rgba(255, 255, 255, 0.07)`, 16px radius, hover elevation).
   - Underlined Category Filter Tabs: `All Personnel (N)`, `Leadership & Admins (N)`, `Sales Executives (N)`, `Suspended / Inactive (N)`.
   - Omni-Search & View Control Toolbar: Command-K input with live fuzzy searching, role dropdown filter, status dropdown filter, and a **Grid (`⊞`) vs. Compact Table (`☰`)** view switcher.
   - 56px circular photography avatars with online status indicators (`#10b981`), linear capacity gauges (`Linear Fluid Card` style), and symmetrical dual-button action footers (`Manage Access` / `Reassign Deals` + `View Profile` + `···` action menu).

2. **Full-Stack Profile Photo Storage & Governance**:
   - **Main Admin Console**: Administrators can upload, crop, set, or remove profile photos for **any staff member** directly from their personnel card or the `···` popover menu.
   - **Self-Service Console**: Users can upload, change, or remove their own photo via the `UserProfileDropdown` in the top navigation bar or from their own card marked `(You)`.
   - Client-side offscreen canvas center-cropping (<80KB WebP at 512×512px) with magic byte inspection (`FF D8 FF`, `89 50 4E 47`, `RIFF...WEBP`).
   - Dedicated Supabase Storage `avatars` bucket with public CDN read access and strict RLS write policies.
   - Server Actions `updateUserAvatarAction` & `removeUserAvatarAction` with orphaned asset purging, audit logging in `public.team_audit_logs`, and cache revalidation.
   - Real-time `user-avatar-updated` window events ensuring immediate visual synchronization across the top bar and card grid without full-page reloads.

3. **Enterprise Defense & Anti-AI-Slop Styling**:
   - Purged all occurrences of `#eefb87` (Accordion Lemon Yellow) and `#2563eb` (generic AI blue).
   - Integrated dark luxury tokens (`$cta-orange: #ff6100;`, `#0e1013`, `#ffffff`).
   - Next.js CSP updated with `https://*.supabase.co` in `img-src` and `remotePatterns` for Supabase Storage avatars.

---

### Delivery Gate Verification Summary

- **TypeScript Typecheck**: `npx tsc --noEmit` exited with code 0 (0 type errors).
- **Server Action Boundaries**: `npm run test:boundaries` passed 100% (45 valid Server Actions across 12 files).
- **Avatar & Roster Unit Tests**: `tests/team/avatar_and_roster_governance.test.ts` passed 15/15 tests.
- **Team Governance Unit Tests**: `tests/team/*.test.ts` passed 79/79 tests (100% pass rate).
- **Phase 5 Operations Suite**: `tests/unit/phase-5-redesign-operations-governance.test.ts` passed 58/58 tests.
- **Playwright Live Evidence**: Captured `docs/user_management_redesign/primestay_people_redesign_live.png`.

---

> [!NOTE]
> Per behavioral rules, this Pull Request remains strictly **OPEN** awaiting manual human review and manual clicking of the "Merge" button on GitHub.
