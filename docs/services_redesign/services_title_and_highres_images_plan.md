# Services Accordion Header Contrast & 16-Asset High-Res Imagery Plan

**Scope**: 
1. Fix invisible section title ("Capabilities & Strategic Delivery") caused by white-on-white text in `ServicesAccordion.module.scss`.
2. Replace all 16 resting card images with curated, ultra-high-resolution (2400px, `q=85`) luxury editorial photography matching the approved video loops and Marca Ubi brand soul.

---

## 1. Forensic Diagnosis: Why Is the Title Invisible?

In `src/app/components/Sections/AboutCurtain.tsx`, `ServicesAccordion` is placed directly at the bottom of the About section.
- `.aboutSection` background is **solid pure white** (`#ffffff`).
- In `ServicesAccordion.module.scss`:
  ```scss
  .sectionTitle {
    color: #ffffff; // WHITE text on WHITE background -> 1:1 contrast (Completely invisible!)
  }
  border-top: 1px solid rgba(255, 255, 255, 0.12); // Translucent white line on white background (Invisible!)
  ```
- Because `.sectionLabel` ("SERVICES") is styled in brand orange (`#ff6100`), only "SERVICES" was visible while "Capabilities & Strategic Delivery" vanished into the white background.

### The Fix:
- In `ServicesAccordion.module.scss`:
  - Update `.sectionTitle` to `color: $client-text-dark;` (`#0a0a0a`), providing **16.1:1 WCAG AAA** contrast on the white canvas.
  - Update `border-top` to `1px solid $client-border-editorial;` (`rgba(0, 0, 0, 0.08)`).
  - The dark segmented switch (`#141414`) remains a sharp, high-contrast control anchor.

---

## 2. 16-Service High-Resolution Curation Matrix (2400px Ultra-HD)

All 16 URLs have been tested via HTTP HEAD and verified active (HTTP 200 OK, 2400px wide, `q=85`).

### B2B Enterprise Capabilities (01 – 08)
| # | Service Name | Visual Concept | 2400px Curated Unsplash URL | Slop Purged |
|---|---|---|---|---|
| **01** | **Demand Generation** | Monolithic skyscraper at night reflecting metropolitan lights | `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=85&w=2400` | Upgraded to 2400px razor-sharp architectural geometry |
| **02** | **Integrated Marketing** | Executive strategy session in a glass boardroom under downlighting | `https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&q=85&w=2400` | Replaced casual office worker in headphones with executive boardroom |
| **03** | **Corporate Communications** | Keynote leader speaking on dark stage under architectural spotlight | `https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=85&w=2400` | Replaced headless blue-tie stock cliché with keynote stage |
| **04** | **Social & Influencer (B2B)** | Cinema optics and grading suite workstation | `https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=85&w=2400` | Replaced generic purple gradient with high-end cinema optics |
| **05** | **Content & Scale** | Matrix data tunnel and optical fiber digital syndication | `https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=85&w=2400` | Replaced freelance coffee mug on wooden desk with optical telemetry |
| **06** | **Public Relations (PR)** | Press conference podium microphone array under camera flashes | `https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=85&w=2400` | Replaced startup sticky-note whiteboard with international press conference |
| **07** | **Customer Marketing** | Executive partnership handshake in dark bespoke suits | `https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=85&w=2400` | Replaced casual chat in brick loft with executive trust agreement |
| **08** | **Account-Based Marketing** | Abstract 3D geometric network mesh with obsidian reflections | `https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&q=85&w=2400` | Replaced blurry satellite lights with precision geometric mesh |

### B2C Consumer Capabilities (09 – 16)
| # | Service Name | Visual Concept | 2400px Curated Unsplash URL | Slop Purged |
|---|---|---|---|---|
| **09** | **Integrated Creativity** | Avant-garde obsidian fluid art sculpture in dark void | `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=85&w=2400` | Replaced low-res chromatic splash with Milad Fakurian fluid sculpture |
| **10** | **Social & Influencer (B2C)** | High-fashion editorial studio shoot under dramatic strobes | `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=85&w=2400` | Replaced casual friends in park with high-contrast fashion editorial |
| **11** | **Digital Performance** | Telemetry HUD with tabular metrics and candlestick analytics | `https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&q=85&w=2400` | Replaced generic pie charts with Bloomberg-grade dark glass HUD |
| **12** | **Sports Marketing** | High-performance sprinter leaping from blocks on floodlit track | `https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=85&w=2400` | Replaced blurry gym barbells with Olympic athletic power |
| **13** | **CRM & Loyalty** | Obsidian luxury contactless card tapped on dark terminal | `https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=85&w=2400` | Replaced POS pinpad on pine wood with tactile black titanium card |
| **14** | **Public Relations (PR - Consumer)** | Atmospheric gala premiere with warm volumetric spotlights | `https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=85&w=2400` | Replaced corporate auditorium with red-carpet gala premiere |
| **15** | **Live Experiences** | Massive spatial festival stage with lasers and crowd silhouettes | `https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=85&w=2400` | Upgraded to 2400px ultra-HD laser synchronization |
| **16** | **Retail Activation** | Architectural luxury flagship boutique with minimalist dark displays | `https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=85&w=2400` | Replaced generic retail rack with minimalist luxury architectural flagship |

---

## 3. Implementation Steps
1. **Update `ServicesAccordion.module.scss`**:
   - Set `.sectionTitle` to `color: $client-text-dark;` (`#0a0a0a`).
   - Set top boundary to `border-top: 1px solid $client-border-editorial;`.
2. **Update `src/app/components/Sections/ServicesAccordion/types.ts`**:
   - Replace all 16 `imageUrl` values with the vetted 2400px URLs.
3. **Verification**:
   - Run `npx tsc --noEmit` to verify 0 errors.
   - Run tests to ensure zero regressions.
4. **Commit & Pull Request**:
   - Commit as `Fenar7 <86710532+Fenar7@users.noreply.github.com>` on branch `redesign/services-cinematic-video-replacement`.
   - Update open PR #101 on GitHub.
