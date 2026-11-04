# Chat Pod — Feature Documentation Index

**Module:** Deterministic conversational assistant + conversational project intake
**Owner:** Fenar7
**Status:** BUILT — M1–M8 complete, then two remediation phases on top of the build: the light editorial
restoration and the comprehension/conversation-state pass now on the branch below. Gate evidence in
[`07-delivery-gate-and-verification.md`](./07-delivery-gate-and-verification.md) (M1–M8) and
[`20-comprehension-and-conversation-state.md`](./20-comprehension-and-conversation-state.md) (the resolver).
**Branch:** `remediation/turbopack-compaction-dev-server`, PR #107 **OPEN** (never merged by an agent).
The module was cut from `master` at `3f1318a` (Phase 14 / PR #104 merged) as `feature/chat-pod`.
**Recorded:** 2026-11-02

---

## Reading order

| # | Document | What it answers |
|---|---|---|
| 00 | [`00-master-plan.md`](./00-master-plan.md) | What we are building, why, scope in/out, the six decisions the owner must confirm |
| 01 | [`01-architecture.md`](./01-architecture.md) | Runtime architecture: modules, data flow, file map, bundle budget, build-time compilation |
| 02 | [`02-research-findings.md`](./02-research-findings.md) | The seven expert-agent research reports, condensed and cited |
| 03 | [`03-conversation-script.md`](./03-conversation-script.md) | Every intent, its trigger utterances, its answer, and its chips — the actual script |
| 04 | [`04-intake-data-contract.md`](./04-intake-data-contract.md) | The intake mode: slot map, one-question-at-a-time flow, validation, and the pipeline reconciliation |
| 05 | [`05-motion-and-a11y-spec.md`](./05-motion-and-a11y-spec.md) | Animation timing spec and the accessibility contract, measured against the light editorial canon |
| 06 | [`06-implementation-milestones.md`](./06-implementation-milestones.md) | M1–M8 build order, acceptance gates, verification protocol, test plan |
| 07 | [`07-delivery-gate-and-verification.md`](./07-delivery-gate-and-verification.md) | The 4-Block antislop Delivery Gate, contrast measurements, R-35 click-through evidence, measured budgets, analytics decision, regression evidence — M1–M8, MOTION 1, superseded on theme and on motion by 16–21 |
| 08 | [`08-luxury-redesign-spec.md`](./08-luxury-redesign-spec.md) | The dark luxury redesign spec that followed 07. **Superseded** by 16/17/18: the pod ships in the light editorial canon |
| 09 | [`09-reverse-typing-and-profile-avatar-remediation.md`](./09-reverse-typing-and-profile-avatar-remediation.md) | Forensic investigation of the reverse-typing and caret-collapse defects, with the reproduction evidence |
| 10 | [`10-concierge-profile-icon-spec.md`](./10-concierge-profile-icon-spec.md) | The concierge profile-icon and header spec that 09's findings produced |
| 11 | [`11-cto-audit-reverse-typing-and-avatar.md`](./11-cto-audit-reverse-typing-and-avatar.md) | Senior CTO audit of the 09/10 remediation |
| 12 | [`12-focus-isolation-and-photographic-avatar.md`](./12-focus-isolation-and-photographic-avatar.md) | Focus invariant, modal mutual exclusion, and the photographic portrait decision |
| 13 | [`13-cto-audit-focus-isolation-and-avatar.md`](./13-cto-audit-focus-isolation-and-avatar.md) | Senior CTO audit of the focus-isolation and avatar work |
| 14 | [`14-luxury-redesign-and-launcher-avatar-plan.md`](./14-luxury-redesign-and-launcher-avatar-plan.md) | The dark luxury overhaul plan and launcher-avatar remediation. **Superseded** by 16–18 |
| 15 | [`15-cto-audit-dark-luxury-redesign.md`](./15-cto-audit-dark-luxury-redesign.md) | Senior CTO audit of the dark luxury redesign. The theme it certifies is no longer shipped |
| 16 | [`16-light-editorial-restoration-plan.md`](./16-light-editorial-restoration-plan.md) | Light editorial theme restoration and brand red (`#ea002a`) alignment |
| 17 | [`17-swiss-light-editorial-overhaul-plan.md`](./17-swiss-light-editorial-overhaul-plan.md) | The Swiss light editorial master overhaul plan that 16 opened |
| 18 | [`18-overall-luxury-design-overhaul-plan.md`](./18-overall-luxury-design-overhaul-plan.md) | The shipped design contract: authentic Swiss light editorial, with the launcher avatar treatment |
| 19 | [`19-cto-audit-swiss-light-editorial.md`](./19-cto-audit-swiss-light-editorial.md) | Senior CTO audit of the Swiss light editorial build (commit `d40e965`) |
| 20 | [`20-comprehension-and-conversation-state.md`](./20-comprehension-and-conversation-state.md) | The resolver as arithmetic: the three tiers and their frozen thresholds, contested authored names, and the conversation layer that makes "tell me more" and "the second one" mean something |
| 21 | [`21-motion-and-contrast-remediation.md`](./21-motion-and-contrast-remediation.md) | Part B of the same pass: measured ink contrast, the entrance-motion contract, and the fluidity fixes (typing hand-off, scroll follow, panel stagger) with the guard test that holds them |
| 22 | [`22-comprehension-continuity-and-intake-remediation.md`](./22-comprehension-continuity-and-intake-remediation.md) | Part C: typed messages against authored ones (chat abbreviations, one-keystroke forgiveness, residue naming), the continuity second pass, the measured resolver table, and the ten intake defects with their causes |
| 23 | [`23-one-column-one-lock-and-the-typed-message.md`](./23-one-column-one-lock-and-the-typed-message.md) | Part D, the browser pass: one scroll owner instead of two boxes, one refcounted viewport lock shared by five overlays, the three remaining holes in question recognition, the three gates that had to be written to prove any of it, and what is still open; §9 is the independent CTO re-audit of that tree, its seven findings and what each one cost, and §10 the third auditor aimed at the pushed commits — one MAJOR that turned out to be dead code and two gate fixes that came out of it |

---

## One-paragraph summary

A floating chat pod appears on every public page except `/start-project`, `/studio` and `/admin` (the
intake form and the two staff surfaces, where it would compete with the work itself). It is **fully
deterministic** — no LLM, no external AI API, no chatbot SaaS, no per-message network call. It answers
casual greetings and questions about Marca Ubi's services, work, process, people and contact details,
drawing **only** from content the site already publishes (the static service decks, the Sanity
blog/FAQ/career queries, the studio facts). When the visitor signals project intent, it switches into
**intake mode**: the same information the `/start-project` wizard collects, gathered one question at a
time in conversation, reviewed, and submitted through the **existing** `POST /api/sales-funnel/ingest`
pipeline so it lands in the same Supabase `leads` table as a form submission, marked
`source_name: "Chat Pod"`. The visual identity is the named persona `Ubi`, honestly badged
(`Digital assistant · Not a person`), rendered in the light editorial canon with a hand-built motion
spec. The launcher paints the concierge portrait at `/avatars/sophia-sterling.jpg` while it is closed and
becomes a `×` while the panel is open (`ChatPod.tsx:962-983`, both marks `aria-hidden` because the visible
name and the `Ask`/`Close` hint already carry the accessible name); the panel header repeats the same
portrait. The permanent `Digital assistant · Not a person` line is what keeps that honest, and the
portrait's provenance and consent are the studio's own record rather than something this document can
verify. The original plan's letterpress `U` frame is gone from the shipped build.

## The three things this plan refuses to do

1. **No AI.** Nothing calls a model. Matching is exact-string → keyword → token-overlap/trigram scoring, all client-side, all shipped as data.
2. **No invented facts.** Every answer is traceable to an existing file or Sanity query. If the knowledge base has no answer, the pod says so and offers a menu — it never guesses.
3. **No new pipeline.** Intake reuses `/api/sales-funnel/ingest` byte-for-byte (same Zod schema, same rate limit, same honeypot, same dedup state machine, same idempotency key). Only `source_name` and `source_detail` differ.
