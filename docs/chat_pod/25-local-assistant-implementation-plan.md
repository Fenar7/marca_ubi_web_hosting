# Local assistant implementation plan

Status: revised proposal, awaiting explicit implementation instruction.
Date: 4 November 2026.
Basis: [experience audit](./24-2026-11-04-experience-and-services-audit.md), the consolidated hand-off, and the owner's requirement for a production implementation without LLMs or external chat APIs.

This document governs the proposed next remediation. It supersedes earlier proposals where they require qualification before answering services questions, capability enquiries to start intake, or traversal of every optional brief question. Existing code has not changed. Earlier records remain evidence of historical behaviour, rather than acceptance criteria for the redesign.

## 1. Product contract and boundaries

Build a local service guide and project-intake assistant. Visitors can obtain factual answers, explore work, ask for help choosing, contact the studio, or explicitly start a short brief. Each supported task must have a complete path, including correction, cancellation, and recovery.

- No LLM, generative model, external intent API, chatbot SaaS, embedding service, or per-message network request.
- No trained classifier or new runtime dependency in this revision. Use bounded language rules, existing lexical scoring, local content lookup, authored answers, and explicit state transitions.
- Existing server-side CMS collection may continue supplying published content. The final brief continues using the existing `/api/sales-funnel/ingest` endpoint. The restriction concerns new conversational processing services, not removal of the existing website infrastructure.
- Typed messages remain local. Never send transcripts to analytics, search services, or the brief endpoint as an incidental side effect.
- Answer only published, supported facts. No invented prices, delivery promises, capabilities, links, or personalised recommendations.
- Keep the existing frozen lexical thresholds and continuity factor. New language handling must be measured independently of those numbers.
- Keep one content scroller, the deliberate textarea overflow exception, shared viewport locking, Lenis exemptions, IME safety, and accessible motion.
- No unrelated SEO, blog, header, or admin changes. Dead-header deletion and avatar replacement are excluded.

The release target is complete, dependable supported journeys with explicit recovery. No finite rule system can enumerate every possible sentence; unrecognised input must still lead somewhere useful.

## 2. Required journeys

| Visitor task | Required behaviour |
|---|---|
| Learn about the studio | Give the studio description; offer relevant exploration |
| Ask broadly about services | Explain the range immediately; optional B2B/B2C exploration |
| Ask about a particular service | Explain that service from its source; link its real page |
| Ask whether a capability exists | State what the published content supports; offer a next action without starting intake |
| Ask for help choosing | Ask one useful narrowing question and present justified starting points |
| Explore work, process, pricing, location, FAQ, or careers | Supply supported information or a specific limitation and useful destination |
| Contact a person | Show the real contact methods without requiring a brief |
| Explicitly start a project | Enter the brief with existing service interest available for confirmation |
| Ask a question during a brief | Answer or clarify, preserve the draft and pending selections, then visibly return |
| Correct, pause, resume, or abandon a brief | Honour the action without silently submitting or discarding data |

Typing a phrase and tapping a control with the same meaning must produce consistent behaviour. Capability enquiry, service browsing, recommendations, and consent to start a brief are separate tasks.

## 3. Local recognition architecture

Retain the current engine and introduce clearly separated interpretation responsibilities. File boundaries are implementation choices; the responsibilities and invariants below are mandatory.

```text
Typed input or explicit control action
  -> explicit action / active-task boundary
  -> input normalisation preserving original text
  -> bounded request-pattern recognition
  -> topic, service, and modifier recognition
  -> existing authored-intent and lexical resolution
  -> answer / focused clarification / honest recovery
  -> authored response + typed next actions
```

### Input handling

Preserve raw text for transcript and field values. Derive a separate interpretation form for case, punctuation, abbreviations, known spelling variations, and request wrappers. Never store the normalised interpretation as a person's name, company, or project title.

Handle patterns such as `let me know about`, `can you tell me about`, `please explain`, and `I would like information about` as bounded request structures. Match at defined sentence positions, retain the subject, and refuse a rewrite when its conditions do not hold. Do not globally delete words such as let, information, all, or each.

Recognise singular/plural service terms and authored synonyms. Keep typo forgiveness constrained to known vocabulary and existing safety rules. Unknown subject words remain evidence of uncertainty.

Negation, exclusions, and multiple subjects must not be discarded. For example, `not branding, I need PR`, `B2B and B2C`, and `services and pricing` require distinct treatment from bare `branding` or `services`.

### Routing and arbitration

- Explicit control actions use stable IDs and do not pass through text matching.
- Recognise explicit global commands such as stop, back, contact, and review only in the states where their meaning is valid. Do not treat those words inside a longer field value as commands.
- A bounded request wrapper may produce a well-defined topic query for the existing resolver; it must not turn any occurrence of `service` into an automatic answer.
- Exact named services and explicit B2B/B2C qualifiers retain priority over a broad overview.
- Preserve the lexical engine's accept, margin, floor, and continuity rules. Document any structural route ahead of scoring and test its negative cases; do not disguise a policy bypass as normalisation.
- For multiple confidently identified supported topics, answer them briefly in a stable order. If the meaning or answer would be misleading, ask which to cover first. Bound output length and avoid dumping two complete catalogues.
- Do not confuse anaphora such as `the second one` with a fresh topic. Resolve references only against currently valid offered items.

Expose structured reasons in local test/debug output: recognised task, topic, request-pattern match, candidates, score, and clarification reason. Do not render engine internals to visitors or add remote telemetry.

## 4. Answer and catalogue design

The services overview must contain substantive information before an optional question. Use approved summaries derived from the 16 published service lines. Show a small set of useful continuations: Explore all services, Business services, Consumer-brand services, and Help me choose.

Do not show all 16 detail replies in the first turn. The full catalogue is a grouped, scannable list with real names and links. Shared titles, including PR, need explicit audience context or a combined overview with a choice of the two versions.

Service detail must explain purpose and published deliverables. Carry its stable service ID and source route. Recommendations must explain why a service is a starting point, and allow both/neither/not sure where appropriate. Three hard-coded outcomes must not pretend to cover every project.

Prices and timing remain source-backed. If a precise quote or delivery time is not published, state that and offer real contact or an optional brief. Unsupported capabilities get an honest distinction between published offerings and exploratory enquiries; a form option alone is not proof of a published capability.

Revise repetitive or implementation-focused recovery copy. For a genuine PR ambiguity, ask which audience the visitor means. For a clearly broad services request, give the overview instead of asking which catalogue level they intended.

## 5. Interface specification

Use the established white canvas, dark readable text, and brand red `#ea002a`. Antislop applies throughout. Design Read: ENERGY 1 / RHYTHM 2 / MOTION 1. Public chat direction takes precedence over older dark/orange CRM defaults.

Separate presentation roles even if they share an action dispatcher:

| Role | Presentation and semantics |
|---|---|
| Multi-select value | Grouped checkbox row or genuine toggle with a visible selected marker |
| Single choice | Clearly labelled choice controls with appropriate state |
| Continue | Primary command in a stable action area, outside the options wrap |
| Back / pause | Secondary command with a clear destination or effect |
| Navigation | Real link with valid destination and appropriate panel-close behaviour |
| Final submission | Explicit Send brief command, distinct from Continue |
| Conversation suggestion | Secondary follow-up control, not visually interchangeable with a primary task action |

Only actual toggles expose `aria-pressed`. Use labelled groups, associated hints/errors, and a sensible reading order. Announce selection counts without rereading the complete transcript.

### Selection task layout

Keep the active question available while browsing long choices. Group by meaningful category. The action area contains an independent count such as `3 services selected`, a secondary Back action, and Continue. Empty selection must have a clear instruction and validation behaviour; it must not silently advance.

Use the space occupied by the empty generic composer for task controls in selection mode. An explicit Ask a question action reveals a detour composer. Preserve existing typed-answer support, drafts, pending selections, and a clear Return to brief action. Text-entry steps use the composer as the primary workspace with a field-specific label and hint.

Entering a question makes its heading and first choices visible. Appending a normal answer follows only a reader already at the end. Toggling choices preserves scroll and pointer position. Manual scroll takeover remains respected. The latest-message control must not obscure choices or task actions.

Keep a single scroll region and avoid increasing permanent header/footer chrome. Validate the layout against the CSS viewport actually served; screenshot pixel width does not establish the breakpoint. Do not automatically focus text inputs on touch devices when doing so would open a keyboard before the visitor needs it.

## 6. Brief and service-interest data contract

Treat these as separate concepts:

| Concept | Meaning |
|---|---|
| Service interest | Stable IDs from the public service catalogue, possibly both audiences or uncertain |
| Deliverables | Specific items the visitor requests, when known |
| Goal | The visitor's own description of what they need |
| CRM routing | Existing internal enum used by the sales pipeline |

Do not replace canonical design strings with B2B/B2C or infer a legacy deliverable from a vaguely related service. Before structural intake work, produce an explicit table for every public service ID: display name, accepted interest representation, relevant deliverables if any, routing destination, uncertainty handling, and whether the existing contract can preserve the meaning.

The mapping must distinguish a valid broad enquiry from missing required data. There is no permitted fallback that silently files every unmatched service as Other. Where no mapping is justified, preserve the service interest and route to an explicitly supported general-enquiry destination, or leave that structural path blocked until the contract is extended.

Preserve current `/start-project` behaviour unless a coordinated change is required and documented. Update shared schemas, payload construction, review, draft persistence, and CRM handling together if a new field is necessary. Continue using the existing ingestion endpoint and its security boundaries. Do not add a second submission pipeline.

Resolve the historic project-name/company and timeline/budget-bracket meanings explicitly. A real company field must not be conflated with a project title. Unrelated historic data migration is outside scope; new meanings require a compatible representation and auditable handling.

### Proposed short brief

1. Confirm carried service interest, or allow an undecided enquiry.
2. Ask what the visitor needs in their own words.
3. Ask their name.
4. Ask for one reply channel; requesting both email and phone is optional.
5. Offer timing with Not sure and an optional-details path.
6. Review immediately, edit as needed, then explicitly Send brief.

This is the target product flow. Current category/service/timeline client requirements must be reconciled before it can replace the old sequence; do not simply bypass them. Existing optional enrichment becomes Add more details, with Skip remaining and Review brief actions. Progress reflects the actual applicable path, rather than promising 17 questions regardless of choice.

### Ambiguous field answers and interruptions

During a verbatim field, explicit questions may detour. Ordinary valid titles such as `social media` or `Brand & Co` must still store as values. For an ambiguous title/request, preserve the raw text and offer a focused choice: Use this as the project name, or Ask about services. Apply confirmation to genuine ambiguity, not every field.

Use this path to handle both `any discount available` and question-shaped titles such as `Tell Me Nothing`. The old refusal trade-off is a regression case, not a permanent product requirement. Email/phone/URL validation stays field-specific.

Closing or leaving intake preserves unsent answers according to the visitor's saving choice. Reset requires an explicit action. Submission remains terminal until the request returns; retry preserves the intended request and the visitor receives an honest result.

## 7. Recovery policy

- A misunderstanding never removes access to exact supported informational tasks or direct navigation.
- Preserve the frozen fallback constant, but remove the user-visible dead end: exact safe authored information and explicit navigation remain available after misses. Any change to the existing lock policy must be documented and gated.
- For genuine ambiguity, show specific alternatives and a clear way to reject them.
- If no answer is supported, give a short limitation with useful catalogue/contact actions. Do not repeatedly demand different wording.
- For stale references, explain what can currently be selected rather than guessing an old item.
- Unavailable storage, failed content sources, validation errors, and submission failures get distinct visible states. Never fabricate content or silently swallow exceptions.
- No transcript analytics is introduced. Future improvement uses explicitly supplied reproduction phrases and consented research rather than secretly collecting messages.

## 8. Implementation milestones and dependencies

| Milestone | Deliverable | Exit condition |
|---|---|---|
| M0: Baseline and contracts | Confirm actual branch/served build; inventory relevant docs and code; define task/response examples and all service mappings | No unresolved silent data conversion; baseline checks recorded |
| M1: Local recognition | Request patterns, task separation, topic modifiers, protected negative cases, diagnostic reasons | Exact reported phrases and language-family cases pass without threshold changes |
| M2: Authored information | Answer-first overview, catalogue/detail paths, honest capability answers, consistent typed/tapped actions, recovery | Supported questions provide useful answers without unwanted intake |
| M3: Task interface | Distinct choices/actions, grouped lists, accessible semantics, active-question and scroll behaviour, detour composer | Choice, Continue, Back, and Send brief are clear and operable across target layouts |
| M4: Brief model and flow | Approved service mapping, context carryover, short brief, early review, optional enrichment, compatible drafts/payloads | Meaning survives discovery through review and existing ingestion |
| M5: Full verification | Regression matrix, browser journeys, build/types/boundaries, click-through, device evidence, delivery report | Every supported release case passes or is explicitly held from release |

M1/M2 can be validated against controlled fixtures before UI changes. M4 depends on M0 data decisions; visual work must not smuggle in a taxonomy migration. M5 verifies the integrated result, not just each isolated part.

Before future Next.js code edits, read the relevant installed `node_modules/next/dist/docs/` guides. Use a task branch/worktree compatible with the actual current tree; never mix the unrelated SEO work into a chat-pod change. If git actions are later authorised, use Fenar7 identity, explicit staging, and descriptive PR titles without feat. PRs remain open for manual merging.

## 9. Acceptance matrix

Tests must validate response meaning and resulting state, not merely an intent ID or a button's existence. Keep fixtures separate from live-CMS/browser checks.

| Family | Required representative cases | Expected outcome |
|---|---|---|
| Reported failures | let me know about your services; what are the services you do | Immediate substantive overview |
| Request wrappers | please let me know; can you explain; I need information about | Same supported topic; courtesy does not create ambiguity |
| Abbreviations/typos | abt, ur, yu, services typo; knw in the reported wrapper | Covered variants resolve; unknown words are not indiscriminately erased |
| Topic precision | all services; B2B services; B2C services; exact service title | Appropriate breadth and qualifier |
| Shared names | PR; social/influencer service across audiences | Honest combined answer or focused clarification |
| Multiple topics | services and pricing; B2B and B2C | Bounded useful answer or specific choice, without losing a topic |
| Negation | not branding, I need PR; I do not want to start a project | Honour exclusions; no unintended intake |
| Unsupported topics | weather in the studio's city; visa letter; unknown capability | No false factual answer; useful recovery |
| Follow-up | tell me more; second one; that service; stale reference | Valid context used; stale context not guessed |
| Capability vs intent | can you build a website; start a project | Capability answer versus explicit brief entry |
| Typed/tapped parity | What do you do; Explore services; named service | Equivalent meaning across entry methods |
| Field ambiguity | social media; Brand & Co; Tell Me Nothing; any discount available; let me know about services | Preserve legitimate values; confirm genuine ambiguity; no question silently stored |
| Selection | zero/one/many; three categories producing 22 options; change earlier category | Clear validation, stable selection, valid dependent values |
| Interruptions | question mid-selection; contact; back; pause; close/reopen; restart | Draft preserved or explicitly reset; clear return path |
| Short brief | essentials complete; timing unknown; add details; skip remainder | Review reachable; required contract still satisfied |
| Review/edit | change service, name, contact, goal | Review and payload reflect confirmed values |
| Submission | double press; invalid input; 422; network failure; retry; success | Existing safeguards; truthful states; no false server-idempotency claim |
| Persistence | consent yes/no; storage denied; legacy draft; schema change | Explicit storage behaviour and compatible restoration |
| Recovery after misses | two misses then exact services or contact | Supported navigation/information remains usable |
| Content | empty CMS collection; stale service ID; missing route | Supported static information or honest error; no invented links |
| Input | paste; 500-character chat limit; longer allowed brief fields; IME; Enter/Shift+Enter | Intact content and correct submit behaviour |
| Accessibility | keyboard-only; screen reader; focus after actions; selected state | Correct roles, announcements, labels, and focus |
| Geometry | 320/390/768/1024/1280 CSS widths; 1280x400; landscape phone; zoom | Readable question, reachable actions, no overlap or clipping |
| Scrolling/overlays | wheel/touch takeover; late reflow; long list; nav/modal transitions | One owner, no stolen scroll, correct shared viewport release |
| Motion/device | reduced motion; coarse pointer; real iOS/Android keyboard where available | Information preserved; target policy and viewport inset verified |

Create meaningful tests for these business boundaries and regressions, rather than duplicating implementation details. Use held-out phrase variants not copied from authored aliases to assess generalisation within the supported patterns. All release-blocking cases must pass; a percentage score must not hide a failed critical journey.

## 10. Verification and release evidence

Run scoped checks during implementation, then the appropriate integrated gates once the tree is stable:

- Existing full unit suite and new meaningful behavioural tests.
- Scoped pod typecheck including browser specs; whole-project typecheck where the host supports it. Report memory failures separately from type failures.
- Relevant lint with baseline comparison; do not call pre-existing errors clean or introduce new ones.
- Production build and server-action boundary checks where the change affects those paths.
- Updated pod browser suite on the existing port 3003. Probe/reuse the server; do not kill or rebind it.
- Browser verification of answer content, actual actions, data carryover, and the delivered corpus, in addition to fixture probes.
- Test submissions intercepted locally; no unsolicited production lead creation.
- Chrome desktop plus available mobile/WebKit coverage. A CSS contract or emulation is not real-device keyboard evidence.
- A recorded R-35 click-through: browse, select, continue, back, detour, resume, review/edit, submit, error/retry, contact, close, and overlapping overlays.
- A small observed task check with intended visitors: obtain a service explanation, identify Continue without coaching, and complete a brief. If participants/devices are unavailable, report that validation as pending rather than fabricate results.

Publish a four-block delivery report: Hard Gate, Purpose-Gate, Liveliness, and Craftsmanship/Quality Locks. Each PASS needs evidence; uncovered device or participant checks remain disclosed. Existing historic test counts are not evidence for a new implementation.

## 11. Decisions to settle at M0

The following are bounded product/data decisions, not reasons to reopen the no-LLM architecture:

1. Confirm the complete service-interest to CRM mapping, including services without legacy equivalents and undecided enquiries.
2. Confirm the short-brief essentials and the handling of company versus project name. Recommended: goal, name, reply channel, and service interest/undecided; timing optional.
3. Confirm any compatible payload/draft version change needed to preserve those meanings. Do not infer permission for a breaking CRM migration.
4. Confirm available real-device and intended-visitor validation before claiming those checks complete.

No changes are implemented by this document. The next action is explicit owner approval to proceed with implementation; any feedback that changes this plan must be documented before coding begins.
