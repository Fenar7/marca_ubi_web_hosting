# Minimalist Clean Aesthetic & Clutter Eradication PRD
**Benchmark Target:** [160over90.com](https://www.160over90.com/)  
**Feature Module:** `docs/minimalist_clean_aesthetic/`  
**Target Branch:** `showcase/homepage-works-cutout-and-portfolio-showcase`  
**Status:** Architecture Complete — Awaiting User Approval to Execute  

---

## 1. Executive Summary & Forensic Audit

A multi-agent design and engineering investigation was conducted comparing our live deployment against user screenshots and the 160/90 benchmark:
- **`Screenshot 2026-10-26 174502.png`**: Our live website hero view.
- **`Screenshot 2026-10-26 174510.png`**: User's focused crop identifying unnecessary clutter: `00 / STRATEGIC BRAND ARCHITECTURE & CULTURAL VELOCITY`.
- **`Screenshot 2026-10-26 174557.png`**: 160/90 benchmark hero demonstrating Swiss brutalist minimalism.

### Benchmark Analysis: The Anatomy of 160/90's Visual Silence
In the benchmark screenshot (`Screenshot 2026-10-26 174557.png`):
1. **Header Navigation Trigger**: Strictly two horizontal parallel bars (`=`). No "MENU" or "Close" text label.
2. **Hero Viewport**:
   - **Zero Kickers / Badges**: No uppercase category tags (such as `00 / ...`).
   - **Zero Scroll Cues**: No "SCROLL TO EXPLORE" text and no decorative horizontal hairline rules.
   - **Monolithic 2-Line Headline**: `Culture` / `Moves Us.` with balanced character count, tight line height (~0.98), and negative tracking.
   - **Maximum Spatial Breathing Room**: Pure focus on the cinematic video layer and the primary headline.
   - *(Note on bottom-left circle `N` in user's screenshot)*: This is the local Next.js dev server indicator overlay rendered on `localhost:3000` during development, which does not exist in production builds.

---

## 2. Root Cause Analysis & Visual Delta Matrix

| Element | Our Current Implementation | 160/90 Benchmark | Root Cause in Codebase | Recommended Refinement |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Kicker** | `00 / STRATEGIC BRAND ARCHITECTURE & CULTURAL VELOCITY` | **None (Zero text)** | `ClientHomeExperience.tsx:53` passes string to `HeroCutout.tsx:27`. | **Eradicate hero kicker.** Make `kicker?: string` optional in `HeroCutoutProps` without default string; do not render when omitted. |
| **Scroll Indicator** | `SCROLL TO EXPLORE` + 48px hairline rule | **None (Zero text, zero rule)** | `HeroCutout.tsx:29-32` renders `.scrollCueCluster`. | **Eradicate scroll cue from hero.** Make `showScrollCue?: boolean = false` (defaults to `false`). |
| **Header Menu Button** | `MENU =` (Text label alongside hamburger) | **Pure 2 lines only (`=`)** | `ClientHeader.tsx:102-104` renders visible `.menuLabel`. | **Streamline to icon-only.** Hide `.menuLabel` visually using `.srOnly` for screen-reader accessibility, while preserving 48px touch target and WAI-ARIA labels. |
| **Headline Optical Balance** | `Engineering Brands That Move` (27 chars) / `The World.` (10 chars) | `Culture` / `Moves Us.` (Balanced 2-line lockup) | Unformatted string wraps arbitrarily based on container width. | **Format balanced 2-line lockup**: `Engineering Brands` (18 chars) / `That Move The World.` (20 chars) via `headline={"Engineering Brands\nThat Move The World."}` and `white-space: pre-line`. |
| **Headline Scale & Leading** | `clamp(2.5rem, 6vw, 5.5rem)`, `line-height: 1.08` | Monumental `clamp(3.25rem, 7.5vw, 6.75rem)`, `line-height: 0.98` | Scaled too conservatively. | **Update typographic tokens**: Increase scale to `clamp(3rem, 7.5vw, 6.75rem)`, tighten line-height to `0.98`, tracking to `-0.03em`. |

---

## 3. Detailed Component Architecture

### 3.1 `HeroCutout.tsx`
- **Props Interface**:
  ```typescript
  export interface HeroCutoutProps {
    headline?: string;
    kicker?: string;
    showScrollCue?: boolean;
  }
  ```
- **Conditional Rendering**:
  - If `kicker` is provided, render `<span className={styles.kicker}>{kicker}</span>`.
  - If `showScrollCue` is `true`, render `<div className={styles.scrollCueCluster}>...</div>`.
  - Otherwise, render pure, unencumbered monumental headline.
- **Multi-Line Headline Support**:
  - Support newline characters `\n` with `style={{ whiteSpace: "pre-line" }}` or mapped lines so the headline breaks cleanly at `Engineering Brands` / `That Move The World.`.

### 3.2 `HeroCutout.module.scss`
- **Typographic Scale & Leading**:
  ```scss
  .displayHeadline {
    font-family: $font-circular;
    font-size: clamp(3rem, 7.5vw, 6.75rem);
    font-weight: 500; // CircularXXWeb-Medium
    line-height: 0.98;
    letter-spacing: -0.03em;
    color: #ffffff;
    margin: 0;
    white-space: pre-line;
    text-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.9),
      0 8px 32px rgba(0, 0, 0, 0.75);
  }
  ```
- **Responsive Padding**:
  - `padding: clamp(2.5rem, 5vw, 5rem) clamp(1.5rem, 4vw, 4rem);`
  - Eliminates vertical crowding on mobile (`antislop-layoutmobile`).

### 3.3 `ClientHeader.tsx` & `ClientHeader.module.scss`
- **Minimalist Icon-Only Menu Button**:
  - Retain accessible screen-reader text:
    ```tsx
    <button
      type="button"
      className={styles.menuTrigger}
      onClick={toggleDrawer}
      aria-expanded={isDrawerOpen}
      aria-controls="client-nav-drawer"
      aria-label={isDrawerOpen ? "Close navigation menu" : "Open navigation menu"}
    >
      <span className={styles.srOnly}>
        {isDrawerOpen ? "Close navigation menu" : "Open navigation menu"}
      </span>
      <div className={styles.burgerStack} aria-hidden="true">
        <span className={`${styles.burgerLine} ${isDrawerOpen ? styles.lineOpenTop : ""}`} />
        <span className={`${styles.burgerLine} ${isDrawerOpen ? styles.lineOpenBottom : ""}`} />
      </div>
    </button>
    ```
- **Styling**:
  - `.menuTrigger`: `display: inline-flex; align-items: center; justify-content: center; min-width: 48px; min-height: 48px; padding: 10px;`
  - `.burgerStack`: `width: 24px; height: 14px; gap: 6px;`
  - Two crisp horizontal lines (`1.5px` height) that morph into an `X` when open.

### 3.4 `ClientHomeExperience.tsx`
- **View 01 Invocation**:
  ```tsx
  {/* View 01: Hero Video Cutout (Transparent, Pure Monumental 160/90 Headline) */}
  <HeroCutout headline={"Engineering Brands\nThat Move The World."} />
  ```

---

## 4. Invariant & Regression Protection

1. **Theme Observer Invariant**:
   - `HeroCutout` continues to declare `data-header-theme="dark"` ensuring the IntersectionObserver sensor in `ClientHeader` applies `.isDark` (white logo and white menu lines).
2. **Accessible Touch Targets (`antislop-human`)**:
   - `.menuTrigger` maintains a minimum `48px x 48px` clickable/tappable bounding box, exceeding WCAG 2.2 Level AA requirement of 24px and Level AAA requirement of 44px.
3. **Automated Test Coverage**:
   - Update and add assertions in `tests/client/client_160over90_platform.test.ts` to verify that `HeroCutout` renders without mandatory kicker or scroll cue, and `ClientHeader` maintains WAI-ARIA and touch target invariants.

---

## 5. Execution Steps (Upon User Permission)

1. Refactor `HeroCutout.tsx` (Make kicker & scroll cue optional, add pre-line support).
2. Update `HeroCutout.module.scss` (Monumental clamp scale, tight 0.98 lead).
3. Update `ClientHomeExperience.tsx` (Clean 2-line headline, omit kicker).
4. Refactor `ClientHeader.tsx` & `.module.scss` (Icon-only 2-line hamburger).
5. Update & expand tests in `client_160over90_platform.test.ts`.
6. Run 31 invariant tests + boundaries + `tsc --noEmit`.
7. Deploy independent Senior CTO PR Auditor agent.
8. Commit as Fenar7 and push to PR #84 (remain OPEN).
