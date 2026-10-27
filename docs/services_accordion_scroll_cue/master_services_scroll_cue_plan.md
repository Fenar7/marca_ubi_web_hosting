# Architectural Plan: Services Accordion Horizontal Scroll Indicator & Interactive Navigation Rails

> **Document Location**: `docs/services_accordion_scroll_cue/master_services_scroll_cue_plan.md`  
> **Status**: **AWAITING USER CONFIRMATION TO EXECUTE ("proceed")**  
> **Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Target Branch**: `refactor/services-accordion-tablet-scroll-nav` (sub-branch off `master`)  
> **Target PR**: New Pull Request targeting `master` (strictly **OPEN**)

---

## 1. Executive Summary & Problem Diagnosis

### Client Directive (`Screenshot 2026-10-27 155016.png`):
> *"and the otehr hting is seein tablet ist liek this to see hte rest we have to scorll si at right centenre thehrehosudl be like a arrow idnicatingthe scroll so yeah pls hire thee tea ofexopert agnets and do this quilcky adupdte hte pr"*

### Visual & UX Analysis:
1. **The Context**:
   In [`ServicesAccordion.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/ServicesAccordion/ServicesAccordion.tsx), 8 full-height service cards are arranged side-by-side in `.cardsRow`.
   On wide desktop monitors (>1680px), all 8 cards fit within the viewport width.
   On tablet and medium viewports (e.g. 768px – 1366px, as seen in the user's screenshot), card minimum width (`min-width: 210px`) causes cards 01 through 06/07 to be visible while cards 07 and 08 are clipped off to the right.
2. **The Problem**:
   Users on tablet or desktop with mouse/trackpad have no obvious visual indicator that the row overflows and can be scrolled horizontally.
3. **The Solution**:
   - Wrap the cards strip in a relative container (`.stripWrapper`).
   - Position an elegant, high-luxury floating navigation arrow button (`.navScrollBtn`) vertically centered at the right edge (`right: 1.5rem; top: 50%; transform: translateY(-50%)`).
   - When the user scrolls right, dynamically reveal a matching left navigation arrow (`left: 1.5rem`), allowing seamless bidirectional movement.
   - The button features:
     - Obsidian glassmorphic backdrop: `background: rgba(10, 10, 10, 0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.15);`.
     - Brand Red hover glow: `color: #ea002a; border-color: #ea002a; box-shadow: 0 0 20px rgba(234, 0, 42, 0.45);`.
     - Smooth scroll step: clicks advance the view by 1 card cluster (`scrollBy({ left: 340, behavior: 'smooth' })`).
     - Accessible: 48px touch target, `aria-label="Scroll services right"`, `tabIndex={0}`.
     - Automatically hides when the strip reaches the end of horizontal scroll (`canScrollRight === false`).

---

## 2. Technical Implementation Specifications

### A. Component Changes: [`ServicesAccordion.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/ServicesAccordion/ServicesAccordion.tsx)

```tsx
// 1. Ref & Scroll State Tracking
const stripRef = useRef<HTMLDivElement | null>(null);
const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
const [canScrollRight, setCanScrollRight] = useState<boolean>(true);

// 2. Dynamic Scroll Boundary Observer
const updateScrollBounds = useCallback(() => {
  if (!stripRef.current) return;
  const { scrollLeft, scrollWidth, clientWidth } = stripRef.current;
  setCanScrollLeft(scrollLeft > 10);
  setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
}, []);

// 3. Scroll By Step Action
const scrollStrip = (direction: "left" | "right") => {
  if (!stripRef.current) return;
  const delta = direction === "right" ? 360 : -360;
  stripRef.current.scrollBy({ left: delta, behavior: "smooth" });
};
```

### B. JSX Architecture:
```tsx
<div className={styles.stripWrapper}>
  {/* Left Navigation Arrow */}
  {canScrollLeft && (
    <button
      type="button"
      className={`${styles.navScrollBtn} ${styles.navScrollLeft}`}
      onClick={() => scrollStrip("left")}
      aria-label="Scroll services left"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  )}

  <div ref={stripRef} onScroll={updateScrollBounds} className={styles.fullWidthStrip}>
    ...
  </div>

  {/* Right Navigation Arrow (Indicating Scroll) */}
  {canScrollRight && (
    <button
      type="button"
      className={`${styles.navScrollBtn} ${styles.navScrollRight}`}
      onClick={() => scrollStrip("right")}
      aria-label="Scroll services right"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  )}
</div>
```

### C. SCSS Tokens: [`ServicesAccordion.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/ServicesAccordion/ServicesAccordion.module.scss)
```scss
.stripWrapper {
  position: relative;
  width: 100%;
}

.navScrollBtn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  width: 48px;
  height: 48px;
  min-width: 48px;
  min-height: 48px;
  border-radius: 50%;
  background-color: rgba(10, 10, 10, 0.78);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background-color: #000000;
    color: $client-accent-red;
    border-color: $client-accent-red;
    box-shadow: 0 0 20px rgba(234, 0, 42, 0.45), 0 8px 24px rgba(0, 0, 0, 0.5);
    transform: translateY(-50%) scale(1.08);
  }

  &:focus-visible {
    outline: 2px solid $client-accent-red;
    outline-offset: 3px;
  }
}

.navScrollRight {
  right: clamp(1rem, 2.5vw, 2.5rem);
}

.navScrollLeft {
  left: clamp(1rem, 2.5vw, 2.5rem);
}
```

---

## 3. Delivery Strategy & Verification

1. **Sub-Branch**: `refactor/services-accordion-tablet-scroll-nav` (branched off `master` or current PR branch per workflow).
2. **Automated Verification**:
   - `node --import tsx --test tests/client/client_160over90_platform.test.ts` (37/37 passing).
   - Zero `any` types, zero generic blue (`#2563eb`), 100% adherence to Circular XX.
3. **Commit & PR**:
   - Author: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`
   - Title: `Design Polish: Services Accordion Horizontal Scroll Indicators and Floating Navigation Rails` (NO `feat`).
   - PR maintained strictly **OPEN**.
