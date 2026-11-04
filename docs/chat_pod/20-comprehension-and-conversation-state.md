# Chat Pod — Comprehension and conversation state (Part A architecture)

Record date: 2 November 2026. Branch `remediation/turbopack-compaction-dev-server`, PR #107 **OPEN**.
Scope: the resolver (`engine/match.ts`, `engine/normalise.ts`), the conversation layer
(`engine/context.ts`), the wrapper (`engine/useChatEngine.ts`) and the contracts in `types.ts`.
Design Read for this module: **ENERGY 2 / RHYTHM 2 / MOTION 2**.

This file is the mechanism. `01-architecture.md` is the module map, `03-conversation-script.md` is the
copy, `07-delivery-gate-and-verification.md` is the gate. What changed *why* is here, because the two
complaints that opened this phase were both comprehension complaints and the answers are arithmetic.

---

## 1. Why this stays deterministic

The pod answers from what this site publishes, offline, in the client bundle, with no model call and no
network round-trip. That is a product decision, not an optimisation: an answer is only publishable if a
human wrote the sentence it transcribes, and every intent in the table carries a `source` the coverage
test can fail on.

The LLM phase is specified in §7 rather than built. Everything in this file is what that phase will
still need to keep, because a model cannot be held to "no answer without a source" more easily than a
dictionary can.

## 2. What was broken, stated as arithmetic

Two symptoms the owner reported, and their actual causes:

| Symptom | Cause |
|---|---|
| "what are the services available" was not understood | Tier 3's query-side denominator discounted words the corpus had never seen, so a one-word overlap inside a long sentence reached a perfect score, and the polite phrasings that share every topic word with an alias were capped below the accept threshold by a fixed blend. |
| Asking about services printed "there are 16 services" | `services.overview` answered with a headcount instead of the branch the catalogue is actually organised by (B2B / B2C), so the visitor got a statistic where the useful next move was a choice. |

A third defect was found while measuring, not reported: a single authored keyword inside a nine-word
question scored 1.000 at Tier 2, which is how "what is the weather in calicut" came to be answered as
the studio's address. The same arithmetic that fixed the first two fixed this one.

## 3. The three tiers, as shipped

Every threshold below is exported and named, because the acceptance criteria cite them and a drift of a
few points is invisible by hand. **None of them moved during this phase.**

| Constant | Value | Meaning |
|---|---|---|
| `ACCEPT_THRESHOLD` | 0.80 | Best score still treated as a confident answer. |
| `ACCEPT_MARGIN` | 0.15 | How far the leader must clear the runner-up before it answers without asking. |
| `FLOOR_THRESHOLD` | 0.55 | Below this the pod does not guess at all. |
| `DISAMBIGUATION_WIDTH` | 3 | Candidates offered when the leader is a near-tie. |
| `FALLBACK_LIMIT` / `LOCK_AFTER` | 2 | Misses tolerated before ordinary matching switches off. |

**Tier 1 — the authored name.** The normalised message is looked up in a dictionary of every phrase the
table publishes. This tier short-circuits: an alias is a decision somebody made and must not be
outvoted by heuristics.

**Tier 2 — weighted keyword coverage.** Two-sided, deliberately:

```
corpusSide = matchedWeight / totalWeight      // how much of the intent's own subject the visitor said
querySide  = min(1, matchedCount / queryTopics) // how much of the visitor's subject the intent claims
score      = sqrt(corpusSide * querySide)
```

The geometric mean is the fix. Averaging or taking the max lets an intent with one keyword answer a
sentence about something else; multiplying means a one-sided match is never confident.

**Tier 3 — lexical containment over the aliases.** Same two-sided shape per authored phrase
(`aliasSide`, `covered`), then character similarity fills only the gap containment left:

```
lexical   = sqrt(aliasSide * covered)
candidate = lexical + (1 - lexical) * trigramSimilarity(query, alias)
```

so spelling tolerance can never carry a message that shares no topic word. Edit distance participates
only when both sides are exactly one word, where trigram overlap degenerates and a typo is the honest
thing to measure.

## 4. Two decisions that are load-bearing, and the lesson behind each

### 4.1 A word we do not publish is charged to the visitor's denominator

The query-side count includes words the corpus has never seen. Discounting unknown words would let
"what are the services available" pass on "available" being ignored, and it would also have made
"what is the weather in calicut" a perfect 1.000 match for the studio address, because the only word
the corpus knows in that sentence is a city name. That was measured, not predicted. Half-charging
unknown words was tried (α = 0.5) and still returned 0.84 on the same query, which clears the accept
threshold and lies.

**The rule that came out of it: a phrasing the pod must understand is authored, not assumed.** This is
why the corpus grew interrogative forms ("what are the services available", "do you offer branding")
instead of the thresholds moving.

### 4.2 A contested name is a fact about the catalogue, not a bug in the dictionary

Both halves of the service catalogue publish a line titled *Public Relations (PR)*. The dictionary used
to be first-wins, so the authoring layer suppressed the duplicate title and pushed the phrase down to
keyword arithmetic, which answered "public relations" with whichever deck carried more keywords. That
is the arbitrary behaviour the margin rule exists to prevent, produced by the layer that was supposed
to prevent it.

The index now maps each name to **every** intent that claims it (`exact: Map<string, Intent[]>`, and
`bare` for one-word aliases). A contested name returns all owners at score 1, `decide` sees a tie with
zero margin, and the visitor gets both pages as chips. Authoring is instructed to write the shared name
on every owner rather than suppressing it on one.

### 4.3 Family discounts

`INTENT_DISCOUNTS` multiplies a rank after scoring, by longest matching id prefix:
`smalltalk.` 0.82, `work.journal.topic.` 0.88, `faq.` 0.90.

These are real intents with real answers whose subject words are also ordinary conversation:
`smalltalk.areyouhuman` authors "what are you", so any "what are the …" sentence reached it and a
visitor asking about services was offered the chip "Are you a person?". A discount, not a deletion —
each still wins when its own words are the ones the visitor used ("are you a bot" still answers). It is
policy about how ranks are compared, so it lives in the matcher, not on `Intent`: an author editing the
corpus must not be able to change it by accident.

### 4.4 Keyword hygiene

Stop-words are dropped at every position of an intent's `keywords` list, not only the first, then the
first survivor carries the topic weight and the rest 0.6. "services, service, offer, marketing, do,
help" made a perfect question about the studio's offering score 0.55 on its own subject because two
thirds of the denominator was grammar. An intent whose whole list is scaffolding keeps the raw list: an
unmatchable intent is worse than a loosely weighted one.

## 5. The conversation layer (`engine/context.ts`)

`match.ts` is a pure function of one message, which is correct for a first question and is exactly why
"tell me more", "the second one" and "brand identity" were being re-ranked as if they were new topics.
This layer adds the previous turn and a closed vocabulary for reading a reference back to it.

**State** (`TurnState`): the intent the last turn answered (`intentId`, null when the turn asked a
question), the chips that were on screen in reading order, and a fingerprint of the blocks that were
rendered.

**Three things a follow-up can be:**

1. **Depth** — the message is one of the authored depth idioms ("tell me more", "go on", "elaborate",
   "deep dive"). The engine re-answers the recorded intent with `{ expanded: true }`. If that intent has
   no deeper branch, the blocks come back identical to the fingerprint, and the pod says so instead of
   repeating itself.
2. **Selection** — an ordinal ("the second one", "1st", "option 3") indexes the chips in the order the
   visitor read them. A picked chip that is another intent is answered; a picked chip that is a page,
   the brief, or the menu is *handed over* (`Turn.kind === "offer"`), because the resolver cannot
   navigate and pretending not to understand would be worse.
3. **Naming** — the message equals a chip label, compared with every non-alphanumeric character removed
   on both sides, so "Public Relations (PR)" is named by "public relations pr" and "publicrelations
   (pr)" alike.

**Guard rails, in the order they are applied:**

- **Authoring outranks idiom.** `isAuthoredName` is consulted first: nothing an intent publishes under
  that exact phrase is ever read as a reference. The predicate is the same one `rank` uses, so the two
  cannot disagree about what "authored" means.
- **A numeral is only a selection when it is alone or carried by a selection word** ("the", "option",
  "pick", "number"), in a message of six words or fewer. "can we do one thing" and "how much for two
  campaigns" contain numerals that count something; answering those by tapping the last chip on screen
  would be putting words in the visitor's mouth. A false negative costs one re-ask, a false positive
  costs trust, so the set is closed and the shapes are narrow.
  A spelled ordinal makes the sentence an ordering, and so does its typed form: "the 9th one" carries a
  suffix *and* the pronoun "one", and reading both as numbers scored two hits, which is not a selection,
  so the message fell through to the matcher and came back as "nothing published matches that". The digit
  suffix is now the same signal as the word, which is what makes "the ninth one" and "the 9th one" both
  reach the honest answer: the size of the list the visitor is looking at.
- **A follow-up never spends a fallback.** The pod understood the sentence; the conversation simply had
  nothing for it to refer to, which is answered honestly and leaves the three guesses untouched.
- **The refusal clears the subject but keeps the controls**, so a visitor who was just told "nothing
  published matches that" can still count the menu the pod offered.

`seedTurn` exists for one case the resolver cannot see: a restored draft leaves the persistent menu on
screen while the engine still remembers the opening, and without it a returning visitor's "the second
one" is answered from a list they are not looking at. What was on screen survives a reload; what it was
an answer *about* does not, so after a reload selection works and depth declines honestly.

## 6. Contracts that changed in `types.ts`

- `AnswerContext { expanded?: boolean }` and `respond: (kb, ctx?) => Reply`. Optional at the call site
  so every intent authored before this concept keeps compiling; an intent that ignores `ctx` is not
  wrong, it simply has no deeper version to give.
- `Turn` gained `offer`, the shape a reference to the screen produces. The panel renders its reply like
  any other; there is no intent behind it and nothing to answer with.
- `ChipAction` was **not** widened. A depth request is a sentence the visitor types, not a control the
  pod can put on screen, and a field no renderer consumes is dead weight.

## 7. Where a model goes later, and what must stay

The seam is `useChatEngine.ask`: one string in, one `Turn` out. The LLM phase can add a fourth stage
*below* Tier 3 for messages that reach the floor, and a re-ranker between the ranked list and `decide`.
What cannot move into a model:

- **Tier 1 and the margin rule.** A model cannot be held to "only what a human authored" more cheaply
  than a dictionary can, and the two PR decks sharing a title is a fact the corpus states.
- **`ALWAYS_RESOLVABLE` and the lock.** The escape hatch after two misses is a promise to the visitor.
- **Every answer string.** `Intent.respond` stays transcription. A generated sentence is not publishable
  on a site whose entire claim is that the assistant quotes it.

## 8. Evidence

| Suite | Proves |
|---|---|
| `chatpod-matcher.test.ts` | Every published threshold at its exact boundary, the two-sided weighting arithmetic, the family discount table, contested names disambiguating, and that a mixed-subject sentence stays below the accept threshold. |
| `chatpod-intent-resolution.test.ts` | The authoring contract end to end over the real corpus: every authored phrase, typed as a message, must reach the intent that authored it; and the phrases the studio must refuse must not be answered. |
| `chatpod-normalise.test.ts` | Normalisation idempotence, the stop-word set, the stemmer's one-way lossiness, trigram padding, edit distance. |
| `chatpod-conversation-state.test.ts` | The reference layer: what a follow-up may point at and, case by case, what it must never steal. |
| `chatpod-knowledge-coverage.test.ts` | Provenance, banned vocabulary, real route targets, the sanctioned shared-name list, the plain-JSON props boundary. |

`tsc --noEmit` zero errors; `npm run test:unit` green across the repository; `npm run test:boundaries`
green; `eslint` clean over `src/app/chat-pod/engine/`.
