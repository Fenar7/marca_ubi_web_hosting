# Services Detail Pages — Implementation Plan (Phase 12)

**Recorded At:** `2026-10-31 IST`
**Status:** EXECUTED on branch `feature/services-detail-pages` — 16 pages live in dev, 0 type errors, deep-link journey browser-verified. PR left OPEN for manual merge.
**Author Identity:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`

---

## 1. Objective

Every one of the **16 accordion services** (8 B2B + 8 B2C) gets a **dedicated detail page**. The sub-items listed under "WHAT WE DO" inside each expanded accordion card become **clickable links** that navigate to the parent service's detail page and auto-open the matching sub-service entry in a "+/−" content accordion.

**Clarification locked from the brief:** detail pages exist **per service** (Demand Generation, Integrated Marketing, …) — NOT per sub-item. Sub-items are accordion sections *inside* the service page.

## 2. Reference Structure (from attached screenshots)

```
Home / Services / {Service Name}          ← breadcrumb
{Service Name}                            ← large editorial title
{Short description paragraph}             ← 2–3 line summary
{Full-width hero image}                   ← 2400px editorial still
What we do                                ← section heading
────────────────────────────────────────
{Sub-service 1}                      +    ← collapsed row
────────────────────────────────────────
{Sub-service 2}                      +    ← collapsed row
────────────────────────────────────────
… (5 rows per service)
```

When a row is clicked it expands in place (accordion, one-open-at-a-time) replacing `+` with `−` and revealing 2–3 paragraphs of expert-written content for that sub-service.

## 3. URL & Routing Architecture

| Item | Decision |
|---|---|
| Route | `src/app/services/[slug]/page.tsx` (dynamic segment + `generateStaticParams` → 16 fully static pages) |
| Slugs | `demand-generation`, `integrated-marketing`, `corporate-communications`, `social-influencer-marketing`, `content-and-scale`, `public-relations-pr`, `customer-marketing`, `account-based-marketing`, `integrated-creativity`, `social-influencer`, `digital-performance`, `sports-marketing`, `crm-and-loyalty`, `public-relations`, `live-experiences`, `retail-activation` |
| Deep link | `/services/demand-generation#paid-media-strategy` → page loads, that accordion row is pre-expanded and scrolled into view |
| Legacy guard | Unknown slug → `notFound()` via existing `not-found.tsx` |
| Sitemap | Add all 16 URLs to `src/app/sitemap.ts` |
| Metadata | Per-page `generateMetadata` (title, description, OG image = hero) |

## 4. Data Architecture

New content module (kept beside the route, typed, single source of truth):

```
src/app/services/
├── content.ts                  # ServiceDetailContent[] — all 16 pages
└── [slug]/
    ├── page.tsx                # server component: metadata + composition
    ├── ServiceDetailPage.module.scss
    └── ServiceDetailClient.tsx # "What we do" accordion (client island: expansion + hash sync)
```

Type contract (extends, does not break, existing `ServicesAccordion/types.ts`):

```ts
interface SubServiceDoc {
  key: string;        // kebab id → hash anchor, e.g. "paid-media-strategy"
  label: string;      // row title
  summary: string;    // 1-line lead shown at top of expanded body
  body: string[];     // 2–3 expert paragraphs
}
interface ServiceDetailContent {
  slug: string;
  sourceId: string;   // links back to accordion id ("b2b-demand-generation")
  category: "B2B" | "B2C";
  number: string;
  title: string;
  breadcrumbLabel: string;
  shortDescription: string;   // reuse/refine accordion desc
  heroImageUrl: string;       // NEW curated 2400px image (distinct from card image)
  heroAlt: string;
  subServices: SubServiceDoc[]; // exactly the 5 items already in the accordion
}
```

`ServicesAccordion/types.ts` gains only a `slug` field per service so the card bullets can link.

## 5. Accordion Card Changes (homepage)

In `ServicesAccordion.tsx` the `<li key={item}>{item}</li>` list becomes:

```tsx
<li><Link href={`/services/${service.slug}#${kebab(item)}`}>{item}</Link></li>
```

- Whole expanded card title also links to `/services/{slug}` (no hash) via the existing `cardTrigger` region — kept as a separate, clearly-hit-tested link so hover-expansion keyboard semantics are untouched.
- Mobile (<768px): bullets remain tappable links inside the scroll-snap strip.
- No change to GSAP/flex expansion, video lifecycle, or scrim architecture.

## 6. Visual Design Contract (Marca Ubi standard)

**Open decision — default applied unless you say otherwise:**
Detail pages render on the **light editorial canvas** (`#ffffff` curtain, `$client-text-dark` #0a0a0a, `#ff6100` accent) to stay visually continuous with the Services section (which lives inside the white `AboutCurtain`) and to match the reference screenshots. Dark-luxury treatment reserved for the existing dark sections.

- Typography: Neue Haas, `clamp()` editorial scale, `-0.03em` tracking on the H1 — mirrors `.sectionTitle` from Phase 11 fix.
- Breadcrumb: 12–13px, `rgba(0,0,0,0.55)` (≥7:1 on white), `/` separators, live links Home → Services anchor.
- Hero image: full-bleed within content max-width, 21:9-ish crop, `next/image` with `priority`, 2400px source, `q=85`.
- "What we do" rows: hairline `rgba(0,0,0,0.08)` dividers, `+`/`−` icon rotates 45° with `power3.out` 400ms (same easing language as the accordion engine), height animates via GSAP or grid-template-rows (no layout thrash), respects `prefers-reduced-motion`.
- Contrast: WCAG AAA for body text, AA minimum for all interactive states; verified via `antislop-human`.
- Zero-tolerance: no drop shadows, no generic blue, no stock-y icon boxes, no centered hero-with-CTA-pair slop.
- Footer/header: reuse existing site chrome (sticky liquid-glass header + existing footer).
- Bottom of page: single editorial CTA row → `/start-project` ("Brief us on {service}").

## 7. Content Production (subagent crew — the big lift)

**Volume:** 16 service intros + **80 sub-service documents** (16 × 5), each = 1 summary line + 2–3 substantive paragraphs (~120–180 words). Total ≈ 15–18k words of original agency copy.

| Subagent | Role | Output |
|---|---|---|
| Content Strategist (writer A) | B2B 8 services × 5 sub-items | Copy deck for `docs/services_detail_pages/content/b2b.md` |
| Content Strategist (writer B) | B2C 8 services × 5 sub-items | Copy deck `.../content/b2c.md` |
| Visual Director | Source 16 hero images (Unsplash, 2400px, `auto=format&q=85`), one per service, distinct from the 16 card stills, matching each service narrative | Image table with URLs + alt text |
| Copy Editor | Anti-slop pass over both decks (no "leverage/unlock/delve", no rule-of-three cadence overload, British spelling to match existing copy: "optimisation", "personalised") | Finalized `content.ts` payloads |

Voice: confident enterprise agency, declarative, specific deliverables and mechanisms (how we work), never generic marketing filler. Each sub-service body must state: what it is, how Marca Ubi executes it, what the client gets.

## 8. Delivery Phases

1. **P12-A — Plan approval** (this document) → you say proceed.
2. **P12-B — Content & imagery production:** spawn writer subagents + visual director; assemble `content.ts` data; PRD/copy decks land in `docs/services_detail_pages/content/`.
3. **P12-C — Route & page engine:** `content.ts` types, `[slug]/page.tsx`, metadata, `generateStaticParams`, `notFound`, sitemap entries.
4. **P12-D — UI build:** breadcrumb/title/description/hero layout, "What we do" accordion client island with hash deep-linking, mobile reflow, reduced-motion.
5. **P12-E — Accordion card wiring:** `slug` field + `Link` bullets in `ServicesAccordion.tsx` + SCSS hover/visited states.
6. **P12-F — Verification gate:** `tsc --noEmit` = 0 errors; dev-server click-through of all 16 pages + 80 anchors (R-35 smoke evidence); contrast audit; branch `feature/services-detail-pages`, PR with descriptive title (never "feat"), **PR left OPEN for your manual merge**.

## 9. Files Touched Summary

- **New:** `src/app/services/` tree (content module, dynamic route, SCSS, client island), `docs/services_detail_pages/` register + content decks
- **Modified:** `src/app/components/Sections/ServicesAccordion/types.ts` (+`slug`), `ServicesAccordion.tsx` (link bullets), `ServicesAccordion.module.scss` (link states), `src/app/sitemap.ts`
- **Untouched:** accordion expansion engine, video pipeline, header/curtain sections, all existing media assets

## 10. Open Decisions (defaults applied if you don't override)

1. **Theme:** light editorial (recommended, matches screenshots + curtain context) vs dark luxury.
2. **Hero images:** fresh 16 sourced stills (recommended) vs reuse existing card images.
3. **CTA at page bottom:** single "Brief us" row (recommended) vs none.
4. **Card bullets:** every bullet links to parent page anchor (recommended, per your brief) vs only card title links.
