# Hamburger Menu Icon: Border Removal & +10% Dimension Refinement Plan

**Document ID**: `docs/hamburger_icon/hamburger_border_and_size_refinement_plan.md`  
**Target Reference**: `Screenshot 2026-10-27 125421.png`  
**Target File**: `src/app/components/ClientHeader/ClientHeader.module.scss`  
**Target Branch**: `showcase/homepage-works-cutout-and-portfolio-showcase`  
**Target PR**: [Pull Request #84](https://github.com/Fenar7/marca_ubi_web_hosting/pull/84) (Strictly `OPEN`)  

---

## 1. Problem Diagnosis & Requirements

Based on user review of `Screenshot 2026-10-27 125421.png`:
1. **Remove Border / Outline**: Eliminate any visible border, focus ring, or box-shadow around the hamburger menu button in resting, hover, focus, and active states.
2. **Increase Icon Dimensions by 10%**:
   - `width`: 24px $\rightarrow$ **26.5px** (+10%)
   - `height`: 16px $\rightarrow$ **18px** (+10%)
   - `gap`: 4px $\rightarrow$ **4.5px** (+10%)
   - `line height`: 2.5px $\rightarrow$ **2.75px** (+10%)
   - Open state translation: $\pm$6.5px $\rightarrow$ **$\pm$7.25px** for precise symmetry in the close '✕' state.

---

## 2. Technical Blueprint (`ClientHeader.module.scss`)

```scss
.menuTrigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  outline: none;
  box-shadow: none;
  padding: 10px;
  min-height: 48px; // Preserves Section 14 touch target test invariant
  min-width: 48px;  // Preserves Section 14 touch target test invariant
  cursor: pointer;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.75;

    .burgerLine {
      background-color: $client-accent-red;
    }
  }

  // Eradicate any browser-level focus border / outline
  &:focus,
  &:focus-visible,
  &:active {
    outline: none;
    border: none;
    box-shadow: none;
  }
}

.burgerStack {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4.5px;     // +10% scale
  width: 26.5px;  // +10% scale (24px * 1.1)
  height: 18px;   // +10% scale (16px * 1.1)
}

.burgerLine {
  display: block;
  width: 100%;
  height: 2.75px; // +10% scale (2.5px * 1.1)
  border-radius: 9999px; // Fully rounded capsule ends matching benchmark
  background-color: currentColor;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, background-color 0.2s ease;
  transform-origin: center;

  &.lineOpenTop {
    transform: translateY(7.25px) rotate(45deg);
    background-color: #ffffff;
  }

  &.lineOpenMiddle {
    opacity: 0;
    transform: scaleX(0);
  }

  &.lineOpenBottom {
    transform: translateY(-7.25px) rotate(-45deg);
    background-color: #ffffff;
  }
}
```

---

## 3. Test Invariants & Compliance Verification

* **Accessibility Touch Targets**: `min-height: 48px` and `min-width: 48px` are preserved, fulfilling `tests/client/client_160over90_platform.test.ts` lines 507-508.
* **Screen Reader Accessibility**: `.srOnly` class definition remains intact, fulfilling test lines 505-506.
* **PR Governance**: PR #84 remains strictly `OPEN`, authored strictly as `Fenar7`, with zero `feat` naming.
