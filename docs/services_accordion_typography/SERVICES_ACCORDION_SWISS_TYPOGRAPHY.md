# Services Accordion — Swiss Luxury Typography Architecture

> **Feature Scope**: Services Accordion Typography Refinement & Alignment with Whoa Mama Swiss Hairline Aesthetic  
> **Component Target**: `src/app/components/Sections/ServicesAccordion/ServicesAccordion.module.scss`  
> **Branch**: `refactor/services-accordion-swiss-typography`  
> **Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`

---

## 1. Architectural Rationale
In accordance with the agency-wide Swiss luxury design system established in `AboutCurtain` and `StatementCurtain` (drawing from the Whoa Mama reference aesthetic), the `ServicesAccordion` component has been unified with authentic Helvetica Neue typography:

1. **Section Heading (`.sectionTitle`)**:
   - Switched from generic Circular XX to `$font-helvetica` (`Helvetica Neue`).
   - Configured with `$fw-helvetica-extralight: 200` (Thin Hairline) at `clamp(1.75rem, 2.6vw, 2.5rem)` with `line-height: 1.15` and `letter-spacing: -0.025em`.
   - Enhanced with subpixel antialiasing (`-webkit-font-smoothing: antialiased`).

2. **Column Numbers (`.restingNumber` & `.overlayNumber`)**:
   - Switched from monospace to `$font-helvetica` at `14px` with `$fw-helvetica-light: 300` and `letter-spacing: 0.05em`.
   - Creates an elegant, editorial indexing hierarchy matching Swiss magazine layouts.

3. **Card Titles (`.restingTitle` & `.overlayTitle`)**:
   - Switched from Circular XX Medium to `$font-helvetica` at `clamp(1.15rem, 1.35vw, 1.45rem)` with `$fw-helvetica-light: 300` and `line-height: 1.18`.
   - Eliminates heavy blockiness while maintaining contrast against photographic background scrims.

---

## 2. Invariant & Contrast Compliance
- **Text Contrast**: White text (`#ffffff`) over dark card scrims and dark obsidian hover overlays exceeds WCAG AAA standards (> 7:1).
- **Brand Red Accent**: Brand red accents (`#ea002a`) maintain WCAG AA compliance (4.5:1 text, 3:1 components).
- **Performance**: Zero additional network requests; consumes pre-registered local Helvetica Neue font cuts.
