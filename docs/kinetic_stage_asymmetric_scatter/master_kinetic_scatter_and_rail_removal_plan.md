# Architecture & Implementation Plan: Kinetic Stage Asymmetric Scatter & Operational Rail Removal

> **Document Location**: `docs/kinetic_stage_asymmetric_scatter/master_kinetic_scatter_and_rail_removal_plan.md`  
> **Status**: **IMPLEMENTED & AUDITED**  
> **Author**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  
> **Target Branch**: `refactor/kinetic-stage-scatter-and-operational-rail-removal` (sub-branch off `master`)  
> **Target PR**: Targeting `master` (strictly **OPEN** awaiting human review)

---

## 1. Executive Summary & User Directives

This implementation addresses two sequential client-directed visual enhancements:

1. **Request A (`Screenshot 2026-10-27 165358.png`)**:
   - Directive: *"just remoe this"*
   - Target: The bottom synchronized operational metadata rail in [`GlobalLocationsCloud.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/Sections/GlobalLocationsCloud.tsx) (`IST 16:53 UTC+05:30 / CCJ HiLITE Business Park, Calicut / TRV Creative Studio, Trivandrum / MON-FRI 09:30-18:30 IST`).
   - Resolution: Complete elimination of `.operationalRail` JSX, all child `.rail*` styles in SCSS, the 10-second `setInterval` clock timer, and the `istTime` component state. Zero unused CSS or JavaScript footprint.

2. **Request B (`Screenshot 2026-10-27 165456.png`)**:
   - Directive: *"see thowe top tow itms are like ina row right also that of hte bottom is laos i nlike row i wnat it to be like in random no tow itses shoudlbe ina arow but hsoudl be fully sviisble btw not cut off or anythihing please hire expoert sbu agetsn ad nd do hits ndpuate he pr"*
   - Target: In [`KineticStage.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/NavigationOverlay/KineticStage.tsx), the 5 core studio capability nodes were positioned in a rigid rectangular grid where the top two items (`Brand Engineering` and `Identity & Art Systems`) shared `yPct: 22`, and the bottom two items (`Digital Experience Design` and `Communication & Growth`) shared `yPct: 78`.
   - Resolution: Re-architect the node positions into an **asymmetric organic constellation** where **every single item occupies a unique vertical level (yPct)** and a **unique horizontal coordinate (xPct)**. Nodes maintain ample padding (>30px) from all canvas container boundaries and >60px clearance from the top-right desktop close button `✕`.

---

## 2. Geometric Coordinate Calculation & Boundary Clearance

### A. Container & Anchor Architecture
- **Stage Container** (`.wordsContainer`):
  - `width: 100%; max-width: 820px; height: 100%; max-height: 640px; margin: auto; position: relative;`
- **Node Anchor Model** (`.wordNode`):
  - `position: absolute; transform: translate(-50%, -50%);`
  - Coordinates `(xPct, yPct)` represent the exact physical center of each node.
- **Node Dimensions (Maximum at 820×640 container)**:
  - Font size: `clamp(1.125rem, 1.7vw, 1.875rem)` (~24px).
  - Maximum node width: `Digital Experience Design` + glyph `🌐` = ~350px (half-width = 175px = ~21.3% of 820px).
  - Average node height: ~45px (half-height = 22.5px = ~3.5% of 640px).

### B. Asymmetric Staggering Matrix

| Node ID | Discipline Label | Glyph | `xPct` | `yPct` | Half-Width Extent | Vertical Clearance to Nearest Node | Boundary Safety |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `brand-engineering` | Brand Engineering | ✦ | **26%** | **18%** | ~140px | +14% (90px) to Node 2 | Top: 115px - 23px = 92px. Left: 213px - 140px = 73px. |
| `identity-art-systems` | Identity & Art Systems | ✌ | **72%** | **32%** | ~160px | +14% (90px) from Node 1; +18% (115px) to Node 3 | Right: 820px - 590px - 160px = 70px. Clear of Close Btn. |
| `brand-transformation` | Brand Transformation | — (Hub) | **48%** | **50%** | ~165px | +18% (115px) from Node 2; +18% (115px) to Node 4 | Dead center nexus hub. Red dot glow. |
| `digital-experience-design` | Digital Experience Design | 🌐 | **28%** | **68%** | ~175px | +18% (115px) from Node 3; +16% (102px) to Node 5 | Left: 230px - 175px = 55px. |
| `communication-growth` | Communication & Growth | ♡ | **70%** | **84%** | ~160px | +16% (102px) from Node 4 | Bottom: 640px - 538px - 23px = 79px. Right: 820px - 574px - 160px = 86px. |

### C. Visual Invariant Validation
1. **Vertical Exclusivity**:
   - `yPct`: `18%` &rarr; `32%` &rarr; `50%` &rarr; `68%` &rarr; `84%`.
   - Minimum vertical separation: `14%` (90px). Since node height is ~45px, the vertical empty space between any two nodes is at least 45px. Zero horizontal row sharing!
2. **Horizontal Exclusivity**:
   - `xPct`: `26%` &rarr; `72%` &rarr; `48%` &rarr; `28%` &rarr; `70%`.
   - Zero vertical column stacking.
3. **Autonomous Flight Integrity**:
   - GSAP timeline reads `word.xPct` and `word.yPct` dynamically. The autonomous cursor glides fluidly across the constellation and pulses each node with zero hardcoded math.

---

## 3. Engineering & Platform Verification

1. **`GlobalLocationsCloud.tsx`**:
   - Removed `.operationalRail` JSX.
   - Removed `istTime` state and `updateTime` / `setInterval` in `useEffect`. Cleaned unused `useEffect` import.
2. **`GlobalLocationsCloud.module.scss`**:
   - Removed `.operationalRail`, `.railNode`, `.railCode`, `.railTime`, `.railAbbr`, `.railText`, and `.railDivider`.
3. **`tests/client/client_160over90_platform.test.ts`**:
   - Updated assertion at line 355 to verify `!tsx.includes("operationalRail")`, strictly enforcing eradication in CI.
4. **Platform Test Suite**:
   - Executed `node --import tsx --test tests/client/client_160over90_platform.test.ts` &rarr; 37/37 passing (100%).
