# Master Architectural & Editorial Remediation Plan: Footer, Sections & Global Copy Parity

> **Document Context**: `docs/editorial_and_footer_refinements/master_editorial_and_footer_refinement_plan.md`  
> **Status**: **AWAITING USER CONFIRMATION TO EXECUTE ("proceed")**  
> **Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Target Branch**: `refactor/footer-editorial-and-section-streamlining` (created from `master`)  
> **Target PR**: New Pull Request targeting `master` (strictly **OPEN**)

---

## 1. Overview & Confirmed Specifications

Based on your visual review and exact directive, this plan locks in all 5 refinements across the codebase:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         CONFIRMED REFINEMENT MATRIX                              │
├────────────────────────────────┬─────────────────────────────────────────────────┤
│ 1. Social Links Hover State    │ Screenshot 160341: Smooth brand red (#ea002a)   │
│    (ConnectCutout.module.scss) │ hover & focus transition; visited fix.          │
├────────────────────────────────┼─────────────────────────────────────────────────┤
│ 2. Footer Column Headers       │ Screenshot 160428: Remove 01/02/03/04 headers   │
│    (MonumentalFooter.tsx)      │ completely for pure broadsheet directory.       │
├────────────────────────────────┼─────────────────────────────────────────────────┤
│ 3. Wording Modernization       │ Screenshot 160513:                              │
│    ("Contact" & "Calicut")     │ - "Direct Channel" -> "Contact"                 │
│                                │ - "Kozhikode" -> "Calicut" across all files.    │
├────────────────────────────────┼─────────────────────────────────────────────────┤
│ 4. Eradicate Numbered Kickers  │ Screenshot 160558: Purge "08 / DIRECT DESKS..." │
│    (All Sections Stream)       │ and all numbered section labels across the site.│
├────────────────────────────────┼─────────────────────────────────────────────────┤
│ 5. Distributed Creators Copy   │ Exact User Copy:                                │
│    (GlobalLocationsCloud.tsx)  │ "Our finest creators and collaborators working  │
│                                │  across India to deliver top-notch digital      │
│                                │  assets and creatives."                         │
└────────────────────────────────┴─────────────────────────────────────────────────┘
```

---

## 2. Step-by-Step Execution Plan

### Step 1: Branch Isolation
- Create and switch to new sub-branch off `master`:
  ```bash
  git checkout -b refactor/footer-editorial-and-section-streamlining
  ```

---

### Step 2: Social Links Strip Smooth Brand Red Hover (`Screenshot 160341`)
- **File**: `src/app/components/Sections/ConnectCutout.module.scss` (lines 183–196)
- **Updates**:
  - Add `display: inline-flex; align-items: center; padding: 4px 0; cursor: pointer;` to provide an accessible hit target.
  - Add `transition: color 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;`.
  - Add explicit `:visited` and `:visited:hover` rules to prevent browser visited link color locking.
  - Enforce `color: $client-accent-red !important` on `&:hover`, `&:visited:hover`, and `&:focus-visible`.
  - Add accessible focus ring: `outline: 2px solid $client-accent-red; outline-offset: 4px; border-radius: 2px;`.

---

### Step 3: Remove Numbered Column Headers from Monumental Footer (`Screenshot 160428`)
- **File**: `src/app/components/Sections/MonumentalFooter.tsx` (lines 48–103)
- **Updates**:
  - Delete line 50: `<h3 className={styles.columnTitle}>01 / Identity &amp; Practice</h3>`
  - Delete line 58: `<h3 className={styles.columnTitle}>02 / Navigation</h3>`
  - Delete line 71: `<h3 className={styles.columnTitle}>03 / Direct Desks</h3>`
  - Delete line 97: `<h3 className={styles.columnTitle}>04 / Studio Corridors</h3>`
  - Wrap Columns 2 and 3 in semantic `<nav>` landmarks for accessibility (`aria-label="Footer Navigation"` and `aria-label="Direct Contact Desks"`).

---

### Step 4: Nomenclature Updates — "Contact" & "Calicut" (`Screenshot 160513`)
- **"Direct Channel" &rarr; "Contact"**:
  - `src/app/components/Sections/ConnectCutout.tsx` (line 40):
    ```tsx
    <span className={styles.deskLabel}>Contact</span>
    ```
- **"Kozhikode" &rarr; "Calicut"**:
  - `src/app/components/Sections/GlobalLocationsCloud.tsx`:
    - Line 16: `city: "Calicut"`
    - Line 19: `address: "HiLITE Business Park, Calicut, Kerala 673014"`
    - Line 20: `mapsUrl: "https://www.google.com/maps/search/?api=1&query=HiLITE+Business+Park%2C+Calicut"`
    - Line 35: JSDoc `Calicut (HiLITE Business Park) and Trivandrum.`
    - Line 129: `<span className={styles.railText}>HiLITE Business Park, Calicut</span>`
  - `src/app/components/ContactCtaSection/ContactCtaSection.tsx`:
    - Update query and text to `Calicut`.
  - `src/app/components/NavigationOverlay/NavigationOverlay.tsx`:
    - `Authentic Kerala Studios: Calicut &amp; Trivandrum`
  - `src/app/layout.tsx`:
    - `addressLocality: "Calicut"`
  - `src/app/privacy/page.tsx`:
    - `studios in Calicut and Trivandrum`
  - `tests/client/client_160over90_platform.test.ts`:
    - Update lines 446, 461, 476, and 526 to accept `"Calicut"`.

---

### Step 5: Numbered Section Kickers Eradication Across All Views (`Screenshot 160558`)
- Remove numbered kicker elements across all sections to achieve monumental benchmark purity:
  - `ConnectCutout.tsx` (line 31): Delete `<span className={styles.kicker}>08 / Direct Desks &amp; Commissions</span>`
  - `TestimonialsCutout.tsx` (line 24): Delete `<span className={styles.kicker}>05 / Client Evidence</span>`
  - `ValuesCutout.tsx` (line 52): Delete `<span className={styles.kicker}>04 / Guiding Principles</span>`
  - `ProcessCurtain.tsx` (line 75): Delete `<span className={styles.sectionLabel}>03 / Methodology &amp; Scope</span>`
  - `AboutCurtain.tsx` (line 60): Delete `<span className={styles.sectionLabel}>01 / About</span>`
  - `DispatchesCurtain.tsx` (line 77): Delete `<span className={styles.sectionLabel}>06 / Studio Dispatches</span>`
  - `GlobalLocationsCloud.tsx` (line 75): Delete `<span className={styles.sectionLabel}>07 / Studio Corridors</span>`
  - `ServicesAccordion.tsx` (line 32): Delete `<span className={styles.sectionKicker}>02 / Practice Spectrum</span>`
  - `WorksCutout.tsx` (line 40) & `ClientHomeExperience.tsx` (line 70): Remove kicker string.

---

### Step 6: Distributed Creators Across India Copy (`GlobalLocationsCloud.tsx`)
- **File**: `src/app/components/Sections/GlobalLocationsCloud.tsx` (lines 76–80)
- **Replace**:
  ```tsx
  // BEFORE:
  <p className={styles.summaryText}>
    Operating across Kerala with permanent studios in Kozhikode and Trivandrum,
    delivering strategic brand architecture and digital flagships.
  </p>

  // AFTER:
  <p className={styles.summaryText}>
    Our finest creators and collaborators working across India to deliver top-notch digital assets and creatives.
  </p>
  ```

---

## 3. Verification & Quality Gates

1. **TypeScript Static Integrity**:
   - Run type checks to confirm 0 compilation errors and zero `any` types.
2. **Platform Test Suite**:
   - Run `node --import tsx --test tests/client/client_160over90_platform.test.ts` to confirm 100% pass rate.
3. **Commit & Push**:
   - Author: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`
   - Message: `Design Polish: Footer Architecture, Editorial Nomenclature, Section Streamlining and Distributed Creators Copy` (strictly NO `feat`).
   - Push to `origin refactor/footer-editorial-and-section-streamlining`.
4. **Pull Request**:
   - Open PR targeting `master`.
   - Strictly leave in `OPEN` state awaiting manual user click on GitHub.

---

## 4. Ready to Execute
> [!IMPORTANT]
> The plan is 100% updated with your exact copy and specifications.
> Please reply **"proceed"** to execute immediately.
