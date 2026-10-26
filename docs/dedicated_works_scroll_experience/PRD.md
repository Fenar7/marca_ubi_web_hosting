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

---

## 8. Anti-AI-Slop Cleanliness Addendum: Masthead Eradication
- **Elements Identified for Eradication**:
  1. `02 / Portfolio Archive` (`.kicker`): Unnecessary artificial chapter numbering.
  2. `• 5 Active Commissions` (`.countBadge` + `.pulseDot`): SaaS-style status badge and glowing green radar dot.
- **Remediation**:
  - Purge `<div className={styles.kickerRow}>` entirely from `WorksGalleryClient.tsx`.
  - Remove orphaned `.kickerRow`, `.kicker`, `.countBadge`, `.pulseDot`, and `.countText` from `Works.module.scss`.
  - Open the route cleanly with the monumental headline `Proof of intent.\nEngineered to endure.` followed by the editorial lead.
  - Assert in `tests/client/client_160over90_platform.test.ts` that zero `pulseDot` or `countBadge` elements exist.

---

## 9. Full-Width Edge-to-Edge Stacking Deck Addendum
- **Issue**: `.workDeckWrapper` previously enforced `padding: 0 clamp(1rem, 3.5vw, 3.5rem)` which inset the 3D cards away from the screen edges with wide black side gutters.
- **Remediation**:
  - Eliminate all side padding on `.workDeckWrapper` (`padding: 0`), allowing cards to bleed 100% full width edge-to-edge.
  - Set `border-radius: 0` and remove left/right borders on `.workDeckCard` for seamless edge-to-edge cinematic canvas.
  - Align index badges and action pills with broadsheet viewport margins.

---

## 10. Zero Top Gap & Natural Casing Addendum
- **Issue 1 (Top Viewport Gap)**: `.workDeckWrapper` applied `top: clamp(1rem, 2vw, 2.5rem)` and `.workDeckCard` applied `height: calc(100svh - clamp(...))`, leaving a black gap above the card.
- **Remediation 1**: Set `.workDeckWrapper { top: 0; }` and `.workDeckCard { height: 100svh; }` flush with the viewport. Offset `.indexBadge` and `.cardActionLinks` (`top: clamp(5.75rem, 8vw, 7rem)`) to sit below the fixed header.
- **Issue 2 (All-Caps Shouting Typography)**: `.actionPillLink` enforced `text-transform: uppercase;` and raw Sanity CMS data contained uppercase entries like `"KUNSTLERIN"` / `"ECOMMERCE"`.
- **Remediation 2**: Set `text-transform: none;` on `.actionPillLink` and implement `toNaturalCase()` in `WorksGalleryClient.tsx` to normalize all-caps titles into natural typography (`"KünstlerIn"`, `"E-Commerce"`).

---

## 11. 160over90 Reference Parity: Left-Anchored Typographic Block & Bottom-Right Action Cluster
- **Visual Defect**: Current cards place project titles at the bottom center (`left: 50%; transform: translateX(-50%)`) and actions at the top right, creating a symmetrical generic look.
- **Reference Benchmark**: 160over90 asymmetrically anchors monumental display typography on the **left side**, vertically centered in the viewport, and places the interactive action buttons (`View Work ↗`, `Case Study ↗`) in the **bottom right**.
- **Remediation**:
  - Restructure `WorksGalleryClient.tsx` and `Works.module.scss`:
    - `.cardLeftContent`: `position: absolute; top: 50%; transform: translateY(-50%); left: clamp(1.5rem, 6vw, 6rem); text-align: left; max-width: min(90%, 650px);`
    - Display title scaled to `clamp(2.5rem, 5.5vw, 5.25rem)` with tight `1.04` line-height and left alignment.
    - `.cardBottomRightActions`: `position: absolute; bottom: clamp(2.5rem, 6vw, 4.5rem); right: clamp(1.5rem, 6vw, 6rem);`
    - Primary CTA updated to `View Work ↗` (with `Live Platform ↗` when live link is present).
    - Multi-directional scrim gradient (left-to-right dark gradient + bottom fade) guaranteeing 21:1 WCAG AAA contrast for left-anchored typography.

---

## 13. 160over90 Reference Parity: Drop Shadow Eradication, Sheer Ambient Scrim & Action Button Stack
- **Visual Defect & User Observation**:
  - The live implementation ([Screenshot 2026-10-26 231737.png](file:///C:/Users/firoz/Pictures/Screenshots/Screenshot%202026-10-26%20231737.png)) displayed heavy drop shadows on card titles, subtext, and cards, a muddy 94% black scrim composite smothering the cover artwork, and boxy filled buttons with diagonal arrows.
  - The benchmark reference ([Screenshot 2026-10-26 231815.png](file:///C:/Users/firoz/Pictures/Screenshots/Screenshot%202026-10-26%20231815.png)) demonstrates zero drop shadows, an ultra-sheer ambient veil preserving complete artwork vibrance, and a vertical stack of signature outline pill buttons.
- **Remediation**:
  - **Zero Drop Shadows**: Eradicated `text-shadow` across `.cardTitle` and `.cardSubtext` (`text-shadow: none;`). Removed `box-shadow` across `.workDeckCard`, `.indexBadge`, and `.actionPillLink`.
  - **Sheer Ambient Scrim Veil**: Replaced the 3-directional 94% black scrim with an ultra-sheer lateral gradient (`rgba(0, 0, 0, 0.35)` to transparent at 55%), ensuring cover artwork and mockups remain crystal clear.
  - **160over90 Outline Pill Button Stack**:
    - Layout: Vertical column stack docked in bottom-right corner (`flex-direction: column; align-items: stretch; gap: 12px; min-width: 170px;`).
    - Geometry: Signature full pill (`border-radius: 9999px;`).
    - Surface: 100% transparent fill (`background: transparent;`) with crisp `1.5px solid rgba(255, 255, 255, 0.85)` outline border.
    - Actions:
      1. Top button: `Play Reel ▶` with solid triangle glyph `▶` (`\u25B6`), opening the accessible `ReelModal`.
      2. Bottom button: `View Work` (plain text, NO diagonal arrow `↗`).
    - Inversion on Hover: `background: #ffffff; color: #0a0a0a; border-color: #ffffff; transform: translateY(-2px);`.


