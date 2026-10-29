## Architectural Summary: Services Accordion Swiss Hairline Typography, Connect Desks Kinetic Text Fill & Fluid Liquid Glass Header

### 1. Problem Statement & Scope
1. Aligns the **Services Accordion** (`ServicesAccordion.module.scss`) with the agency-wide Swiss luxury hairline aesthetic established across `AboutCurtain`, `StatementCurtain`, and the Whoa Mama reference standard (`Helvetica Neue Thin` / `Light`).
2. Streamlines the **Monumental Footer** column 1 brand description to `"The Brand Engineering Company"` and calibrates legal links to high-contrast white with Brand Red hover transitions.
3. Implements the **ConnectCutout Studio Desks Kinetic Left-to-Right Red Text Fill Wave** across the 3-column cluster (`Contact`, `General Inquiries`, `Kerala Studios`), keeping top category labels permanently static and animating only the lower white content text.
4. Re-engineers the **ClientHeader Scrolled Liquid Glass Floating Capsule HUD**:
   - Eradicates the harsh, dated 48% height `::before` gloss cut-off line.
   - Implements continuous 360-degree meniscus perimeter refraction and multi-stop physical bevels.
   - Transitions via Apple-grade Exponential Deceleration (`cubic-bezier(0.19, 1, 0.22, 1)`) with asymmetric lateral/vertical droplet condensation and a 20px scroll hysteresis buffer.

### 2. Typographic & Kinetic Specifications
- **Services Accordion Heading (`.sectionTitle`)**: Switched to `$font-helvetica` with `$fw-helvetica-extralight: 200` (Thin Hairline) at `clamp(1.75rem, 2.6vw, 2.5rem)` with `line-height: 1.15` and `letter-spacing: -0.025em`.
- **Column Numerals & Card Titles**: Calibrated to `$font-helvetica` with `$fw-helvetica-light: 300` for hairline clarity.
- **ConnectCutout Studio Desks Kinetic Text Fill**:
  - `400%` width multi-stop gradient with strictly isolated white-rest and red-illumination zones.
  - Cascading `@keyframes kineticTextFillCol1`, `Col2`, and `Col3` sweeping across letterforms from left to right.
  - Interactive link hover state immediately triggers high-contrast Brand Red (`#ea002a`).
- **Liquid Glass Floating Capsule HUD**:
  - `backdrop-filter: blur(28px) saturate(190%) contrast(106%)` for crystal refraction.
  - Organic top specular keyline glint (`::after`) without internal body slicing.
  - Multi-property fluid morphing transition across `0.45s` exponential deceleration.

### 3. Verification & Compliance
- **Platform Invariants**: **55/55 PASS** (`npx tsx --test tests/client/client_160over90_platform.test.ts`).
- **Boundaries**: **48/48 PASS** (`tsx scripts/verify-server-action-boundaries.ts`).
- **Visual Smoke Tests**: Verified with Playwright across un-scrolled, light-curtain, and dark-cutout liquid glass states.
- **Strict Policy Compliance**: Authored as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`, strictly zero merges executed. PR remains OPEN.
