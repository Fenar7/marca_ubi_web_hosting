# Dedicated Works Showcase: 3D Stacking Card Scroll Experience PRD
**Target Route:** `/works` (`src/app/works/page.tsx` & `WorksGalleryClient.tsx`)  
**Feature Module:** `docs/dedicated_works_scroll_experience/`  
**Target Branch:** `showcase/homepage-works-cutout-and-portfolio-showcase`  
**Status:** Architecture Complete — Awaiting User Approval to Execute  

---

## 1. Executive Summary & Root Cause Analysis (RCA)

### User Observation
The user reviewed the newly created dedicated showcase page at `/works` (`Screenshot 2026-10-26 182904.png` and `Screenshot 2026-10-26 182915.png`) and noted:
1. **Dark Mode Confirmation**: Confirmed dark mode is desired for this deep-vault portfolio archive (`#000000` / `#0b0b0b`).
2. **Missing Motion**: The current `/works` page was implemented as a flat, static broadsheet column with standard gap spacing.
3. **Requirement**: Restore the **exact signature curated works scrolling animation and card-stacking physics** from the pre-redesign homepage, but modernized with Marca Ubi's new design system:
   - Official **Circular XX** typography (`Book 400`, `Medium 500`, `Bold 700`, zero unmapped 600).
   - Official Brand Red (`#ea002a`) title fill sweep and accent highlights (replacing legacy orange `#ff6100`).
   - Clean obsidian canvas (`#000000`).
   - Native standard cursors (no custom cursor badges).
   - Fix unescaped HTML entity glitch (`&nearr;` visible in screenshot).

### Root Cause Diagnosis
When the homepage was redesigned to feature `WorksCutout.tsx` (the transparent video cutout linking to `/works`), the original GSAP 3D card stacking engine (`src/app/components/WorksSection/WorksSectionClient.tsx` and `style.scss`) was left in the unused homepage component. The new `/works` page (`WorksGalleryClient.tsx`) was written as a static flex column without GSAP ScrollTrigger or stacking card mechanics.

---

## 2. Architectural Comparison Matrix

| Feature | Pre-Redesign Homepage (`WorksSectionClient`) | Current `/works` (`WorksGalleryClient`) | Proposed Modernized `/works` Architecture |
| :--- | :--- | :--- | :--- |
| **Animation Engine** | GSAP `ScrollTrigger` + `@gsap/react` | Static CSS flex column | **Full GSAP 3D ScrollTrigger Engine** |
| **Stacking Physics** | `position: sticky; top: clamp(...)`, `150svh` scroll travel | Flat vertical document flow | **3D Sticky Stacking Deck** (`150svh` spacer, dynamic `zIndex: index + 1`, final card `100svh`) |
| **3D Transform Matrix** | `rotateZ: 18°`, `rotateX: 6°`, `scale: 0.72`, `perspective: 1400` | Flat 2D layout | **Perspective 3D Entry Scrub** (`rotateZ: 18° -> 0°`, `scale: 0.72 -> 1.0`, `perspective: 1400`) |
| **Inner Image Motion** | Synchronized de-zoom (`scale: 1.28 -> 1.0`) | Static image | **Synchronized Cover De-Zoom** (`scale: 1.28 -> 1.0`) |
| **Title Scroll Animation** | Pinned `CURATED WORKS` scrub fill | Static headline text | **Pinned `CURATED WORKS` Scrub Fill** (`white` ➔ `#ea002a` Brand Red) |
| **Typography** | Legacy `$font-movatif`, `$font-sf-pro` | Mixed Circular XX | **Circular XX Book 400 & Medium 500** exclusively |
| **Accent Color** | Legacy Orange (`#ff6100`) | Mixed red/orange | **Marca Ubi Brand Red (`#ea002a`)** |
| **Taxonomy Filtering** | None (flat array) | Category pills (`All`, `Brand`, `Digital`) | **Category Filtering preserved** with automatic `ScrollTrigger.refresh()` |
| **Entity Glitch** | N/A | Displays raw `&nearr;` text | **Clean Unicode `↗` (`\u2197`)** |

---

## 3. Detailed Component Architecture

### 3.1 `src/app/works/WorksGalleryClient.tsx`
- **Container Structure**:
  1. **Masthead Hero Deck**: Preserves the archive kicker `02 / PORTFOLIO ARCHIVE`, commission status count badge, and headline *"Proof of intent. Engineered to endure."*.
  2. **Taxonomy Filter Bar**: Category pills (`All Commissions`, `Brand Architecture`, `Digital Platforms`, `Design Systems`). Selecting a tab filters projects and triggers `ScrollTrigger.refresh()`.
  3. **Pinned Title Scrub Stage**: Pinned `CURATED WORKS` title with horizontal gradient fill sweep:
     - Desktop: Center-pinned ScrollTrigger driving `--title-fill: 0%` to `100%` across 60% viewport travel distance.
     - Mobile: Automatic viewport reveal without scroll-locking.
  4. **3D Sticky Stacking Deck Stream**:
     - Each card wrapped in `.workItemWrapper` with `position: sticky; top: clamp(1rem, 2vw, 2.5rem); height: 150svh;` (final card `100svh`).
     - Dynamic z-index: `style={{ zIndex: index + 1 }}`.
     - Card `.workItem` with 3D perspective entrance (`rotateZ: 18° -> 0°`, `rotateX: 6° -> 0°`, `scale: 0.72 -> 1.0`, `perspective: 1400`) and image de-zoom (`1.28 -> 1.0`).
     - Top-right external links (`CASE STUDY`, `TESTIMONIAL`, `VIEW WORK`) with clean Unicode `↗`.
     - Bottom overlay with Circular XX project title and editorial subtext.
  5. **Commission Bridge**: Modernized *"Let's build something monumental together"* section leading into the footer.

### 3.2 `src/app/works/Works.module.scss`
- **Design Tokens**:
  - Background: `$client-canvas-black` (`#000000`).
  - Text: `#ffffff` for titles, `rgba(255, 255, 255, 0.75)` for subtext.
  - Accent: `$client-accent-red` (`#ea002a`) for kicker, title sweep, and link hover states.
  - Fonts: `$font-circular` with `$fw-book: 400`, `$fw-medium: 500`, `$fw-bold: 700`. Zero unmapped 600.
  - Cards: 1px specular border `rgba(255, 255, 255, 0.1)`, `box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8)`.

---

## 4. Mobile & Accessibility Engineering

1. **Mobile Motion Optimization (`shouldUseMobileMotion()`)**:
   - Softened 3D tilt on mobile: `rotateZ: 8°`, `rotateX: 3°`, `scale: 0.88`, `y: 34px`.
   - Card sticky clearance: `top: 4.8rem` and `height: calc(100svh - 4.8rem)` to prevent overlap with the fixed `ClientHeader`.
   - Overflow defense: `overflow-x: clip;` to prevent side-scrolling leak from 3D rotation.
2. **Accessible Touch Targets & Focus States (`antislop-human`)**:
   - Minimum 44px/48px tap targets on all card links and filter pills.
   - High-contrast `:focus-visible` ring (`outline: 2px solid #ea002a; outline-offset: 4px;`).
   - Screen-reader accessible roles and semantic tags (`article`, `role="tab"`, `aria-selected`).

---

## 5. Execution Workflow (Upon User Permission)

1. Refactor `WorksGalleryClient.tsx` (Integrate GSAP `useGSAP`, 3D card physics, title fill sweep).
2. Update `Works.module.scss` (Sticky deck `150svh`, Circular XX tokens, `#ea002a` brand red).
3. Fix unescaped HTML entities (`&nearr;` -> Unicode `↗`).
4. Update tests in `client_160over90_platform.test.ts`.
5. Run 35 platform tests + boundaries + `tsc --noEmit`.
6. Deploy Senior CTO PR Auditor agent for Delivery Gate Report.
7. Commit as Fenar7 and push to PR #84 (remain OPEN).
