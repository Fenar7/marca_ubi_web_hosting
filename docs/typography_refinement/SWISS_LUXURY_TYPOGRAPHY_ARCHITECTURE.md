# Swiss Luxury Editorial Typography Architecture

> **Feature Scope**: Helvetica Neue Thin Integration across AboutCurtain & StatementCurtain  
> **Benchmark Source**: [whoamama.com](https://whoamama.com/) — *"All work, all play, everyday. We strategize, design and deliver."*  
> **Target Branch**: `refactor/master-brand-and-kinetic-refinements`  
> **Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`

---

## 1. Architectural Strategy
To elevate Marca Ubi's digital platform to the highest tier of international studio aesthetics, we integrate **Helvetica Neue Thin** (`HelveticaNeue-Thin.otf`, weight 100/200) alongside our core **Circular XX** (grotesque) and **Graphik** body typography.

### 2. Font Allocation Matrix
- **`AboutCurtain.module.scss`**:
  - `.statementHeadline`: Styled with `$font-helvetica`, `font-weight: 200`, `letter-spacing: -0.02em`, `line-height: 1.18`.
  - `.metricValue`: Styled with `$font-helvetica`, `font-weight: 200`, `letter-spacing: -0.03em`, `tabular-nums`.
  - `.metricSymbol`: Styled with `$client-accent-red`, `font-weight: 200`.
- **`StatementCurtain.module.scss`**:
  - `.monumentalStatement`: Styled with `$font-helvetica`, `font-weight: 200`, `letter-spacing: -0.02em`, `line-height: 1.22`.
- **`NavigationOverlay.module.scss`**:
  - Continues using `$font-helvetica`, `font-weight: 300` (Light) for lowercase navigation links.

### 3. Font System Setup
- Asset: `public/fonts/helvetica/HelveticaNeue-Thin.otf` (301KB OpenType Binary)
- Next.js LocalFont: Registered in `src/app/fonts.ts` under `helveticaNeue` with weights `100` and `200`.
- SASS Mixins: Exported in `src/app/styles/client-mixins.scss` as `$font-helvetica` and `$fw-helvetica-thin: 100`, `$fw-helvetica-extralight: 200`.
