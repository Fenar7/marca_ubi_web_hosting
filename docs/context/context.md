# Full Engineering Context Register — Latest Active Context

> **Start here.** This is the live pointer file; the detail lives in the linked register.
> Any agent (human or AI) opening this project should read this file first, then the register.

**Recorded At:** `2026-11-01T23:57:33+05:30`
**Current Branch:** `feature/chat-pod` (cut from `master`, work uncommitted)
**Base Branch:** `master`
**Latest Commit On Branch:** `3f1318a` — *Merge pull request #104 (Phase 14 blog redesign)*, i.e. branch tip == `master`
**Open Pull Request:** none yet — Chat Pod PR to be opened from `feature/chat-pod`; it must stay OPEN
**Author Identity:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`
**TypeScript Status:** `0 errors` (`npx tsc --noEmit`)

---

## 1. Active work: Chat Pod (conversational intake assistant)

A site-wide `Ubi` pod: launcher + dialog, a server-compiled knowledge base matched client-side by a
deterministic 3-tier engine, and an 17-slot intake FSM that produces the *same* payload
`POST /api/sales-funnel/ingest` already accepts, so a pod lead lands in the CRM exactly like a form lead.

Plan, milestones, budgets and the delivery gate live in [`docs/chat_pod/`](../chat_pod/06-implementation-milestones.md).
Gate evidence: [`docs/chat_pod/07-delivery-gate-and-verification.md`](../chat_pod/07-delivery-gate-and-verification.md).

What a new session needs before touching it — owned files, the six closed decisions (D1 intake reuses the
live ingest pipeline, D2 name `Ubi`, D3 no face, D4 branch, D5 idle nudge, D6 analytics deferred), the nine
traps already paid for (the 4.29:1 accent-on-tint failure, hashed CSS-module class names are not selectors,
the chip stagger makes axe cry, `FloatingExploreButton` is unmounted on this branch, the launcher cannot be
`aria-label`ed and stay SC 2.5.3-clean), the exact verification protocol this user permits, and the open
items:
👉 [`docs/context/2026-11-01_23-39-48.md`](./2026-11-01_23-39-48.md)

---

## 2. Previous phases

1. **Phase 14 (PR #104 - Merged `3f1318a`):** Blog redesign — homepage **Journal** rail, `/blog` masthead +
   index ledger, `/blog/[slug]` article. Five rejection rounds, all about reserved-but-empty space.
   **The rule that ended the argument:** the reading column *is* the measure. No `max-width` cap on prose,
   normal type (16-18px body). Do not restore a 65-85ch measure and do not inflate the type — both tried,
   both rejected. Detail: [`docs/context/2026-11-01_19-45-56.md`](./2026-11-01_19-45-56.md); plans in
   [`docs/blog_redesign/`](../blog_redesign/plan.md).
2. **Phase 8 (PR #98 - Merged):** Pentagram header dual-slot vertical aperture alignment, 0ms background video poster crossfade.
3. **Phase 9 (PR #99 - Merged):** Services Accordion horizontal hover expansion engine with video loop playback.
4. **Phase 10 (PR #100 - Merged):** GSAP fluid motion (`power3.out`), clear aperture dual-zone scrim, responsive mobile touch architecture.
5. **Phase 11 (PR #101 - Merged):** White-curtain title contrast, 16 resting cards at 2400px, Card 08 media swap, H.264 faststart loops with zero-jump WebP posters.
6. **Phase 12 (PR #102 - Merged):** 16 `/services/[slug]` detail pages, light editorial theme, deep-linked accordion bullets.
7. **Phase 13 (PR #103 - Merged):** `/start-project` rebuilt as a light page under a cinematic video hero; brief popup retired in favour of the dedicated intake route.

