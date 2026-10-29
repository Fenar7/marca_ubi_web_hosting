## Architectural Summary: Services Accordion Swiss Hairline Typography

### 1. Problem Statement & Scope
Aligns the **Services Accordion** (`ServicesAccordion.module.scss`) with the agency-wide Swiss luxury hairline aesthetic established across `AboutCurtain`, `StatementCurtain`, and the Whoa Mama reference standard (`Helvetica Neue Thin` / `Light`).

### 2. Typographic Changes
- **Section Heading (`.sectionTitle`)**: Switched to `$font-helvetica` with `$fw-helvetica-extralight: 200` (Thin Hairline) at `clamp(1.75rem, 2.6vw, 2.5rem)` with `line-height: 1.15` and `letter-spacing: -0.025em`.
- **Column Numerals (`.restingNumber`, `.overlayNumber`)**: Switched to `$font-helvetica` with `$fw-helvetica-light: 300` at `14px` and `letter-spacing: 0.05em`.
- **Card Titles (`.restingTitle`, `.overlayTitle`)**: Switched to `$font-helvetica` with `$fw-helvetica-light: 300` at `clamp(1.15rem, 1.35vw, 1.45rem)` with `line-height: 1.18`.

### 3. Verification & Compliance
- **Platform Invariants**: **55/55 PASS** (`npx tsx --test tests/client/client_160over90_platform.test.ts`).
- **Boundaries**: **48/48 PASS** (`tsx scripts/verify-server-action-boundaries.ts`).
- **Contrast**: WCAG AAA compliance (> 7:1) preserved across all card overlays.
- **Strict Policy Compliance**: Authored as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`, strictly zero merges executed.
