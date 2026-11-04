# 03 — Conversation Script & Intent Table

Every answer below is a **literal** or a **template over the compiled knowledge base**. Nothing is generated at runtime from the visitor's words beyond slot echoes and counts. Each intent carries the `source` it must cite; `knowledge-source-coverage.test.ts` fails the build if any intent lacks one.

**Voice rules enforced on every string:** British spelling; no em dashes; no exclamation marks; no banned vocabulary (seamless, unlock, unleash, leverage, delve, elevate, empower, robust, cutting-edge, game-changer, harness, foster, synergy, holistic, landscape-as-metaphor, "In today's fast-paced"); at most one three-item list per answer; active voice; the studio speaks as "we/our"; dates `en-GB` sentence case ("31 Oct 2026"); brand strings literal (**LinkedIn**, **X**).

**Notation:** `{{kb.path}}` = build-time value. `[chip: label → action]` = quick reply. `→ route` = navigation.

---

## 1. Opening

### `session.open` — first message on panel open
> Hi. I am **{{kb.persona.name}}**, {{kb.persona.roleLine}} for Marca Ubi.
> I can answer questions about what we do, the work, and how a project starts. If you would rather talk to a person, say so and I will hand you the number.

*Not an intent — always the first assistant turn. The AI badge sits in the panel header permanently, so the disclosure is not reliant on this message alone.*

Chips:
`[What do you do? → intent:services.overview]` `[Show me the work → intent:work.overview]` `[Start a project → intake:start]`

---

## 2. Greetings and small talk

### `greeting`
Utterances: `hi`, `hello`, `hey`, `hey there`, `hi there`, `hello there`, `good morning`, `good afternoon`, `good evening`, `namaste`
Keywords: hi, hello, hey, morning, evening
> Hello. What would you like to know about us?

Chips: `[Services → services.overview]` `[Work → work.overview]` `[Start a project → intake:start]`
`source: authored:03-conversation-script.md §2`

### `smalltalk.howareyou`
Utterances: `how are you`, `how are you doing`, `how's it going`, `how have you been`, `you ok`, `you good`
> Running well, thanks. I am a piece of software rather than a person, so my days are consistent. What can I help with?

`source: authored:03-conversation-script.md §2` — the second clause is the honesty badge doing work in copy, not just in chrome.

### `smalltalk.areyouhuman`
Utterances: `are you a bot`, `are you human`, `are you real`, `are you ai`, `are you a robot`, `am i talking to a bot`, `is this a robot`, `what are you`
> I am a bot. Marca Ubi built me to answer questions from what we have already published, so nothing I say comes from a model guessing. A person answers the phone on {{kb.studio.phone}} and at {{kb.studio.email}}.

`source: src/app/components/Sections/MonumentalFooter.tsx:90-98`
**This intent is never suppressed, never fuzzy-matched away, and always answered plainly.** It is the single most important string in the module, and it survives the fallback lock (`ALWAYS_RESOLVABLE` in `src/app/chat-pod/engine/match.ts`).

### `thanks`
Utterances: `thanks`, `thank you`, `thank you so much`, `many thanks`, `cheers`, `ta`, `appreciate it`
> Any time.

Chips: the persistent menu.
`source: authored:03-conversation-script.md §2`

### `goodbye`
Utterances: `bye`, `goodbye`, `see you`, `see you later`, `that's all`, `that is all`, `nothing else`
> Goodbye. The panel stays here if you come back.

*Then closes the panel after 900ms.* `source: authored:03-conversation-script.md §2`

---

## 3. Services

### `services.overview`
Utterances: `what do you do`, `what do you offer`, `what services do you offer`, `what are your services`, `service list`, `your services`, `services`, `what can you do for me`, `help me with marketing`
Keywords: services, service, offer, marketing, do, help
> We publish {{kb.counts.servicePages}} service lines: {{kb.counts.servicesB2B}} aimed at businesses and {{kb.counts.servicesB2C}} at consumer brands. Each one has a page setting out what the line covers.
> Which group is closest to what you need?

Chips: `[Business work → services.b2b]` `[Consumer work → services.b2c]` `[All service pages → /#services]` `[Not sure which → services.whichone]`
`source: ServicesAccordion/types.ts B2B_SERVICES:28 / B2C_SERVICES:130; src/app/services/content.ts SERVICE_DETAILS:95, getAllServiceSlugs():100`

There is no `/services` index route on this site. The catalogue is the homepage accordion, which carries `id="services"` at `src/app/components/Sections/ServicesAccordion/ServicesAccordion.tsx:86`, so "all services" resolves to `/#services`. The blog listing links the dead `/services` today; the pod does not repeat that, and `chatpod-knowledge-coverage.test.ts` fails if a chip points at a route with no page behind it.

### `services.b2b`
> Business-to-business work:
> {{kb.services[split=B2B].title}} — rendered as a list, one line per published page
> Each one has a full page setting out what the line covers.

Chips: one per service slug → `/services/[slug]`, capped at 8, plus `[All service pages → /#services]`
`source: B2B_SERVICES:28; src/app/services/content/b2b.ts`

### `services.b2c`
Same shape over `B2C_SERVICES:130` and `src/app/services/content/b2c.ts`.

### `services.detail.<slug>` — 16 intents, one per slug
Utterances: the published title where it is unique across the sixteen (`Public Relations (PR)` is the title of both a B2B and a B2C line, so it stays a keyword and the two pages surface as disambiguation chips), plus `SERVICE_ALIASES` from `src/app/chat-pod/knowledge/corpus.ts` — `abm`, `demand gen`, `crm`, `loyalty programme`, `paid media`, `seo`, and the rest. Every alias names work the deck itself publishes; a colloquial name no deck carries is not authored.
> {{kb.services[slug].summary}}
> What it covers: {{kb.services[slug].covers[0..2]}}
> Full page: /services/{{slug}}

Chips: `[Open the page → /services/{{slug}}]` `[Related: {{sibling}} → services.detail.<sibling>]` `[Start a project → intake:start]`
`source: src/app/services/content.ts SERVICE_DETAILS:95 + getServiceBySlug():105 + decks b2b.ts/b2c.ts`

### `services.whichone`
Utterances: `not sure`, `which service`, `which service do i need`, `which service is right for me`, `what do i need`, `recommend`, `help me choose`, `i do not know which service`
> Tell me the outcome you are after and I will point at the right line. Are you trying to reach new buyers, build how the brand reads, or get more out of the customers you already have?

Chips: `[Reach new buyers → services.detail.demand-generation]` `[Build how the brand reads → services.detail.integrated-creativity]` `[Get more from existing customers → services.detail.crm-and-loyalty]` `[Show me everything → /#services]`
`source: services/content.ts SERVICE_DETAILS:95`

### `pricing` / `cost` / `rates` / `how much`
Utterances: `how much`, `how much does it cost`, `how much is it`, `how much do you charge`, `what does a project cost`, `what are your rates`, `cost`, `price`, `pricing`, `rates`, `rate card`, `fees`, `what are your fees`, `quote`, `budget`, `expensive`, `cheap`
> We do not publish a rate card, and I am not going to invent a range. Fees depend on scope, markets and duration, so a number from me would be meaningless. The way to get a real one is a short conversation about the project.

Chips: `[Start that conversation → intake:start]` `[Open the full form → /start-project]` `[Email us → mailto:{{kb.studio.email}}]`
`source: static — no rate card exists in the corpus; §00 §4.4 forbids inventing one`

---

## 4. Work

### `work.overview`
Utterances: `your work`, `portfolio`, `case studies`, `case study`, `previous work`, `what have you done`, `show me work`, `show me the work`, `projects`
> The work is published on the site, so I will point you at it rather than describe it. Selected campaigns and the thinking behind them sit on the works page.

Chips: `[See the work → /works]` `[Latest journal entries → work.journal]` `[Start a project → intake:start]`
`source: src/app/works/page.tsx (Selected Works route)`

### `work.journal`
Utterances: `blog`, `journal`, `articles`, `writing`, `thoughts`, `insights`, `latest posts`, `recent articles`, `do you have a blog`, `journal entries`
> The {{kb.counts.journalPosts}} most recent entries:
> {{kb.journal[0..4].title}} — {{kb.journal[i].category}} — {{kb.journal[i].date (en-GB)}}

Chips: one per entry → `/blog/{{slug}}`, plus `[All entries → /blog]`
`source: src/sanity/lib/blog-queries.ts postsQuery:6`
When the compile returns no posts the answer says so and offers `/blog` rather than listing entries from memory. `JOURNAL_LIMIT` is 12; the /blog index remains the full set.

### `work.journal.topic.<category>`
Utterances: category names from `categoriesQuery:51` plus `<category> articles` and `<category> journal`
> Under {{category}}: {{kb.journal[category].title list with en-GB dates}}

`source: src/sanity/lib/blog-queries.ts categoriesQuery:51, postsQuery:6`
Only titles are compiled, so the answer stays inside the twelve entries the pod was given; anything it cannot place says so and offers the index.

### `work.clients`
Utterances: `clients`, `client list`, `who do you work with`, `who are your clients`, `brands`, `references`, `testimonials`
> Names and engagements are published with the work rather than in a logo strip. What I can answer here is how engagements run, which is usually the more useful question.

Chips: `[See the work → /works]` `[How we work → process.overview]` `[Start a project → intake:start]`
`source: src/app/works/page.tsx; no testimonial corpus exists`
**No testimonials are quoted.** None exist in the compiled corpus, and inventing one is a Hard Gate violation (R-18). There is no `/clients` route on this site, so the client question routes to the work.

---

## 5. Process

### `process.overview`
Utterances: `how do you work`, `how we work`, `how does it work`, `how does the process work`, `what is your process`, `your process`, `process`, `what happens`, `engagement`, `onboarding`, `working with you`
> Four principles, in the order we work in: {{kb.process[].title}}: {{kb.process[].body}}

Chips: `[Start with the brief → intake:start]` `[Talk to a person → contact]` `[Open the full form → /start-project]`
`source: src/app/components/HowWeWorkSection/HowWeWork.tsx:11-49`
That cards array is module-private inside a `"use client"` component, so the pod carries a transcription rather than importing a component it cannot render. `chatpod-knowledge-coverage.test.ts` diffs the four title/body pairs against the source file text on every run, so a copy edit in the section fails the build instead of leaving the pod quoting a principle the site no longer makes.

### `process.timeline`
Utterances: `how long`, `how long does a project take`, `how long will it take`, `how quickly can you deliver`, `timeline`, `duration`, `when can you start`, `availability`, `lead time`
> Timelines are set per project. On the brief form you pick yours from a fixed set:
> {{kb.timelines[]}} — rendered as a list, the chip labels the form itself publishes
> We build the plan around the answer rather than the other way round.

Chips: `[Give me your timeline → intake:start]` `[Open the full form → /start-project]`
`source: src/app/lib/intake/intakeOptions.ts INTAKE_TIMELINE_OPTIONS:165-180`
**No durations invented.** `kb.timelines` is compiled from the same array the wizard renders, so the pod cannot offer a window the form does not collect, and the coverage test fails if the printed set drifts from it.

### `process.team` / `people`
Utterances: `who works there`, `tell me about the team`, `team`, `people`, `founder`, `who are you`, `about you`
> Two studios, both in Kerala: {{kb.studio.locations}}. The people and open roles are on the careers page.

Chips: `[Open roles → /careers]` `[Talk to a person → contact]` `[See the work → /works]`
`source: src/app/components/Sections/GlobalLocationsCloud.tsx:14-28; src/app/components/Sections/MonumentalFooter.tsx:110-113`
There is no `/about` page on this site, so the studio answer names the published offices and sends the people question to `/careers`, which is where the studio does publish about its people.

---

## 6. Contact, careers, logistics

### `contact` / `handoff`
Utterances: `talk to a person`, `speak to someone`, `i want to talk to someone`, `real person`, `human`, `phone`, `phone number`, `call`, `email`, `contact`, `contact details`, `how do i contact you`, `get in touch`, `number`, `whatsapp`
> Phone {{kb.studio.phone}}. Email {{kb.studio.email}}. Both go to the studio, and {{kb.studio.locations[0]}} is where most of it happens.

Chips: `[Call → tel:{{kb.studio.phoneHref}}]` `[Email → mailto:{{kb.studio.email}}]` `[Open the full form → /start-project]`
`source: src/app/components/Sections/MonumentalFooter.tsx:90-113`
**This intent always resolves, at any fallback count.** It is the escape hatch and is exempt from the two-strike cap.

### `contact.press`
Utterances: `press`, `press enquiry`, `press enquiries`, `media enquiry`, `press contact`, `media kit`
> Press and media go to {{kb.studio.pressEmail}}.
`source: src/app/components/Sections/ConnectCutout.tsx:80-82`

### `contact.socials`
Utterances: `instagram`, `linkedin`, `twitter`, `x`, `social`, `follow`, `social media`, `social channels`, `your social media`, `where do you publish`
> {{kb.studio.socials[].label}} — rendered as real links, literal brand strings (**LinkedIn**, **Twitter (X)**; the rail label is the one the component publishes)
`source: src/app/components/Sections/ConnectCutout.tsx:7-13`

### `careers.list`
Utterances: `jobs`, `careers`, `hiring`, `are you hiring`, `are you recruiting`, `open roles`, `vacancy`, `vacancies`, `openings`, `career opportunities`, `join`
> {{kb.counts.openRoles}} open roles:
> {{kb.careers[0..5].title}} — {{kb.careers[i].location}}
> Applications go to {{kb.studio.careersEmail}}.

Chips: one per role → `/careers/{{slug}}`, plus `[All roles → /careers]` `[Email careers → mailto:{{kb.studio.careersEmail}}]`
`source: src/sanity/lib/career-queries.ts FALLBACK_CAREERS:101-183, getActiveCareers():188; src/app/components/Sections/MonumentalFooter.tsx:100-103`
When the compile returns no live roles the answer says so plainly and offers `careers@`, because "no roles are listed right now" is the truth the site supports.

### `location` / `office`
Utterances: `where are you`, `where are you located`, `where is your studio`, `your address`, `which city are you in`, `office`, `location`, `address`, `kerala`, `calicut`, `trivandrum`, `india`
> Two addresses, as published in the footer: {{kb.studio.locations[]}}
`source: src/app/components/Sections/MonumentalFooter.tsx:110-113; src/app/components/Sections/GlobalLocationsCloud.tsx:14-28`

### `faq.<n>` — one intent per compiled FAQ
Utterances: the question verbatim, plus its keyword set.
> {{kb.faqs[i].answer}} — copied verbatim from the published FAQ. Never paraphrased.
`source: src/sanity/lib/faq-queries.ts faqsQuery:10, FALLBACK_FAQS:19-65, getFaqs():67`

---

## 7. Intake trigger and exit

### `intake.trigger`
Utterances: `start a project`, `i want to start a project`, `i have a project`, `i need help with a project`, `i need your help with a project`, `brief`, `send a brief`, `submit a brief`, `enquiry`, `enquire`, `hire you`, `i want to hire you`, `can we work together`, `let's talk`, `get in touch about a project`, `new project`, `proposal`, `i would like a proposal`, `work with you`
Keywords: project, brief, enquiry, hire, proposal, start
> Happy to take that. I will ask you a few things, one at a time, and you can stop at any point. Nothing is sent to us until you press send at the end.

*Then transitions to `INTAKE_FORM`, slot 1.* `[Prefer the full form → /start-project]` · exit is a header affordance, not a chip on the answer.
`source: authored:docs/chat_pod/03-conversation-script.md §7; consent line from §01 §8`

### `intake.exit`
Utterances: `stop`, `cancel`, `cancel that`, `stop asking questions`, `never mind`, `back to questions`, `not now`, `exit`
> No problem. Nothing was sent. Your answers stay on this device for {{DRAFT_RETENTION_DAYS}} days if you come back.

*Returns to `CHAT` with slots retained.* Chips: the persistent menu.
`source: docs/chat_pod/01-architecture.md §8; DRAFT_RETENTION_DAYS in src/app/chat-pod/knowledge/corpus.ts`
The retention figure is one constant shared by the copy and the expiry maths, so the pod cannot promise a window the persistence module does not enforce.

---

## 8. Fallbacks

### `fallback.soft` — score ≥0.55, margin <0.15
> That could mean a few things. Which is closest?

Chips: top 3 candidates by score, labelled with the intent's own display name. No "did you mean" preamble.
`source: §01 §4`

### `fallback.hard` — score <0.55, first two occurrences
> I do not have an answer for that. I only know what is published on this site. Here is what I can do.

Chips: `[Services → services.overview]` `[Work → work.overview]` `[How we work → process.overview]` `[Talk to a person → contact]` `[Start a project → intake:start]`
`source: §00 §4.3`

### `fallback.capped` — third occurrence onward
> I am going to stop guessing. I only know what is on this site, and I would rather tell you that than make something up.

Chips: `[Talk to a person → contact]` `[Call → tel:…]` `[Start a project → intake:start]` `[Open the full form → /start-project]` `[Read the journal → /blog]`
*Matcher bypassed for the rest of the session; only chip taps and the `ALWAYS_RESOLVABLE` ids (`greeting`, `thanks`, `goodbye`, `contact`, `intake.trigger`, `smalltalk.areyouhuman`) resolve from here.*
`source: docs/chat_pod/01-architecture.md §4 fallback counter`
The three fallback states live in `FALLBACK_REPLIES`, not in the intent table: they are chosen by the resolver's score, and an intent here would be answerable by typing the words "fallback hard".

---

## 9. Persistent menu

Available as a header affordance and re-offered after any fallback. Never more than five entries:

`Services` · `Work` · `How we work` · `Talk to a person` · `Start a project`

`PERSISTENT_MENU` in `src/app/chat-pod/knowledge/corpus.ts` is the one array; the coverage test asserts both the count and the exact labels.

---

## 10. Intent count and coverage audit

| Group | Shipped |
|---|---|
| Greeting / small talk | 5 (`greeting`, `smalltalk.howareyou`, `smalltalk.areyouhuman`, `thanks`, `goodbye`) |
| Services | 5 + 16 detail intents = 21 |
| Work | 3 + N journal-category topic intents |
| Process | 3 |
| Contact / careers / logistics | 4 + N FAQ intents (`contact`, `contact.press`, `contact.socials`, `careers.list`, `location` is the fifth) |
| Intake trigger / exit | 2 |
| Fallbacks | 3 replies, deliberately outside the table |

23 static intents plus 16 service-detail, one per published FAQ and one per published journal category: **44 with the five published FAQs and no categories in the fixture, and the count rises with the corpus rather than with code.**

Coverage is asserted from the corpus itself, so it cannot drift as content is added:

- `chatpod-knowledge-coverage.test.ts` — sources, alias uniqueness, one intent per slug, verbatim deck and FAQ quoting, counts, routes, schemes, transcription, voice.
- `chatpod-intent-resolution.test.ts` — 107 typed phrases, every authored alias exercised as a visitor message, plus the refusal set.
- `chatpod-matcher.test.ts` / `chatpod-normalise.test.ts` — the threshold arithmetic and the normaliser.

Requirement held at M5 sign-off: **every one of the 16 service slugs has a detail intent quoting a real `SERVICE_DETAILS` summary; every compiled FAQ has an intent that answers with the published text; every journal category has a topic intent.**

---

## 11. Strings that must never appear

Rejected during scripting, recorded so they are not reintroduced:

- "I'm just a simple bot but I'll do my best!" — self-deprecating filler.
- "Great question!" / "Absolutely!" — exclamation-mark cheer.
- "Let me delve into that for you." — banned vocabulary, and there is no delving; the answer is a lookup.
- "We offer seamless, end-to-end solutions." — three banned words in one line.
- "Powered by AI." — it is not. Claiming otherwise would be the one dishonest badge this module could wear.
- Any statistic not present in `kb.counts`.
- Any duration not present in `kb.timelines`.
- Any client name, testimonial, award or case-study result not already published on the site.
- Any service nickname that no deck carries. "logo" and "app development" are plausible requests and are not authored aliases, because routing a visitor to a page that never claims that work is itself a claim.
