# Chat Pod — Feature Documentation Index

**Module:** Deterministic conversational assistant + conversational project intake
**Owner:** Fenar7
**Status:** BUILT — M1–M8 complete on `feature/chat-pod`; gate evidence in
[`07-delivery-gate-and-verification.md`](./07-delivery-gate-and-verification.md)
**Branch:** `feature/chat-pod`, cut from `master` at `3f1318a` (Phase 14 / PR #104 merged). Own PR.
**Recorded:** 2026-11-01

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
| 07 | [`07-delivery-gate-and-verification.md`](./07-delivery-gate-and-verification.md) | The 4-Block antislop Delivery Gate, contrast measurements, R-35 click-through evidence, measured budgets, analytics decision, regression evidence |

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
spec. **As shipped, no face:** the launcher is a letterpress `U` frame, because D3 withheld a portrait
until a consented team photo exists — the plan's "persona with a photo" is the only line here the build
does not match, deliberately.

## The three things this plan refuses to do

1. **No AI.** Nothing calls a model. Matching is exact-string → keyword → token-overlap/trigram scoring, all client-side, all shipped as data.
2. **No invented facts.** Every answer is traceable to an existing file or Sanity query. If the knowledge base has no answer, the pod says so and offers a menu — it never guesses.
3. **No new pipeline.** Intake reuses `/api/sales-funnel/ingest` byte-for-byte (same Zod schema, same rate limit, same honeypot, same dedup state machine, same idempotency key). Only `source_name` and `source_detail` differ.
