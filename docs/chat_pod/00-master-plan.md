# 00 — Chat Pod Master Plan

> **Status: PLANNED. No implementation until the owner types "proceed".**
> Antislop mode for this module: **DURING** the work (owner-confirmed). Dials inherited from `DESIGN.md`: ENERGY 2 / RHYTHM 2 / MOTION 1.

---

## 1. What the owner asked for

Verbatim intent, decomposed:

| Requirement | Source phrase | How this plan satisfies it |
|---|---|---|
| Floating chat pod on the site | "we have to build out a chat pod" | `ChatPod` mounted once in `src/app/layout.tsx`, bottom-right, above the z-index of `ClientHeader` (50) |
| Present everywhere except the intake page | AskUserQuestion answer | Route exclusion list mirrors `SmoothScrollProvider`'s `/studio` + `/admin` skip, extended with `/start-project` |
| Answers casual greetings | "respond to simple text like hi greetings etc" | `greeting`, `smalltalk`, `thanks`, `goodbye` intents (§03) |
| Answers service/work/process questions | "when asked about our services asked about our work etc it should respond accordingly" | Knowledge base compiled at build time from the static service decks, Sanity blog/FAQ/career queries, studio facts (§01 §3) |
| Conversational intake mode | "there should be like some kind of a mode … interactive way … the content and purpose is basically the same as the other form flow" | Finite-state intake mode, one question at a time, same fields as `ProjectForm`'s four steps (§04) |
| Data lands where the form's data lands | "the data is collected and basically it is told to our sanity things and stuff" | **Correction required** — see §5. The form does *not* write to Sanity; it posts to Supabase via `/api/sales-funnel/ingest` |
| No real AI, no API | "we don't want to even like a real ai or apq or anything" | Zero LLM, zero third-party chat SDK, zero per-message network. Deterministic matcher only (§01 §4) |
| High-craft animation, not a "sad bot" | "with the animation stuff … not just like your simple you know shit sad bot" | Hand-written motion spec: origin-aware panel open, typing dots with reserved height, chip affordances, mobile sheet (§05) |
| Deep research, multiple experts, full documentation | "hire the team of expert agents … find about 8 agents … check the internet research everything" | Seven agent reports captured in §02; documentation set in `docs/chat_pod/` |
| Plan first | "dont start exccution first preosent me the plan continue" | This document. Nothing implemented. |

Reference imagery supplied by the owner: the **Commvault "Cami"** assistant widget, and a **"Don't be shy! Say hi! / TALK TO US"** panel. Both are used as *structure* references (launcher + panel + persona), not as visual templates — the pod must wear the light editorial canon, not theirs.

---

## 2. Scope

### In scope

1. **Launcher** — a persistent floating control with the persona's photo, an idle nudge, and an honest AI badge.
2. **Panel** — header (persona, role, close), transcript (`role="log"`, `aria-live="polite"`), quick-reply chips, composer with send.
3. **Deterministic matcher** — three-tier resolution (exact → keyword → scored fuzzy) over a static intent table.
4. **Knowledge base** — build-time compilation of site content into intents. Two sources:
   - static TypeScript (service decks, studio facts, FAQ/career fallbacks) — compiled directly;
   - Sanity (blog post list, categories) — fetched server-side at build/ISR time and serialized into the client payload. **No live Sanity call from the pod.**
5. **Chat/FAQ mode** — greeting, services, work, process, people, contact, careers, journal, pricing-adjacent honesty.
6. **Intake mode** — slot-filling FSM collecting the `ProjectForm` field set conversationally, with validation, a review card, edit-any-slot, and submit through `/api/sales-funnel/ingest`.
7. **Handoff** — at any point the visitor can abandon the conversation and be routed to `/start-project` or given the direct phone/email, with intake state preserved in `localStorage` so the form can be pre-filled (M8, optional).
8. **Persistence** — draft transcript in `localStorage` with a first-run consent line, 14-day expiry, cleared on submit.
9. **Accessibility & performance** — see §05 and §06 gates.

### Out of scope (explicitly)

- Any LLM, embedding model, vector store, or third-party chatbot SaaS.
- Any new API route. Intake uses the existing ingest route unchanged.
- Any admin/CRM surface change. Leads appear in the existing pipeline.
- Live chat with a human agent, queueing, or agent handoff infrastructure.
- Multilingual conversation. The pod speaks English (British spelling) only, matching the site.
- Analytics beyond the existing pattern; event names proposed in §06, wiring deferred to M8.

---

## 3. Design identity

**Owner decision (AskUserQuestion): "Named persona with photo."** This overrides the recommendation I made for a faceless wordmark launcher. It is honoured, with two non-negotiable conditions:

1. **Honest badging.** The persona is labelled an AI assistant in three places: the launcher tooltip, the panel header subline, and the first assistant message. Commvault's Cami does this; a named face without a disclosure does not. Copy: `Digital assistant · Not a person` (mono, 11px, uppercase-tracked, muted).
2. **Likeness consent.** The photo must be either (a) a real Marca Ubi team member who has consented in writing, or (b) an owned/generated asset the studio holds rights to. **The agent will not invent a fake person's face and name.** Until the owner supplies the asset, the build uses a neutral placeholder frame and the persona name is a `const` in one file.

**Proposed persona (owner to confirm or replace):**

| Field | Proposal | Rationale |
|---|---|---|
| Name | **Ubi** | Already the studio's own word (`Marca Ubi`). No invented human name, no gendered implication, no trademark risk. |
| Role line | `Digital assistant` | Honest, British, unadorned. Not "AI concierge", not "virtual teammate". |
| Launcher idle copy | `Say hi` | Two words. Taken from the owner's own reference panel ("Don't be shy! Say hi!") and reduced — the exclamation marks are the slop. |
| Voice | Second person, British spelling, no exclamation marks, no em dashes, no tricolons, short sentences | Matches `feedback-copy-voice` and the accepted Journal prose |

**Visual canon (inherited, not renegotiated):**

- Canvas `#ffffff`, ink `#0a0a0a`, body `#444444`, muted `#666666`.
- Hairline `rgba(0,0,0,0.08)`; radius `2px`; **zero box-shadows** anywhere in the module.
- Accent `#ea002a` only — used at most twice per panel state (send button + one active chip / one link). **Never legacy orange `#ff6100`.**
- Contrast trap: `#ea002a` on white is 4.63:1 (AA pass) but on `#fafafa` is 4.44:1 (**fail**). Therefore assistant bubbles sit on `#ffffff` or on a hairline-bordered `#ffffff` card — **never on a tinted surface**. Meta text never lighter than `#767676`.
- Type: Helvetica Neue 200/300 for the persona name and any display line; Circular for all conversation text; 11px mono uppercase for kickers, timestamps and the AI badge.
- Focus ring: `outline: 2px solid $client-accent-red; outline-offset: 4px`. Minimum target 44×44px.

---

## 4. Conversation behaviour — the honesty contract

This is the part that decides whether the pod reads as craft or as a toy.

1. **No fabricated answers.** Every response string is either (a) a literal in the intent table, or (b) a template rendered with data that came from a real file or Sanity query. Nothing is composed at runtime from the visitor's words beyond slot echoes.
2. **No fabricated numbers.** No "500+ projects", no "98% retention", no response-time claims. Counts that appear (e.g. "16 service lines") are computed from the actual arrays at build time.
3. **Three-strike honesty.** Unmatched input resolves through: fuzzy match ≥0.80 with a ≥0.15 margin over the runner-up → answer; fuzzy match without that margin → disambiguate the top 3 as chips; score <0.55 → an honest "I don't have that" plus the persistent menu. **After two fallbacks in one session the pod stops guessing entirely** and offers `/start-project`, the phone number and the email.
4. **Pricing is not answered.** There is no published rate card in the corpus. The correct answer is the truth: budgets are scoped per project, here is how to start. No invented ranges.
5. **No dead ends.** Every assistant message carries either a chip row or a route forward. Every chip has a real destination or a real next turn.
6. **No looping attention bait.** One nudge maximum, only after ≥20s idle and ≤50% page scroll, once per session. No pulse, no shake, no badge count, no sound.
7. **Escape is real.** The pod never traps the visitor. `Esc` closes and returns focus to the launcher. Intake mode can be exited to chat mode at any point with state retained.

---

## 5. The one discrepancy that needs the owner's confirmation

**Owner's AskUserQuestion answer: "Reuse projectBrief" (Sanity).**
**Codebase reality: the live `/start-project` form does not touch Sanity.**

Evidence gathered by the intake-contract agent:

- `src/app/components/ProjectForm/ProjectForm.tsx:128` posts to `POST /api/sales-funnel/ingest`.
- That route validates with Zod (`src/app/lib/validations/ingest.ts:33-142`), applies a honeypot (`route.ts:121-135`), a 10-per-10-minute token bucket (`:73-95`), a 64KB cap (`:38,62-71`), an idempotency key, a dedup state machine (`:275-536`), then inserts into Supabase `leads` + `lead_activities` (`:466-510`, pg fallback `:801-850`) and fires an alert (`:512`).
- `src/app/api/submit-brief/route.ts` — the Sanity `projectBrief` writer — is **deprecated**: it returns an `X-Deprecated-Endpoint` header and has **zero client callers**.
- The `ProjectBriefModal` that used it was retired in Phase 13.

The owner's answer was given against my earlier incorrect framing of the pipeline. **Recommendation: submit through `/api/sales-funnel/ingest`, identical to the form, differing only in `source_name: "Chat Pod"` and `source_detail: "Conversational intake (chat pod)"`.** That means chat-pod leads land in the same CRM table, get the same dedup treatment, the same rate limiting, the same alerting, and the same activity log — with no server code changes at all.

If the owner genuinely wants a Sanity `projectBrief` document *as well*, that is an additive second write and should be a separate decision; it must not replace the ingest call, or chat-pod leads would vanish from the pipeline. **Flagged for confirmation before M4.**

---

## 6. Decisions required from the owner

| # | Decision | Default if unanswered | Blocks |
|---|---|---|---|
| D1 | Confirm intake target = `/api/sales-funnel/ingest` (not Sanity `projectBrief`) | Ingest route | M4 |
| D2 | Persona name — accept **Ubi** or supply another | Ubi | M2 (cosmetic only) |
| D3 | Persona photo asset — real consented team member, or owned/generated asset, supplied by owner | Neutral placeholder frame + `const` name, no face shipped to production | M7 |
| D4 | Branch + PR strategy — new branch `feature/chat-pod` off `master`, or continue on `feature/blog-redesign` | New branch off `master` after PR #104 is merged by the owner | M1 |
| D5 | Idle nudge — permitted (once/session, ≥20s idle, ≤50% scroll) or none at all | Permitted as specced | M6 |
| D6 | Analytics events — wire in M8 or defer | Defer | M8 |

---

## 7. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Pod reads as "another AI chatbot", the exact slop the owner rejects | Medium | High — module rejected | Deterministic corpus-only answers; the honesty contract §4; motion spec §05; antislop DURING; audit against the accepted `/blog` listing as internal reference standard |
| Launcher collides with `FloatingExploreButton` | High | Medium | Both bottom-anchored. Resolution: the pod takes the bottom-right slot; `FloatingExploreButton` moves to bottom-left **or** the two merge into one stacked rail. Decided in M2, measured in the browser before shipping |
| Bundle cost on every page | Medium | Medium | `next/dynamic` with `ssr: false` inside a thin client shell; prefetch on `pointerenter`/`focusin`; mount gated on the existing `initial-loader:complete` event with a 12s fallback (the `FloatingExploreButton` precedent); chunk ≤35KB gzip; LCP delta <50ms; CLS 0 |
| Lenis smooth-scroll fights the panel's internal scroll | High | Medium | Dispatch the existing `menu:open` / `menu:close` window events on panel open/close so `SmoothScrollProvider` calls `lenis.stop()` / `start()` (`SmoothScrollProvider.tsx:392-411`) |
| Mobile keyboard covers the composer | High | High | `visualViewport` resize/scroll listeners; panel becomes a full sheet (`translateY(100%)→0`, 400ms) with a flat scrim; composer pinned above the keyboard |
| Intake collects an email then loses it on refresh | Medium | Medium | `localStorage` draft with consent, 14-day expiry, cleared on submit and on explicit "start over" |
| Spam through the pod | Low | Low | Same honeypot field, same token bucket, same 64KB cap, same idempotency key as the form — all inherited free |
| Persona photo becomes a legal problem | Low | High | D3: no face ships without owner-supplied rights/consent |
| Duplicate leads when a visitor uses both pod and form | Medium | Low | The ingest route's dedup state machine already handles this by email/phone |

---

## 8. Definition of done

The module is done when **all** of these hold:

1. Pod visible on every route except `/start-project`, `/studio`, `/admin`.
2. Zero network requests on message send in chat/FAQ mode (verifiable in the Network panel).
3. Every answer in the intent table traceable to a named source file or Sanity query — no orphan literals.
4. Intake submit produces a row in Supabase `leads` with `source_name = "Chat Pod"`, identical shape to a form submission.
5. `npx tsc --noEmit` → 0 errors. Zero `any`. Zero swallowed exceptions.
6. Unit tests for the matcher, the slot FSM, and the knowledge-base compiler pass.
7. axe-clean on `/` with the pod open; keyboard-only completion of a full intake; `Esc` returns focus.
8. No horizontal overflow at 390 / 768 / 1024 / 1440 / 1680.
9. Pod chunk ≤35KB gzip; CLS 0; LCP delta <50ms measured against the current baseline.
10. Reduced-motion: every animation collapses to opacity-only ≤150ms or none; the pod remains fully usable.
11. antislop Delivery Gate run and recorded; the 38-rule scan attached to the PR.
12. PR left **OPEN**. Never merged by the agent.

---

## 9. What this plan does not yet specify

Recorded so it is not mistaken for completeness. Each item is a deliberate deferral to a named milestone, not an oversight — except where marked.

| # | Gap | Why it is not specified yet | Closed at |
|---|---|---|---|
| G1 | **No visual design.** No panel dimensions, no header composition, no bubble geometry, no launcher drawing. Only the canon (white, hairline, 2px, zero shadow, `#ea002a` twice max) and the motion values. | A pixel spec written before the launcher collision is resolved would be thrown away. The collision decision changes the launcher's shape and position. | M2, after the collision is measured in the browser |
| G2 | **Persona photo art direction.** Nothing on crop, background, treatment, or how a photograph sits inside a flat hairline system without becoming the one soft element on the page. | Blocked on D3 — the asset does not exist. | M7, once the owner supplies it |
| G3 | **Service-answer length.** The 16 `services.detail.<slug>` intents render `SERVICE_DETAILS` summaries into a chat bubble. Those decks were written for a full page, not a 320px bubble. No truncation or rewrite rule exists yet. | Needs the compiled corpus in hand to measure actual character counts. | M3, with a hard cap and a "read the full page" chip as the overflow |
| G4 | **Journal rendering.** §03 specced a text list with `en-GB` dates. Whether it should instead be small cards with `coverUrl()` thumbnails is undecided, and cards cost bundle and CLS. | Deliberate deferral: text list is the safe default, cards are an upgrade only if the budget allows. | M4 |
| G5 | **Chip cap arithmetic.** `services.b2b` caps at 8 chips. If the B2B split holds more than 8 slugs, the cap silently hides services. No overflow rule (`Show all N` chip) is written. | Needs the compiled split counts. | M3 |
| G6 | **Copy test not specced as a file.** The banned-vocabulary / emoji / em-dash / `#ff6100` sweep is described as a check but has no named test file or assertion list. | Cheap to add; belongs with the other unit tests. | M4 |
| G7 | **Pre-filling `/start-project` from a retained pod draft** is listed as M8-optional and has no design. The form takes zero props (`start-project/page.tsx:29`), so this needs a query-param or storage contract. | Genuinely optional; excluded unless the owner asks. | M8, only if requested |
| G8 | **No answer for "who is your favourite client" style bait.** The script covers `work.clients` but not adversarial or abusive input beyond the fallback tiers. | The fallback tiers already handle it honestly; adding special cases would be guessing at insults. | Accepted as-is |

**Correction already applied during this audit (2026-11-01):** §04 §2 originally described `industry`, `language`, `referral`, `agencyStatus` and `showcasePermission` as free-text slots. They are **closed sets** in the form — `<select>` and radio fields with fixed string values (`Step2Business.tsx:14-50`, `Step3Details.tsx:215`). The slot map, the parity test and M5 were corrected, and the five arrays are now required to be extracted to a shared module imported by both surfaces. `inspirationLinks` was likewise corrected to the form's `"\n"`-join format (`Step3Details.tsx:78-79`), and `showcasePermission` reduced from three invented options to the form's actual two.
