# Architecture Specification: Apple-Grade Liquid Glass & Fluid Morphing Header

> **Target Component**: [`ClientHeader.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/ClientHeader/ClientHeader.tsx) & [`ClientHeader.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/ClientHeader/ClientHeader.module.scss)  
> **Aesthetic Soul**: Apple visionOS / iOS 18 Glassmorphism + Dynamic Fluid Surface Tension  
> **Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Status**: Architectural Plan awaiting user explicit approval ("proceed")  

---

## 1. Problem Diagnosis & Visual Forensics (`Screenshot 2026-10-29 110204.png`)
Direct visual inspection of the screenshot reveals why the current header doesn't feel like true liquid glass:
1. **The 2000s Aqua Gloss Cut-Off Line**:
   - The current `::before` pseudo-element with `height: 48%; border-radius: 9999px 9999px 0 0;` slices horizontally across the top half of the capsule.
   - This creates an artificial line through the text and logo, breaking the optical transparency illusion.
2. **Rigid Scroll Transition**:
   - The scroll transition interpolates layout properties with a standard CSS transition curve without fluid volume conservation or exponential deceleration.

---

## 2. Real Liquid Glass Optical Physics Engine

True modern liquid glass relies on **three-dimensional perimeter refraction**, **Snell's Law meniscus bending**, and **dynamic light caustics**:

### 2.1 Eradicate the Faux Gloss Cut-Off
- Remove the harsh 48% height `::before` semi-circle gloss slice.
- Replace with continuous 360° perimeter meniscus refraction (`box-shadow` multi-stop inset highlights) that smoothly bend light around the squircle/pill boundary without slicing the internal text.

### 2.2 Dual-Theme Liquid Substrates
- **Light Curtain Theme** (over `StatementCurtain` / White Canvas):
  ```scss
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.72) 0%,
    rgba(245, 245, 250, 0.45) 45%,
    rgba(255, 255, 255, 0.60) 100%
  );
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.65),           // Outer crystal rim
    0 0 0 1.5px rgba(0, 0, 0, 0.04),               // Subpixel boundary separation
    inset 0 1.5px 1px 0 rgba(255, 255, 255, 1.0),  // Top keylight specular rim
    inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05),        // Bottom ambient bounce bevel
    0 6px 18px -2px rgba(15, 23, 42, 0.08),        // Contact shadow
    0 20px 40px -8px rgba(15, 23, 42, 0.12);       // Floating atmospheric suspension
  ```
- **Dark Obsidian Theme** (over Hero Video / Dark Canvas):
  ```scss
  background: linear-gradient(
    135deg,
    rgba(25, 25, 30, 0.72) 0%,
    rgba(12, 12, 16, 0.55) 50%,
    rgba(20, 20, 25, 0.68) 100%
  );
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.14),           // Outer rim
    0 0 0 1.5px rgba(0, 0, 0, 0.50),               // Boundary separation
    inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.35), // Top specular highlight
    inset 0 -1px 1px 0 rgba(0, 0, 0, 0.70),        // Bottom dark bevel
    0 8px 24px -2px rgba(0, 0, 0, 0.50),           // Contact shadow
    0 24px 48px -8px rgba(0, 0, 0, 0.70);          // Ambient suspension
  ```

---

## 3. Fluid Liquid Morphing Scroll Animation

### 3.1 Exponential Easing & Liquid Dynamics
Replace rigid linear transitions with Apple-grade **Exponential Deceleration (`cubic-bezier(0.19, 1, 0.22, 1)`)**:
- Instantaneous initial response: Reacts immediately when scroll threshold is crossed.
- Asymptotic liquid settling: Decelerates smoothly with viscous friction into its floating suspension position.

### 3.2 Asymmetric Condensation Stagger
```scss
transition:
  top 0.45s cubic-bezier(0.19, 1, 0.22, 1),
  width 0.48s cubic-bezier(0.16, 1, 0.3, 1),
  max-width 0.48s cubic-bezier(0.16, 1, 0.3, 1),
  height 0.38s cubic-bezier(0.2, 0.9, 0.2, 1),
  border-radius 0.35s cubic-bezier(0.19, 1, 0.22, 1),
  backdrop-filter 0.42s ease,
  -webkit-backdrop-filter 0.42s ease,
  box-shadow 0.45s cubic-bezier(0.19, 1, 0.22, 1);
```

### 3.3 Scroll Hysteresis
- Trigger transition: `scrollY > 50px`
- Reset transition: `scrollY <= 30px` (20px hysteresis buffer prevents boundary oscillation)
