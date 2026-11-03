# Chat Pod — Comprehension, continuity and the intake remediation (Part C)

Record date: 3 November 2026. Branch `remediation/turbopack-compaction-dev-server`, PR #107 **OPEN**.
Scope: `engine/normalise.ts`, `engine/match.ts`, `engine/useChatEngine.ts`, `intake/slots.ts`,
`intake/useIntakeFlow.ts`, `ChatPod.tsx`, `ChatPod.module.scss`, `knowledge/intents.ts`,
`knowledge/corpus.ts`, and the three unit suites named in §7.
Design Read for this module: **ENERGY 2 / RHYTHM 2 / MOTION 2** (unchanged from `20-` and `21-`).

`20-comprehension-and-conversation-state.md` is the architecture this file builds on — the three tiers,
the frozen thresholds, the conversation layer. `21-motion-and-contrast-remediation.md` is the visual half
of the previous pass. This file records what changed after the owner used the pod on a phone and came
back with two sentences: that asking *what do you do* got the services question back, and that the
question card *feels broken*.

---

## 1. What the complaint was, in its own words

> *"when ask what do you do why is it asking my services and stuff … the start a project view when asking
> the questions feels broken … should ask b2b or b2c … when i ask about services it says there are 16
> services that doesn't help"*

Four distinct failures, only one of which is a knowledge gap:

| Complaint | Layer | Root cause |
|---|---|---|
| *what do you do* → asked who they sell to | knowledge | `services.overview` owned the company question, and its answer opens with a qualification question. No intent owned *who we are* at all. |
| *there are 16 services* | knowledge | `services.overview` answered with a headcount where the useful next move was the B2B / B2C branch the catalogue is organised by. Fixed in the previous pass, re-pinned here. |
| Typo-laden phrasing not understood | engine | A message typed on a phone (`plese`, `abt`, `servces`, `whta`) lost its topic words to a strict stop-word test and its spelling to a single-word-only typo rule. |
| The brief *feels broken* | UI + machine | Six defects in `ChatPod.tsx` and four in the intake machine, all in §6. None were raised as individual bugs; the owner experienced them as one sensation. |

## 2. The vocabulary change: a typed message is not an authored one

The corpus is authored by hand, so it is well-formed English. Visitors are not. The engine previously
treated both identically, which is why a sentence typed with two shortcuts and one missed key scored
worse than the same sentence dictated carefully.

**`CHAT_ABBREVIATIONS`** (`engine/normalise.ts:85`) folds six closed-class chat abbreviations
(`abt`, `th`, `u`, `ur`, `pls`, `plz`) to the word they stand for. The list is short on purpose: `svc` and
`mktg` are absent because they *name a subject*, and a subject the corpus does not spell out must stay
visible in the denominator rather than be smoothed into a guess.

**`isScaffold()`** (`engine/normalise.ts:130`) is the stop-word test with forgiveness. It answers *is this
token grammar* — an authored stop word, an abbreviation of one, or a token one keystroke from one
(`plese`, `teell`, `wtih`). The forgiveness is a pre-built deletion-and-transposition index over the
scaffolding vocabulary (`SCAFFOLD_NEIGHBOURS`, `engine/normalise.ts:104`), which is exact at distance 1
and linear at query time. Transposition is indexed because `whta` is the most common mistyping there is
and sits two deletions from `what` but one keystroke. Substitution at distance 2 is deliberately excluded:
that is the depth at which `art` starts reaching `are` and a topic word gets eaten by the grammar filter.

**`residue()`** (`engine/normalise.ts:145`) is `contentTokens()` with both rules applied. It returns the
message with the scaffolding taken out; when nothing survives it returns the whole message, so a query
that is pure grammar (`what is it`) still scores rather than producing an empty vector that silently
matches nothing.

**`vocabulary` / `stemNeighbours` / `typoStems()`** (`engine/match.ts:186-193`, `343`) do the same job for
topic words. `vocabulary` is every word form the corpus actually uses, raw and stemmed. A token outside
it is either one keystroke from a word we do use, or it names a subject we do not publish — and those two
cases must be treated differently or every typed message becomes a miss. `typoStems` splits them:

- exactly one vocabulary neighbour → **full credit**. One keystroke and no alternative reading is a typo.
- several neighbours (`organis` reaching both `organise` and `organic`) → **half credit**, because the pod
  that guesses which one was meant is the pod that answers about the wrong thing with total confidence.
- no neighbour → charged to the visitor, unchanged. This is the rule from `20-` §4.1 and it did not move.

Tokens under five characters are never tested in either direction. A three-letter word is within one edit
of almost everything, which is how `art` reaches `start` and an illustration enquiry becomes a brief.

## 3. Residue naming: the same question, wrapped in more courtesy

`rank()` now groups authored aliases by their **topic words only** — `residueKey`, the sorted residue of
the alias — and looks a message up in that map (`index.residueOwners`, `engine/match.ts:193`, `574`) after
Tier 1's exact-name check fails and before scoring.

The reason is a measurement, not a theory. `ok can you plese tell me abt th services` and `the services`
reduce to the same one topic word, but containment scored the first at 1.000 against two runners-up at
0.883 — inside the accept margin — so the visitor who was polite enough to write a full sentence got
three chips while the one who typed one word got an answer. That is the behaviour the owner called
unintelligent, and the fix is to recognise that both messages are an authored phrase with extra wrapping.

Two hard conditions keep it honest:

1. **Only when exactly one intent owns that set of words.** `can i see the work` reduces to `work`, which
   five intents happen to mention (measured, §5); promoting a contested residue would answer those at a
   perfect score and stop answering the work question at all. Contested residues fall through to scoring.
2. **`isAuthoredName()` uses the same predicate** (`engine/match.ts:525`), so the conversation layer can
   never disagree with the matcher about what "the studio wrote this down" means.

`coreAllowed` (`engine/match.ts:552`) is the guard on the other half of the same idea. Stripping the
scaffolding also strips the sentence's evidence, and `what is the weather in calicut` reduces to a city
name this studio publishes — measured against a bare alias it starts to look like the whole question. So
the scaffolding-free trigram comparison only runs when every topic word in the message is a word this
corpus has used. A word nobody published keeps the message's shape visible.

## 4. Continuity: the previous turn is allowed to break a tie

`CONTINUITY_PRIOR = 1.08` (`engine/match.ts:57`). `resolve()` takes an optional `prior` — the intent the
previous turn answered — and applies it as a **second pass, only when the same message failed to resolve
without it** (`engine/match.ts:652-671`). Ordering is the whole safety: continuity cannot change an answer
the pod was already confident about, it only breaks a tie the pod could not break alone.

Within that pass, a candidate is lifted only when `cold >= FLOOR_THRESHOLD` (0.55) **and** it shares a
`familyRoot()` with the prior (`engine/match.ts:60`, the first dotted id segment — the same segmentation
`INTENT_DISCOUNTS` reads). Lifting a 0.2 would turn a fallback into a confident question about the wrong
subject, and a pod that asks after the wrong thing twice has lost the visitor.

At 1.08 a candidate needs 0.741 cold to be lifted over the 0.80 accept line — a message already mostly
about the last subject. `explain each service` measured 0.775 cold and now resolves; before this change
the pod put up three chips on a conversation it had been holding. Bigger factors were tried and rejected:
they make the pod sticky, and a sticky pod answers about services for the rest of the session no matter
what the visitor asks.

`useChatEngine.lookup` deliberately passes **no** prior (§6 defect 1). A question asked in the middle of a
brief is the visitor changing the subject; pulling it back toward the slot they are answering is how a
form starts guessing.

## 5. Measured, after this pass

From the resolver over the real compiled corpus, by `npx tsx scripts/chat-pod/probe-comprehension.mts` —
committed, because §9 asks for this table to be re-read before any authoring or threshold decision is
made, and a table nobody can reproduce is an opinion.

**Cold resolution:**

| Typed message | Outcome | Scores (top three) | Before |
|---|---|---|---|
| `what do you do` | `identity.studio` (1.000) | 1.000 | answered by `services.overview`, which asked who they sell to |
| `who are you` | `identity.studio` (1.000) | 1.000 | `process.team`, whose answer is two street addresses |
| `are you an agency` | `identity.studio` (1.000) | 1.000 | no owner; fell to disambiguation |
| `whta is marka ubi` | `identity.studio` (0.853) | 0.853 / 0.218 / 0.121 | fallback — the mistyped brand name was an unknown token |
| `ok can you plese tell me abt th services` | `services.overview` (1.000) | 1.000 | disambiguated at 1.000 vs 0.883 vs 0.883 |
| `tell me about the services` | `services.overview` (1.000) | 1.000 | disambiguated |
| `what services do you offer` | `services.overview` (1.000) | 1.000 | answered |
| `servces` | `services.overview` (0.875) | 0.875 / 0.582 / 0.582 | answered only by the single-word edit rule |
| `can you plese help with pricing` | `pricing` (0.863) | 0.863 / 0.527 / 0.526 | answered, below margin |
| `how much does a rebrand cost` | `pricing` (1.000) | 1.000 | disambiguated — one word matched pricing, one matched a service page |
| `do you do seo` | `services.detail.digital-performance` (1.000) | 1.000 | answered |
| `i want a website` | `intake.trigger` (1.000) | 1.000 | answered |
| `what is the weather in calicut` | **DISAMBIGUATE** | 0.780 / 0.293 / 0.190 | *answered* as the studio address at 1.000 |
| `can i see the work` | **DISAMBIGUATE** | 0.829 / 0.812 / 0.788 | disambiguated |
| `hello` | `greeting` (1.000) | 1.000 | answered |

The last two rows are the correct answers, not defects: three unrelated intents genuinely claim *work*,
and the pod has no published weather. `20-` §4.1's rule — refuse rather than guess — is what those two
rows are evidence for.

**Warm resolution** (`prior` = the intent the previous turn answered):

| Conversation | Outcome |
|---|---|
| `what do you do` → `tell me about the services` → `explain each service` | third turn resolves to `services.overview` (0.775 cold, lifted by 1.08) |
| `services` → `b2b` → `explain each service` | resolves; the branch answer does not steal the follow-up |
| `what do you do` → `how much does a rebrand cost` → `what is the process` → `and the timeline` | each turn answers, `process.timeline` carried by family |
| `hello` → `can you build an app` → `tell me about that` | third turn disambiguates — an honest refusal across families, not a wrong answer |

**Authoring facts the residue map exposed** — four contested whole aliases (already known) and eight
contested residues, printed by the same run. Two of them are worth the studio's attention as content
decisions, not engine bugs: `[work]` is claimed by five intents, and `[brand strategy]` by both
`services.detail.integrated-creativity` and the journal topic of the same name. They fall through to
scoring today, which is correct; authoring them apart is the better fix and is on the list in §8.

## 6. The ten intake defects

All ten were reproduced before being fixed and all ten have a test. The mechanism column names the line,
not the symptom, because the owner's report was a sensation and the reports below are its causes.

| # | What the visitor met | Cause | Fix |
|---|---|---|---|
| 1 | A mid-brief question was **filed as the answer** to the live slot | Every message in `INTAKE_FORM` went to the slot pipeline. `who are you` in the name field became a name. | `engine.lookup()` (`useChatEngine.ts:190`) + the detour branch (`ChatPod.tsx:979-993`). Side-effect-free: consumes no fallback, records no turn. |
| 2 | Typing **`no`** at the agency question did nothing | `SKIP_WORDS` ran ahead of option matching, so the stored answer `No, I'm not an agency` was skipped rather than chosen. | `polarityMatch()` (`intake/slots.ts:383`), tried before the skip test (`ChatPod.tsx:954`). One option starts with the word → file it; two start with it → name both and ask (`ChatPod.tsx:959-970`) rather than invent a preference the CRM would read as the visitor's. |
| 3 | **Start a project** during a brief was **silently refused** | The reducer refused `START_INTAKE` mid-brief — correctly, it would discard an answered slot — and the refusal emitted no line. | `whereIsTheBrief()` (`ChatPod.tsx:782`) on both routes (chip and typed intent), naming the live question and putting its own buttons back. |
| 4 | The trigger line and the first question **landed out of order** | Two `setTimeout`s racing; the shorter reply won. | Ordered speech queue: `speakAt` / `pendingLines` (`ChatPod.tsx:222-224`) schedule each line to land after the previous one's reading weight, and `typing` clears only when the queue empties. |
| 5 | A stale option chip tap did **nothing at all** | `say()` left the previous turn's chips on screen through the typing beat, and `onChip` returned early on `active !== action.slot`. | The tray is cleared at the top of `say()` (`ChatPod.tsx:227`), and every refused tap now goes through `answerMovedOn()` (`ChatPod.tsx:745`), which names the question it turned down and which one is live. |
| 6 | After a detour the tray held the **wrong question's buttons** | Detour replies carried their own chips. | Detours answer with `chipsForSlot(slot)` (`ChatPod.tsx:991`) — the live question's buttons, always. |
| 7 | 16 service chips + Continue **grew the tray past the panel** | `.tray` had no height budget. | `max-height: 7.5rem`, `overflow-y: auto`, `overscroll-behavior: contain` and the same thin scrollbar as the transcript (`ChatPod.module.scss`, `.tray`). |
| 8 | Progress **moved backwards** on a correction and **stalled** on a skip | It counted filled slots. | While asking, the row shows `Question N of 17` from the slot index; the answered count is shown only when not asking (`ChatPod.tsx:1103`, `1210`). |
| 9 | A mistake two questions back needed a **full stop** | `EDIT_SLOT` was legal only from `REVIEW`. | `editReturn` (`useIntakeFlow.ts:58`, `314`) records where the edit was started from; `advance()` resumes there (`useIntakeFlow.ts:207`) instead of dropping to the card, and `chipsForSlot()` appends a `Back to <label>` chip on every question (`ChatPod.tsx:479`). |
| 10 | Esc during **SUBMITTING** hit a reducer refusal with no feedback | Same class as 3 and 5: a correct refusal, stated as silence. | Esc answers `It is mid-send, so I will not cut it off. One moment.` (`ChatPod.tsx:358`) and leaves the send alone. |

The shape common to 3, 5 and 10 is the finding: **the machine's refusals were right and its lines were
missing.** A visitor does not experience a silent correct decision differently from a dead button, so
every guard in the intake path now says what it turned down and what it would accept instead.

## 7. What was deliberately *not* changed

- **No threshold moved.** `ACCEPT_THRESHOLD`, `ACCEPT_MARGIN`, `FLOOR_THRESHOLD`, `DISAMBIGUATION_WIDTH`,
  `FALLBACK_LIMIT`/`LOCK_AFTER` are the values in `20-` §3. Every fix in §2-§4 is an authoring or an
  evidence change, because a threshold that moves to accommodate a typed message is a threshold that no
  longer means anything.
- **`MatchOutcome` gained no `tier` field.** `lookup()` was gated on a Tier-1 hit while this was being
  built, and the gate was removed. The asymmetry decides it: a detour that turns out to be wrong costs a
  re-read and the live question comes back with its buttons; a question filed as an answer goes into the
  CRM as a lead the studio reads wrongly. `do you do seo` scores 1.000 as a Tier-2 coverage hit and would
  have been missed by a tier gate, so `lookup` takes any accept-level answer.
- **No new dependency, no model, no network call.** The pod is still a dictionary with arithmetic.
- **The payload is unchanged.** Intake still goes through `POST /api/sales-funnel/ingest` byte-for-byte.
- **`looksLikeQuestion()` is not in the resolver.** It lives in `normalise.ts:284` and is used once, at
  defect 1, to decide whether a message typed into a *blank* is a detour or an answer. It reads shape
  (an interrogative opening, or a `?` the visitor put there) and never a score, which is what keeps it
  out of the matcher's way. Six non-questions are pinned as tests because each one is a real answer some
  visitor gives: `Arjun Patel`, `asha@studio.example`, `Kerala, for the temple project`,
  `need a logo and a website`, `no particular deadline`, `anything you can suggest`.

## 8. Evidence

| Suite | Count | Proves |
|---|---|---|
| `tests/unit/chatpod-normalise.test.ts` | 36 | `isScaffold` at its boundaries (abbreviation, one keystroke, the under-five guard, never over a word the corpus uses), `residue` including its keep-unknown-words and all-grammar fallbacks, and `looksLikeQuestion` including the six messages that must stay answers. |
| `tests/unit/chatpod-intake-fsm.test.ts` | 53 | The six machine invariants, the `editReturn` resume point (including across the `categories` detour, the one special case in `advance()`), and `polarityMatch` against the real option sets. |
| `tests/unit/chatpod-intent-resolution.test.ts` | 21 | Every authored phrase, typed as a message, reaching the intent that authored it; the continuity second pass; the company question answered about the company; a mistyped brand name not losing the brand question. |
| `tests/unit/chatpod-matcher.test.ts` | 40 | The contracts from `20-` §3 over this diff: every threshold at its boundary, the two-sided weighting, the family discount table and contested names. |
| `chatpod-contrast.test.ts`, `chatpod-conversation-state.test.ts`, `chatpod-knowledge-coverage.test.ts` | unchanged | The contracts from `20-` and `21-`, still green over this diff. |

Repo-wide: `npm run test:unit` 1308 tests, 0 failures. Typecheck is scoped, because a full
`npx tsc --noEmit` on this repository exhausts the default heap:
`node --max-old-space-size=3072 node_modules/typescript/bin/tsc --noEmit -p tsconfig.podcheck.json`
→ zero errors over `src/app/chat-pod/**` and the chat-pod suites.

## 9. Open, in priority order

1. **Author the contested residues apart** (`work`, `brand strategy`, `pr public relation` — §5). Five
   intents claiming `[work]` is a corpus fact the engine now routes around; writing it apart is cheaper
   than any further scoring change.
2. **A per-intent depth branch for the service pages.** Continuity makes a follow-up *reach* the right
   intent; it does not make that intent say anything it has not already said. `20-` §5's refusal is the
   honest behaviour, and more depth branches are the fix.
3. **The phone-typing corpus.** `typoStems` handles one keystroke; a two-keyword miss (`sercices
   pricing`) is charged to the visitor by design. Whether the studio wants to widen that is a product
   decision, and it should be made with the same probe table rather than by feel.
4. **The LLM phase** remains specified in `20-` §7 and unbuilt. Nothing in this pass is incompatible with
   it; everything in §2-§4 is a deterministic stage a model would have to keep honouring.
