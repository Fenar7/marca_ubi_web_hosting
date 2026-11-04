/**
 * @file types.ts
 * @description Shared contracts for the Chat Pod. The split is deliberate:
 *              `KnowledgeBase` is *data* compiled on the server and serialized into props,
 *              while `Intent` is *code* that ships in the client bundle. Keeping them separate
 *              is what lets the pod answer without a network round-trip: the functions never
 *              cross the boundary, only the facts they read do.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

/** A single compiled service line, flattened from the accordion card plus its detail deck. */
export interface KnowledgeService {
  slug: string;
  title: string;
  split: "B2B" | "B2C";
  /** The published deck's `shortDescription`, copied not paraphrased. 211-290 chars across the
   *  16 decks, which wraps to a few lines in the bubble; every alternative field in the corpus
   *  is either the same text or a bullet label, and inventing a shorter one is not allowed. */
  summary: string;
  /** Sub-service labels, used for keyword coverage and the "what it covers" list. */
  covers: string[];
}

export interface KnowledgeJournalPost {
  slug: string;
  title: string;
  category: string;
  /** Pre-formatted en-GB sentence case, e.g. "31 Oct 2026". Formatted server-side so the
   *  client never re-localises and cannot drift to en-US. */
  date: string;
}

export interface KnowledgeFaq {
  question: string;
  answer: string;
}

export interface KnowledgeCareer {
  slug: string;
  title: string;
  location: string;
}

export interface KnowledgeStudio {
  phone: string;
  phoneHref: string;
  email: string;
  careersEmail: string;
  pressEmail: string;
  locations: string[];
  socials: { label: string; href: string }[];
}

/**
 * Everything the pod is allowed to say, compiled once per server render.
 * Plain JSON only: no Date, no functions, no Sanity image builders. Adding a non-serializable
 * field here breaks the props boundary, so the shape is asserted by the coverage test.
 */
export interface KnowledgeBase {
  /** ISO timestamp of the compile, surfaced in diagnostics only. Draft validity is keyed on the
   *  persistence module's own schema constant, not this: the compiler re-fills on a cache TTL,
   *  so treating this as an invalidation signal would evict every live draft once a minute. */
  generatedAt: string;
  services: KnowledgeService[];
  journal: KnowledgeJournalPost[];
  journalCategories: string[];
  process: { title: string; body: string }[];
  /**
   * The timeline values the brief form offers, in the order the form prints them, as the short
   * chip labels rather than the long stored strings. Compiled from `INTAKE_TIMELINE_OPTIONS`
   * because "how long" is a question with a published answer set, and the pod would otherwise be
   * tempted to state a duration nobody chose.
   */
  timelines: string[];
  faqs: KnowledgeFaq[];
  careers: KnowledgeCareer[];
  studio: KnowledgeStudio;
  /** All figures the pod may quote. No answer is allowed to contain a number absent here. */
  counts: {
    /** Service lines with a published detail page under /services/[slug]. */
    servicePages: number;
    /** Of those, the business-facing and consumer-facing halves. */
    servicesB2B: number;
    servicesB2C: number;
    /** Granular deliverables in the intake taxonomy (the 52 sub-services). */
    serviceOptions: number;
    /** Top-level buckets of that taxonomy (the 8 categories). */
    serviceCategories: number;
    journalPosts: number;
    faqs: number;
    openRoles: number;
  };
}

export type ChipAction =
  | { kind: "intent"; id: string }
  | { kind: "route"; href: string }
  | { kind: "intake"; serviceSlug?: string }
  | { kind: "external"; href: string }
  | { kind: "close" }
  /** Single-select closed set: stores the exact canonical value and advances. */
  | { kind: "slot-pick"; slot: SlotId; value: string }
  /** Multi-select set: toggles membership without advancing, so the visitor picks several. */
  | { kind: "slot-toggle"; slot: SlotId; value: string }
  /** Commits the current multi-selection and moves to the next question. */
  | { kind: "slot-continue"; slot: SlotId }
  /** Declines the current optional question. Refused on a required one. */
  | { kind: "slot-skip"; slot: SlotId }
  /** Jump from a review row back to that one question, keeping everything else. */
  | { kind: "slot-edit"; slot: SlotId }
  | { kind: "intake-action"; action: "submit" | "later" | "retry" | "exit" | "review" | "details" };

export interface Chip {
  label: string;
  action: ChipAction;
}

/**
 * Message body parts. `p` is prose, `list` is a compact key/value stack, `links` are real
 * anchors. Deliberately not markdown: a chat bubble rendered from a markdown string would put
 * formatting authority outside the reviewed corpus.
 */
export type AnswerBlock =
  | { t: "p"; text: string }
  | { t: "list"; items: { label: string; sub?: string }[] }
  | { t: "links"; items: { label: string; href: string; sub?: string }[] };

export interface Reply {
  blocks: AnswerBlock[];
  chips: Chip[];
}

/**
 * What the pod knows about the conversation, beyond the message it just received.
 *
 * Only one field exists today, and it exists because the depth of an answer is a property of the
 * turn, not of the intent: "tell me more" must render the same service with its sub-service list
 * attached, which means `respond` has to be able to see that it is being asked a second time.
 * Optional at the call site so every intent authored before this concept stays valid. An intent
 * that ignores `ctx` is not wrong, it just has no deeper version to give.
 */
export interface AnswerContext {
  /** The visitor already had the summary and asked again. Give the expanded form. */
  expanded?: boolean;
}

export interface Intent {
  id: string;
  /** Human phrase used when this intent appears as a disambiguation chip. */
  label: string;
  /**
   * Mandatory provenance: a file path, a Sanity query name, or the literal "authored".
   * `knowledge-source-coverage` test fails when an intent omits it, which is the mechanical
   * guarantee behind "the pod never invents an answer".
   */
  source: string;
  /** Full phrases resolved at Tier 1 after normalisation. */
  utterances: string[];
  /** Whole-word tokens scored at Tier 2. First token carries weight 1.0, the rest 0.6. */
  keywords: string[];
  respond: (kb: KnowledgeBase, ctx?: AnswerContext) => Reply;
}

export type Speaker = "assistant" | "visitor";

/**
 * The seventeen fields the `/start-project` wizard collects, named exactly as
 * `ProjectForm/types.ts` names them so the intake payload cannot drift from the form's.
 * `categories`/`services` are the multi-select arrays; `category`/`service` remain the
 * ", "-joined strings the wizard stores and `mapCategory` consumes.
 */
export type SlotId =
  | "serviceInterest"
  | "company"
  | "categories"
  | "services"
  | "timeline"
  | "name"
  | "email"
  | "phone"
  | "projectName"
  | "industry"
  | "projectDescription"
  | "website"
  | "instagram"
  | "language"
  | "agencyStatus"
  | "referral"
  | "inspirationLinks"
  | "showcasePermission"
  | "extraNotes";

export type SlotValue = string | string[] | null;

export interface TranscriptMessage {
  id: string;
  speaker: Speaker;
  blocks: AnswerBlock[];
  /** Formatted "14:02" for display, full date for screen readers. */
  time: string;
  timeFull: string;
  /** Chips attached to this turn. Only the newest attached row is rendered. */
  chips?: Chip[];
  kind?: "text" | "review" | "error";
  reviewRows?: { slot: SlotId; label: string; value: string }[];
}
