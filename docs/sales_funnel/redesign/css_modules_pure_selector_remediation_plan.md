# CSS Modules Pure Selector Build Error: Root Cause & Remediation Plan

> **Issue**: Next.js / Turbopack build failure: `Selector "[data-admin-root="true"]" is not pure. Pure selectors must contain at least one local class or id.`  
> **Impacted Files**: 6 `.module.scss` files in the CRM workspace  
> **Document Location**: `docs/sales_funnel/redesign/css_modules_pure_selector_remediation_plan.md`  
> **Author**: Fenar7 <86710532+Fenar7@users.noreply.github.com>

---

## 1. What is this Error?

During `next build` (Next.js 16 with Turbopack), the CSS compiler reported the following fatal error across 6 CSS module files:

```
Error: Turbopack build failed with 6 errors:
1. ./src/app/admin/(workspace)/deals/[id]/not-found.module.scss.module.css
   Transforming CSS failed
   Selector "[data-admin-root="true"]" is not pure. Pure selectors must contain at least one local class or id.

2. ./src/app/admin/(workspace)/deals/[id]/page.module.scss.module.css
   Transforming CSS failed
   Selector "[data-admin-root="true"]" is not pure. Pure selectors must contain at least one local class or id.

3. ./src/app/admin/(workspace)/leads/[id]/not-found.module.scss.module.css
   Transforming CSS failed
   Selector "[data-admin-root="true"]" is not pure. Pure selectors must contain at least one local class or id.

4. ./src/app/admin/(workspace)/leads/[id]/page.module.scss.module.css
   Transforming CSS failed
   Selector "[data-admin-root="true"]" is not pure. Pure selectors must contain at least one local class or id.

5. ./src/app/admin/components/DossierWorkspace/LeadDossierWorkspace.module.scss.module.css
   Transforming CSS failed
   Selector "[data-admin-root="true"]" is not pure. Pure selectors must contain at least one local class or id.

6. ./src/app/admin/components/layout/AdminBreadcrumbs.module.scss.module.css
   Transforming CSS failed
   Selector "[data-admin-root="true"]" is not pure. Pure selectors must contain at least one local class or id.
```

---

## 2. Root Cause Analysis

### 2.1 The "Pure Selectors" Constraint in CSS Modules
In CSS Modules (`*.module.scss` / `*.module.css`), every selector must be **pure**, meaning it must contain at least one locally scoped class or ID (e.g. `.breadcrumbNav` or `#myElement`). This allows Next.js / LightningCSS to generate hashed local class names (such as `.AdminBreadcrumbs_breadcrumbNav__x7y2z`) to prevent global stylesheet collision.

Global or naked selectors—such as tag names (`body`, `div`) or attribute selectors (`[data-admin-root="true"]`) without an attached local class—are considered **impure**. If placed in a `.module.scss` file, the build system rejects them immediately.

### 2.2 Why `[data-admin-root="true"]` Leaked into CSS Modules
In `src/app/admin/styles/tokens.scss`, line 10 defines the CRM root variables under a global attribute selector:
```scss
[data-admin-root="true"] {
  --admin-canvas-bg: #f7f8fa;
  --admin-card-bg: #ffffff;
  --admin-border-default: #e2e5ea;
  ...
}
```
Further down (lines 88-219), `tokens.scss` defines Sass mixins:
- `@mixin accordionPillPrimary`
- `@mixin accordionPillSecondary`
- `@mixin accordionPillGhost`
- `@mixin adminMonoToken`

When the 6 affected `.module.scss` files added:
```scss
@use '../../styles/tokens.scss' as *;
```
to consume the button mixins, Sass `@use` imported the **entire** file, including the top-level selector `[data-admin-root="true"] { ... }`. 

Because `[data-admin-root="true"]` has no local class or ID, Next.js / Turbopack treats it as an impure selector emitted inside a CSS Module, halting the build.

### 2.3 Global Variable Architecture Clarification
The global layout at `src/app/admin/layout.tsx` **already imports `tokens.scss` globally**:
```typescript
// src/app/admin/layout.tsx
import './styles/tokens.scss';
```
And `AdminRootClientProvider.tsx` attaches `data-admin-root="true"` to the admin shell container.

Therefore:
- **CSS Variables** (`var(--admin-canvas-bg)`, `var(--admin-card-bg)`, `var(--admin-text-primary)`, etc.) are already globally available in the browser runtime under all admin routes without needing `@use 'tokens.scss'`.
- The **only reason** the 6 `.module.scss` files imported `tokens.scss` was to access the Sass `@mixin`s (`accordionPillPrimary`, `adminMonoToken`, etc.).

---

## 3. The Clean Architectural Solution

To resolve this completely and adhere to industry Sass/CSS-Module best practices:

### Step 1: Separate Mixins from Variable Selectors
Create a dedicated mixin partial:
`src/app/admin/styles/mixins.scss`
This file will contain **only** pure Sass mixins and zero CSS selector rules:
- `@mixin accordionPillPrimary`
- `@mixin accordionPillSecondary`
- `@mixin accordionPillGhost`
- `@mixin adminMonoToken`

Because `mixins.scss` contains **only definitions** (no top-level rules or selectors), Sass emits zero CSS output when it is `@use`d. The mixin code is only emitted when included inside a local class (e.g. `.btnConvertDeal { @include accordionPillPrimary; }`), which makes every selector **100% pure**.

### Step 2: Forward Mixins in `tokens.scss`
In `src/app/admin/styles/tokens.scss`:
Add `@forward './mixins';` at the top and remove the duplicate mixin declarations. This ensures full backward compatibility for any other imports.

### Step 3: Update the 6 Impacted `.module.scss` Files
In each of the 6 files:
1. `src/app/admin/components/layout/AdminBreadcrumbs.module.scss`
2. `src/app/admin/components/DossierWorkspace/LeadDossierWorkspace.module.scss`
3. `src/app/admin/(workspace)/leads/[id]/page.module.scss`
4. `src/app/admin/(workspace)/leads/[id]/not-found.module.scss`
5. `src/app/admin/(workspace)/deals/[id]/page.module.scss`
6. `src/app/admin/(workspace)/deals/[id]/not-found.module.scss`

Change the import from:
```scss
// ❌ Imports impure [data-admin-root="true"] rule
@use '../../styles/tokens.scss' as *;
```
to:
```scss
// ✅ Pure Sass mixins only - zero impure selectors emitted
@use '../../styles/mixins.scss' as *;
```

---

## 4. Verification Plan

1. **Local Turbopack Build**:
   Execute `npm run build` to confirm `next build` passes with **0 errors**.
2. **TypeScript Compilation**:
   Execute `npx tsc --noEmit` to confirm 0 type errors.
3. **Unit Tests**:
   Execute `npm run test:unit` to confirm all 910+ unit tests continue to pass.
4. **Git Commit & Push**:
   Commit the fix with author `Fenar7 <86710532+Fenar7@users.noreply.github.com>` and update PR #72.

---

> [!IMPORTANT]
> **Strict Behavioral Rule Enforcement**: In accordance with the workspace rules (`STRICT BEHAVIORAL RULE: NEVER EXECUTE WITHOUT EXPLICIT PERMISSION`), no code modifications have been made.
> 
> Please reply with **`proceed`** or **`yes, do it`** to execute this remediation and verify the production build.
