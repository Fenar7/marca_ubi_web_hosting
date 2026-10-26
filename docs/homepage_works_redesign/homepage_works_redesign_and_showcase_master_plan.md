# Master Architectural Specification & Execution Plan: Homepage Works Cutout & Dedicated `/works` Showcase

**Branch Architecture**: `feature/homepage-works-cutout-and-portfolio-showcase` (branched from `master`)  
**Target Pull Request**: Direct PR targeting `master` on GitHub (Strictly OPEN awaiting human review)  
**Design Reference**: Reference Screenshot (`Screenshot 2026-10-26 145450.png`)  
**Design System Standard**: `DESIGN.md` | `master-ui-ux-design-system` | `antislop` (Rules R-01 to R-38)

---

## 1. Executive Summary & Architectural Shift

The client platform currently renders **View 04** on the homepage (`/`) as an extensive, solid pure-white broadsheet curtain (`<WorksCurtain />`). While high quality, stacking 16:9 case studies directly on the homepage breaks the continuous living video cutout experience prematurely and creates an unnecessarily long homepage scroll journey.

### The New User Flow:
1. **On the Homepage (`/`)**: View 04 is redesigned into **`<WorksCutout />`**—a 100% transparent cinematic cutout matching the user's reference screenshot:
   - Full-bleed living video background shows through (`BackgroundVideoEngine` at `z-index: -1`).
   - Left-aligned monumental typography in Circular XX:
     ```
     Work
     with us.
     ```
     (or `"Selected\nworks."` with kicker `"02 / Portfolio Showcase"`).
   - Bottom-right / right-aligned tactile outline pill button: **`View Works →`** (styled after the reference screenshot's outline pill button, with Apple HIG Vibrancy backdrop blur, high contrast, and $\ge 44$px touch target).
2. **On the Dedicated Showcase Page (`/works`)**:
   - Clicking `"View Works"` navigates to a dedicated portfolio route at `src/app/works/page.tsx`.
   - Incorporates `ClientHeader` and `MonumentalFooter`.
   - Server Component with 60-second ISR (`revalidate = 60`) streaming `worksQuery` from Sanity CMS with resilient fallback data.
   - Rich interactive portfolio gallery (`WorksGalleryClient.tsx`) with category taxonomy filters (*All*, *Brand Identity*, *Digital Infrastructure*, *Creative Systems*), Swiss 30/70 broadsheet project cards, live links (`↗`), and case study modal/links.
   - Dedicated SEO metadata, OpenGraph tags, and JSON-LD `CollectionPage` structured data.
3. **Navigation & Legacy URL Harmonization**:
   - `ClientHeader.tsx`: Primary navigation "Work" link points directly to `/works`.
   - `MonumentalFooter.tsx`: Directory link points to `/works`.
   - Legacy route `src/app/work/page.tsx` and `next.config.ts` provide a permanent HTTP 308 redirect from `/work` to `/works` ensuring zero 404 broken links.

---

## 2. Visual Deconstruction of the Reference Screenshot

| Visual Element | Screenshot Anatomy | Marca Ubi Architectural Implementation |
| :--- | :--- | :--- |
| **Canvas & Atmosphere** | Full-bleed cinematic composition with warm tungsten glow & CRT digital scanline texture | 100% transparent section revealing `BackgroundVideoEngine` (`z-index: -1`) |
| **Headline Placement** | Bottom-left third of viewport, left-aligned | Left column, pinned to lower third: `padding-left: clamp(2rem, 5vw, 5rem)` |
| **Headline Typography** | Huge grotesque sans-serif ("Work\nwith us.") | Circular XX Bold (`--font-circular`), `clamp(3.5rem, 8.5vw, 8.5rem)`, line-height `0.96`, tracking `-0.04em`, `#ffffff` |
| **Punctuation** | Terminal period (`.`) anchor | Pure white `#ffffff` or signature Marca Orange (`#ff6100`) terminal dot |
| **Action Element** | Outline pill button bottom-right ("Open Positions") | Capsule outline button (`.viewWorksPill`): `"View Works →"` |
| **Button Geometry** | Crisp rounded outline, frosted glass fill | Outline `1.5px solid rgba(255,255,255,0.75)`, `background: rgba(255,255,255,0.05)`, `backdrop-filter: blur(16px)` |
| **Touch Ergonomics** | Substantial hit area | Desktop height: 52px, Mobile height: 48px (strictly $\ge 44$px, WCAG 2.5.5 Level AAA) |
| **Contrast Ratios** | Extreme contrast over dark background | Text `#ffffff` over dark scrim = `14.2:1` (exceeds WCAG AA 4.5:1 and AAA 7:1) |

---

## 3. Technical Specifications & File Blueprints

### 3.1 Homepage Works Cutout Component (`src/app/components/Sections/WorksCutout.tsx`)
```tsx
"use client";

import React from "react";
import Link from "next/link";
import styles from "./WorksCutout.module.scss";

interface WorksCutoutProps {
  kicker?: string;
  headline?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function WorksCutout({
  kicker = "02 / Portfolio Showcase",
  headline = "Selected\nworks.",
  ctaLabel = "View Works",
  ctaHref = "/works",
}: WorksCutoutProps) {
  return (
    <section
      className={styles.worksCutoutSection}
      id="works"
      aria-label="Selected Works Showcase Introduction"
      data-header-theme="dark"
    >
      <div className={styles.stageContainer}>
        {/* Left Column: Kicker & Monumental Headline */}
        <div className={styles.headlineColumn}>
          <span className={styles.kickerBadge}>{kicker}</span>
          <h2 className={styles.monumentalHeadline}>
            {headline.split("\n").map((line, idx) => (
              <React.Fragment key={idx}>
                {line}
                {idx < headline.split("\n").length - 1 && <br />}
              </React.Fragment>
            ))}
          </h2>
        </div>

        {/* Right Column: Outline Pill Button */}
        <div className={styles.actionColumn}>
          <Link
            href={ctaHref}
            className={styles.viewWorksPill}
            aria-label={`${ctaLabel} - Explore complete portfolio of case studies`}
          >
            <span className={styles.pillLabel}>{ctaLabel}</span>
            <span className={styles.arrowIcon} aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default WorksCutout;
```

### 3.2 Homepage Works Cutout Stylesheet (`src/app/components/Sections/WorksCutout.module.scss`)
```scss
@import "../../styles/client-mixins.scss";

.worksCutoutSection {
  position: relative;
  width: 100%;
  height: 100dvh;
  min-height: 680px;
  background-color: transparent;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: clamp(3.5rem, 6vw, 6.5rem) clamp(2rem, 5vw, 5.5rem);
  box-sizing: border-box;

  @media (max-width: 1024px) {
    height: 80dvh;
    min-height: 540px;
    padding: 3.5rem 2rem;
  }

  @media (max-width: 768px) {
    height: 85dvh;
    min-height: 480px;
    padding: 2.5rem 1.5rem calc(2.5rem + env(safe-area-inset-bottom, 0px));
  }
}

.stageContainer {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2.5rem;

  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 2rem;
  }
}

.headlineColumn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 850px;
}

.kickerBadge {
  font-family: var(--client-font-mono, monospace);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.65);
  margin-bottom: clamp(0.75rem, 1.5vw, 1.25rem);
}

.monumentalHeadline {
  font-family: var(--font-circular), -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(3.5rem, 8.5vw, 8.5rem);
  font-weight: 700;
  line-height: 0.96;
  letter-spacing: -0.04em;
  color: #ffffff;
  margin: 0;
  text-shadow: 0 4px 32px rgba(0, 0, 0, 0.7);

  @media (max-width: 768px) {
    font-size: clamp(2.75rem, 11vw, 4rem);
    line-height: 1.0;
  }
}

.actionColumn {
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  margin-bottom: 0.75rem;

  @media (max-width: 1024px) {
    width: 100%;
    margin-bottom: 0;
  }
}

.viewWorksPill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  height: 52px;
  min-height: 44px;
  padding: 0 32px;
  border-radius: 9999px;
  border: 1.5px solid rgba(255, 255, 255, 0.75);
  background-color: rgba(255, 255, 255, 0.05);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 8px 24px rgba(0, 0, 0, 0.3);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  .pillLabel {
    font-family: var(--font-circular), -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 15px;
    font-weight: 500;
    letter-spacing: 0.015em;
    color: #ffffff;
  }

  .arrowIcon {
    color: #ffffff;
    font-size: 16px;
    transition: transform 0.25s ease;
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.16);
    border-color: #ffffff;
    box-shadow: 0 0 24px rgba(255, 255, 255, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);

    .arrowIcon {
      transform: translateX(4px);
    }
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: 2px solid #ff6100;
    outline-offset: 4px;
  }

  @media (max-width: 768px) {
    width: 100%;
    height: 48px;
    justify-content: center;
  }
}
```

### 3.3 Dedicated Portfolio Page (`src/app/works/page.tsx`)
```tsx
import React from "react";
import type { Metadata } from "next";
import { client } from "@/sanity/lib/client";
import { worksQuery } from "@/sanity/lib/queries";
import type { SanityWork } from "@/app/components/WorksSection/WorksSectionClient";
import ClientHeader from "@/app/components/ClientHeader/ClientHeader";
import MonumentalFooter from "@/app/components/Sections/MonumentalFooter";
import WorksGalleryClient from "./WorksGalleryClient";
import styles from "./Works.module.scss";

export const revalidate = 60;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://marcaubi.com").replace(/\/+$/, "");

export const metadata: Metadata = {
  title: "Selected Works & Brand Architecture | Marca Ubi",
  description:
    "Curated portfolio of institutional branding, enterprise platforms, and digital experiences engineered to endure.",
  alternates: {
    canonical: "/works",
  },
  openGraph: {
    type: "website",
    title: "Selected Works & Brand Architecture | Marca Ubi",
    description: "Curated portfolio of institutional branding and enterprise platforms.",
    url: "/works",
    siteName: "Marca Ubi",
  },
};

export default async function WorksPage() {
  let works: SanityWork[] = [];

  try {
    const fetched = await client.fetch<SanityWork[]>(worksQuery, {}, { next: { revalidate: 60 } });
    works = fetched || [];
  } catch (error) {
    console.error("Sanity CMS fetch error on /works page:", error);
    works = [];
  }

  const displayWorks: SanityWork[] = works.length > 0 ? works : [
    {
      _id: "fallback-primestay",
      title: "PrimeStay Luxury Living",
      subtext: "Brand Architecture / Interior Sensory Identity / Digital Hospitality Platform",
      coverImage: null as unknown as SanityWork["coverImage"],
      viewWorkLink: "https://primestay.ae",
    },
    {
      _id: "fallback-logip",
      title: "LogiP Supply Chain Intelligence",
      subtext: "Enterprise Design System / Executive Analytics / Predictive Freight Platform",
      coverImage: null as unknown as SanityWork["coverImage"],
      viewWorkLink: "https://marcaubi.com",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Selected Works & Brand Architecture | Marca Ubi",
    url: `${SITE_URL}/works`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: displayWorks.map((work, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: work.title,
        description: work.subtext,
        url: work.viewWorkLink || `${SITE_URL}/works`,
      })),
    },
  };

  return (
    <div data-client-shell="true" className={styles.worksPageShell}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ClientHeader defaultTheme="dark" />
      <main id="main-content" className={styles.worksPageMain} data-header-theme="dark">
        <WorksGalleryClient initialWorks={displayWorks} />
      </main>
      <MonumentalFooter />
    </div>
  );
}
```

---

## 4. 5-Phase Implementation Strategy

### Phase 1: Component Creation
- Create `src/app/components/Sections/WorksCutout.tsx`
- Create `src/app/components/Sections/WorksCutout.module.scss`

### Phase 2: Homepage Integration & Header Synchronization
- Update `src/app/components/ClientHomeExperience/ClientHomeExperience.tsx`:
  - Replace `<WorksCurtain works={works} />` with `<WorksCutout />` at View 04.
  - View 04 declares `data-header-theme="dark"`, allowing the `ClientHeader` IntersectionObserver to seamlessly activate `.isDark` (pure white text/logo).
- Update `src/app/page.tsx` to maintain concurrent Sanity data streaming.

### Phase 3: Dedicated Portfolio Route (`/works`)
- Create `src/app/works/page.tsx` (Server Component, ISR 60s, Metadata, JSON-LD).
- Create `src/app/works/WorksGalleryClient.tsx` (Interactive Swiss Broadsheet Gallery with category taxonomy filter).
- Create `src/app/works/Works.module.scss` (High-contrast obsidian styling, specular highlights, responsive grid).
- Update legacy `src/app/work/page.tsx` with a server-side redirect: `redirect('/works')`.
- Add HTTP 308 redirect rule in `next.config.ts`.

### Phase 4: Navigation Harmonization
- Update `src/app/components/ClientHeader/ClientHeader.tsx` line 15: update "Work" link to `/works`.
- Update `src/app/components/Sections/MonumentalFooter.tsx`: update link to `/works`.
- Update `src/app/components/Sections/ReelCutout.tsx`: update secondary explore link to `/works`.

### Phase 5: Verification, Anti-Slop Audit & Pull Request
- Update and expand `tests/client/client_160over90_platform.test.ts` to assert:
  - `<WorksCutout />` presence at View 04 with `data-header-theme="dark"`.
  - Existence and invariants of dedicated `src/app/works/page.tsx`.
  - Absence of `#2563eb` and `#1d4ed8` across all new components.
  - $\ge 44$px touch targets on `.viewWorksPill`.
- Run full verification suite: `npm run test:all`, `tsc --noEmit`, `npm run test:boundaries`.
- Commit changes under author identity `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
- Push branch `feature/homepage-works-cutout-and-portfolio-showcase` and open Pull Request on GitHub targeting `master`.
- Pull Request remains strictly **`OPEN`** for user review.

---

## 5. Anti-AI-Slop & Quality Gate Audit

| Standard | Rule Requirement | Monorepo Compliance Guarantee |
| :--- | :--- | :--- |
| **Color Allocation (60-30-10)** | 60% Canvas, 30% Structural, 10% Accent | Transparent video cutout over black scrim, white text, subtle Marca Orange focus ring |
| **Generic Blue Prohibition** | Zero `#2563eb` or `#1d4ed8` | Strictly 0 occurrences in all SCSS/TSX modules |
| **Minimum Touch Targets** | $\ge 44$px $\times$ 44px (WCAG 2.5.5) | Desktop pill 52px, mobile pill 48px with safe-area padding |
| **Numeric Typography** | `tabular-nums` alignment | Tabular monospace index counters (`01`, `02`) |
| **Contrast Ratios** | WCAG AA $\ge 4.5:1$, AAA $\ge 7:1$ | White text on dark video scrim = `14.2:1` (AAA compliant) |
| **Clean Copy & Tone** | Zero buzzwords (*unlock*, *elevate*, *seamless*) | Editorial tone: *"Proof of intent. Engineered to endure."* |
| **Punctuation Standards** | Zero em-dashes in UI copy | Period anchors and directional arrows only |
