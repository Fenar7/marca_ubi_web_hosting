# Phase 14c: Homepage rail sticky pin + "Dispatch" wording (Plan)

Status: **decisions locked (Journal; both surfaces, one push) - awaiting an
explicit "proceed" before any code is written.**
Surface: the homepage blog teaser (`#dispatches`) and the `/blog` + article
vocabulary it shares. Nothing else.

## 1. Sticky rail: measured root cause

The sticky rule is already in the CSS and is *not* the problem. It is being
defeated by geometry. Measured in headless Chrome at 1440x900 on the live dev
server, scrolling 700px down through the section:

| Measurement | Value |
| --- | --- |
| `.stickyRail` computed `position` | `sticky` (correct) |
| `.stickyRail` computed `top` | `162px` (correct) |
| `.leftColumn` height (the sticky element's containing block) | **395px** |
| `.stickyRail` height | **395px** |
| `.rightColumn` height (the card stack) | **2226px** |
| Section height | 2485px |
| Rail movement over a 700px scroll | **-700px (moves 1:1, never pins)** |
| Ancestors with a scroll-container-forming `overflow` | none (`html`/`body` use `overflow-x: clip`, which is sticky-safe) |

So the rail has exactly **zero travel room**: its containing block is the same
395px tall as it is. `position: sticky` is legal, computed, and inert.

The cause is [DispatchesCurtain.module.scss:32](../../src/app/components/Sections/DispatchesCurtain.module.scss) -
`.gridContainer { align-items: start }` sizes the grid *item* (`.leftColumn`) to
its own content instead of to the row, and the sticky declaration sits one level
*deeper* on `.stickyRail`. A sticky element is confined to its containing block,
and here that block collapses to the element's own height.

The fix is one of two, both ~3 lines:

- **(a) Move sticky onto the grid item.** `position: sticky; top: ...` goes from
  `.stickyRail` to `.leftColumn`. A sticky *grid item* is confined by its grid
  **area**, which spans the full 2485px row, so it gains ~2090px of travel.
  Keeps `align-items: start`, no wrapper changes. **Recommended.**
- (b) Leave sticky where it is and give `.leftColumn { align-self: stretch }` so
  the wrapper has room inside it. Works, but the column then carries a 395px
  block of dead space below the rail in the layout box.

Either way the existing `position: static` override at the <=1024px breakpoint
must move with the declaration, or the mobile rule stops matching.

Secondary, and it matters: a 395px rail pinned at `top: 162px` against a 2226px
card stack means the rail sits alone in whitespace for the last ~1600px of the
section. Pinning is what the owner asked for, so the plan does it - but the rail
copy is also being rewritten shorter/longer, so `top` gets re-measured after the
copy lands rather than tuned twice.

## 2. Wording: what is actually wrong (all strings verified in source)

**W1 - the homepage rail and the `/blog` page are the same text.** Kicker
"Studio Dispatches" and headline "Thinking in Systems." appear on both
(`DispatchesCurtain.tsx:63-64` and `BlogListingClient.tsx:171-172`). The teaser
and its destination introduce themselves identically, so the rail adds nothing.
The two standfirsts differ in wording but open the same way and both end "filed
from / from the Marca Ubi studio floor".

**W2 - "dispatch" is doing three different jobs at once.** Section name
(`STUDIO DISPATCHES`), per-item noun (`Read dispatch`, `Featured dispatch`,
`Read full dispatch`, `Related Dispatches`) and a count (`04 / Dispatches`).
`04 / Dispatches` does not say whether 04 is how many posts exist or which
section this is - it is the former, which is not guessable.

**W3 - "dispatch" is not the word the rest of the site uses for writing,** and it
*is* the word the CRM uses for sending alerts (`proposal dispatched`,
`Alert Dispatch`). Same token, two meanings in one product.

**W4 - reading time is presented five different ways** across the three blog
surfaces: `?? 4` + uppercase `MIN READ` on the rail, `|| 5` + `min read` on the
featured card, `min read` on listing rows, `min` in the article ledger, and a
computed value in the article masthead. The `?? 4` / `|| 5` fallbacks are
invented numbers on rows that carry no body text to measure.

**W5 - the rail dates in `en-US` ("Oct 12, 2026")** while `/blog` and, as of this
session, the article page all use `en-GB` ("12 Oct 2026"). Same content, two
locales on two adjacent surfaces.

**W6 - the word "curated" is live in production copy** on `/works`
(`WorksCurtain.tsx:68`, `works/page.tsx:17,25`, `WorksSectionClient.tsx:223`).
Not this surface, so not in this plan's scope - flagged because it is a banned
word sitting in shipped text.

## 3. Naming decision - **RESOLVED: "Journal"**

Owner chose scheme **B. Journal**. Locked vocabulary, one word used only for the
section and never as the noun for an individual post:

| Slot | Before | After |
| --- | --- | --- |
| Rail kicker | `Studio Dispatches` | `Journal` |
| Rail headline | `Thinking in Systems.` | `Thinking in Systems.` stays on `/blog`; the rail takes its own line so the teaser stops restating the archive `<h1>` (W1) |
| Rail meta row | `04 / Dispatches` | `04 entries` |
| Rail button | `View All Dispatches` | `Read the journal` |
| Card footer | `Read dispatch` | `Read` |
| Rail empty state | `New dispatches are being drafted.` | `New entries are being drafted.` |
| `/blog` kicker | `Studio Dispatches` | `Journal` |
| `/blog` ledger label | `Dispatches` | `Entries` |
| `/blog` "All" tab | `All dispatches` | `All entries` |
| `/blog` featured | `Featured dispatch` (x2) | `Featured` |
| `/blog` featured CTA | `Read full dispatch` | `Read the full entry` |
| `/blog` index aria | `Dispatch index` | `Journal index` |
| `/blog` empty | `No dispatches filed under this category yet.` | `Nothing filed under this category yet.` |
| `/blog` empty CTA | `View all dispatches` | `Read the journal` |
| Article section heading | `Related Dispatches` | `More from the journal` |
| Article "all" link | `All Dispatches` | `All entries` |

`id="dispatches"` on the section is **kept** (external deep links may target it)
with a comment saying why it is not renamed, and the `aria-label` on the section
becomes `Journal`.

Research that informed this: Pentagram uses **News**, Collins **Arts & Culture**,
Stink Studios **News**, Basic **Thinking**, DEPT **Insights**; no comparable
studio was found using **Dispatches**. `Journal` was accepted as a judgement call
(implies a dated log) rather than a verified industry norm.

## 4. Fix plan

1. Sticky: option (a) above; move the `<=1024px` `position: static` override with
   it; re-measure `top` after copy lands.
2. Rename to the chosen scheme across all three surfaces, one word, section-only
   usage. Kill the noun use of the section name on cards and rows.
3. Rail gets its own headline so it stops duplicating `/blog`'s `<h1>`; `/blog`
   keeps "Thinking in Systems." as the archive title.
4. Meta row becomes unambiguous: `04 essays` (count + what is counted), not
   `04 / Dispatches`.
5. One reading-time format everywhere: lowercase `min read`, computed from the
   body where a body exists, and **omitted entirely** where it does not (rail and
   listing rows have no body to measure, so the `?? 4` / `|| 5` fallbacks go).
6. Rail dates switch to `en-GB`, matching the surfaces beside it.
7. Delete the now-unused `.railNext*` rules left in `BlogPost.module.scss` from
   the component removed earlier in this session.

## 5. Gates

- Rail `top` delta over a 700px scroll inside the section is within 8px of the
  pinned value (measured the same way as §1, before/after).
- No ancestor of `.stickyRail` gains a scroll-forming `overflow`.
- Zero user-facing occurrences of the replaced word on the three surfaces (grep).
- One reading-time format, zero invented durations on body-less rows.
- One date locale site-wide on blog surfaces.
- `tsc --noEmit` clean; platform suite holds at 59 pass / 3 known pre-existing
  failures; forbidden-pattern grep (`#ff6100`, `#2563eb`, `box-shadow`,
  `font-weight: 600`, `9999px`, `&nearr;`) returns zero hits.
- No horizontal overflow at 390 / 768 / 1024 / 1440 / 1680, and the rail is
  `position: static` below 1024px.

## 6. Delivery decision - **RESOLVED: both surfaces, one push**

Owner chose to land the article fix and this rail work together in a single
commit on `feature/blog-redesign`, so PR #104 updates once.

The article pass from earlier in this session is applied in the working tree but
uncommitted, and carries two open blockers that this combined push must clear:

- **Prose measure was dropped.** The body column measures ~1066px at 1440 and
  ~1075px at 1680, which is roughly 90-character lines - outside the 65-85ch
  legibility band and past this plan's own 720-780px gate. The full-container
  breakout for figures, pull quotes, code and callouts is correct and stays; the
  *paragraph* run needs its measure cap restored.
- Dead `.railNext*` rules remain in `BlogPost.module.scss` for the rail component
  deleted this session (plan item 7).

One copy choice is still open and does not block the rest: with
"Thinking in Systems." reserved for the `/blog` `<h1>`, the rail needs its own
headline. Proposed default, to be replaced on request: **"From the studio
floor."** It is plain, matches the British editorial tone, and does not repeat
the archive title.
