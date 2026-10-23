# Architectural Redesign Plan: Configure Tab Permissions Governance Modal

**Target Component**: `src/app/admin/(workspace)/team/components/EditUserPermissionsModal.tsx`  
**Target Stylesheet**: `src/app/admin/(workspace)/team/components/EditUserPermissionsModal.module.scss`  
**Visual Reference**: Screenshot (`Screenshot 2026-10-23 193925.png`)  
**Design Standards**: PrimeStay &times; Linear Light Luxury (`DESIGN.md`, `master-ui-ux-design-system`, Rules R-01 to R-38)

---

## 1. Executive Summary & Root Cause Diagnosis

An exhaustive line-by-line inspection by the **Expert UI/UX Designer Agent** and **Expert Frontend Architect Agent** identified 5 primary architectural defects in the current permissions modal:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ CURRENT DEFECTS IN EDIT USER PERMISSIONS MODAL                                         │
├──────────────────────────────────────┬─────────────────────────────────────────────────┤
│ Defect 1: Header Close Button        │ 44px box cramps 14px SVG cross + <kbd>Esc</kbd> │
│                                      │ badge, compressing the cross into an ugly dot.  │
├──────────────────────────────────────┼─────────────────────────────────────────────────┤
│ Defect 2: Footer Multi-Line Wrapping │ "Select All" and "Role Defaults" wrap to 2      │
│                                      │ lines because uppercase "SAVE PERMISSIONS" pill │
│                                      │ (215px) starves left toolbar down to 89px.      │
├──────────────────────────────────────┼─────────────────────────────────────────────────┤
│ Defect 3: Obsolete Brand Accent      │ Legacy Accordion Lemon Yellow (#eefb87) pill    │
│                                      │ contradicts Marca Orange (#ff6100) standard.   │
├──────────────────────────────────────┼─────────────────────────────────────────────────┤
│ Defect 4: Card Title Wrapping        │ Tab titles (e.g. "Commercial Analytics") wrap  │
│                                      │ into 2 lines because route slugs (/admin/...)   │
│                                      │ share the exact same unconstrained row.         │
├──────────────────────────────────────┼─────────────────────────────────────────────────┤
│ Defect 5: Avatar Invisibility        │ Dossier strip strictly renders initials         │
│                                      │ ignoring the team member's avatar_url.          │
└──────────────────────────────────────┴─────────────────────────────────────────────────┘
```

---

## 2. Redesign Architectural Pillars

### Pillar 1: Header Geometry & 36px Circular Close Action
- **Visual Design**: Replace the rectangular `<kbd>Esc</kbd>` button with a **pure circular button** (`width: 36px; height: 36px; border-radius: 50%`).
- **Icon**: Centered, balanced SVG `✕` (`width: 16px; height: 16px; stroke-width: 2`).
- **Surfaces**: Hairline border (`#e2e5ea`), transparent background, soft hover state (`background: #f4f6f9; border-color: #cbd5e1; transform: scale(1.04)`).
- **Accessibility**: Remove `<kbd>Esc</kbd>` from DOM (keyboard `Escape` listener remains fully active in React `useEffect`). Set `aria-label="Close modal (Esc)"` and `title="Close modal (Esc)"`.

### Pillar 2: Footer Layout & Zero-Wrap 38px Standard
- **Modal Dialog Canvas**: Expand `max-width` from `580px` to **`620px`** (adding 40px of breathing room).
- **Mandatory Non-Wrapping Invariant**: Apply `white-space: nowrap;` across all buttons (`.quickActionBtn`, `.cancelButton`, `.submitButton`).
- **Standardized Rhythm**: Standardize all 4 buttons to **38px height** and **8px radius** (`border-radius: 8px`). Eliminates corner radius collisions between 6px, 9999px pills, and 16px modal borders.
- **Space Reclamation**: Convert `"SAVE PERMISSIONS"` to sentence-case `"Save Permissions"`, reducing primary button width from 215px to ~145px, freeing up 70px for `.footerLeft`.

### Pillar 3: Primary Action Brand Token Unification
- **Eradicate Accordion Lemon Yellow (`#eefb87`)**:
  - Replace with **Marca Orange Brand Action Button**:
    - `background: linear-gradient(135deg, #ff6100 0%, #e05500 100%);`
    - `color: #ffffff; font-weight: 600; font-size: 0.82rem;`
    - Specular top highlight: `box-shadow: 0 2px 8px rgba(255, 97, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.2);`
    - Hover: `background: #e05500; box-shadow: 0 4px 14px rgba(255, 97, 0, 0.38); transform: translateY(-1px);`
- **Secondary / Cancel Button**:
  - `height: 38px; border-radius: 8px; background: #ffffff; border: 1px solid #e2e5ea; color: #525965; font-weight: 600; font-size: 0.8rem;`
- **Loading Spinner**:
  - Inline 14px circular spinner (`border: 2px solid rgba(255, 255, 255, 0.35); border-top-color: #ffffff; border-radius: 50%`) beside `"Updating..."` to eliminate width reflow during Server Action mutation.

### Pillar 4: Enclave Card Anatomy & Title Preservation
- **Decouple Title from Route**:
  - Row 1: Tab title (`tab.label`) occupies **100% of the top row** with `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`. Any `Locked` pill is pinned cleanly at the trailing edge.
  - Row 2: Secondary hint (`tab.hint`) in muted slate typography (`#525965`).
  - Row 3: Technical route slug (`tab.route`) rendered as a subtle **Raycast Monospace Chip** (`font-size: 0.66rem; background: rgba(31, 36, 47, 0.03); border: 1px solid #eef0f3; padding: 0.1rem 0.4rem; border-radius: 4px;`).
- **No Nested Bento Inception**:
  - Replace the heavy grey enclave background (`#f0f2f5`) with clean, borderless section envelopes separated by subtle hairline dividers.
- **Card States & Polish**:
  - Inactive: Pure white `#ffffff`, 1px solid `#e2e5ea`, 10px radius.
  - Active: Brand focus ring (`border-color: #ff6100; box-shadow: 0 0 0 1px #ff6100, 0 2px 8px rgba(255, 97, 0, 0.08);`).
  - Custom Checkbox: 18px rounded checkbox (`border-radius: 4px`) with brand `#ff6100` fill and white checkmark when checked.

### Pillar 5: User Dossier Strip Photography Integration
- Incorporate Next.js `<Image />` (`width={46} height={46} unoptimized`) for `targetMember.avatar_url`.
- Add local state `avatarError` with `onError={() => setAvatarError(true)}` falling back to `{getInitials(targetMember.full_name)}`.
- Render role as a crisp Raycast monospace badge (`SALES MANAGER`, `SALES EXECUTIVE`, `ADMIN`).

---

## 3. Concrete Implementation Plan & Files to Modify

### File 1: `src/app/admin/(workspace)/team/components/EditUserPermissionsModal.tsx`
1. Add `avatarError` state and Next.js `Image` import.
2. Update header close button: 36px circular button with SVG `✕`, removing `<kbd>Esc</kbd>`.
3. Update user dossier strip: render `<Image />` when `avatar_url` is present.
4. Refactor enclave card DOM: separate `.tabTitleRow` (title + locked pill) from `.tabHint` and `.tabRouteTag`.
5. Update footer buttons: sentence-case `"Save Permissions"`, add `.btnSpinner` during `isPending`.
6. Retain all defensive invariants: `isSelf` and admin role self-protection rules for `users` and `settings`.

### File 2: `src/app/admin/(workspace)/team/components/EditUserPermissionsModal.module.scss`
1. `.modalDialog`: `max-width: 620px; border-radius: 16px;`.
2. `.closeButton`: `width: 36px; height: 36px; border-radius: 50%; border: 1px solid #e2e5ea;`.
3. `.tabsGrid`: `grid-template-columns: repeat(2, 1fr); gap: 0.65rem;`.
4. `.tabCard`: pure `#ffffff` surface, 10px radius, `#ff6100` active state.
5. `.customCheckbox`: 18px with `#ff6100` fill on active.
6. `.modalFooter`: `padding: 0.85rem 1.75rem; justify-content: space-between;`.
7. `.quickActionBtn`, `.cancelButton`, `.submitButton`: `height: 38px; border-radius: 8px; white-space: nowrap;`.
8. `.submitButton`: Marca Orange gradient (`#ff6100` to `#e05500`), white text, specular box-shadow.

---

## 4. Delivery Gate Verification Checklist

| Verification Gate | Expected Target |
| :--- | :--- |
| **TypeScript Typecheck** | `npx tsc --noEmit` exits 0 (0 errors) |
| **Team Governance Tests**| `npx tsx --test tests/team/*.test.ts` passes 79/79 (100%) |
| **Boundary Tests** | `npm run test:boundaries` passes 45/45 Server Actions |
| **No Lemon Yellow** | 0 occurrences of `#eefb87` in `EditUserPermissionsModal.*` |
| **No Text Wrapping** | "Select All", "Role Defaults", "Save Permissions" render strictly on 1 line |
| **No Title Wrapping** | All 9 tab titles render on a single line |
| **Circular Close Action**| 36px &times; 36px circle with centered `✕` |
| **Git Authorship** | `Fenar7 <86710532+Fenar7@users.noreply.github.com>` |
| **Zero Merge Rule** | PR #78 remains strictly **OPEN** |
