# Full Engineering Context Register — Latest Active Context

> **Start here.** This is the live pointer file; the detail lives in the linked register.
> Any agent (human or AI) opening this project should read this file first, then the register.

**Recorded At:** `2026-11-02T09:51:45+05:30`
**Current Branch:** `feature/chat-pod` (cut from `master`)
**Base Branch:** `master`
**Latest Commits On Branch:** `c84c230` — *Chat Pod: Ubi, the deterministic assistant and conversational intake*
→ `f6caede` — *Docs: record the Chat Pod plan, contract and measured delivery gate*. The audit fix pass
(12 source files + 3 test files, 1 of them new) is **uncommitted**.
**Open Pull Request:** none yet — nothing has been pushed; the Chat Pod PR opens only on the owner's word
and must stay OPEN
**Author Identity:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`
**TypeScript Status:** `0 errors` (`npx tsc --noEmit`)
**Unit Tests:** `npx tsx --test tests/unit/chatpod-*.test.ts` → **199 pass / 0 fail** (7 suites)

---

## 1. Active work: Chat Pod (conversational intake assistant)

A site-wide `Ubi` pod: launcher + dialog, a server-compiled knowledge base matched client-side by a
deterministic 3-tier engine, and an 17-slot intake FSM that produces the *same* payload
`POST /api/sales-funnel/ingest` already accepts, so a pod lead lands in the CRM exactly like a form lead.

Plan, milestones, budgets and the delivery gate live in [`docs/chat_pod/`](../chat_pod/06-implementation-milestones.md).
Gate evidence: [`docs/chat_pod/07-delivery-gate-and-verification.md`](../chat_pod/07-delivery-gate-and-verification.md).

What a new session needs before touching it — the full architecture (mount gate, knowledge compile,
deterministic matcher, 17-slot intake, one payload builder, storage contract), the six closed decisions
(D1 intake reuses the live ingest pipeline, D2 name `Ubi`, D3 no face, D4 branch, D5 idle nudge, D6
analytics deferred), the twelve audit findings and how each was fixed and proven, the ten rules already
paid for, the exact verification protocol this user permits, and what is still open (the e2e spec needs
four updates and a re-run, `07-delivery-gate` still records pre-fix numbers, then the push/PR ask):
👉 [`docs/context/2026-11-02_09-51-45.md`](./2026-11-02_09-51-45.md)

The pre-audit register — trap-by-trap detail on the build itself, including the launcher naming defect:
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

