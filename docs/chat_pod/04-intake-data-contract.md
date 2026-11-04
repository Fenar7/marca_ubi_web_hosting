# 04 — Intake Mode: Data Contract

Verified directly against source on 2026-11-01. Line numbers are current as of `feature/blog-redesign` HEAD.

---

## 1. The pipeline reconciliation (D1 — needs owner confirmation)

**Owner's answer:** "Reuse projectBrief" (Sanity).
**Verified reality:** the live form never touches Sanity.

| | Claimed | Verified |
|---|---|---|
| `/start-project` submit target | `POST /api/submit-brief` → Sanity `projectBrief` | **`POST /api/sales-funnel/ingest`** (`ProjectForm.tsx:128`) → Supabase `leads` + `lead_activities` |
| `/api/submit-brief` status | live | **deprecated** — returns `X-Deprecated-Endpoint`, **zero client callers**; its consumer `ProjectBriefModal` was retired in Phase 13 |

**Recommendation: submit through `/api/sales-funnel/ingest`, exactly as the form does.** Zero server changes. Chat-pod leads then inherit, for free:

- Zod validation (`ingest.ts:33-142`)
- honeypot interception (`route.ts:121-135`)
- 10-per-10-minute token bucket (`route.ts:73-95`)
- 64KB body cap (`route.ts:38,62-71`)
- idempotency key handling
- the dedup state machine (`route.ts:275-536`) — which also resolves the "visitor used both pod and form" case
- the internal alert (`route.ts:512`)
- the pg fallback path (`route.ts:801-850`)

Only two values differ: `source_name` and `source_detail`.

If a Sanity `projectBrief` document is *additionally* wanted, that is a second, additive write and a separate decision. It must not replace the ingest call, or chat-pod leads disappear from the CRM.

---

## 2. Slot map

Source of truth: `ProjectForm/types.ts:1-44` (`ProjectFormData`), collected across the wizard's four steps.

`R` = required to submit · `O` = optional · `C` = conditional

| # | Slot | Wizard origin | Req | How the pod asks | Validation (client, mirrored from `ingest.ts`) |
|---|---|---|---|---|---|
| 1 | `categories[]` → `category` | Step1 | **R** | "What kind of work is this?" — 8 chips from `CATEGORIES` (`Step1Services.tsx:42-51`) | ≥1 selected |
| 2 | `services[]` → `service` | Step1 | **R** | "Which of these?" — chips scoped to the chosen categories from `SERVICES_BY_CATEGORY` (`Step1Services.tsx:129`) | ≥1 selected |
| 3 | `projectName` | Step2 | O | "What are you calling the project?" | ≤120 chars (maps to `company`) |
| 4 | `industry` | Step2 | O | "What industry is it in?" — chips from `INDUSTRIES` | must equal one of `INDUSTRIES` (`Step2Business.tsx:25-35`); ≤100 chars |
| 5 | `projectDescription` | Step2/3 | O | "In a sentence or two, what do you need?" | ≤800 chars |
| 6 | `timeline` | Step3 | **R** | "When do you need it?" — 6 chips from `TIMELINE_OPTIONS` (`Step3Details.tsx:30-63`) | exact match against the 6 `value` strings |
| 7 | `inspirationLinks` | Step3 | O | "Any links to work you like? One per message, or say skip." | collected as an array, **stored `"\n"`-joined** — the form splits on `"\n"` (`Step3Details.tsx:78-79`); max 5 links, ≤255 chars each |
| 8 | `name` | Step2 | **R** | "Your name?" | 1–100 chars, non-empty after trim |
| 9 | `email` | Step2 | **C** | "Best email for this?" | RFC email, ≤255 chars |
| 10 | `phone` | Step2 | **C** | "And a number, in case email is slow?" | ≤50 chars |
| 11 | `website` | Step2 | O | "Your website, if you have one?" | ≤255 chars |
| 12 | `instagram` | Step2 | O | "Instagram handle?" | ≤100 chars |
| 13 | `language` | Step2 | O | "Preferred language for the work?" — chips from `LANGUAGES` | must equal one of `LANGUAGES` (`Step2Business.tsx:14-23`); defaults `"English"` |
| 14 | `agencyStatus` | Step2 | O | "Are you an agency?" — 3 chips | must equal one of `AGENCY_STATUS_OPTIONS` (`Step2Business.tsx:46-50`) |
| 15 | `referral` | Step2 | O | "How did you find us?" — chips from `REFERRAL_SOURCES` | must equal one of `REFERRAL_SOURCES` (`Step2Business.tsx:37-44`) |
| 16 | `showcasePermission` | Step3 | O | "Can we showcase the finished work in our portfolio?" — 2 chips | must equal `"Yes"` or `"No"` (`Step3Details.tsx:215`) — the form offers only these two |
| 17 | `extraNotes` | Step3 | O | "Anything else I should pass on?" | ≤2,000 chars (see §4 cap) |

### The option lists are closed sets, not free text

Six of the seventeen slots are `<select>` or radio fields in the form with **fixed string values**. The pod must present them as chips drawn from the same arrays and must store the **exact string**, not a paraphrase. Anything else breaks payload parity and, for `industry`, produces a lead the CRM cannot filter.

```ts
// Step2Business.tsx:14-23
const LANGUAGES = ["English","Spanish","French","German","Arabic","Malayalam","Hindi","Other"];

// Step2Business.tsx:25-35
const INDUSTRIES = ["Technology","Retail","Healthcare","Finance","Real Estate",
                    "Education","Food & Beverage","Luxury & Hospitality","Other"];

// Step2Business.tsx:37-44
const REFERRAL_SOURCES = ["Google Search","Social Media","Friend or Colleague",
                          "Direct Referral / Industry Partner","Advertisement","Other"];

// Step2Business.tsx:46-50
const AGENCY_STATUS_OPTIONS = ["Yes and I'm interested in agency services",
                               "Yes and I'm NOT interested in agency services",
                               "No, I'm not an agency"];

// Step3Details.tsx:215
const SHOWCASE_CHOICES = ["Yes","No"];
```

**These five arrays must be extracted to a shared module and imported by both the form and the pod**, exactly as `mapCategory` is (§4). Duplicating them is how the two surfaces drift. `AGENCY_STATUS_OPTIONS` contains a curly-ambiguous apostrophe (`I'm`) and a deliberate uppercase `NOT` — both must survive the extraction byte-for-byte, and the parity test asserts it.

**Chip-copy rule for long option strings.** `AGENCY_STATUS_OPTIONS[0]` is 45 characters and will not fit a chip. The chip shows a short label (`Yes, interested` / `Yes, not interested` / `No, not an agency`) while the **stored value stays the exact form string**. The review card shows the stored string, so what the visitor confirms is what the CRM receives.

**`email` OR `phone` is the hard conditional** — `ingest.ts:136-142` `.refine()` rejects a lead with neither. Slot 9 is therefore required; slot 10 is asked but skippable **only if** slot 9 succeeded. If the visitor skips email, slot 10 becomes required and is re-asked with the reason stated.

**Sequencing rule:** required slots first (1, 2, 6), then identity (8, 9, 10), then the optional tail in one batch offered as skippable. Rationale: the visitor should reach "who are you" only once the conversation has earned it, and the optional tail must not feel like an interrogation — each carries a `Skip` chip.

**One question per turn.** No turn asks two things. This is the single highest-impact rule from the intake research (§02 Agent 3).

---

## 3. Turn choreography

```
intake:start
  → [services]      chip grid, 8 categories, multi-select, "Continue" chip
  → [service]       chip grid scoped to selection, multi-select, "Continue"
  → [timeline]      6 chips, single-select
  → "That is the required part done. The rest is optional and helps us prepare."
  → [name]          free text
  → [email]         free text, validated on the turn
  → [phone]         free text, validated on the turn, skippable iff email present
  → optional batch, each with [Skip]:
      projectName → industry → projectDescription → website → instagram
      → language → agencyStatus → referral → inspirationLinks
      → showcasePermission → extraNotes
  → REVIEW card
  → [Send it → submit] [Change something → edit a slot] [Not yet → keep draft]
```

**Review card** — a single structured message, not prose:

```
Here is what I have.

Work            Logo & identity, Web & app design
Services        Logo & brand identity pack, Web page design
Timeline        1 month
Name            …
Email           …
Phone           …
Project         …
Industry        …
Scope           …
Website         …
Instagram       …
Language        …
Agency status   …
Referral        …
Inspiration     …
Showcase        …
Notes           …

Nothing has been sent yet.
```

Each populated row is tappable → `[Edit → slot]` and the FSM jumps back to exactly that slot, keeping everything else. Empty optional rows are omitted rather than shown as "—".

**Submit turn:** send button becomes `aria-disabled` (never `disabled`), a single non-looping progress state, then either the success message or the error path (§6).

Success:
> Sent. It is with the studio now, and someone will come back to you at {{email or phone}}.

Then: draft cleared, panel returns to `CHAT`, one chip `[Ask something else → menu]`.

---

## 4. Payload mapping — byte-for-byte parity with the form

`ProjectForm.tsx:88-119` is the reference. The pod builds the identical object; only two strings differ.

```ts
const payload = {
  name:            slots.name.trim(),
  email:           slots.email.trim() || undefined,
  phone:           slots.phone.trim() || undefined,
  company:         slots.projectName.trim() || undefined,
  company_website: slots.website.trim() || undefined,
  industry:        slots.industry.trim() || undefined,
  service_category: mapCategory(slots.category),        // identical fn, extracted to a shared module
  budget_bracket:  slots.timeline.trim() || undefined,   // NOTE: timeline, not money
  notes:           combinedNotes || undefined,           // identical assembly order
  source_name:     "Chat Pod",                           // ← the only difference
  source_detail:   "Conversational intake (chat pod)",   // ← the only difference
  brief_payload: {
    category: slots.category,          // "Logo & identity, Web & app design" (", " joined)
    service:  slots.service,           // "Logo design, Web page design"      (", " joined)
    services: serviceList,             // string[] from splitting the above
    categories: categoryList,
    language: slots.language,
    projectName: slots.projectName,
    projectDescription: slots.projectDescription,
    industry: slots.industry,
    website: slots.website,
    agencyStatus: slots.agencyStatus,
    referral: slots.referral,
    timeline: slots.timeline,
    inspirationLinks: slots.inspirationLinks,
    showcasePermission: slots.showcasePermission,
    extraNotes: slots.extraNotes,
    instagram: slots.instagram,
    idempotencyKey,
  },
};
```

Headers and transport, identical to `ProjectForm.tsx:128-135`:

```
POST /api/sales-funnel/ingest
Content-Type: application/json
X-Idempotency-Key: <crypto.randomUUID() ?? `brief-${Date.now()}`>
```

**`mapCategory` must be extracted, not duplicated.** `ProjectForm.tsx:57-67` currently holds it inline. Move it to a shared module (e.g. `src/app/lib/intake/mapCategory.ts`), import it in both places, and leave the form's behaviour unchanged. This is the only refactor to existing code the module requires, and it exists so the pod cannot drift from the form's enum mapping (`'Branding' | 'Web & Digital' | 'Mobile Apps' | 'UI/UX Design' | 'Full-Suite Advisory' | 'Other'`, `ingest.ts:19-26`).

**`combinedNotes` must be assembled in the identical order** (`ProjectForm.tsx:76-86`): Project Scope → Requested Services (with count and bullets) → Additional Notes → Inspiration References → Instagram → Agency Status → Referral Channel, `.filter(Boolean).join("\n\n")`.

### The 2,000-character trap

`ingest.ts:99-105` caps `notes` at **2,000 characters**. The form's `combinedNotes` can exceed that once several long fields are filled, which would 422 at the server. The pod must:

1. cap `extraNotes` at 2,000 in the slot validator (already specced);
2. after assembling `combinedNotes`, if `length > 2000`, truncate at the last whole line boundary under the cap and append `\n[truncated in transit — full text in brief_payload]`;
3. keep the untruncated text in `brief_payload`, which is `z.record(z.string(), z.unknown())` and has no length cap.

**Flag to the owner:** the existing form does not do this and can 422 on very long briefs. Fixing it in the form too is a one-line change but is out of this module's scope unless approved.

### Deliberately NOT collected

- **`preferred_channel`** (`ingest.ts:76-80`, enum `Phone | WhatsApp | Email | Meeting`, defaults `'Email'`). The form does not send it. Adding it would break payload parity for no measured gain. **Rejected** unless the owner asks.
- **`expected_value`**, **`source_id`** — internal/CRM fields, not visitor-facing.
- **Any budget or fee figure.** The form has no budget field; `budget_bracket` carries the *timeline*. The pod must never ask "what is your budget" and never imply the field means money.

---

## 5. FSM specification

```ts
type Mode = "CHAT" | "INTAKE_FORM" | "REVIEW" | "SUBMITTING" | "HANDOFF" | "DONE" | "ERROR";

type IntakeState = {
  mode: Mode;
  slotIndex: number;                 // index into the SLOT_ORDER array
  slots: Record<SlotId, string | string[] | null>;
  touched: SlotId[];                 // for the review card's edit affordance
  attempt: number;                   // 0..3
  idempotencyKey: string | null;     // created once per submission intent, REUSED across retries
  error: { slot?: SlotId; message: string } | null;
};

type Event =
  | { t: "START_INTAKE" }
  | { t: "ANSWER"; slot: SlotId; value: string | string[] }
  | { t: "SKIP" }
  | { t: "NEXT" } | { t: "BACK" }
  | { t: "EDIT_SLOT"; slot: SlotId }
  | { t: "SUBMIT" }
  | { t: "SUBMIT_OK" } | { t: "SUBMIT_FAIL"; status: number; message: string; slot?: SlotId }
  | { t: "EXIT_TO_CHAT" } | { t: "HANDOFF" }
  | { t: "HYDRATE"; draft: PersistedDraft }
  | { t: "RESET" };

transition(state: IntakeState, event: Event): IntakeState   // pure, no side effects
```

Rules:

- `ANSWER` validates against the slot's schema before advancing. Invalid → stay, set `error.slot`, re-ask with the specific message. Nothing else is lost.
- `SKIP` on a required slot is refused with the reason ("I need this one to send it") and does not advance.
- `SKIP` on `email` when `phone` is empty promotes `phone` to required and says why.
- `EDIT_SLOT` sets `slotIndex` to that slot; on the next `ANSWER`, the FSM returns to `REVIEW` (not to the next unanswered slot) because `touched` already covers the rest.
- `SUBMIT` creates `idempotencyKey` **once** and stores it on the state. `SUBMIT_FAIL` increments `attempt` and **reuses the same key** — this is what stops retries creating duplicate leads (`ProjectForm.tsx:51-54,121-148`).
- `attempt === 3` → `ERROR` mode with `[Try again → RESET attempt, keep key?]` / `[Open the full form → /start-project]`. Retrying after exhaustion generates a **new** key (the old one may be recorded server-side).
- `EXIT_TO_CHAT` keeps every slot; `RESET` clears them and the draft.
- `HYDRATE` restores a draft only if `draft.generatedAt === knowledge.generatedAt` and `savedAt` is within 14 days; otherwise it is discarded silently and the visitor starts clean.

The FSM is a pure function and is unit-tested exhaustively (`tests/unit/chatpod/intake-fsm.test.ts`) — every transition above, plus the illegal ones (skip-required, submit-when-incomplete, edit-during-submit).

---

## 6. Error handling on submit

| HTTP | Cause | Pod behaviour |
|---|---|---|
| 2xx | success | `DONE`. Clear draft + `localStorage`. Success message with the contact channel used. |
| 422 | Zod rejection | Read `error`/`path` from the JSON body, jump the FSM to that slot, name it in copy: "That email did not look right to our system. Can you check it?" Never a generic message. |
| 429 | rate limit (10 per 10 min) | Honest: "That is too many attempts from here. Call {{kb.studio.phone}} or email {{kb.studio.email}} and we will pick it up." Draft retained. `[Call → tel:]` `[Email → mailto:]` |
| 413 | body over 64KB | Cannot happen (payload is tiny); if it does, log with `console.error` and offer `/start-project`. Never swallow. |
| honeypot trip | `_hp_company_url_confirm` non-empty | Server intercepts silently. The pod never populates it and never renders it. |
| 5xx / network | server or offline | Retry ×3, backoff `attempt * 1000ms`, same idempotency key. Then `ERROR` mode, draft retained, `[Try again]` / `[Open the full form]`. |

---

## 7. Persistence shape

```ts
type PersistedDraft = {
  v: 1;
  generatedAt: string;   // must match the served KnowledgeBase.generatedAt or the draft is dropped
  savedAt: string;       // ISO; expired at 14 days
  mode: Mode;
  slotIndex: number;
  slots: Record<SlotId, string | string[] | null>;
  touched: SlotId[];
  transcriptTail: TranscriptMessage[];  // last 12 only, keeps localStorage small
  consent: true;                        // written only after the consent line is shown
};
// key: "mubi.pod.draft.v1"
```

Cleared on: successful submit, `RESET`, consent withdrawal, expiry, `generatedAt` mismatch.
Never written before consent is acknowledged. Feature-detected; absent storage degrades to session-only with no error.

---

## 8. Parity test (required before M5 sign-off)

`tests/unit/chatpod/ingest-payload-parity.test.ts`:

1. Build a `ProjectFormData` fixture and a `slots` fixture holding the same information.
2. Run the form's payload builder (extracted) and the pod's.
3. Assert deep equality on every key **except** `source_name` and `source_detail`.
4. Assert both pass `ingestLeadSchema.parse()` from `src/app/lib/validations/ingest.ts`.
5. Assert `notes.length <= 2000` for a deliberately over-long fixture, and that the overflow survives in `brief_payload`.
6. **Assert the five closed-set arrays are the identical imported module** in both the form and the pod — same reference, not equal copies. This is the drift guard for `LANGUAGES`, `INDUSTRIES`, `REFERRAL_SOURCES`, `AGENCY_STATUS_OPTIONS`, `SHOWCASE_CHOICES`.
7. Assert every stored slot value for a closed-set slot is a member of its array — including the curly apostrophe in `"Yes and I'm interested in agency services"` and the uppercase `NOT`, byte-for-byte.
8. Assert `inspirationLinks` round-trips: pod array → `"\n"`-joined string → `split("\n")` → same array, matching `Step3Details.tsx:78-79`.

This test is what makes "same as the form flow" a verified claim rather than an intention.
