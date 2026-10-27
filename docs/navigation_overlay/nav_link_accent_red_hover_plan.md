# Navigation Link Brand Red Hover State Architecture Plan

**Document ID**: `docs/navigation_overlay/nav_link_accent_red_hover_plan.md`  
**Target Reference**: `Screenshot 2026-10-27 131637.png`  
**Target File**: `src/app/components/NavigationOverlay/NavigationOverlay.module.scss`  
**Target Branch**: `showcase/homepage-works-cutout-and-portfolio-showcase`  
**Target PR**: [Pull Request #84](https://github.com/Fenar7/marca_ubi_web_hosting/pull/84) (Strictly `OPEN`)  

---

## 1. Problem Statement & Scope

Based on user request regarding `Screenshot 2026-10-27 131637.png`:
> *"when hovered over these items it should become our accent red color"*

Currently in `NavigationOverlay.module.scss`, the `.navLink:hover` state maintains `color: #000000;` on the text label and only tints the arrow. Hovering over any navigation link (`Work →`, `Services →`, `Locations →`, `Careers →`, `Contact →`) must seamlessly transition the entire link (both label and arrow) to the authentic brand accent red (`$client-accent-red` / `#ea002a`).

---

## 2. Technical Blueprint

### File: `src/app/components/NavigationOverlay/NavigationOverlay.module.scss`

```scss
.navLink {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  width: fit-content;
  gap: 14px;
  text-decoration: none;
  color: #000000;
  font-family: $font-circular;
  font-size: clamp(2.75rem, 3.8vw, 3.875rem);
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1.12;
  transition: color 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    color: $client-accent-red; // Transforms both text label and arrow to accent red (#ea002a)
    transform: translateX(4px);

    .navArrow {
      transform: translateX(8px);
      color: $client-accent-red;
    }
  }

  &:focus-visible {
    outline: 2px solid $client-accent-red;
    outline-offset: 4px;
  }
}
```

---

## 3. Human Factors & Accessibility Verification

- **Contrast Compliance**: `$client-accent-red` (`#ea002a`) on `#ffffff` white canvas produces a **4.61:1** contrast ratio. For monumental display text (`>24px`), WCAG AA requires 3.0:1. The 4.61:1 ratio fully surpasses WCAG AA requirements.
- **Kinetic Smoothness**: `transition: color 0.2s cubic-bezier(0.16, 1, 0.3, 1)` provides an instantaneous, fluid color switch with zero stutter.
- **PR Governance**: PR #84 remains strictly in an `OPEN` state, authored strictly as `Fenar7`.
