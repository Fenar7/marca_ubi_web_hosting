# Phase 14b: Article Detail Width + Anti-Slop Pass (Plan)

Status: **EXECUTING** - build pass in flight (S1-S9 + 4.1), audit round landed
(§5), verification pending.
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

## 5. Independent audit round (A1-A10, second fix pass)

A read-only auditor judged the surface against the accepted `/blog` listing and
returned ten defects beyond S1-S9. Verdict: the listing treats every figure as
live archive truth and never repeats an item, while the article decorates with a
sticky rail that re-shows content already on the page.

| # | Defect | Keeper rule |
| --- | --- | --- |
| A1 | Rail "Next dispatch" is `relatedPosts[0]`, which the bottom ledger also renders - same title, excerpt and meta twice | Ledger maps `relatedPosts.slice(1)`; the rail keeps only genuinely additive content |
| A2 | Inline share variant prints a `Share` label next to a button also called `Share` | Label renders in one variant only; the LinkedIn action is labelled by its brand |
| A3 | Dates mix `en-US` + upper-cased ledger text against the listing's `en-GB` sentence case, and the page's own word count uses `en-GB` | One locale, one case: `en-GB`, sentence case, site-wide |
| A4 | Two `/start-project` CTAs stacked under different labels, plus an `Explore` verb repeated in the banner and the "Explore All" link | One `/start-project` link, one `Explore` verb |
| A5 | `related.estimatedReadingTime \|\| 4` invents a read time - `PostSummary` carries no body, so the number cannot be substantiated | Omit the duration cell when the field is absent (R-17) |
| A6 | Breadcrumb ends on the category with `aria-current="page"`, so it never names the current page and repeats the kicker | Terminal crumb is the article title, plain text |
| A7 | `<dt>Revised</dt><dd>Updated Oct 31, 2026</dd>` - label and value say the same thing | Value is the bare date |
| A8 | Callout falls back to a fabricated "Studio Insight" heading and mounts a decorative dot that carries no data | Header renders only when the editor supplied a title |
| A9 | `charAt(0).toUpperCase()` produces "Linkedin" / "Twitter" | Brand-correct labels ("LinkedIn", "X") |
| A10 | Cover caption right-aligns inside the narrow reading band while the image spans the container, so its edge hangs mid-image | No-gutter caption aligns to the cover's own edge |

Gates for this round: A1-A10 cleared, the S1-S7 and 4.1 gates still hold, and no
rail block re-renders data already present in the body.

## 6. Execution model

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

## 7. Round 14d - the numeral rail is gone, the prose takes its width

Reported from two screenshots of the live article at 1440.

| # | Defect | Fix |
|---|--------|-----|
| D1 | A 96px hanging rail + 57.6px gap reserved 153px of empty gutter on the left of the prose purely to carry `01`/`02` section counters - numbers that restate what the heading already says | Rail deleted end to end: `--numeral-w`, `--bleed`, `.readingGridGutter`, `.heroCaptionBandGutter`, the CSS counters, `.heading2::before`, `hasSectionNumerals()` and `marginaliaGutter` |
| D2 | Text held 720px inside a 949px reading column, so ~230px of dead space sat between the prose and the right rail | Prose steps 17px to 20px (21px above 1500px, 18px on tablet, 17px on phones) and `--measure` is derived from it: `calc(var(--prose-size) * 42.3)` = 85 characters = 846px at 1440 |
| D3 | Breakout widths were expressed as `calc(100% + var(--bleed))`, meaningless once nothing bleeds | Breakout rule deleted; figures, pull quotes and code simply fill the column |
| D4 | A per-element `ch` cap would resolve against each element's own font size, putting headings, callouts and the mono caption on three different right edges | One shared absolute length, consumed as `min(100%, var(--measure))` |
| D5 | Callout body ran 15px absolute inside a paragraph-width card: ~106 characters | `font-size: 0.95em`, so the note tracks the prose and holds the same band |
| D6 | `data-variant` on every callout was a hook no stylesheet read any more, with a comment claiming gutter rules that no longer exist | Attribute and both stale comments removed |
| D7 | Share rows were text links only; the rail read as a plain `<ul>` | Real X and LinkedIn marks (path data copied from simple-icons, `currentColor`, no brand colour) plus a neutral chain glyph for copy, each paired with its mono label; 44px contiguous tap targets, hairline dividers dropped |
| D8 | `variant="inline"` existed on the share bar with no mount, and the tablet strip already flattened rows through `[data-share-variant]` | Prop and `.shareBarInline` deleted; the rail mount is the only state |
| D9 | `.listItem` pinned 17px against 20px paragraphs | Inherits the prose size; leading 1.75 to 1.65 for the wider measure |

Kept deliberately: the `01`/`02`/`03` in the "More from the journal" ledger at the
foot of the page. That numbers a list of three different articles and mirrors the
index ledger on `/blog`; the deleted numerals counted sections inside one article,
which nothing reads as data.

Gates: `npx tsc --noEmit` exit 0, no `numeral`/`bleed`/`Gutter` symbol left in the
article surface, and no new build, dev server or browser run - the owner asked for
none.
