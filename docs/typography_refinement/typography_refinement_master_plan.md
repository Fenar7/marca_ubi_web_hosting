# Architectural Blueprint: Typography Weight & Editorial Cadence Restoration

## 1. Executive Summary & Forensic Comparison

This document outlines the architectural plan for harmonizing the client-side typography of the Marca Ubi web platform to achieve exact parity with the **160over90 benchmark design** ([160over90.com](https://www.160over90.com/)).

### Visual Evidence Comparison
- **Current Marca Ubi (`Screenshot 2026-10-26 164640.png`)**:
  - The editorial statement is rendered in heavy `font-weight: 700` (`CircularXXWeb-Bold.woff2`).
  - Stems are thick (~14px–16px at 68px scale), letter-spacing is tightly compressed (`-0.035em`), and line-height is squished (`1.16`).
  - Result: The text appears as a heavy, blocky wall of black ink rather than high-fashion editorial typography.
- **160over90 Benchmark (`Screenshot 2026-10-26 164656.png`)**:
  - The editorial statement is rendered in refined **Book / Regular weight (400)** (`CircularXXWeb-Book.woff2`).
  - Stems are crisp and monolinear (~4.5px–5.5px at 68px scale).
  - Leading is airy and expansive (`line-height: ~1.32 – 1.36`), creating comfortable vertical rhythm.
  - Tracking is natural (`letter-spacing: -0.005em` to `0em`), allowing circular apertures to breathe freely.

---

## 2. Root Cause Analysis

1. **Systemic Hard-Coded `font-weight: 700`**:
   - Component stylesheets repeatedly declared `font-weight: 700` for headlines, statements, and cards across all 12 views.
2. **The Discrete CSS Font-Matching Trap (`font-weight: 600`)**:
   - `src/app/fonts.ts` defines three discrete weights:
     - `400`: `CircularXXWeb-Book.woff2`
     - `500`: `CircularXXWeb-Medium.woff2`
     - `700`: `CircularXXWeb-Bold.woff2`
   - Under CSS Fonts Level 4 matching rules, when a font family lacks weight 600, target weight `600` searches ascending ($\ge 600$), immediately selecting **700 (Bold)**!
   - Consequently, all buttons, kickers, and links declaring `font-weight: 600` fell back to synthetic heavy bold.

---

## 3. Typographic Weight Architecture & Tokens

We establish three canonical weight tokens strictly mapped to our verified `.woff2` binaries in [client-mixins.scss](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/styles/client-mixins.scss):

```scss
// Discrete Circular XX Weight Tokens
$fw-book: 400;   // CircularXXWeb-Book.woff2: Pure white curtain statements, long-form copy, location clouds
$fw-medium: 500; // CircularXXWeb-Medium.woff2: Section headlines, buttons, kickers, anthem titles
$fw-bold: 700;   // CircularXXWeb-Bold.woff2: Reserved exclusively for high-impact tabular metrics
```

### Typographic Invariants
1. **Curtain Statements (Views 02, 04, 07, 09, 10)**:
   - Primary Statements: **`$fw-book` (400)** or **`$fw-medium` (500)**
   - Line-Height: `1.32`–`1.36` (Desktop), `1.28`–`1.32` (Mobile)
   - Letter-Spacing: `-0.005em` to `-0.015em`
2. **Video Cutouts (Views 01, 03, 05, 06, 08, 11)**:
   - Display Headlines: **`$fw-medium` (500)**
   - Line-Height: `1.08`–`1.14`
   - Letter-Spacing: `-0.02em` to `-0.025em`
3. **Interactive Controls & Buttons**:
   - All Buttons: **`$fw-medium` (500)** (Eradicating `font-weight: 600` bold escalation)

---

## 4. File-by-File Refinement Inventory

| Module | Selector | Current CSS | Target CSS | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **[`StatementCurtain.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/StatementCurtain.module.scss)** | `.monumentalStatement` | `font-weight: 700; line-height: 1.16; letter-spacing: -0.035em;` | **`font-weight: 400; line-height: 1.34; letter-spacing: -0.005em;`** | **Exact parity with Screenshot 2.** Transforms heavy block into 160over90 editorial statement. |
| **[`AboutDoctrineCurtain.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/AboutDoctrineCurtain.module.scss)** | `.statementHeadline` | `font-weight: 700; line-height: 1.15; letter-spacing: -0.035em;` | **`font-weight: 400; line-height: 1.28; letter-spacing: -0.01em;`** | Restores Swiss editorial balance. |
| | `.doctrineLead` | `font-weight: 450;` | **`font-weight: 400;`** | Purges non-discrete 450; uses authentic Book cut. |
| | `.serviceTitle`, `.metricValue`, `.architecturalButton` | `font-weight: 700 / 600;` | **`font-weight: 500;`** | Clean Medium weight without bold distortion. |
| **[`HeroCutout.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/HeroCutout.module.scss)** | `.displayHeadline` | `font-weight: 700; line-height: 1.02; letter-spacing: -0.045em;` | **`font-weight: 500; line-height: 1.08; letter-spacing: -0.025em;`** | Relieves optical crowding while preserving hero impact. |
| **[`ReelCutout.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/ReelCutout.module.scss)** | `.statementHeadline` | `font-weight: 700; line-height: 1.05; letter-spacing: -0.04em;` | **`font-weight: 500; line-height: 1.14; letter-spacing: -0.02em;`** | Refines cutout typography over living video. |
| | `.playReelButton` | `font-weight: 600;` | **`font-weight: 500;`** | Eliminates synthetic bold on action button. |
| **[`WorksCutout.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/WorksCutout.module.scss)** | `.monumentalHeadline` | `font-weight: 700; line-height: 0.96; letter-spacing: -0.04em;` | **`font-weight: 500; line-height: 1.04; letter-spacing: -0.025em;`** | "Work with us." matches 160over90 Medium elegance. |
| **[`ValuesCutout.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/ValuesCutout.module.scss)** | `.headline`, `.valueTitle` | `font-weight: 700;` | **`font-weight: 500; line-height: 1.22;`** | Harmonizes with glassmorphic cards. |
| **[`ProcessCurtain.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/ProcessCurtain.module.scss)** | `.railHeadline`, `.stepTitle` | `font-weight: 700;` | **`font-weight: 500;`** | Swiss editorial header rhythm. |
| | `.disciplineItem` | `font-weight: 700;` | **`font-weight: 400; letter-spacing: -0.01em;`** | Capabilities cloud becomes featherweight modern Swiss typography. |
| **[`TestimonialsCutout.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/TestimonialsCutout.module.scss)** | `.headline`, `.authorName` | `font-weight: 700;` | **`font-weight: 500;`** | Consistent headline hierarchy. |
| | `.quoteText` | `font-weight: 450;` | **`font-weight: 400; line-height: 1.55;`** | Pure Book 400 for reader quote clarity. |
| **[`DispatchesCurtain.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/DispatchesCurtain.module.scss)** | `.railHeadline`, `.postTitle` | `font-weight: 700;` | **`font-weight: 500; line-height: 1.36;`** | Editorial magazine rhythm for insights. |
| **[`GlobalLocationsCloud.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/GlobalLocationsCloud.module.scss)** | `.cityName` | `font-weight: 700;` | **`font-weight: 400; letter-spacing: -0.01em;`** | Studio locations in light Swiss weight. |
| **[`ConnectCutout.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/ConnectCutout.module.scss)** | `.displayHeadline`, `.deskValue` | `font-weight: 700 / 600;` | **`font-weight: 500; line-height: 1.12;`** | Balanced commercial desk typography. |
| **[`MonumentalFooter.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/MonumentalFooter.module.scss)** | `.anthemHeadline` | `font-weight: 700; line-height: 1.05; letter-spacing: -0.045em;` | **`font-weight: 500; line-height: 1.12; letter-spacing: -0.025em;`** | Captures 160over90 anthem authority. |
| **[`ClientHeader.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/ClientHeader/ClientHeader.module.scss)** | `.menuTrigger`, `.drawerNavLink` | `font-weight: 600;` | **`font-weight: 500;`** | Navigation trigger and drawer links. |
| **[`Works.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/works/Works.module.scss)** | `.displayTitle`, `.projectTitle` | `font-weight: 700;` | **`font-weight: 500;`** | /works portfolio showcase titles. |
| **[`Blog.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/blog/Blog.module.scss)** | `.displayTitle`, `.articleTitle` | `font-weight: 700;` | **`font-weight: 500;`** | /blog listing and dispatch articles. |

---

## 5. Automated Regression Test Invariants

Update [`tests/client/client_160over90_platform.test.ts`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/tests/client/client_160over90_platform.test.ts) Section 1:
- Assert that `StatementCurtain.module.scss` uses Book `400` (`$fw-book`).
- Assert that zero client-facing SCSS files declare `font-weight: 600` (which triggers synthetic 700 bold).
- Verify all 30 existing invariant tests and unit tests continue to pass with 100% success.

---

## 6. Execution Verification Gate

1. `npx tsx --test tests/client/client_160over90_platform.test.ts` (all suites passing)
2. `npm run test:boundaries` (100% boundary compliance)
3. `npx tsc --noEmit` (0 TypeScript type errors)
4. Independent Senior CTO PR Auditor review
5. Git commit under `Fenar7 <86710532+Fenar7@users.noreply.github.com>` and push to PR #84.
