# Focus Invariant Protection, Modal Mutual Exclusion & Concierge Photographic Portrait

> **Module**: Chat Pod & Header Overlay Lifecycle Architecture  
> **Branch**: `remediation/turbopack-compaction-dev-server`  
> **Associated PR**: [PR #107 (OPEN)](https://github.com/Fenar7/marca_ubi_web_hosting/pull/107)  
> **Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Audit Status**: `APPROVAL-READY` (All 7 Quality Gates Passed)

---

## 1. Executive Summary & Defect Remediation

### Defect 1: Typing Caret Drop & Focus Loss
- **Mechanical Root Cause**: In `ClientHeader.tsx`, the continuous Pentagram dual-slot rolling engine updates `activeDisciplineIndex` every ~3.5 seconds. Because `closeDrawer` was passed unmemoized to `<NavigationOverlay>`, `handleKeyDown` and the overlay lifecycle effect were recreated on every roll. Inside that effect, `focusTarget?.focus()` repeatedly snatched DOM focus away from the Chat Pod `<textarea>` and transferred it to the top-right overlay close button.
- **Remediation**:
  1. Guarded `focusTarget?.focus()` in `NavigationOverlay.tsx` with a `prevOpenRef` transition guard (`isInitialOpen = !prevOpenRef.current && isOpen`), preventing focus shifts on background re-renders.
  2. Memoized `closeDrawer` in `ClientHeader.tsx` with `useCallback(() => setIsDrawerOpen(false), [])`.

### Defect 2: Competing Background Navigation Overlay
- **Mechanical Root Cause**: Zero cross-overlay synchronization between `NavigationOverlay` (`z-index: 100`) and `ChatPod` (`z-index: 30003`). If the site navigation drawer was opened during testing, launching Chat Pod rendered over the active overlay without dismissing it, causing keyboard traps and background focus conflicts.
- **Remediation**:
  1. `ChatPod.tsx`: Dispatches `window.dispatchEvent(new Event("navigation:close"))` when `openPanel()` is triggered.
  2. `ClientHeader.tsx`: Registers passive listeners for `navigation:close` and `chatpod:open` to immediately close the navigation drawer (`setIsDrawerOpen(false)`).
  3. `ClientHeader.tsx`: Dispatches `chatpod:close` when the navigation drawer is opened.
  4. `ChatPod.tsx`: Registers a mount listener for `chatpod:close` to invoke `closePanel()`.

### Defect 3: Authentic Lady Concierge Photographic Portrait
- **Mechanical Root Cause**: The previous iteration substituted a vector SVG silhouette icon rather than rendering an authentic photographic portrait of a lady concierge.
- **Remediation**:
  1. `PersonaHeader.tsx`: Replaced SVG silhouette markup with Next.js `<Image src="/avatars/sophia-sterling.jpg" alt="Ubi, Concierge" width={38} height={38} className={styles.avatarImg} priority />`.
  2. `ChatPod.module.scss`: Implemented `.avatarImg` with Apple HIG continuous squircle geometry (`border-radius: 10px`), specular ring highlight, and preserved the isolated emerald live radar beacon (`#22c55e`).
  3. Maintained permanent disclosure (`PERSONA.identityLine`: "DIGITAL ASSISTANT · NOT A PERSON") and accessible text nodes for `Menu` and `Close`.

---

## 2. Verification & Automated Test Evidence

- **TypeScript Typecheck**:
  `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit`
  `Exit code: 0` (0 type errors across all modules)

- **Chat Pod Unit & Contract Test Suite**:
  `npx tsx --test tests/unit/chatpod-composer-and-avatar.test.ts`
  `Tests: 18 passed, 0 failed`

- **Chat Pod Scoped Regression Suite**:
  `npm exec -- tsx --test tests/unit/chatpod-*.test.ts`
  `Tests: 217 passed, 0 failed`

- **Global Regression Suite**:
  `npm run test:unit`
  `Tests: 1,234 passed, 0 failed (100% green)`

- **Next.js Server Action Boundaries**:
  `npm run test:boundaries`
  `12 files audited, 48 actions verified (100% compliant)`
