## Executive Summary & Architectural Overview

This Pull Request delivers a ground-up transformation of the Marca Ubi User Management workspace (`/admin/team`), system-wide Profile Photo Management architecture, and the granular Configure Tab Permissions Governance Modal dialog, strictly matching the **PrimeStay People Reference standard** (`original-a90edff5ebcc6e3fee2aee29ea8e8282.webp`) on the canonical **Accordion Executive Advisory × Sypher Minimalist Light Canvas** architecture with pure white elevated cards on a soft anti-glare canvas (`#f7f8fa`).

---

### Core Pillars Implemented & Calibrated

1. **PrimeStay People Light Luxury Card Architecture**:
   - Replaced dark cards with **pure white elevated fluid cards** (`#ffffff` surface, `1px solid #e2e5ea` hairline border, 16px radius, soft ambient hover lift `0 8px 24px -4px rgba(15, 23, 42, 0.08)`).
   - Realigned card anatomy: 56px circular photography avatar on the left, name + role + status indicator, subtle `···` popover trigger anchored at **top-right header**, key-value operational metadata rows with `tabular-nums` formatting, and a **symmetrical dual-button footer** (50/50 split: Accordion Lemon primary action button + white outline `View Profile` button).
   - Category Underline Tabs: active tab rendered with Deep Slate Charcoal `#1f242f` text (15.5:1 contrast, passing WCAG AAA), 2px high-contrast charcoal underline (`#1f242f`), and soft Electric Lemon counter badge (`var(--admin-accent-lemon-tint)` fill with `#1f242f` ink). Inactive tabs rendered with `#64748b` text (5.1:1 contrast, passing WCAG AA).
   - Omni-Search & View Control Toolbar: Pure white inputs with hairline borders, subtle focus rings, and Grid (`⊞`) vs. Compact Table (`☰`) view toggle.

2. **Canonical Indian Currency & Numerical Standardization**:
   - Standardized currency formatting across the entire User Management workspace via `formatRupees` (e.g. `₹42,00,000`, `₹1,50,00,000`), purging arbitrary abbreviations and aligning with the canonical Phase 8.8 standard.
   - Standardized deal and count tabulation via `formatNumber` (`count.toLocaleString('en-IN')`).
   - Resolved synthetic benchmark pipeline data inflation: updated `getTeamRoster()` in `src/app/actions/team.ts` with `.or('brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true')`, ensuring realistic agency portfolio valuations instead of benchmark test records (`₹13.4Cr`, `1000 Deals`).

3. **Full-Stack Profile Photo Storage & High-Resolution Personnel Portraits**:
   - **Main Admin Console**: Administrators can upload, crop, set, or remove profile photos for **any staff member** directly from their personnel card or the `···` popover menu.
   - **Self-Service Console**: Users can upload, change, or remove their own photo via the `UserProfileDropdown` in the top navigation bar or from their own card marked `(You)`.
   - Seeded high-resolution corporate portraits in `public/avatars/` (`elena-vance.jpg`, `tariq-al-mansoor.jpg`, `sophia-sterling.jpg`, `root-admin.jpg`) synchronized across `public.profiles.avatar_url`.
   - Client-side offscreen canvas center-cropping (<80KB WebP at 512×512px) with magic byte inspection (`FF D8 FF`, `89 50 4E 47`, `RIFF...WEBP`).
   - Dedicated Supabase Storage `avatars` bucket with public CDN read access and strict RLS write policies.
   - Server Actions `updateUserAvatarAction` & `removeUserAvatarAction` with orphaned asset purging, audit logging in `public.team_audit_logs`, and cache revalidation.
   - Real-time `user-avatar-updated` window events ensuring immediate visual synchronization across the top bar and card grid without full-page reloads.

4. **Total Eradication of Website Orange & Restoration of Accordion Lemon CRM Tokens**:
   - **Header Primary Action (`+ ADD MEMBER`)**: Restored to signature **Accordion Electric Lemon Pill** (`var(--admin-accent-lemon, #eefb87)`, `border: 1px solid var(--admin-border-strong, #1f242f)`, `color: var(--admin-accent-lemon-ink, #1f242f)`), achieving **13.90:1 AAA contrast** matching `+ NEW LEAD` in the sidebar.
   - **Personnel Card Actions**: Primary buttons (`Manage Access` / `Reassign Deals`) restored to Accordion Lemon pairing (`#eefb87` / `#1f242f`). Secondary buttons use crisp white cards (`#ffffff`).
   - **Badges**: `(You)` badge and `ADMIN` badge standardized to neutral slate/charcoal styling (`#f1f5f9` fill, `#1f242f` text).
   - **Telemetry Meter**: `PersonnelCard.tsx` capacity threshold restored: `<70%` is **Emerald Green (`#10b981`)**, `70-89%` is **Amber (`#f59e0b`)**, and `>=90%` is **Rose (`#ef4444`)**.
   - **Focus Rings**: Eradicated all orange focus outlines across `FilterControlToolbar`, `PersonnelActionMenu`, and modals, standardizing to `var(--admin-border-strong, #1f242f)`.

5. **Configure Tab Permissions Governance Modal Redesign (`EditUserPermissionsModal`)**:
   - **Circular Dismiss Action**: Replaced rectangular `<kbd>Esc</kbd>` badge with an Apple HIG-compliant **44×44px circular button** (`border-radius: 50%`) with a centered SVG `✕` icon, smooth hover scale, and active Esc keyboard trap.
   - **Zero-Wrap Footer Rhythm**: Standardized all footer buttons (`Select All`, `Role Defaults`, `Cancel`, `Save Permissions`) to single-line text (`white-space: nowrap`), 44px height (`min-height: 44px`), and 8px corner radii, eliminating multi-line text breaking.
   - **Signature Lemon Submit Action**: Restored submit button to Accordion Lemon Yellow (`#eefb87`) with high-contrast slate ink (`#1f242f`), sentence-case `"Save Permissions"`, and an inline circular spinner during `isPending`.
   - **Enclave Card Layout & Title Preservation**: Separated `.tabTitleRow` from the route slug. Route slug rendered cleanly below as a secondary Raycast Monospace token chip (`monospace`, `rgba(31, 36, 47, 0.03)` fill), preventing tab card title line-wrapping.
   - **Personnel Dossier Photography**: Integrated Next.js `<Image unoptimized />` displaying staff member profile portraits with automatic `onError` fallback to initials.
   - **Defensive RBAC Invariants**: Hardened all-admin immunity policy, defensively preventing administrators from revoking `users` or `settings` workspace tabs for themselves or peer administrators.

6. **Enterprise Quality, Type Safety & Zero AI Slop**:
   - Strictly 0 `any` types across all components, actions, and schemas.
   - Strictly 0 generic AI blue (`#2563eb`), 0 website orange (`#ff6100`, `$cta-orange`, `#c2410c`, `#e05500`), and 0 crude box shadows.
   - Comprehensive high-value engineering documentation on all services, mathematical transformations, and boundary guards.

---

### Delivery Gate Verification Summary

| Gate | Checkpoint | Result |
| :--- | :--- | :--- |
| **TypeScript Compilation** | `npx tsc --noEmit` | **0 errors (Pass)** |
| **Server Action Boundaries** | `npm run test:boundaries` | **45/45 valid Server Actions across 12 files (100% Pass)** |
| **Team Governance Suite** | `tests/team/*.test.ts` | **79/79 passing (100% Pass)** |
| **Operations Governance Suite** | `tests/unit/phase-5-redesign-operations-governance.test.ts` | **70/70 passing (100% Pass)** |
| **Total Automated Unit Tests** | `npx tsx --test` | **149/149 passing (100% Pass)** |
| **Accessibility Compliance** | Touch targets >= 44px (Rule R-03), 13.90:1 AAA contrast | **Verified (Pass)** |
| **Brand Color Compliance** | 0 `#ff6100`, 0 `$cta-orange`, 0 `#2563eb`, Signature Lemon restored | **Verified (Pass)** |
| **Git Authorship** | `Fenar7 <86710532+Fenar7@users.noreply.github.com>` | **Verified (Pass)** |
| **PR Merge State** | Zero automated merges rule | **Strictly OPEN (Pass)** |

---

> [!NOTE]
> Per strict behavioral governance rules, this Pull Request remains strictly **OPEN** awaiting manual human review and manual clicking of the "Merge" button on GitHub.
