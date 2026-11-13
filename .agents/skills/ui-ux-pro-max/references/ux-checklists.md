# UI UX Pro Max — Prioritized UX & Accessibility Checklists

This document provides audit checklists to be executed before marking any frontend work as complete.

---

## 1. Priority 1: Critical Accessibility (Non-Negotiable)

- [ ] **Contrast Verification (WCAG 2.1 AA/AAA)**:
  - Text body/labels $\ge 4.5:1$ against surface background.
  - Large headings ($\ge 18\text{pt}$ or $24\text{px}$) $\ge 3:1$.
  - Secondary text `#475569` against `#ffffff` is $7.58:1$ (Passed AAA).
  - Essential graphical boundaries (buttons, form inputs) $\ge 3:1$.
- [ ] **Keyboard Operability**:
  - All interactive elements are reachable via `Tab` / `Shift+Tab`.
  - Focused elements show an unmistakable `:focus-visible` ring.
  - Dropdowns and modals close on `Escape`.
- [ ] **Semantic Markup**:
  - Real `<button>` elements used for actions; `<a>` elements for navigation.
  - WAI-ARIA tab pattern (`role="tablist"`, `role="tab"`, `role="tabpanel"`).
  - SVG icons have `aria-hidden="true"` or descriptive `<title>`.

---

## 2. Priority 2: Interaction & Touch Ergonomics

- [ ] **Minimum Hit Targets**:
  - Touch target size $\ge 44 \times 44\text{px}$ on touch screens.
- [ ] **All Interactive States Implemented**:
  - Default, Hover, Active/Pressed, Focus, Disabled, and Loading.
  - Physical tactile feedback on click (`transform: scale(0.98)`).
- [ ] **Loading & Empty State Handling**:
  - Every data list, chart, or table handles empty and error states gracefully.
  - Buttons show loading spinners during async mutations to prevent double-clicks.

---

## 3. Priority 3: Visual Polish & Geometry

- [ ] **Concentric Radii Math**:
  - Outer container border-radius minus internal padding equals inner element radius ($R_{\text{inner}} = R_{\text{outer}} - \text{padding}$).
- [ ] **Tabular Numerics**:
  - All financial amounts, dates, and metric counters use `font-variant-numeric: tabular-nums` to eliminate layout jitter.
- [ ] **Zero Horizontal Overflow**:
  - Test at 320px, 375px, 768px, 1024px, 1440px, and 1920px viewports. No horizontal scrollbars.
