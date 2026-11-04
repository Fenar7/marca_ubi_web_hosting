/**
 * @file corpus.ts
 * @description Authored, non-Sanity facts the Chat Pod is allowed to speak. These are literals
 *              transcribed from published surfaces, each tagged with the file and region it came
 *              from, because the pod's honesty claim rests on every answer tracing to a real
 *              source. `knowledge-source-coverage.test.ts` asserts the transcriptions still match
 *              those files, so a footer edit that changes the phone number fails the build rather
 *              than leaving the pod quoting a dead number.
 *
 *              Sanity-backed content is deliberately absent here: it is compiled per render in
 *              `collect.ts` and never hardcoded, so the pod cannot serve a stale copy of a live
 *              post.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import type { Chip, KnowledgeStudio } from "../types";

/** Persona strings. `identityLine` is the permanent disclosure shown in the panel header. */
export const PERSONA = {
  name: "Ubi",
  roleLine: "the digital assistant",
  identityLine: "Digital assistant · Not a person",
} as const;

/**
 * Contact and location facts, transcribed verbatim from the live components.
 * Provenance: MonumentalFooter.tsx:90-113 (tel, three desks, both addresses) and
 * ConnectCutout.tsx:7-13,80-82 (social rail, press desk).
 */
export const STUDIO: KnowledgeStudio = {
  phone: "+91 7012 052 472",
  phoneHref: "tel:+917012052472",
  email: "hello@marcaubi.com",
  careersEmail: "careers@marcaubi.com",
  pressEmail: "press@marcaubi.com",
  locations: [
    "HiLITE Business Park, Hilite City, Calicut, Kerala 673014",
    "Trivandrum Creative Studio, Kerala",
  ],
  socials: [
    { label: "Instagram", href: "https://instagram.com/marcaubi" },
    { label: "LinkedIn", href: "https://linkedin.com/company/marcaubi" },
    { label: "Twitter (X)", href: "https://x.com/marcaubi" },
    { label: "Vimeo", href: "https://vimeo.com/marcaubi" },
    { label: "Substack", href: "https://marcaubi.substack.com" },
  ],
};

/**
 * The four studio principles, transcribed from the cards array in
 * src/app/components/HowWeWorkSection/HowWeWork.tsx:11-49. That array is module-private and the
 * component is a client island coupled to its CSS-module class names, so the pod reads a copy
 * rather than importing a component it cannot render. `process-principles.test.ts` diffs these
 * four title/body pairs against the source file text on every run.
 */
export const PROCESS_PRINCIPLES: { title: string; body: string }[] = [
  {
    title: "Strategy Before Expression",
    body: "Every project begins by defining the brand core, audience, positioning, and direction, so every creative and digital decision has a clear foundation.",
  },
  {
    title: "Systems Over Isolated Outputs",
    body: "Identity, messaging, content, and digital touchpoints are built as connected systems, not standalone pieces, so the brand stays coherent as it grows.",
  },
  {
    title: "Craft With Deliberate Precision",
    body: "Every element is shaped with care, from hierarchy and storytelling to motion and interaction, so the work feels refined, meaningful, and considered.",
  },
  {
    title: "Build, Refine, Evolve",
    body: "We create for real-world use, then strengthen the work through feedback, iteration, and performance insight so the brand continues to improve over time.",
  },
];

/**
 * Aliases per published service line. Every alias names something the line actually publishes:
 * "seo" is the sub-service label at src/app/services/content/b2c.ts:141 under `digital-performance`;
 * a colloquial name that no deck carries ("logo", "app development") is not authored, because routing
 * a visitor to a page that never claims that work is a claim the pod cannot support.
 *
 * A phrase that genuinely belongs to two lines is authored on *both* of them, not demoted to keywords.
 * Tier 1 is multi-owner, so "public relations" and "social media marketing" come back as a tie at
 * score 1 and the pod asks which one, which is the honest answer when the catalogue itself repeats the
 * name. Uniqueness is only enforced against a single writer being chosen by declaration order.
 *
 * The interrogative form is authored when the visitor's phrasing carries a word the deck never uses:
 * "do you offer branding" scores 0.61 on arithmetic because the line's published words are "Brand
 * strategy" and "Brand identity", not "branding", so the phrase is written down instead of the
 * threshold being moved.
 * Provenance: slug list from ServicesAccordion/types.ts, covered by the coverage test.
 */
export const SERVICE_ALIASES: Record<string, string[]> = {
  "demand-generation": ["demand gen", "lead generation", "pipeline generation"],
  "integrated-marketing": ["integrated campaigns", "channel orchestration"],
  "corporate-communications": ["internal comms", "stakeholder messaging", "executive communications"],
  "social-influencer-marketing": [
    "influencer partnerships",
    "creator collaborations",
    "b2b social",
    "social media marketing",
  ],
  "content-and-scale": ["content production", "content operations"],
  "public-relations-pr": ["public relations", "b2b public relations", "corporate pr", "press relations", "media relations"],
  "customer-marketing": ["customer retention marketing", "lifecycle marketing"],
  "account-based-marketing": ["abm", "account based marketing", "enterprise account campaigns"],
  "integrated-creativity": [
    "brand identity",
    "brand strategy",
    "branding",
    "branding services",
    "do you offer branding",
    "creative campaign",
    "art direction",
  ],
  "social-influencer": ["consumer influencer", "b2c social", "community building", "social media marketing"],
  "digital-performance": ["performance marketing", "paid media", "media buying", "seo", "search engine optimisation"],
  "sports-marketing": ["sports sponsorship", "team marketing", "athlete partnerships"],
  "crm-and-loyalty": ["loyalty programme", "crm", "retention programme", "membership scheme"],
  "public-relations": ["public relations", "consumer pr", "brand publicity", "product launches press"],
  "live-experiences": ["events", "brand activations", "experiential"],
  "retail-activation": ["in-store activation", "retail merchandising", "trade marketing"],
};

/**
 * Where "all services" lives. There is no `/services` index route on this site: the catalogue is
 * the homepage accordion, which carries `id="services"`
 * (src/app/components/Sections/ServicesAccordion/ServicesAccordion.tsx:86). The blog listing links
 * `/services` and 404s today; the pod does not repeat that.
 */
export const ALL_SERVICES_HREF = "/#services";

/**
 * The published questions on the homepage, which is where the pod sends a visitor who wants the
 * positioning stated at length rather than in its own words. The anchor is the section id in
 * `src/app/components/Sections/FaqCurtain.tsx:29`, so the link and the cutout move together or not at all.
 */
export const FAQ_HREF = "/#faq";

/**
 * How long a saved intake draft survives on the device. Authored here because the pod tells
 * visitors this number in `intake.exit` and the persistence module enforces it; a literal in the
 * copy and a literal in the expiry maths would be two answers to one question.
 */
export const DRAFT_RETENTION_DAYS = 14;

/**
 * The persistent menu: five entries, never more, re-offered after any fallback.
 * Provenance: docs/chat_pod/03-conversation-script.md §9.
 */
export const PERSISTENT_MENU: Chip[] = [
  { label: "Services", action: { kind: "intent", id: "services.overview" } },
  { label: "Work", action: { kind: "intent", id: "work.overview" } },
  { label: "How we work", action: { kind: "intent", id: "process.overview" } },
  { label: "Talk to a person", action: { kind: "intent", id: "contact" } },
  { label: "Start a project", action: { kind: "intake" } },
];

/**
 * Phrases that must never be emitted, whatever the corpus says. Asserted over every intent's
 * output by the coverage test so banned vocabulary cannot enter through a Sanity field either.
 */
export const BANNED_TERMS: string[] = [
  "seamless",
  "unlock",
  "unleash",
  "leverage",
  "delve",
  "elevate",
  "empower",
  "robust",
  "cutting-edge",
  "game-changer",
  "harness",
  "foster",
  "synergy",
  "holistic",
  "in today's fast-paced",
];
