# Navigation Overlay Parity Architecture Plan (Client Specification Update)

**Document ID**: `docs/navigation_overlay/full_160over90_overlay_benchmark_parity_plan.md`  
**Target Branch**: `showcase/homepage-works-cutout-and-portfolio-showcase`  
**Target PR**: [Pull Request #84](https://github.com/Fenar7/marca_ubi_web_hosting/pull/84) (Strictly `OPEN`)  
**Design Direction**:  
- **Left Panel**: Benchmark Parity (Monumental 50px–62px Circular XX Medium typography, custom editorial vector arrow, 42×42px social tiles, strict single-axis datum).
- **Right Panel**: Revert to the approved and preferred **Original Kinetic Constellation Stage** (`Culture ✦`, `Design ✌`, `Craft •`, `Tech 🌐`, `Impact ♡` with the vector cursor).

---

## 1. Architectural Summary & Scope

Based on user feedback (`Screenshot 2026-10-27 122349.png`):
> *"regarding the right side this man we just want the old stuff that we did that was much better man"*

The right side vertical pinwheel cross is rejected in favor of the original, highly polished horizontal kinetic constellation stage. The Left Panel retains all approved benchmark improvements.

### Component Matrix

| Section | Current State | Approved Target Architecture |
| :--- | :--- | :--- |
| **Left Panel Typography** | Upgraded to monumental 50px–62px scale | **Keep**: `clamp(2.75rem, 3.8vw, 3.875rem)` in Circular XX Medium (500) with `-0.03em` tracking. |
| **Left Panel Arrow** | Custom inline SVG editorial arrow | **Keep**: Scalable inline SVG editorial arrow (`36×14px`, 2.5px solid stem) optically centered. |
| **Left Panel Socials** | 42×42px tiles with 20px SVGs | **Keep**: 42×42px obsidian black tiles, 6px radius, 12px gap, 20px white SVGs directly below `Contact →`. |
| **Left Panel Invariant** | Kerala Studio in `.srOnly` | **Keep**: `<div className={styles.srOnly}>Authentic Kerala Studios: Kozhikode &amp; Trivandrum</div>`. |
| **Right Panel Layout** | Vertical 3×3 pinwheel cross | **Revert**: Restoring the beloved original constellation stage (`Culture ✦`, `Design ✌`, `Craft •`, `Tech 🌐`, `Impact ♡`). |
| **Right Panel Cursor** | 8-bit retro pixel pointer | **Revert**: Restoring the sleek vector desktop cursor with autonomous glide, spring clicks, and mouse tracking. |

---

## 2. Actionable Implementation Steps

### Step 1: Left Panel Refinements (Already Applied)
- [`src/app/components/NavigationOverlay/NavigationOverlay.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/NavigationOverlay/NavigationOverlay.tsx)
- [`src/app/components/NavigationOverlay/NavigationOverlay.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/NavigationOverlay/NavigationOverlay.module.scss)

### Step 2: Revert Right Panel to Original Kinetic Constellation Stage
- Restore [`src/app/components/NavigationOverlay/KineticStage.tsx`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/NavigationOverlay/KineticStage.tsx):
  - `STAGE_WORDS`: `Culture ✦` (24%, 24%), `Design ✌` (76%, 22%), `Craft •` (50%, 50%), `Tech 🌐` (24%, 76%), `Impact ♡` (76%, 78%).
  - Vector arrow cursor (`M3 3L10.5 21L14 13.5L21.5 10L3 3Z`) with tactile click scale and autonomous GSAP timeline.
- Restore [`src/app/components/NavigationOverlay/KineticStage.module.scss`](file:///F:/Fenar/Marca%20Ubi/Web_Works/marca_ubi_web_hosting/src/app/components/NavigationOverlay/KineticStage.module.scss):
  - `.wordsContainer` (`width: min(580px, 86%); height: min(580px, 86%);`).
  - `.wordNode` horizontal layout with hover scaling and accent red dot on `Craft`.
  - `.vectorCursor` with click scaling.

### Step 3: Git Commit, Push & PR #84 Update
- Stage files and commit authored strictly as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
- Commit title: `Design Polish: Navigation Overlay Left Benchmark Parity and Kinetic Stage Restoration`.
- Push to `showcase/homepage-works-cutout-and-portfolio-showcase`.
- Update PR #84 description while keeping PR strictly **OPEN**.
