## Executive Summary & Architectural Overview

This Pull Request delivers a comprehensive, ground-up client-facing platform remediation and flagship redesign for **Marca Ubi Enterprise**, benchmarked directly against the world-class digital flagship **[160over90](https://www.160over90.com/)**.

Following user review and forensic visual audit across production screenshots, this PR eradicates all AI-slop badges, pulsing radar dots, and capsule pills; resolves the vector logo invisibility over video by introducing a zero-lag `IntersectionObserver` theme controller; preserves 100% of authentic previous production content across an **11-view alternating stream** with dynamic Sanity CMS data; completely redesigns **`/blog`** and **`/blog/[slug]`** to the 160over90 Monolithic Swiss Editorial standard; and restricts studio coordinates strictly to authentic Kerala locations: **Kozhikode (HiLITE Business Park)** and **Trivandrum**.

---

## Key Architectural Deliverables

### 1. Vector Logo Contrast Engine (`MarcaUbiLogo.tsx` & `useHeaderTheme`)
- Componentized inline SVG `MarcaUbiLogo.tsx` with dynamic `currentColor` wordmark paths and permanently invariant `#ea002a` red accents.
- Eradicated `mix-blend-mode: difference`, which caused mathematical invisibility over dark video (`|dark - black| = dark`) and corrupted red to neon cyan (`#15ffd5`) over white curtains.
- Implemented zero-lag `IntersectionObserver` theme controller tracking `data-header-theme="light"` vs `data-header-theme="dark"` across all 11 views, dynamically switching between `.isLight` (pitch black text/logo) and `.isDark` (pure white text/logo).

### 2. 100% Eradication of AI-Slop Pills, Badges & Radar Dots
- Purged tacky status chips (`[ 12 INTEGRATED DISCIPLINES ]`, `[ • ACTIVE GLOBAL RELAY ]`).
- Purged glowing red radar dots, `@keyframes radarPulse`, and `@keyframes pulseLine`.
- Purged all `border-radius: 9999px` capsule buttons from client components, replacing them with sharp Swiss architectural rectangular buttons (`border-radius: 2px`).

### 3. Authentic Kerala Studio Corridors (Zero Synthetic International Hubs)
- Eradicated all synthetic foreign hubs (`Dubai`, `London`, `Bengaluru`, `New York`, `Singapore`, `Tokyo`, `Los Angeles`) and foreign clocks (`DXB`, `LON`, `BLR`, `NYC`, `SIN`, `TYO`, `LAX`).
- Refactored View 09 to **Kerala Studio Corridors**:
  * Broadsheet duo typography: **Kozhikode** / **Trivandrum** in Swiss scale (`clamp(2.5rem, 6vw, 5.5rem)`), with interactive hover links to authentic Google Maps coordinates.
  * Synchronized Operational Rail: Indian Standard Time (`IST UTC+05:30`), airport station codes (`CCJ` / `TRV`), and studio hours (`Mon–Fri 09:30–18:30 IST`).
- Restricted Column 04 of `MonumentalFooter` strictly to HiLITE Business Park Calicut & Trivandrum Studio.
- Cleaned up `layout.tsx` schema and `privacy/page.tsx` legal copy to reference Kerala studios.

### 4. Complete 11-View Alternating Homepage Stream with Dynamic Sanity Pipelines
- **View 01 (`HeroCutout`)**: Transparent living video viewport with monumental typography (`clamp(2.5rem, 6.5vw, 6.5rem)`), uppercase hairline kicker, and static 48px scroll cue.
- **View 02 (`AboutDoctrineCurtain`)**: Pure white `#ffffff` curtain housing the full production doctrine, 4 Core Services (`01 Brand Engineering` etc.), and 4 verified metric odometers (`100+ Brands`, `12+ Disciplines`, `3* Pillars`, `360° Scope`).
- **View 03 (`ReelCutout`)**: Transparent video viewport with `Play Reel` modal trigger and `Explore Selected Work &rarr;`.
- **View 04 (`WorksCurtain`)**: Pure white `#ffffff` curtain streaming live client case studies via Sanity CMS `worksQuery` in 16:9 broadsheet format.
- **View 05 (`ValuesCutout`)**: Transparent video viewport with 4 floating Apple HIG Vibrancy glass fluid cards (*Thought Before Form*, *Art With Intention*, *Experiences That Pull People In*, *Built, Not Improvised*).
- **View 06 (`ProcessCurtain`)**: Pure white `#ffffff` curtain uniting the 12 Practice Areas kinetic typographic cloud with the 4-phase delivery methodology (*Discovery*, *Strategy & System*, *Design & Build*, *Deliver & Rollout*).
- **View 07 (`TestimonialsCutout`)**: Transparent video viewport with authentic partner quotation and executive attribution.
- **View 08 (`DispatchesCurtain`)**: Pure white `#ffffff` curtain displaying the latest 3 editorial essays from Sanity CMS with reading time in `tabular-nums` and direct link to `/blog`.
- **View 09 (`GlobalLocationsCloud`)**: Pure white `#ffffff` curtain with authentic Kerala Studio Corridors (**Kozhikode** & **Trivandrum**) and real-time IST operational rail.
- **View 10 (`ConnectCutout`)**: Transparent video viewport with genuine Kerala studio coordinates (`+91 7012 052 472`, `hello@marcaubi.com`, Hilite Business Park Calicut & Trivandrum studios).
- **View 11 (`MonumentalFooter`)**: Solid obsidian black (`#000000`) monolith anchor with cultural anthem, massive vector wordmark, and 4-column directory.

### 5. Complete Ground-Up Redesign of `/blog` & `/blog/[slug]`
- Wrapped in `[data-client-shell="true"]` with `ClientHeader` and `MonumentalFooter`.
- Circular XX typography (`--font-circular`) and brand red accent `#ea002a`.
- **`/blog` Broadsheet Listing**:
  * Hero stage with monumental title: `Thinking in Systems.`
  * Typographic category navigation rail separated by slashes (zero background pills) with sharp 2px red underline on active category.
  * 60/40 asymmetric featured article flagship showcase.
  * 3-column broadsheet dispatches grid with reading times, dates, and cover images.
- **`/blog/[slug]` Article Reader**:
  * 30/70 Swiss asymmetric reading layout.
  * Left rail: Minimalist sticky Table of Contents with active progress indicator and clean text-based social sharing.
  * Right rail: Styled Portable Text renderer with `#ea002a` pull-quotes, monospace code blocks, author dossier card, and related dispatches grid.
  * 100% zero em dashes in metadata and copy.

---

## Quantitative Verification Ledger

| Verification Pillar | Metric / Invariant | Status |
| :--- | :--- | :--- |
| **Static Types** | `npx tsc --noEmit` | **0 errors (100% PASS)** |
| **Server Action Boundaries** | `scripts/verify-server-action-boundaries.ts` | **50/50 valid Server Actions (100% PASS)** |
| **Platform Test Suite** | `tests/client/client_160over90_platform.test.ts` | **27/27 PASS across 13 suites (100%)** |
| **Production Build** | `next build` (Turbopack) | **33/33 static & dynamic routes compiled (100% PASS)** |
| **Authentic Content Audit** | 0 mentions of Dubai/London/NYC in studio components | **100% PASS (Zero synthetic hubs)** |
| **WCAG AAA Text Contrast** | `#0a0a0a` on `#ffffff` canvas | **19.82:1** ($\ge 7.0:1$) |
| **WCAG AA Accent Contrast** | `#ea002a` on `#ffffff` & `#000000` | **4.63:1 / 4.53:1** ($\ge 4.5:1$) |
| **Touch Targets** | Interactive button minimum bounds | **$\ge 44\text{px} \times 44\text{px}$** |
| **Anti-Slop Generic Blue** | `#2563eb` and `#4571ff` | **0 instances detected** |
| **Anti-Slop Em Dash Ban** | Rule R-02 Compliance | **0 em dashes detected** |
| **CRM Air-Gap Quarantine** | `src/app/admin/` modifications | **0 files touched (100% QUARANTINED)** |

---

## Authorship & Review Policy

- **Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`
- **PR Status**: **OPEN** awaiting human review. Under strict behavioral rules, this agent does **NOT** merge Pull Requests.
