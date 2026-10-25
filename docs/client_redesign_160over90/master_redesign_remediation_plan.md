# Master Remediation & Full-Content Integration Plan: 160over90 Architecture

**Project**: Marca Ubi Enterprise Digital Flagship  
**Branch**: `remediation/160over90-full-content-and-blog-redesign` (Targeting `clientside-platform-160over90-redesign`, PR #80)  
**Base Commit Reference**: `7e5b006`  
**Benchmark**: [160over90 Monolithic Swiss Brutalism](https://www.160over90.com/)  
**Authorship Identity**: `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  

---

## 1. Executive Summary & Root Cause Analysis

Following user review across visual evidence (Screenshots `220033`, `220400`, `220411`, `220045`, and `231251`), this remediation plan incorporates the user's latest critical correction regarding studio locations, alongside previous visual and architectural fixes.

### 1.1 Root Cause 1: Missing Previous Production Content & Dynamic CMS Pipelines
- In the initial 160over90 pass, `src/app/page.tsx` was replaced with placeholder components. As a result, previous production content from commit `7e5b006` was suppressed:
  1. **Dynamic Works Portfolio**: The Sanity CMS `worksQuery` was omitted; no client case studies were displayed on the home experience.
  2. **Homepage Blog Section (Latest 3 Articles)**: No editorial dispatches section was featured on the homepage.
  3. **Verified Production Content**: The About doctrine with 4 verified metric odometers (`100+`, `12+`, `3*`, `360°`), 4 Core Services, Testimonials from real partners, and the 4 Core Values (*Thought Before Form*, *Art With Intention*, *Experiences That Pull People In*, *Built, Not Improvised*) were absent.
  4. **Genuine Studio Desks**: Contact details were generic, omitting the real phone (`+91 7012 052 472`), `hello@marcaubi.com`, and the Kozhikode (HiLITE Business Park) & Trivandrum studios.
- **The Solution**: Preserve 100% of the authentic production content, dynamic Sanity CMS data, and studio metadata by housing every pillar inside the 160over90 alternating living video cutout stream.

### 1.2 Root Cause 2: Common AI-Slop Pills, Badges, and Radar Dots
- **The Issue**: 
  - Screenshot `220400`: `[ 12 INTEGRATED DISCIPLINES ]` rendered as a rounded capsule badge with pink fill and red monospace text.
  - Screenshots `220411` & `220033`: `[ • ACTIVE GLOBAL RELAY ]` and hover badges like `[DXB 17:35 GST • ACTIVE]` with glowing red dots and `@keyframes radarPulse`.
  - Overuse of `border-radius: 9999px` capsule buttons.
- **The Solution**: 100% eradication of all pill badges, status chips, pulsing dots, and radar keyframes. Replace with authentic 160over90 Swiss brutalism: pure uppercase hairline kickers, crisp inline typography, clean slashes (`/`), sharp architectural rectangular buttons (`border-radius: 0px` or `2px`), and typographic arrow links (`&rarr;`, `&nearr;`).

### 1.3 Root Cause 3: Invisible Header Logo over Video & Color Corruption
- **The Issue**: In `public/images/marca-ubi-red-png.svg`, wordmark paths have no fill attribute, defaulting to black (`#000000`). With `mix-blend-mode: difference`, black paths over dark video evaluate to `|dark - black| = dark`, making the wordmark 100% invisible. Only the red accent triangle (`#ea002a`) had contrast, causing the isolated red sliver seen in Screenshot `220045`. Furthermore, over white curtains, `difference` inverted red into neon cyan (`#15ffd5`).
- **The Solution**:
  1. Componentize an inline SVG component (`MarcaUbiLogo.tsx`) where wordmark letterforms consume `currentColor` and the red accent `#ea002a` remains permanently invariant.
  2. Eliminate `mix-blend-mode: difference`. Implement a zero-lag `IntersectionObserver` header theme controller (`useHeaderTheme`):
     - Over dark video cutouts: Header text and wordmark are pure white (`#ffffff`), accent is `#ea002a`.
     - Over white editorial curtains: Header text and wordmark are deep black (`#0a0a0a`), accent is `#ea002a`.

### 1.4 Scope Addition: Complete Ground-Up Redesign of `/blog` and `/blog/[slug]`
- Both `/blog` and `/blog/[slug]` currently use legacy header and footer components, older typography, and generic styling.
- Both routes are redesigned to the **160over90 Monolithic Swiss Editorial Design System**:
  - `ClientHeader` and `MonumentalFooter` integration.
  - Circular XX Web typography (`--font-circular`) across all headings, body text, and metadata.
  - Brand red accent `#ea002a` for active category tabs, pull-quote margins, and hover accents.
  - Pure Swiss broadsheet layout for the listing page and magazine-standard typography for the article reader.

### 1.5 Critical User Correction: Studio Locations Mismatch (Screenshot `231251`)
- **The Issue**: 
  - View 09 (`GlobalLocationsCloud.tsx`) erroneously generated synthetic international cities:
    `Dubai / London / Bengaluru / New York / Singapore / Tokyo / Los Angeles` and time clocks (`DXB / LON / BLR / NYC / SIN / TYO / LAX`).
  - Column 04 of `MonumentalFooter.tsx` also listed `DIFC Gate Precinct 4, Dubai` and `Tea Building, Shoreditch, London`.
  - The user explicitly clarified: *"there was only kozhikode and trivandrum right .. i told you only to use the content data that we had before right"*.
  - Reference commit `7e5b006` (`ContactCtaSection.tsx`) verifies that Marca Ubi operates exclusively from Kerala studios:
    1. **Kozhikode**: HiLITE Business Park, Kozhikode, Kerala 673014 (Maps link: `https://www.google.com/maps/search/?api=1&query=HiLITE+Business+Park%2C+Kozhikode`)
    2. **Trivandrum**: Creative Studio, Trivandrum, Kerala (Maps link: `https://www.google.com/maps/search/?api=1&query=Trivandrum%2C+Kerala`)
- **The Architectural Solution**:
  1. **Purge Synthetic Hubs**: Eliminate Dubai, London, Bengaluru, New York, Singapore, Tokyo, Los Angeles, and their foreign timezones from all client views.
  2. **Refactor View 09 to Kerala Studio Corridors**:
     - Headline: `07 / Studio Corridors`.
     - Broadsheet Typography: Monumental duo `Kozhikode / Trivandrum` in `clamp(2.5rem, 6vw, 5.5rem)`, 700 weight, linked directly to their authentic Google Maps locations.
     - Operational Rail: Authentic Kerala context with live IST clock (`IST UTC+05:30`), studio status, and direct addresses:
       `IST 23:25 • Calicut (CCJ) HiLITE Business Park • Trivandrum (TRV) Creative Studio • Mon–Fri 09:30–18:30 IST`.
  3. **Clean Up `MonumentalFooter.tsx`**: Restrict Column 04 to HiLITE Business Park Calicut & Trivandrum Studio only.
  4. **Align `layout.tsx` & `privacy/page.tsx`**: Remove Dubai/London metadata, anchoring schema and legal text strictly to Kozhikode & Trivandrum.

---

## 2. The Complete 11-View Alternating Flagship Homepage Architecture

The redesigned flagship experience integrates 100% authentic production content into an 11-view alternating rhythm:

```
+=====================================================================================+
| FIXED BACKGROUND LAYER: BackgroundVideoEngine (z-index: -1, GPU accelerated, loop)  |
| FIXED DYNAMIC HUD:      ClientHeader (z-index: 50, IntersectionObserver theme flip) |
+=====================================================================================+
| [VIEW 01] HERO CUTOUT (Transparent Video Viewport)                                  |
|   - Living background video running beneath monumental headline.                    |
|   - Headline: "Engineering Brands That Move The World."                             |
|   - Kicker: "00 / STRATEGIC BRAND ARCHITECTURE"                                     |
|   - Action: [ Explore Selected Work -> ] (Architectural high-contrast rectangular)  |
+-------------------------------------------------------------------------------------+
| [VIEW 02] ABOUT & DOCTRINE CURTAIN (Solid Pure White #ffffff Curtain)              |
|   - Left Rail (30%): "01 / ABOUT & DOCTRINE", Direct Action to /start-project       |
|   - Right Rail (70%):                                                               |
|     * Statement Headline: "We live at the collision of culture and commerce..."     |
|     * Production Doctrine: "Marca Ubi brings together brand engineering..."         |
|     * 4 Core Services: Brand Engineering / Identity Systems / Digital / Comm        |
|     * 4 Metric Odometers: 100+ Brands / 12+ Services / 3* Disciplines / 360° Scope  |
+-------------------------------------------------------------------------------------+
| [VIEW 03] SHOWREEL CUTOUT (Transparent Video Viewport)                              |
|   - Living background video re-exposed with dark cinematic scrim.                   |
|   - Headline: "Everything you expect. A few things you don't."                      |
|   - Action: [ Play Showreel ] (Opens accessible ReelModal; pauses video engine)     |
+-------------------------------------------------------------------------------------+
| [VIEW 04] CURATED WORKS SHOWCASE CURTAIN (Solid Pure White #ffffff Curtain)         |
|   - Dynamic Sanity CMS GROQ Data (worksQuery fetching real client portfolio)        |
|   - Left Rail (30%): "02 / SELECTED WORK", Total Index Count, Discipline Filters    |
|   - Right Rail (70%): Broadsheet Case Study Showcase:                               |
|     * 16:9 full-bleed imagery with Sanity CDN optimization                          |
|     * Monolithic client titles, discipline scopes                                   |
|     * Direct links: [ Case Study -> ] and external project launcher                 |
+-------------------------------------------------------------------------------------+
| [VIEW 05] GUIDING VALUES & PHILOSOPHY CUTOUT (Transparent Video Viewport)           |
|   - Living background video running beneath floating glass fluid cards.             |
|   - Kicker: "03 / GUIDING PRINCIPLES"                                               |
|   - Headline: "What Shapes The Way We Build"                                        |
|   - 4 Architectural Glass Cards:                                                    |
|     01 Thought Before Form | 02 Art With Intention                                  |
|     03 Experiences That Pull People In | 04 Built, Not Improvised                   |
+-------------------------------------------------------------------------------------+
| [VIEW 06] STRATEGY & METHODOLOGY CURTAIN (Solid Pure White #ffffff Curtain)         |
|   - Left Rail (30%): "04 / METHODOLOGY", "Systems Over Isolated Outputs"            |
|   - Right Rail (70%):                                                               |
|     * 12 Practice Areas kinetic typographic cloud (NO AI-slop pills)                |
|     * 4-Phase Delivery Process: Discovery -> Strategy -> Design -> Launch           |
+-------------------------------------------------------------------------------------+
| [VIEW 07] CLIENT EVIDENCE & TESTIMONIALS CUTOUT (Transparent Video Viewport)        |
|   - Living background video running beneath monumental quote layout.                |
|   - Kicker: "05 / VALIDATION"                                                       |
|   - Headline: "What Clients Value After Working With Marca Ubi"                     |
|   - Partner feedback block with executive attribution & verification                |
+-------------------------------------------------------------------------------------+
| [VIEW 08] STUDIO DISPATCHES & BLOG INSIGHTS CURTAIN (Solid Pure White #ffffff)      |
|   - Dynamic Sanity CMS GROQ Data (postsQuery fetching latest 3 articles)            |
|   - Left Rail (30%): "06 / STUDIO DISPATCHES", Overview description                 |
|     Action: [ View All Dispatches -> ] linking to /blog                             |
|   - Right Rail (70%): 3-Column Editorial Broadsheet Grid:                           |
|     * Article covers with LQIP blur placeholders                                    |
|     * Publication dates, reading cadence (e.g. "5 MINUTE READ"), categories        |
|     * Typographic headline link with animated underline leading to /blog/[slug]     |
+-------------------------------------------------------------------------------------+
| [VIEW 09] KERALA STUDIO CORRIDORS CURTAIN (Solid Pure White #ffffff Curtain)       |
|   - Left Rail (30%): "07 / STUDIO CORRIDORS", Operating across Kerala               |
|   - Right Rail (70%):                                                               |
|     * Monumental duo typography: Kozhikode / Trivandrum                             |
|     * Interactive hover: reveals studio address & links to authentic Google Maps    |
|     * Operational Rail: Live IST time (UTC+05:30), CCJ / TRV codes, studio hours    |
|     * ZERO fake international cities (Dubai, London, NYC, Tokyo, etc. purged)       |
+-------------------------------------------------------------------------------------+
| [VIEW 10] CONNECT & COMMERCIAL DESK CUTOUT (Transparent Video Viewport)             |
|   - Living background video re-exposed with direct contact cluster.                 |
|   - Headline: "Let's Build Something That Holds."                                   |
|   - Real Desk Coordinates: +91 7012 052 472 / hello@marcaubi.com                    |
|   - Real Kerala Studios: Hilite Business Park (Calicut) & Trivandrum                |
|   - Action: [ Start a Project Brief -> ] linking to /start-project                  |
+-------------------------------------------------------------------------------------+
| [VIEW 11] MONUMENTAL OBSIDIAN FOOTER (Solid Pitch Black #000000 Anchor)             |
|   - Cultural Anthem: "Feel something. Do something."                                |
|   - Full-width vector brandmark with white letterforms and red accent #ea002a       |
|   - 4-Column Directory: Systems, Navigation, Direct Desks, Kerala Studio Corridors  |
|   - Tabular-nums copyright with links to /privacy, /terms, and /security            |
+=====================================================================================+
```

---

## 3. Dedicated Redesign Blueprint for `/blog` & `/blog/[slug]`

### 3.1 The `/blog` Listing Experience Redesign
- **Shell**: Wrapped in `[data-client-shell="true"]` with `ClientHeader` and `MonumentalFooter`.
- **Background**: Deep obsidian canvas (`#0b0b0b` / `#000000`) with crisp `#ffffff` typography.
- **Hero Header**:
  - Kicker: `STUDIO DISPATCHES & ARCHITECTURAL PAPERS` in `#ea002a` uppercase tracking `0.1em`.
  - Monumental Title: `Thinking in Systems.` (`clamp(3rem, 6vw, 6rem)`).
  - Editorial Subtext: High-conviction narrative on brand engineering, art systems, and cultural velocity.
- **Category Navigation (Zero Slop)**:
  - Clean Swiss typography tabs separated by hairline slashes:
    `ALL DISPATCHES / BRAND ARCHITECTURE / DIGITAL CRAFT / CULTURAL VELOCITY / STRATEGY`
  - Active category marked by a sharp $2\text{px}$ underline in authentic `#ea002a` (NO rounded background pills).
- **Featured Article Flagship**:
  - 60/40 asymmetric split card showcasing the latest featured essay with full-bleed cover, author byline, reading time (`tabular-nums`), and architectural link `Read Dispatch &rarr;`.
- **Editorial Dispatches Grid**:
  - 3-column broadsheet grid separated by hairline borders (`1px solid rgba(255, 255, 255, 0.08)`).
  - Hover states: Cover image expands smoothly (`scale: 1.03`), title illuminates, arrow shifts.

### 3.2 The `/blog/[slug]` Article Reader Experience Redesign
- **Shell**: Wrapped in `[data-client-shell="true"]` with `ClientHeader` and `MonumentalFooter`.
- **Header Stage**:
  - Kicker: `Category • Reading Time • Published Date` in letterspaced uppercase.
  - Monumental Article Title: `clamp(2.5rem, 5vw, 4.5rem)`, weight 700, letter-spacing `-0.035em`.
  - Author Dossier: Clean inline avatar, author name, and studio title (`Brand Technologist, Marca Ubi`).
- **Hero Visual**: Full-width cinematic banner ($21:9$ or $16:9$) with Sanity CDN blur LQIP placeholder.
- **Reading Canvas (Swiss 30/70 Asymmetric Layout)**:
  - **Left Rail (30% Sticky)**:
    - Table of Contents (`TableOfContents.tsx`): Minimalist list of H2/H3 headings with active progress indicator in `#ea002a`.
    - Social Share Rail (`SocialShareBar.tsx`): Clean text-based share triggers (`X`, `LinkedIn`, `Copy Link`).
  - **Right Rail (70% Reading Column)**:
    - Portable Text Renderer (`PortableTextRenderer.tsx` & `.module.scss`):
      * Body text in Circular XX Book (`18px`, line-height `1.75`, color `rgba(255, 255, 255, 0.88)`).
      * Editorial pull quotes with left border in `#ea002a` (`clamp(1.5rem, 2.5vw, 2.25rem)`).
      * Monospace code blocks with copy action.
- **Related Dispatches Section**: 3-column curated grid of adjacent essays before the footer.

---

## 4. Technical Implementation & Data Flow Architecture

### 4.1 Server Page Orchestration (`src/app/page.tsx`)
```typescript
import { client } from "@/sanity/lib/client";
import { worksQuery } from "@/sanity/lib/queries";
import { postsQuery } from "@/sanity/lib/blog-queries";
import type { SanityWork } from "@/app/components/WorksSection/WorksSectionClient";
import type { PostSummary } from "@/sanity/types/blog";
import ClientHomeExperience from "./components/ClientHomeExperience/ClientHomeExperience";

export const revalidate = 60; // 60-second ISR caching

export default async function Home() {
  let works: SanityWork[] = [];
  let posts: PostSummary[] = [];

  try {
    const [fetchedWorks, fetchedPosts] = await Promise.all([
      client.fetch<SanityWork[]>(worksQuery),
      client.fetch<PostSummary[]>(postsQuery),
    ]);
    works = fetchedWorks || [];
    posts = fetchedPosts || [];
  } catch (error) {
    console.error("Sanity data fetch error on flagship homepage:", error);
  }

  return <ClientHomeExperience works={works} posts={posts} />;
}
```

### 4.2 Studio Corridors Component (`GlobalLocationsCloud.tsx`)
```typescript
interface KeralaStudio {
  city: string;
  code: string;
  subdivision: string;
  address: string;
  mapsUrl: string;
}

const KERALA_STUDIOS: KeralaStudio[] = [
  {
    city: "Kozhikode",
    code: "CCJ",
    subdivision: "HiLITE Business Park",
    address: "HiLITE Business Park, Kozhikode, Kerala 673014",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=HiLITE+Business+Park%2C+Kozhikode",
  },
  {
    city: "Trivandrum",
    code: "TRV",
    subdivision: "Creative Studio",
    address: "Creative Studio, Trivandrum, Kerala",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Trivandrum%2C+Kerala",
  },
];
```

### 4.3 Monumental Footer Corridors Clean-up (`MonumentalFooter.tsx`)
- Restrict Column 04 strictly to:
  ```tsx
  <div className={styles.column}>
    <h3 className={styles.columnTitle}>04 / Studio Corridors</h3>
    <p className={styles.columnText}>
      Hilite Business Park, Hilite City, Calicut, Kerala 673014<br />
      Trivandrum Creative Studio, Kerala
    </p>
  </div>
  ```

---

## 5. Verification & Delivery Quality Gates

| Verification Gate | Validation Criteria | Verification Command |
| :--- | :--- | :--- |
| **Static Types** | 0 TypeScript errors across the entire codebase | `npx tsc --noEmit` |
| **Server Action Boundaries** | 50/50 actions compliant with Next.js App Router boundary invariants | `npm run test:boundaries` |
| **Platform Test Suite** | 100% pass rate on client platform test suite (verifying Kozhikode & Trivandrum; 0 fake hubs) | `npx tsx --test tests/client/client_160over90_platform.test.ts` |
| **Production Build** | 33/33 routes compiled cleanly with 0 build warnings | `npm run build` |
| **CRM Air-Gap Quarantine** | 0 files modified under `src/app/admin/`, tokens scoped to `:not([data-admin-root="true"])` | `git diff -- src/app/admin` |
| **Authentic Content Audit** | 0 mentions of Dubai, London, NYC, Tokyo, or Singapore in studio components | Automated grep check |
| **WCAG Contrast Ratios** | Text $\ge 4.5:1$ (AA) & $\ge 7:1$ (AAA); Brand red $\ge 4.5:1$ | Mathematical luminance verification |
| **Touch Target Bounds** | $\ge 44\text{px} \times 44\text{px}$ across all interactive controls | CSS layout inspection |

---

## 6. Execution Decision Gate

> [!IMPORTANT]
> In accordance with the **Strict Behavioral Rule** and **Critical Zero-Tolerance Addendum** in `AGENTS.md`, no code files will be modified, committed, or pushed until you explicitly review this updated plan and instruct the agent to proceed.

Please review this updated plan addressing the studio locations and reply with **"proceed"** or **"do it"** to begin execution.
