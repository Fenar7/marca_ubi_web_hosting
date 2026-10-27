# Master Implementation Plan: 3-Line Rounded Pill Hamburger Icon

> **Subsystem**: Header Navigation Trigger (`src/app/components/ClientHeader/`)  
> **Benchmark Reference**: `Screenshot 2026-10-27 010831.png`  
> **Authorship**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Status**: **PROPOSED — AWAITING EXPLICIT USER 'PROCEED' COMMAND**  
> **Target Branch**: `showcase/homepage-works-cutout-and-portfolio-showcase`  
> **Target PR**: [#84 (Strictly OPEN)](https://github.com/Fenar7/marca_ubi_web_hosting/pull/84)  

---

## 1. Forensic Visual Audit & Root Cause Analysis

### 1.1 Visual Comparison: Current Code vs. Reference Screenshot (`010831.png`)

| Feature | Reference Benchmark (`010831.png`) | Current Implementation (`ClientHeader`) | Fix Required |
| :--- | :--- | :--- | :--- |
| **Line Count** | **3 horizontal lines** | **2 horizontal lines** (`burgerLine` x 2) | Add middle line span; update stack to 3 lines. |
| **Line Thickness** | **2.5px** (thick, confident, solid presence) | **1.5px** (thin, hairline) | Increase height to `2.5px`. |
| **Line Geometry** | **Rounded pill ends** (`border-radius: 9999px`) | **Sharp square ends** (`border-radius: 0`) | Apply `border-radius: 9999px` to `.burgerLine`. |
| **Vertical Spacing** | **4px gap** between the 3 lines | **6px gap** between 2 lines | Set `gap: 4px;` in `.burgerStack`. |
| **Total Stack Dimensions** | Width: `24px`, Height: `15.5px` (`2.5*3 + 4*2`) | Width: `24px`, Height: `16px` | Refined proportion matching the reference crop. |
| **Touch Target** | Accessible `48px x 48px` hitbox | `min-height: 48px; min-width: 48px;` | Preserved for WCAG AA compliance. |
| **Theme Adaptability** | Inherits `currentColor` (`#ffffff` / `#0a0a0a`) | Inherits `currentColor` | Preserved via `.isLight` and `.isDark`. |

---

## 2. Technical Blueprint

### 2.1 Markup Update (`src/app/components/ClientHeader/ClientHeader.tsx`)
Update `.burgerStack` to render 3 rounded lines:
```tsx
<div className={styles.burgerStack} aria-hidden="true">
  <span className={`${styles.burgerLine} ${isDrawerOpen ? styles.lineOpenTop : ""}`} />
  <span className={`${styles.burgerLine} ${isDrawerOpen ? styles.lineOpenMiddle : ""}`} />
  <span className={`${styles.burgerLine} ${isDrawerOpen ? styles.lineOpenBottom : ""}`} />
</div>
```

### 2.2 Styling Update (`src/app/components/ClientHeader/ClientHeader.module.scss`)
```scss
.burgerStack {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  width: 24px;
  height: 16px;
}

.burgerLine {
  display: block;
  width: 100%;
  height: 2.5px;
  border-radius: 9999px; // Fully rounded capsule ends
  background-color: currentColor;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, background-color 0.2s ease;
  transform-origin: center;

  &.lineOpenTop {
    transform: translateY(6.5px) rotate(45deg);
    background-color: #ffffff;
  }

  &.lineOpenMiddle {
    opacity: 0;
    transform: scaleX(0);
  }

  &.lineOpenBottom {
    transform: translateY(-6.5px) rotate(-45deg);
    background-color: #ffffff;
  }
}
```

---

## 3. Delivery Gate & Verification Checklist

- [ ] **Exact Visual Parity**:
  - 3 horizontal bars matching `Screenshot 2026-10-27 010831.png`.
  - 2.5px thickness with rounded capsule pill ends.
  - Smooth morphing transition into an `×` when opened.
- [ ] **Accessibility Invariants**:
  - Minimum 48px × 48px touch hitbox preserved (`min-height: 48px; min-width: 48px`).
  - `.srOnly` screen reader text preserved.
- [ ] **Test Invariants**:
  - All 37 client platform tests pass (`npx tsx --test tests/client/client_160over90_platform.test.ts`).
  - 0 TypeScript compilation errors (`npx tsc --noEmit`).
- [ ] **Governance**:
  - Author: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
  - PR #84 remains strictly **OPEN**.
