# Chat pod experience and services audit

Recorded: 4 November 2026. Research and recommendations only; no product implementation.

## Assessment

The pod currently makes visitors work too hard to get straightforward information and complete a brief. Three independent research agents reviewed conversation matching, interface accessibility, and the intake/data model. The lead agent inspected the screenshots and reproduced the reported interaction on the existing local server.

The problems occur at several layers:

1. Common request wording can miss an otherwise obvious service intent.
2. A successful service match deliberately answers with a qualification question.
3. Choices, navigation, Continue, and submission share the same visual treatment.
4. The brief asks visitors to navigate a different service taxonomy from the public catalogue.
5. Technical tests preserve some of the behaviour the owner now rejects.

Improving the colours alone would leave the main usability problems intact. The recommended direction is to answer information requests directly, make narrowing optional, and present brief collection as an explicit task with recognisable actions.

## Evidence and limitations

The consolidated hand-off is `docs/context/2026-11-04_11-35-00.md`. Its branch/head describe a historical snapshot. The actual working tree during this review was `seo-ai-search/llm-indexing-and-search-dominance`, HEAD `ca0eeb2`, with pre-existing tracked changes and untracked documents. No branch switch, staging, commit, push, merge, or product edit was performed.

Screenshots inspected:

- `C:/Users/firoz/Pictures/Screenshots/Screenshot 2026-11-04 115919.png`: first work-type selection and indistinct Continue.
- `C:/Users/firoz/Pictures/Screenshots/Screenshot 2026-11-04 115936.png`: long service list, question out of view, Continue beside Back.
- `C:/Users/firoz/Pictures/Screenshots/Screenshot 2026-11-04 120213.png`: service clarification and floating jump control.

Fresh checks:

- Existing comprehension probe using the current resolver/service files and its fixture CMS inputs.
- Headless Chromium on the existing `http://127.0.0.1:3003/blog`, at a 1280 by 800 viewport.
- Both exact service phrases submitted in isolated browser sessions.
- Brief started explicitly through the menu, with Logo & identity, Web & app design, and Packaging & label selected; continued to the next question.
- DOM attributes, visible text, and computed styles inspected.
- Viewport changed to 390 by 844 to inspect the current sheet geometry.

The preferred agent-browser CLI was unavailable; its no-install invocation did not complete and was cancelled. The live check used the project's installed Playwright package. No brief was submitted, no contact information entered, and the server was neither restarted nor rebound.

The probe's CMS content is a fixture, not an export of the browser-delivered corpus (`scripts/chat-pod/probe-comprehension.mts:7`). Scores below belong to that fixture. The live browser independently reproduced the two headline outcomes.

Historical 1,334 unit passes, 44 browser passes, build and typecheck results were read from the hand-off. They were not re-run or re-certified here. This is an expert inspection and reproduction, not participant usability research. Real-device keyboard behaviour and screen-reader announcements remain untested.

## Findings

### 1. A services answer is deliberately replaced with qualification

Priority: high. Confirmed in source and live browser.

`what are the services you do` resolves to `services.overview`, but its authored answer opens:

> Who do you sell to, other businesses or consumers?

It then gives service counts and offers branch choices. The visitor has asked what the studio offers; the pod asks the visitor to classify themselves before providing that explanation.

Evidence: `src/app/chat-pod/knowledge/intents.ts:262`, particularly the response at line 295. Live Chromium showed the same wording and counts of eight business-facing and eight consumer-facing lines.

B2B/B2C is a useful way to organise the catalogue. It should be an optional way to explore it. A visitor should receive a useful overview even if they never select another control.

Recommended response shape: a concise factual description, examples of the work, and optional routes to all services, business-facing work, consumer-brand work, or help choosing. Ask about audience only when the visitor requests a recommendation or tailoring.

### 2. Polite wording still breaks recognition

Priority: high. Measured by probe and corroborated live.

| Phrase | Fixture resolver result | Overview score |
|---|---|---|
| let me know about your services | Clarification | 0.785 |
| let me know your services | Answer | 0.801 |
| let me know about services | Clarification | 0.798 |
| let me know about your service | Clarification | 0.756 |
| please let me know about your services | Clarification | 0.771 |
| let me knw abt ur services | Clarification | 0.709 |
| what are the services you do | Answer | 1.000 |
| tell me about your services | Answer | 1.000 |
| what services do you offer | Answer | 1.000 |
| i need information about your services | Clarification | 0.670 |
| explain each service | Clarification | 0.775 |

The exact first screenshot phrase also produced the generic clarification in the live browser, with choices What we do, Business work, and Consumer work.

`QUERY_STOPWORDS` includes know, me, about, and your, but excludes let (`engine/normalise.ts:65`). The residue retains `let` alongside the service subject. The clean service residue can take the authored-owner route, while this extra token sends the phrase through fuzzy scoring. Adding or removing ordinary courtesy words then changes the result around the frozen 0.8 threshold.

Recommended repair: bounded handling of request phrases such as `let me know`, accompanied by off-topic and proper-name controls. Review question-shape detection as well as ranking. Do not globally remove unknown words, reduce the thresholds, or keep adding only the exact latest sentence. Those approaches either weaken unrelated safeguards or leave the failure class intact.

### 3. Continue is visually indistinguishable from an answer

Priority: high. Confirmed in screenshots, code, and live DOM.

`ChatPod.tsx:505` constructs one array containing selectable options, Continue, and Back. `ui/ChipRow.tsx:32` renders all entries with the same `.chip` class. Selected options receive the stronger black-fill `.chipOn` style (`ChatPod.module.scss:934`); Continue remains white and outlined.

This reverses the hierarchy needed to complete the task. The interface emphasises what is already selected and understates how to proceed.

Recommended repair:

- Present options as selectable rows or clearly marked toggles.
- Give selected values an explicit checkmark and restrained selection treatment.
- Put Continue in a consistent action area, separate from options.
- Show the count independently, for example `3 services selected`.
- Use one primary action for the current task. Keep Back secondary.
- Apply the same distinction to review and final Send brief, rather than fixing only the first two steps.

This recommendation follows the functional distinction in the [GOV.UK button guidance](https://design-system.service.gov.uk/components/button/): a main action should be readily identifiable, and its wording should communicate its effect.

### 4. Ordinary actions are incorrectly exposed as toggles

Priority: high. Source confirmed and partly verified live.

`ChatPod.tsx:1187` returns a boolean selection state for every chip. `ChipRow.tsx:41` places it in `aria-pressed`, including false for non-toggle actions.

The live DOM confirmed `aria-pressed="false"` on Continue and on ordinary clarification actions. These controls perform commands; they do not toggle a pressed state.

Recommended repair: emit pressed state only for genuine toggles, or use native checkbox inputs for multi-select choices. Continue, Back, links, and submission must retain appropriate command/navigation semantics. [W3C's button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) documents this distinction.

### 5. A long list separates the question from its answers

Priority: high. Visible in screenshot two; structure reproduced live.

The three work types selected in the screenshot yield 22 service choices. The live browser showed all 22 followed by Continue and Back to Work in one wrap. They have no visible category headings.

`intake/slots.ts:338` concatenates services under all selected disciplines. `Transcript.tsx:172` follows the floor of the conversation, which includes that list. Reaching its bottom exposes the action but can move the question out of sight.

Recommended repair: retain one content scroller, group choices by the selected work types, keep current-question context available, and keep the action reachable independently of the last option. Entering a task should show its question and first choices; ordinary message arrival and task entry need distinct scroll policies. Preserve manual takeover and selection stability.

Do not restore a separate scrolling chip rail. A fixed action footer outside the single content scroller does not require a second scroll owner.

### 6. Public services and brief options describe different offerings

Priority: high. Confirmed across catalogue, shared options, and payload code.

| Public catalogue | Brief intake |
|---|---|
| 16 service lines grouped under B2B and B2C | Eight design disciplines containing 52 deliverables |
| Demand Generation, Account-Based Marketing, Corporate Communications, Customer Marketing | Logo & identity, Web & app design, Book & magazine |
| Integrated Creativity, Digital Performance, CRM & Loyalty, Live Experiences | Icon or button, Facebook cover, Tattoo, Cup or mug |

Evidence: `src/app/services/content/b2b.ts`, `b2c.ts`, and `src/app/lib/intake/intakeOptions.ts:22`.

A visitor can discover Account-Based Marketing but cannot select that same service in the brief. A visitor can select design deliverables that the discovery conversation cannot explain well. The measured phrase `do you do ui ux` fell back despite related intake options.

Recommended direction: distinguish public service interest, requested deliverables, and internal routing category. Connect them through explicit mappings. Preserve a chosen service visibly when the visitor elects to start a brief.

Simply replacing the eight categories with B2B/B2C would be unsafe product modelling. Existing strings are canonical values shared with `/start-project`; category derivation, schema membership, old drafts, routing, and parity tests rely on them. Some public service lines have no honest one-to-one mapping to old design deliverables.

### 7. Capability questions can start a form without answering the question

Priority: high. Probe measured; controller path confirmed.

`can you build a website` resolves to `intake.trigger` at 1.000. That intent also authors capability phrases such as `do you build apps` (`intents.ts:799`). In chat mode the controller immediately starts intake (`ChatPod.tsx:1100`).

A capability question is different from an explicit decision to provide a brief. Answer supported capability facts first, then offer to discuss a project. Preserve direct entry for explicit Start a project actions. Do not invent service-page URLs or promise capabilities solely because a legacy form accepts an enquiry.

### 8. Seventeen questions are treated as the normal completion path

Priority: medium to high. Source confirmed; abandonment impact is unmeasured.

`SLOT_ORDER` defines 17 slots (`intake/slots.ts:121`). Many are optional, but optional currently means individually skippable. The state machine has no Review now or Skip remaining optional details event; review normally follows the last slot (`useIntakeFlow.ts:185`).

The path puts timeline before a description of the goal, and puts project scope in the optional tail. Website, Instagram, referral, showcase permission, and other enrichment still require traversal.

Recommended direction: agree on a short useful brief and offer review once its essentials are present. Make additional detail an explicit choice. A candidate sequence is goal/service interest, name, one reply method, optional timing, then review. This is a proposed product contract and requires reconciliation with current client requirements and CRM routing before implementation.

Do not merely hide the 17-step count while preserving all 17 interactions. [GOV.UK question guidance](https://design-system.service.gov.uk/patterns/question-pages/) recommends knowing why each question is necessary and asking only for information the service needs.

### 9. Service context is lost on the way to a brief

Priority: medium to high. Source confirmed.

Service-detail replies know the service slug and offer an ordinary `asChip.intake()` (`intents.ts:863`, `:902`). Intake starts generically with `START_INTAKE` (`ChatPod.tsx:729`). The visitor must classify their work again.

Recommended repair: carry a selected service as visible interest, ask the visitor to confirm it, and let existing draft choices take precedence. Preserve meaning in the final payload. Do not silently translate an unsupported service into an arbitrary legacy category.

### 10. Identical wording has different meanings when typed and tapped

Priority: medium. Probe and source confirmed.

The opening `What do you do?` chip routes to services.overview (`intents.ts:1028`). Typing the same phrase resolves to identity.studio (`intents.ts:214`). Currently one path describes the studio, while the other asks about the visitor's audience.

Recommended repair: align the destinations, or give the chip an accurate label such as Explore services. Test semantic parity between typed and tapped equivalents.

### 11. Error recovery and clarification need a product review

Priority: medium. Source confirmed; not the immediate cause of screenshot one.

Generic clarification says `A few published things match that` (`intents.ts:1052`). For the reported phrase it offers an overview and two subcategories of the same topic, making the visitor repair the catalogue hierarchy rather than clarify an ambiguous subject.

Two accumulated hard fallbacks eventually lock ordinary matching; later successes do not reset that count (`useChatEngine.ts:151`). Services is not in the always-resolvable set (`match.ts:105`). Clarifications do not spend those misses, so this did not cause the reported first response.

Recommended direction: use specific clarifications only when there is genuine ambiguity. Review whether safe authored information should remain accessible after misses, or provide an explicit restart. This changes documented policy and needs approved acceptance criteria.

### 12. Secondary chrome competes with the active task

Priority: medium. Screenshot and source evidence.

The empty generic composer stays visible during selections, alongside Send, a saving-preference row, timestamps, progress, Menu, and Close. The active selection task has little visual priority. The jump control visibly overlays conversation content in screenshot three.

Recommended direction: in selection mode, use the bottom area for the selection summary and primary action, with an explicit Ask a question detour. In text-entry mode, restore the composer as the main workspace. Preserve typed-answer support deliberately. Keep privacy controls accessible and honest, but visually secondary. Validate that the jump control never obscures active choices or actions.

## Proposed experience

### Information journey

1. Visitor asks about services.
2. Pod immediately describes the kinds of work using published content.
3. Optional controls expose all services, business-facing work, consumer-brand work, and help choosing.
4. Service details explain the service and provide its page link.
5. Only an explicit project action starts brief collection.
6. Direct contact remains available without a brief.

Illustrative first answer, to be checked against the final content contract:

> We work across marketing campaigns, creative and brand work, content, PR, digital performance, customer loyalty, and live experiences. Our services cover both business audiences and consumer brands.
>
> You can explore the full range or ask about a particular service.

Controls: Explore all services; Business services; Consumer-brand services; Help me choose.

The examples summarise current published service families. They are proposed copy, not newly promised deliverables. Google’s [informational-response guidance](https://developers.google.com/assistant/conversation-design/informational-statements) supports supplying the relevant answer and using chips for optional continuations.

### Brief selection workspace

```text
Ubi                                      Menu   Close
Digital assistant

Your brief
Which services do you need?
Choose any that apply.

Web & app design
[ ] Web page design
[x] App design
[ ] Landing page design

Packaging & label
[x] Product packaging
[ ] Product label

              One scrolling content region

2 services selected
Back to work types                         [Continue]
Ask a question
```

This wireframe illustrates action hierarchy using the current data. It does not approve that taxonomy as the final product model. Grouped checkbox rows are suitable for long selections; the [GOV.UK checkbox pattern](https://design-system.service.gov.uk/components/checkboxes/) provides a semantic reference.

Use the established public white canvas and brand red `#ea002a`. The older dark/orange defaults in DESIGN.md describe a different direction and should not override the chat-pod hand-off. Design Read: ENERGY 1 / RHYTHM 2 / MOTION 1. The visual purpose is legibility and clear task progression; motion should preserve context rather than decorate every choice.

## Accessibility and geometry cautions

- The action/toggle semantic defect is confirmed. A full accessibility certification is not implied.
- Desktop chips measured approximately 33 CSS pixels high during the live pass. The code raises targets to 44 pixels for coarse pointers. These are different input conditions.
- WCAG 2.2 AA target size generally uses 24 by 24 CSS pixels with exceptions; 44 pixels is a stronger design target, not the universal AA minimum. See [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- Do not infer a contrast failure from screenshot colours. Use computed/composited colours and the actual background. The weak action hierarchy is a usability problem independently of contrast compliance.
- Live 390 by 844 geometry produced a full-width, full-height panel with zero corner radius. The narrow screenshots show a floating rounded panel. Their CSS viewport/build is unknown; image width is not a reliable viewport measurement.
- Real-device keyboard inset, zoom, focus visibility beneath the proposed footer, and screen-reader announcements require fresh verification.

## Recommended scope and order

### First: correct the immediate experience without changing stored meanings

Separate choices and task actions; correct aria-pressed; make Continue and Send brief recognisable; group long lists; retain question context; answer broad services questions before qualification; handle the demonstrated request-wrapper family with protected negative controls; align typed/tapped wording.

### Second: reconcile discovery and brief collection

Define service interest separately from deliverables and CRM category. Preserve interest across the transition. Separate capability enquiry from form entry. Agree on essentials, early review, and optional enrichment. Define unsupported/uncertain requests honestly.

### Third: validate the changed product contract

Replace assertions that require qualification-first answers. Keep the useful scroll, lock, accessibility, submission, and parity safeguards. Run phrase and journey checks on both controlled fixtures and the actual browser-delivered corpus. Then conduct a small observed usability check with intended visitors before calling the new hierarchy proven.

No larger model, new dependency, chat endpoint, or threshold reduction is necessary to address the demonstrated headline failures. The deterministic constraint does mean language coverage remains bounded; the interface should make those boundaries recoverable.

## Data-contract risks to resolve before structural changes

- Shared intake strings are canonical CRM inputs, not disposable display copy.
- `intake/review.ts:44` derives categories from selected services, rather than copying the category taps.
- `lib/intake/intakeOptions.ts:217` reduces disciplines into six CRM enums; B2B/B2C are not those enums.
- Current payload conventions submit project name into company and timeline into budget_bracket. A revised model should document these meanings explicitly.
- Existing drafts need migration or compatible restoration if question IDs or value sets change.
- `/start-project` must preserve compatible meaning; parity cannot be maintained by silently dropping newly captured service interest.
- Unmapped service lines require an explicit handling policy. Mapping everything to Other would lose useful intent.

## Acceptance criteria

1. Both exact screenshot phrases receive substantive services information before a qualification question.
2. Request wrappers and typo variants are covered as a family; first contact does not depend on a previous services turn.
3. Unrelated questions, multi-topic requests, proper names, and legitimate project titles retain safe behaviour.
4. Broad requests stay broad; explicit B2B/B2C requests are respected.
5. Capability enquiries do not begin brief collection without an explicit project action.
6. Continue is identifiable independently of reading the instruction sentence and is separate from selectable values.
7. Only true toggle choices expose a pressed state; command buttons and links have appropriate semantics.
8. Long selections retain question context, visible grouping, selected count, and a reachable next action.
9. Selecting an option does not move its target, add transcript noise, or unexpectedly change scroll position.
10. One content scroller is retained; composer overflow remains its deliberate exception.
11. A question detour preserves pending selections and visibly returns to the same task.
12. A chosen public service survives into the review and payload without a silent unrelated mapping.
13. Once agreed essentials are present, review is available without individually skipping every optional question.
14. Final submission is explicitly labelled Send brief, with clear pending, success, failure, and retry states.
15. Human contact works without completing intake.
16. Old drafts and full-form submissions preserve meaning after any model change.
17. Keyboard order, visible focus, touch, reduced motion, short windows, safe areas, zoom, and real soft keyboards are exercised.
18. Review success measures whether visitors obtain an answer and understand how to proceed, alongside technical assertions.

## Four-block delivery gate for this report

| Block | Status | Evidence or remaining work |
|---|---|---|
| Hard Gate | Product not certified | Confirmed semantic and experience defects; no implementation supplied. Contrast, full accessibility, and real-device claims are not newly certified. |
| Purpose-Gate | Research complete | Every proposed change addresses a traced task failure: answering, selection, progression, context, or data meaning. |
| Liveliness | Direction recorded; design untested | White/red public direction and restrained motion documented. Wireframe is illustrative. No rendered redesign or preference study exists. |
| Craftsmanship and quality locks | Partial verification | Exact service failures and first two selection steps reproduced live; source/data contract traced. Fresh full gates belong to a subsequent approved implementation. |

R-35 click-through evidence for this investigation: opened Ubi on /blog, declined local saving, submitted each reported service phrase in a fresh session, opened the menu, started a brief, selected three work types, and continued to the 22-option service list. No final submit, retry, full review/edit path, real-device keyboard test, or exhaustive control sweep was performed. This is not an approval-ready product delivery report.

The user authorised analysis and a detailed report. Implementation, taxonomy migration, deletion of dead shared header files, pushes, and PR changes are outside this report. All existing PRs remain for manual human review and merging.
