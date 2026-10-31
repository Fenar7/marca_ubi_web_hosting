# Phase 14: Blog Redesign — Homepage Dispatches, Listing & Article Detail (Plan)

Status: **EXECUTED (Phase 14, branch `feature/blog-redesign`).** All three surfaces
shipped: homepage broadsheet rail, light listing with URL-synced category filter, and
the light editorial article detail (sticky TOC rail, 72ch canon, drop cap, full
Portable Text coverage, hotspot-aware crops, lqip blur-ups). Evidence PNGs in this
folder. Remaining content task: swap the duplicate post-3 cover in Sanity Studio
(seed script already corrected for future re-seeds).

## 1. Verdict from research

The blog is the last dark surface in an otherwise light editorial stream. The
homepage dispatch rail is white, click through and `/blog` is obsidian
(`#0b0b0b`), and the article body inherits the same dark canvas. Beyond the
surface discontinuity, research found hard defects:

| # | Defect | Evidence |
| --- | --- | --- |
| D1 | Ragged card bottoms: titles unclamped, footer never anchors (`margin-top: auto` missing) | `DispatchesCurtain.module.scss:120-214`, `Blog.module.scss:311-395` |
| D2 | Cards 1 and 3 show the same building photo (seed assets `bg-cover-image-2.png` / `-3.png` are the same shot); one shared fallback constant in 4 places | `scripts/seed-sanity-blog.ts:62-65` |
| D3 | Nine Portable Text class names referenced with zero definitions: in-body images render as raw untransformed `<img>` (2.3 MB originals), code blocks unstyled, callout variants dead | `PortableTextRenderer.tsx:110-132` vs its SCSS |
| D4 | Article measure ~95-100 chars/line; title, cover and prose sit on three different left edges | `BlogPost.module.scss:61-233` |
| D5 | Weight chaos: 500 title / 700 H2 / 450 blockquote (a weight the font does not carry) | `BlogPost.module.scss:99`, `PortableTextRenderer.module.scss:15-84` |
| D6 | `hotspot` authored in Sanity but never fetched, so every cover is blind center-cropped; `alt`, `caption`, `lqip` fetched or authored but unused | `blog-queries.ts:13-24` |
| D7 | Filters are `useState`-only: no URL, no back button, no share; `featured` ignored on homepage; `noIndex` posts still listed | `BlogListingClient.tsx:37-47` |
| D8 | Contrast failures: `#666666` micro-labels on `#0b0b0b` (~4.2:1); zero `prefers-reduced-motion` guards in any blog file; TOC forces smooth scroll | `BlogPostComponents.module.scss:11-74` |
| D9 | `og:image` declares 1200×630 but serves the multi-MB original untransformed | `[slug]/page.tsx:71` |

## 2. Design direction

**One canvas, three surfaces.** All blog surfaces move to the light editorial
canon already proven on `/services/[slug]` and `/start-project`:

- Shell: `#ffffff`, ink `#0a0a0a`, `<ClientHeader defaultTheme="light" />`, `main data-header-theme="light"`, `MonumentalFooter` last.
- Container: 1680px, gutter `clamp(1.5rem, 6vw, 6rem)`, 1.25rem ≤768px.
- Type: Helvetica Thin/Light display headlines (`-0.03em`), Circular 400/500/700 only (no 600, no 450), mono 11px meta rows with `tabular-nums`, kicker 11px/0.12em uppercase `$client-accent-red`.
- Hairlines `rgba(0,0,0,0.08)`; radius 2px; zero drop shadows; zero legacy orange; motion `cubic-bezier(0.16,1,0.3,1)`; `prefers-reduced-motion` kill-blocks; focus-visible red 2px/4px.

### 2.1 Homepage "Thinking in Systems" rail (DispatchesCurtain)

Broadsheet composition replacing the three identical cards:

- Left rail (28fr, sticky): kicker "Studio Dispatches", Helvetica headline, summary, outline "View All Dispatches" button (existing idiom, 48px).
- Right (72fr): **one lead dispatch** (16/10 image, 21/11 on wide, title clamp(1.5rem,2.4vw,2.25rem), excerpt, mono meta row) above **two compact index rows** separated by hairlines: mono date + category left, title right, hover fills the row with `#fafafa` and slides the arrow. No images on index rows keeps the block calm and kills the duplicate-photo problem visually.
- Selection: `featured` post leads; two newest follow. Fallbacks become per-slot generated monogram frames, not one shared PNG.
- Card footers anchor with `margin-top: auto`; titles clamp to 3 lines; excerpts 2 lines; letterbox `#f0f0f0` (never black on white); `lqip` blur-up placeholder.

### 2.2 Listing `/blog`

- Light shell; hero: kicker + `Thinking in Systems.` extralight display + lede + post count (mono, tabular).
- Category rail: hairline top/bottom, zero pills, 2px red underline on active, **counts from `categoriesQuery`** (stop discarding `postCount`), zero-count categories stay visible but disabled, filter state synced to `?category=` via `useSearchParams` (shareable, back-button alive).
- Featured card: 58/42 split kept, re-coloured light, `hotspot`-aware crop.
- Grid: 3 columns aligned via the card fixes above; `sizes` corrected; authored `mainImage.alt` used; empty state restyled.
- `postsQuery` filters `seo.noIndex != true`.

### 2.3 Article `/blog/[slug]`

- Header band: breadcrumb (Home / Blog / Category), kicker, Helvetica Thin title clamp(2.25rem,5vw,4.5rem), standfirst 72ch, mono meta row (date · read time · Updated when `_updatedAt` differs), author line with 44px avatar.
- Cover: full-bleed 21/11 (4/3 mobile, same negative-margin arithmetic as service hero), caption right-aligned mono 11px muted.
- Reading grid: body column 72ch aligned to the same left edge as the header and cover; sticky left rail carries TOC (light re-colour, ≥4.5:1 labels) and share bar; `scroll-margin-top` kept.
- Body typography (the missing prose canon): 17px/1.75 Circular 400 `#333→#444` on white; lead paragraph 20px; H2 Helvetica 300 `clamp(1.5rem,2.6vw,2.25rem)`; H3 500; blockquote becomes the TestimonialsCutout pull-quote ( `#fbfbfb` block, 3px red left rule, 1.25-1.85rem/1.48); lists, inline code, links re-themed; `::first-letter` drop cap on the lead paragraph only, red, Helvetica Thin.
- Portable Text fixes: define all nine missing classes; body images go through `urlFor().width(1200)` + `next/image` with caption/alt; code blocks get a `#fafafa` frame, mono 13px, filename header; callout `note|principle|warning` variants defined; `underline` decorator mapped; single shared `slugify` (TOC + renderer import from one module).
- Related posts: same card anatomy as listing (currently inconsistent), `featured`-aware exclusion kept.
- Footer CTA: editorial `.ctaLink` row to `/start-project`.
- SEO: `og:image` built via `urlFor().width(1200).height(630)`; add `BreadcrumbList` JSON-LD; `wordCount`/`articleSection` on `BlogPosting`.

## 3. Data & platform changes

1. `blog-queries.ts`: fetch `hotspot`, stop selecting unused fields, add `noIndex` filter to `postsQuery`, homepage slice (3) server-side.
2. `types/blog.ts`: add `hotspot` to `SanityImageReference`.
3. Image pipeline: all card/hero/OG URLs get `urlFor(...).focalPoint(hotspot)`; `next.config.ts` qualities aligned (bake 75 or add 85/90 to allow-list).
4. Seed covers: replace the duplicate building PNG with a distinct asset and re-point post 3 (script change + note for live dataset; no silent runtime patching).

## 4. Non-negotiable gates (from tests + docs)

- Keep: `<DispatchesCurtain>` mounted on homepage, `postsQuery` + `revalidate = 60` in `page.tsx`, `data-header-theme="light"` on the curtain, `ClientHeader`+`MonumentalFooter` on both routes, zero `—` in `/blog` source copy, no `font-weight: 600`, no `9999px`, no `#2563eb`/`#ff6100`, tap targets ≥44px, `#ea002a` contrast ≥4.5:1.
- Copy: British spelling, banned vocabulary list, no numbered kickers.
- Every new SCSS file gets a `prefers-reduced-motion` block; TOC smooth scroll gated on the media query.

## 5. Execution team & order

| Phase | Work | Owner |
| --- | --- | --- |
| P1 | Queries/types/image pipeline + seed asset fix | Main agent |
| P2 | DispatchesCurtain redesign (TSX + SCSS) | UI subagent brief, main agent integrates |
| P3 | Listing redesign (BlogListingClient + Blog.module.scss) | UI subagent brief, main agent integrates |
| P4 | Article redesign (BlogPost + PortableTextRenderer + components SCSS/TSX) | UI subagent + main agent |
| P5 | SEO polish, tsc, browser click-through (desktop + mobile), evidence, PR left OPEN | Main agent |

Estimated touched files: ~16. No new routes, no Sanity schema migration required
(hotspot/featured already exist); author archives, tags, RSS and pagination are
explicitly out of scope.

## 6. Open questions (answer with the approval, or defaults apply)

1. Homepage rail composition: broadsheet lead + 2 hairline index rows (recommended) vs keep 3 image cards but fixed/aligned?
2. `/blog` hero: plain light typographic hero (recommended, matches services pages) or a 45vh video band like `/start-project`?
3. Drop cap on article lead paragraph: yes (recommended, adds publication character) or keep austere Swiss?
