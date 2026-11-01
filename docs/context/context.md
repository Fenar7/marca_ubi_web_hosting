# Full Engineering Context Register — Latest Active Context

> **Start here.** This is the live pointer file; the detail lives in the linked register.
> Any agent (human or AI) opening this project should read this file first, then the register.

**Recorded At:** `2026-11-01T19:45:56+05:30`
**Current Branch:** `feature/blog-redesign` (pushed, in sync with origin)
**Base Branch:** `master`
**Latest Commit On Branch:** `22d9713` — *Phase 14d.2: Drop the article type scale to a clean reading size*
**Open Pull Request:** [#104 — OPEN, MERGEABLE, must stay OPEN](https://github.com/Fenar7/marca_ubi_web_hosting/pull/104)
**PR Title:** `Phase 14: Blog redesign - homepage dispatch rail, listing, and article detail`
**Author Identity:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`
**TypeScript Status:** `0 errors` (`npx tsc --noEmit`)

---

## 1. Active work: Phase 14 — blog redesign

Three surfaces rebuilt to the light editorial canon: the homepage **Journal** rail, the
`/blog` listing (masthead + index ledger), and the `/blog/[slug]` article. Five rejection
rounds (14 → 14a → 14b/14c → 14d → 14d.1 → 14d.2) all on the article surface, all about the
same thing: reserved-but-empty space.

**The rule that ended the argument:** the reading column *is* the measure. No `max-width` cap
on prose, and normal type (16-18px body). Do not restore a 65-85ch measure and do not inflate
the type to fill the width — both were tried and both were rejected.

Full detail, including the geometry values, the naming table, the traps already paid for
(sticky containing blocks, `&nearr;`, lqip gating, Sanity field nullability), the verification
protocol this user permits, open content items, and the file-ownership map for parallel work:
👉 [`docs/context/2026-11-01_19-45-56.md`](./2026-11-01_19-45-56.md)

Feature plans and the audit tables live in [`docs/blog_redesign/`](../blog_redesign/plan.md).

---

## 2. Previous phases (merged to `master`)

1. **Phase 8 (PR #98 - Merged):** Pentagram header dual-slot vertical aperture alignment, 0ms background video poster crossfade.
2. **Phase 9 (PR #99 - Merged):** Services Accordion horizontal hover expansion engine with video loop playback.
3. **Phase 10 (PR #100 - Merged):** GSAP fluid motion (`power3.out`), clear aperture dual-zone scrim, responsive mobile touch architecture.
4. **Phase 11 (PR #101 - Merged):** White-curtain title contrast, 16 resting cards at 2400px, Card 08 media swap, H.264 faststart loops with zero-jump WebP posters.
5. **Phase 12 (PR #102 - Merged):** 16 `/services/[slug]` detail pages, light editorial theme, deep-linked accordion bullets.
6. **Phase 13 (PR #103 - Merged):** `/start-project` rebuilt as a light page under a cinematic video hero; brief popup retired in favour of the dedicated intake route.
