# Architecture Plan: Complete Purge of the Word "Doctrine" Across the Platform

## Executive Summary
This implementation plan establishes the architectural steps to eradicate all occurrences of the word **"Doctrine"** (and any variants) from client-facing copy, accessibility attributes, navigation overlays, footer directories, and component namespaces across the entire Marca Ubi web platform.

---

## 1. Forensic Audit & Inventory of Occurrences

| Scope | File Path | Current Occurrence | Target Replacement | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Header Nav Overlay** | [`NavigationOverlay.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/NavigationOverlay/NavigationOverlay.tsx#L12) | `{ label: "About & Doctrine", href: "/#about" }` | `{ label: "About", href: "/#about" }` | Restores clean single-word Swiss menu hierarchy matching `Works`, `Methodology`, etc. |
| **Monumental Footer** | [`MonumentalFooter.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/MonumentalFooter.tsx#L9) | `{ label: "About & Doctrine", href: "/#about" }` | `{ label: "About", href: "/#about" }` | Standardizes footer directory entry with primary navigation. |
| **Homepage Section Kicker** | [`AboutDoctrineCurtain.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/AboutDoctrineCurtain.tsx#L83) | `<span className={styles.sectionLabel}>01 / About &amp; Doctrine</span>` | `<span className={styles.sectionLabel}>01 / About</span>` | Eliminates dogma/academic jargon; adopts direct Swiss editorial tone. |
| **WAI-ARIA Accessibility** | [`AboutDoctrineCurtain.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/AboutDoctrineCurtain.tsx#L76) | `aria-label="About and Agency Doctrine"` | `aria-label="About Marca Ubi"` | Clear, descriptive, and accessible screen-reader announcement. |
| **Component & File Namespace** | `src/app/components/Sections/AboutDoctrineCurtain.tsx` | `AboutDoctrineCurtain` | `AboutCurtain` | Complete eradication from React component tree and DevTools. |
| **SCSS Module Namespace** | `src/app/components/Sections/AboutDoctrineCurtain.module.scss` | `.doctrineBlock`, `.doctrineLead`, `.doctrineSupport` | `.narrativeBlock`, `.narrativeLead`, `.narrativeSupport` | Eliminates word from DOM generated class hashes. |
| **Client Home Experience** | [`ClientHomeExperience.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/ClientHomeExperience/ClientHomeExperience.tsx#L7) | `import AboutDoctrineCurtain ...` | `import AboutCurtain ...` | Consumes clean component namespace. |
| **Platform Test Suite** | [`client_160over90_platform.test.ts`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/tests/client/client_160over90_platform.test.ts#L395) | `AboutDoctrineCurtain` references | `AboutCurtain` references | Preserves 100% test pass rate across all 37 invariant checks. |

---

## 2. Proposed Changes

### A. Navigation Overlay (`NavigationOverlay.tsx`)
```diff
-  { label: "About & Doctrine", href: "/#about" },
+  { label: "About", href: "/#about" },
```

### B. Monumental Footer (`MonumentalFooter.tsx`)
```diff
-  { label: "About & Doctrine", href: "/#about" },
+  { label: "About", href: "/#about" },
```

### C. About Curtain Component (`AboutCurtain.tsx`)
```diff
-      aria-label="About and Agency Doctrine"
+      aria-label="About Marca Ubi"
...
-            <span className={styles.sectionLabel}>01 / About &amp; Doctrine</span>
+            <span className={styles.sectionLabel}>01 / About</span>
...
-          <div className={styles.doctrineBlock}>
-            <p className={styles.doctrineLead}>
+          <div className={styles.narrativeBlock}>
+            <p className={styles.narrativeLead}>
...
-            <p className={styles.doctrineSupport}>
+            <p className={styles.narrativeSupport}>
```

### D. SCSS Module (`AboutCurtain.module.scss`)
```diff
-.doctrineBlock {
+.narrativeBlock {
...
-.doctrineLead {
+.narrativeLead {
...
-.doctrineSupport {
+.narrativeSupport {
```

### E. Test Invariant Updates (`client_160over90_platform.test.ts`)
- Update file paths: `AboutDoctrineCurtain.module.scss` -> `AboutCurtain.module.scss`
- Update view check: `assert.ok(content.includes("<AboutCurtain"), "View 02: AboutCurtain must be present");`

---

## 3. Verification & Safety Protocol

1. **Static Typecheck**:
   ```powershell
   npx tsc --noEmit
   ```
   Must yield **0 errors**.

2. **Platform Invariant Tests**:
   ```powershell
   npx tsx --test tests/client/client_160over90_platform.test.ts
   ```
   Must verify **37 / 37 PASS**.

3. **Global Repository Audit**:
   ```powershell
   git grep -i "doctrine" -- src/
   ```
   Must return **0 matches** across the entire `src/` directory.

4. **Git Governance**:
   - Author strictly: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`
   - Commit title: `Content Refinement: Complete Purge of Doctrine Terminology Across Platform`
   - Target PR: [PR #84](https://github.com/Fenar7/marca_ubi_web_hosting/pull/84) remains strictly **OPEN** (Zero automated merges).
