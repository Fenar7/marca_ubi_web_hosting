# Phase 14b: Article Detail Width + Anti-Slop Pass (Plan)

Status: **AWAITING APPROVAL — no code written.**
Surface: `/blog/[slug]` only. The homepage rail and `/blog` listing are already
verified and are NOT in scope.

## 1. Measured evidence (Playwright, 1440x900, live dev server)

Container spans 1259px. Inside it:

| Zone | Measured | Verdict |
| --- | --- | --- |
| Left gutter | 277px (x 91 to x 368) | barren; carries only an occasional hanging numeral or one orphaned caption |
| Prose column | **621px** | 49% of the container, 43% of the viewport |
| Right rail | 302px | over-wide for what it holds |

So the page is not "wide editorial", it is a narrow column pushed right of centre
with a decorative void on its left. That is the width complaint, and it is real.

## 2. Slop inventory (each item verified in source, not inferred)

| # | Defect | Source evidence |
| --- | --- | --- |
| S1 | Share cluster rendered **twice** (8 buttons total): inline in the byline bar and stacked in the rail | `[slug]/page.tsx:353` and `:406` both mount `SocialShareBar` |
| S2 | Author identity rendered **three times**: byline bar, rail "Written by" mini-card, closing dossier | `page.tsx:335`, `:411`, dossier block |
| S3 | On-screen contradiction: `WORDS 151` sits under `READ TIME 6 min` in the same ledger. The word count is computed from the body, the read time is authored in Sanity, and for this post they disagree | `page.tsx:324-327`, `countBodyWords` at `:167` |
| S4 | Masthead ledger is 5 rows, two of which restate text already on screen (`SECTION` repeats the red kicker above the title; `PUBLISHED` repeats the byline date) | masthead spec list |
| S5 | `PROGRESS` label above a bare hairline that reads as a broken/empty widget | rail progress block |
| S6 | Two calls to action back to back: a lone "Start a conversation" link, then the full-width commissions banner | `page.tsx:454` + `BlogCtaBanner` |
| S7 | Figure caption orphaned and centred in the left gutter (`Fig 3.0 - Identity tokens...`), detached from its image | caption grid placement |
| S8 | Three identical bordered button boxes with generic verbs `Post` / `Share` / `Copy link` | rail stacked share variant |
| S9 | Masthead title capped at `20ch`, which opens a dead band between the title block and the right-hand ledger | masthead grid |

## 3. Design intent

Keep the three-zone editorial grid - it is the right archetype - but make every
zone earn its width, and let the *page* go wide where a page should go wide
(media, pull quotes, code) while only the *prose* stays at a reading measure.
A narrow measure inside a wide canvas is a choice only when the flanks are doing
work; today they are not.

## 4. Fix plan

### 4.1 Width utilisation
- Prose measure: `72ch` to `min(100%, 50rem)` targeting **720-780px at 1440**
  (currently 621px). Line length stays inside the 65-85ch legibility band.
- Left gutter: 277px to a **96px** hanging-numeral rail. Anything that cannot be
  populated on *every* article is deleted rather than left as an empty column.
- Right rail: 302px to **260px**.
- Full-container breakouts: figures, pull quotes, code blocks and callouts span
  the entire container (`grid-column: 1 / -1`), so the reading experience
  alternates measure and width the way print does. Breakouts are the single
  biggest lever on "uses the full width".
- Masthead: title measure 20ch to ~30ch so it meets the ledger instead of
  leaving a void; the ledger becomes a compact 2-row mono stack flush right with
  a hairline column rule.
- Cover: keep 21/9 but let it bleed to the container edge and align its caption
  under the prose column, left-aligned.

### 4.2 Slop removal (one keeper per function)
- **S1/S8**: one share affordance, in the rail only, restyled as a hairline
  text-link row (mono labels, red hover, 44px rows). No bordered boxes.
- **S2**: keep the masthead byline and the closing dossier; delete the rail
  "Written by" card.
- **S3/S4**: delete the `WORDS` and `SECTION` rows and the duplicated date.
  Ledger keeps `READ TIME` and `LAST REVISED` only (word count stays in JSON-LD,
  where it is machine-facing and cannot contradict anything on screen).
- **S5**: drop the `PROGRESS` label. The rule itself becomes a 2px red fill that
  visibly tracks scroll, with the rail's `CONTENTS` heading as its only label.
- **S6**: delete the standalone "Start a conversation" row; the commissions
  banner is the single closing CTA.
- **S7**: captions move directly beneath their figure, full container width,
  left-aligned mono `#666666`.

### 4.3 Verification gates (all must pass before this is called done)
- Prose column measures >= 720px at 1440 and >= 760px at 1680.
- `SocialShareBar` mount count on the page: exactly **1**.
- Author name rendered at most **2** times (byline + dossier).
- No visible element whose label contradicts its data (word count gone from UI).
- Zero horizontal overflow and correct degradation at 390 / 768 / 1024 / 1440 / 1680.
- `npx tsc --noEmit` clean; platform suite stays at 59 pass / 3 known pre-existing
  failures; forbidden-pattern grep (`600`, `9999px`, `#ff6100`, `#2563eb`,
  `box-shadow`, `&nearr;`) returns zero hits.
- Preserved without regression: `revalidate = 60`, `generateStaticParams`,
  `generateMetadata`, `notFound()`, `BreadcrumbList` + `BlogPosting` JSON-LD,
  shared `slugify` import, reduced-motion gates, the `{"\u2197"}` entity fix, the
  24h `Updated` gate, all nine Portable Text classes and the three callout variants.

## 5. Execution model

Parallel writes to one stylesheet caused the last round of drift, so this pass is
single-owner with an adversarial audit:

1. **Build agent** - sole owner of all eight article-surface files
   (`[slug]/page.tsx`, `[slug]/BlogPost.module.scss`, `PortableTextRenderer.tsx`
   + `.module.scss`, `TableOfContents.tsx`, `SocialShareBar.tsx`,
   `BlogCtaBanner.tsx`, `BlogPostComponents.module.scss`). Implements 4.1 + 4.2.
2. **Slop auditor** - read-only, independent, fresh eyes. Its brief is to hunt
   for duplication, decorative-but-empty widgets, contradictory data, and generic
   component chrome, and to return a numbered defect list the build agent must
   then clear. It edits nothing.
3. **Verifier** - Playwright geometry assertions plus screenshots at five widths.
4. **Me** - integration, gates, commit, push to `feature/blog-redesign` so PR
   #104 updates. The PR stays OPEN; no merge.

Estimated: one build pass, one audit round, one fix round.
