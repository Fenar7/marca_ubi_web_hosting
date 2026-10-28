# Architectural Plan: Removal of Slash Dividers in Integrated Capabilities Cloud

> **Task ID**: `TASK-CLIENT-CAPABILITIES-SLASH-REMOVAL-001`  
> **Status**: READY FOR USER REVIEW  
> **Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Target Files**:
> - `src/app/components/Sections/ProcessCurtain.tsx`
> - `src/app/components/Sections/ProcessCurtain.module.scss`  
> **References**:
> - `Screenshot 2026-10-28 103629.png` (Section overview: "Systems over isolated outputs." / "INTEGRATED CAPABILITIES")
> - `Screenshot 2026-10-28 103625.png` (Zoomed-in slash divider)

---

## 1. Problem Statement & User Directive

The user provided `Screenshot 2026-10-28 103629.png` and `Screenshot 2026-10-28 103625.png` and stated:
> *"btw ehre in this seciotn remove the [Screenshot 2026-10-28 103625.png] remoe these slash in between just space in between them is enough"*

Currently, `ProcessCurtain.tsx` displays the 12 integrated capabilities ("Brand Strategy", "Visual Identity Systems", "Creative Direction", etc.) in a flowing typographic cloud separated by explicit forward slashes:
```tsx
{index < DISCIPLINES.length - 1 && (
  <span className={`${styles.slashDivider} ${isSlashActive ? styles.activeSlash : ""}`} aria-hidden="true">
    /
  </span>
)}
```
The user has requested the removal of all slash dividers (`/`), replacing them with natural, fluid architectural whitespace and margin spacing between the capability items.

---

## 2. Proposed Implementation Strategy

### A. Component Refinement (`ProcessCurtain.tsx`)
1. Remove the rendering of `.slashDivider` and `/` characters from the typographic cloud map loop.
2. Simplify the cloud wrapper:
```tsx
<div className={styles.cloudWrapper}>
  {DISCIPLINES.map((discipline, index) => (
    <button
      key={discipline}
      type="button"
      className={styles.disciplineItem}
      aria-label={`Practice area: ${discipline}`}
    >
      {discipline}
    </button>
  ))}
</div>
```
3. Remove unused `hoveredIndex` / `isSlashActive` state tracking if no longer needed, streamlining component lifecycle and rendering performance.

### B. SCSS Layout Refinement (`ProcessCurtain.module.scss`)
1. In `.cloudWrapper`, introduce generous fluid spacing:
```scss
.cloudWrapper {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.85rem clamp(1.25rem, 2.5vw, 2.25rem);
  line-height: 1.35;
}
```
2. In `.disciplineItem`:
   - Maintain the refined Circular XX clamp font sizing (`clamp(1.5rem, 2.75vw, 2.75rem)`).
   - Maintain subtle hover color shift to Brand Red (`#ea002a`).
   - Remove obsolete `.slashDivider`, `.activeSlash`, and `.itemGroup` styling.

---

## 3. Verification & Safety Strategy
- Verify with `tests/client/client_160over90_platform.test.ts` and ensure all 42 platform invariants pass.
- Run `npx tsc --noEmit` to verify 0 type errors.
- Commit strictly authored as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
- Push to current working branch or dedicated branch as requested.
