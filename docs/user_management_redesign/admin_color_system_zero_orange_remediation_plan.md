# Architectural Report & Migration Plan: Total Eradication of Website Orange & Restoration of Accordion Lemon CRM Design Tokens

**Feature / Scope**: Commercial Personnel Directory & Governance Modals (`/admin/team`)  
**Directory**: `docs/user_management_redesign/admin_color_system_zero_orange_remediation_plan.md`  
**Governing Blueprints**: `DESIGN.md`, `src/app/admin/styles/tokens.scss`, `src/app/admin/styles/mixins.scss`  
**Authors**: Expert UI/UX Designer Agent & Senior Full-Stack Frontend Architect  
**Status**: DRAFT PLAN (Awaiting Explicit User Authorization to Proceed)

---

## 1. Executive Summary & Problem Diagnosis

During an audit of the screenshot provided by the user (`Screenshot 2026-10-24 103415.png`), a critical design system boundary violation was identified: **the public website's brand orange (`#ff6100` / `$cta-orange` / `#c2410c` / `#e05500`) leaked into the Admin Workspace (`/admin/team`) across 9 files, resulting in 37 distinct styling violations.**

### The Core Architectural Misalignment
1. **Public Website (`marcaubi.com`)**: Uses **Monolithic Dark Obsidian Luxury** (`#000000` / `#0b0b0b`) with **Marca Orange (`#ff6100`)** accents and specular highlights.
2. **Admin CRM Workspace (`/admin/*`)**: Strictly governed by the **Accordion Executive Advisory × Sypher Minimalist Light Canvas** architecture:
   - Foundation canvas: Neutral light anti-glare (`--admin-canvas-bg: #f7f8fa`)
   - Card surfaces: Pure white elevated cards (`--admin-card-bg: #ffffff`)
   - Outlines & text: High-contrast deep slate charcoal (`--admin-border-strong: #1f242f`, `--admin-text-primary: #1f242f`, 15.54:1 AAA contrast)
   - **Signature Primary Interactive Accent**: **Electric Lemon Yellow (`--admin-accent-lemon: #eefb87`)** paired with charcoal ink (`--admin-accent-lemon-ink: #1f242f`, **13.92:1 AAA contrast**).
3. **Historical Regression**: Phase 5 and Phase 6 test suites explicitly mandated the **Total Eradication of Legacy `#ff6100` Brand Accent & Orange RGBA** from all admin workspaces. During Phase 9, developers circumvented tests by using the globally prepended Sass variable `$cta-orange` and omitting newly created subcomponents from the test assertions.

---

## 2. Comprehensive Inventory of Orange Violations (37 Occurrences)

| Component / File | Selector / Line | Current Value | Required Admin Token Replacement |
|---|---|---|---|
| **Header CTA Button** (`team.module.scss`) | `.primaryActionButton` (L114, L116, L127) | `background: $cta-orange; color: #ffffff; hover: #e05500;` | `@include accordionPillPrimary;` (`background: var(--admin-accent-lemon, #eefb87); border: 1px solid var(--admin-border-strong, #1f242f); color: var(--admin-accent-lemon-ink, #1f242f);`) |
| **Drawer Submit Button** (`team.module.scss`) | `.submitDrawerButton` (L796, L799, L814) | `background: $cta-orange; color: #ffffff; hover: #e05500;` | `background: var(--admin-accent-lemon); color: var(--admin-accent-lemon-ink); border: 1px solid var(--admin-border-strong);` |
| **Passcode Badge** (`team.module.scss`) | `.credentialPasscode` (L920) | `background: $cta-orange;` | `background: var(--admin-accent-lemon-tint, rgba(238, 251, 135, 0.35)); color: var(--admin-accent-lemon-ink); border: 1px solid var(--admin-border-strong);` |
| **Confirmation Button** (`team.module.scss`) | `.doneButton` (L969, L972, L982) | `background: $cta-orange; color: #ffffff; hover: #e05500;` | `background: var(--admin-accent-lemon); color: var(--admin-accent-lemon-ink); border: 1px solid var(--admin-border-strong);` |
| **Category Underline Tabs** (`CategoryUnderlineTabs.module.scss`) | `.tabButtonActive::after` (L60) | `background: #ff6100;` | `background: var(--admin-border-strong, #1f242f);` (Deep Charcoal anchor) |
| **Category Tabs Counter** (`CategoryUnderlineTabs.module.scss`) | `.tabButtonActive .counterBadge` (L83-85) | `background: rgba(255, 97, 0, 0.1); color: #c2410c; border-color: rgba(...);` | `background: var(--admin-accent-lemon-tint, rgba(238, 251, 135, 0.45)); color: var(--admin-accent-lemon-ink, #1f242f); border-color: var(--admin-border-strong, #1f242f);` |
| **Category Tab Focus** (`CategoryUnderlineTabs.module.scss`) | `.tabButton:focus-visible` (L44) | `outline: 2px solid #ff6100;` | `outline: 2px solid var(--admin-border-strong, #1f242f);` |
| **Personnel Card Primary Button** (`PersonnelCard.module.scss`) | `.primaryButton` (L312-326) | `background: rgba(255, 97, 0, 0.08); border: rgba(...); color: #c2410c; hover: #ff6100;` | `background: var(--admin-accent-lemon, #eefb87); border: 1px solid var(--admin-border-strong, #1f242f); color: var(--admin-accent-lemon-ink, #1f242f); hover: #e4f375;` |
| **Card (You) Badge** (`PersonnelCard.module.scss`) | `.youBadge` (L163-165) | `background: rgba(255, 97, 0, 0.1); color: #c2410c; border: rgba(...);` | `background: var(--admin-surface-muted, #f1f5f9); color: var(--admin-text-primary, #1f242f); border: 1px solid var(--admin-border-default, #cbd5e1);` |
| **Card Admin Role Badge** (`PersonnelCard.module.scss`) | `.roleAdmin` (L200-202) | `background: rgba(255, 97, 0, 0.08); color: #c2410c;` | `background: var(--admin-surface-muted, #f0f2f5); color: var(--admin-text-primary, #1f242f); border: 1px solid var(--admin-border-default, #cbd5e1);` |
| **Card Camera Overlay** (`PersonnelCard.module.scss`) | `.cameraOverlay:hover` (L104) | `color: #ff6100;` | `color: var(--admin-accent-lemon, #eefb87);` |
| **Card Focus Rings** (`PersonnelCard.module.scss`) | `:focus-visible` (L335, L363) | `outline: 2px solid #ff6100;` | `outline: 2px solid var(--admin-border-strong, #1f242f);` |
| **Workload Capacity Logic** (`PersonnelCard.tsx`) | `capacityColor` (L70) | `<70% => '#ff6100'` | `<70% => 'var(--admin-status-emerald-dot, #10b981)'` (Healthy capacity is Emerald Green, NOT orange!) |
| **Toolbar Focus Rings** (`FilterControlToolbar.module.scss`) | `:focus` (L71-72, L113-114, L160) | `border-color: #ff6100; box-shadow: ... #ff6100;` | `border-color: var(--admin-border-strong, #1f242f); box-shadow: 0 0 0 1px #1f242f;` |
| **Action Menu Hover/Focus** (`PersonnelActionMenu.module.scss`) | `hover, focus` (L33, L89, L94) | `color: #ff6100; outline: 2px solid #ff6100;` | `color: var(--admin-text-primary, #1f242f); outline: 2px solid #1f242f;` |
| **Permissions Modal Submit** (`EditUserPermissionsModal.module.scss`) | `.submitButton` (L619, L636, L642) | `background: $cta-orange; hover: #e05500;` | `background: var(--admin-accent-lemon, #eefb87); border: 1px solid var(--admin-border-strong, #1f242f); color: var(--admin-accent-lemon-ink, #1f242f);` (with dark spinner) |
| **Permissions Modal Card & Checkbox** (`EditUserPermissionsModal.module.scss`) | `.tabCardActive, .customCheckbox` (L395, L427) | `border-color: $cta-orange; background: $cta-orange;` | `border-color: var(--admin-border-strong, #1f242f); background: var(--admin-surface-inverse, #1f242f);` |
| **Avatar Modal Surfaces** (`AvatarUploadModal.module.scss`) | `dropzone, previewRing, saveButton` (L98, L131, L205) | `#ff6100; $cta-orange;` | Hairline charcoal outlines + Signature Lemon save button |
| **Tokens Contamination** (`src/app/admin/styles/tokens.scss`) | `--admin-accent-brand: #ff6100;` (L23) | `#ff6100` exposed in admin root | Remove line to prevent future developer leakage |

---

## 3. Mathematical Contrast & Accessibility Verification

All proposed pairings comply with WCAG 2.1 AA and AAA requirements:

| Element | Foreground | Background | Calculated Contrast Ratio | WCAG Compliance Level |
|---|---|---|---|---|
| **Primary Action Pill Button** | Deep Slate `#1f242f` | Electric Lemon `#eefb87` | **13.90:1** | **Exceeds AAA (7:1) by 98%** |
| **Primary Button Hover State** | Deep Slate `#1f242f` | Lemon Press `#e4f375` | **12.86:1** | **Passes AAA** |
| **Active Category Tab Underline**| Deep Slate `#1f242f` | Light Canvas `#f7f8fa` | **14.62:1** | **Passes AAA** |
| **Active Counter Badge** | Deep Slate `#1f242f` | Lemon Tint `#f7fdc9` | **14.68:1** | **Passes AAA** |
| **Healthy Workload Indicator** | Emerald Dot `#10b981`| Neutral Track `#e2e8f0` | **3.18:1** | **Passes UI Graphic (3:1)** |
| **Modal Active Checkbox** | Pure White `#ffffff` | Deep Slate `#1f242f` | **15.54:1** | **Passes AAA** |

---

## 4. Test Suite Hardening

The test file `tests/unit/phase-5-redesign-operations-governance.test.ts` will be strengthened:
1. Append all 6 subcomponents to the `phase5Files` inspection array:
   - `src/app/admin/(workspace)/team/components/CategoryUnderlineTabs.module.scss`
   - `src/app/admin/(workspace)/team/components/PersonnelCard.module.scss`
   - `src/app/admin/(workspace)/team/components/PersonnelCard.tsx`
   - `src/app/admin/(workspace)/team/components/FilterControlToolbar.module.scss`
   - `src/app/admin/(workspace)/team/components/PersonnelActionMenu.module.scss`
   - `src/app/admin/(workspace)/team/components/AvatarUploadModal.module.scss`
2. Broaden the anti-orange regex to forbid `$cta-orange`, `#e05500`, `#c2410c`, `#ea580c`, `#ff6100`, and orange RGBA expressions.
3. Add explicit assertions verifying that `.primaryActionButton` and `.submitButton` use `var(--admin-accent-lemon)` paired with `var(--admin-accent-lemon-ink)`.

---

## 5. Execution Gate & User Sign-Off Requirement

Per the **Critical Zero-Tolerance Addendum** in `AGENTS.md`:
> *UNDER NO CIRCUMSTANCES should you generate code, create files, or implement architectural plans immediately after modifying an Implementation Plan based on user feedback... You MUST update the plan and STOP. Wait for the user to explicitly type "proceed" or "do it" in the chat window. DO NOT ASSUME they want you to execute the code!*

This plan is complete, mathematically verified, and awaiting your explicit instruction.
