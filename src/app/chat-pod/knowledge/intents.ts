/**
 * @file intents.ts
 * @description The authored conversation table. Every string here is literal, or a slot over a
 *              value that exists in the compiled knowledge base; nothing is composed from the
 *              visitor's own words. The table is assembled per mount from `kb` because the FAQ and
 *              journal intents are generated from published content, so adding a post or a question
 *              in Sanity adds an answer without a code change, and the coverage test then demands
 *              that the generated entry has a source, which is how the guarantee stays true after
 *              the content moves on.
 *
 *              Three rules the table obeys and that are easy to break by accident:
 *              1. A Tier 1 name may be authored by more than one intent, and when it is, the phrase
 *                 resolves to both of them at once. The name dictionary is multi-owner, so a contested
 *                 name reaches the disambiguation chips instead of being won by whichever intent was
 *                 declared first. That is what lets two published lines share a title ("Public
 *                 Relations (PR)" is published under both splits) without the pod having to invent a
 *                 tie-break. Author the shared name on every owner; do not suppress it on one of them.
 *              2. Only routes that exist in `src/app` may be linked. `/about` and `/clients` were
 *                 in the script and are not on this site, so those answers point at real pages.
 *              3. Utterances are full sentence forms, not just topic nouns. Tier 3 blends token
 *                 containment against character similarity, so a polite sentence that carries one
 *                 authored word ("how much does it cost") scores in the 0.70s and lands in
 *                 disambiguation. That is the right outcome for a phrase nobody authored, and the
 *                 wrong outcome for "are you hiring", which is the question this studio gets. The
 *                 alias list is where a human decides which phrasings are known, so the sentences
 *                 are authored here rather than the accept threshold being lowered to rescue them.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import type { Chip, Intent, KnowledgeBase, Reply } from "../types";
import {
  ALL_SERVICES_HREF,
  DRAFT_RETENTION_DAYS,
  FAQ_HREF,
  PERSONA,
  PERSISTENT_MENU,
  SERVICE_ALIASES,
  STUDIO,
} from "./corpus";

const STOPWORDS = new Set(["a", "an", "and", "of", "the", "for", "with", "to", "or", "in", "on", "at", "by"]);

const asChip = {
  intent: (label: string, id: string): Chip => ({ label, action: { kind: "intent", id } }),
  route: (label: string, href: string): Chip => ({ label, action: { kind: "route", href } }),
  external: (label: string, href: string): Chip => ({ label, action: { kind: "external", href } }),
  intake: (label = "Start a project"): Chip => ({ label, action: { kind: "intake" } }),
  close: (label = "Close"): Chip => ({ label, action: { kind: "close" } }),
};

/** Whole-word keyword candidates from a phrase, stopwords dropped and capped. */
function keywordsFrom(phrase: string, cap = 6): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const word of phrase.toLowerCase().split(/[^a-z0-9']+/)) {
    if (word.length < 3 || STOPWORDS.has(word) || seen.has(word)) continue;
    seen.add(word);
    out.push(word);
    if (out.length >= cap) break;
  }
  return out;
}

/**
 * One rendering for both halves of the catalogue, so the business and consumer lists cannot drift
 * apart in shape or in length.
 *
 * Each row carries the line's first two published deliverable labels as its `sub` rather than its
 * `shortDescription`: across the sixteen decks those summaries run 211 to 290 characters, so eight of
 * them stacked under one title is close to two thousand characters in a single bubble and a list
 * nobody scrolls on a phone. Two labels is the same corpus cut to what sits beside a title, and the
 * whole summary is one tap away on that line's own intent.
 *
 * The chips are intent chips, not route chips: a tap should explain the service inside the
 * conversation instead of navigating the page out from under the visitor. They are not sliced, because
 * dropping the tail of the list from the tap path is how a published line becomes unfindable, and the
 * count is bounded by the split itself (eight). The switch to the other half rides on the persistent
 * menu's "Services" chip, which the panel renders in chat mode, so it needs no chip of its own.
 */
function listSplitReply(kb: KnowledgeBase, split: "B2B" | "B2C"): Reply {
  const lines = kb.services.filter((service) => service.split === split);
  const count = split === "B2B" ? kb.counts.servicesB2B : kb.counts.servicesB2C;
  return {
    blocks: [
      {
        t: "p",
        text:
          split === "B2B"
            ? `${count} lines aimed at businesses. Tap one and I will explain it:`
            : `${count} lines aimed at consumer brands. Tap one and I will explain it:`,
      },
      {
        t: "list",
        items: lines.map((line) => ({ label: line.title, sub: line.covers.slice(0, 2).join(", ") })),
      },
    ],
    chips: [
      ...lines.map((line) => asChip.intent(line.title, `services.detail.${line.slug}`)),
      asChip.route("All service pages", ALL_SERVICES_HREF),
    ],
  };
}

/**
 * Intents that exist independently of the corpus. FAQ, journal-topic and service-detail entries are
 * generated below because their ids and utterances come from published data.
 */
const STATIC_INTENTS: Intent[] = [
  {
    id: "greeting",
    label: "Say hello",
    source: "authored:03-conversation-script.md §2",
    utterances: [
      "hi",
      "hello",
      "hey",
      "hey there",
      "hi there",
      "hello there",
      "good morning",
      "good afternoon",
      "good evening",
      "namaste",
    ],
    keywords: ["hi", "hello", "hey", "morning", "evening"],
    respond: () => ({
      blocks: [{ t: "p", text: "Hello. What would you like to know about us?" }],
      chips: [
        asChip.intent("Services", "services.overview"),
        asChip.intent("Work", "work.overview"),
        asChip.intake(),
      ],
    }),
  },
  {
    id: "smalltalk.howareyou",
    label: "How are you",
    source: "authored:03-conversation-script.md §2",
    utterances: ["how are you", "how are you doing", "how's it going", "how have you been", "you ok", "you good"],
    keywords: ["how", "are", "you", "going", "ok"],
    respond: () => ({
      blocks: [
        {
          t: "p",
          text: "Running well, thanks. I am a piece of software rather than a person, so my days are consistent. What can I help with?",
        },
      ],
      chips: [...PERSISTENT_MENU],
    }),
  },
  {
    id: "smalltalk.areyouhuman",
    label: "Are you a bot",
    source: "src/app/components/Sections/MonumentalFooter.tsx:90-98",
    utterances: [
      "are you a bot",
      "are you human",
      "are you real",
      "are you ai",
      "are you a robot",
      "am i talking to a bot",
      "is this a robot",
      "what are you",
    ],
    keywords: ["bot", "human", "real", "ai", "robot"],
    respond: (kb) => ({
      blocks: [
        {
          t: "p",
          text: `I am a bot. Marca Ubi built me to answer questions from what we have already published, so nothing I say comes from a model guessing. A person answers the phone on ${kb.studio.phone} and at ${kb.studio.email}.`,
        },
      ],
      chips: [
        asChip.external("Call the studio", kb.studio.phoneHref),
        asChip.external(`Email ${kb.studio.email}`, `mailto:${kb.studio.email}`),
      ],
    }),
  },
  {
    id: "thanks",
    label: "Thanks",
    source: "authored:03-conversation-script.md §2",
    utterances: ["thanks", "thank you", "thank you so much", "many thanks", "cheers", "ta", "appreciate it"],
    keywords: ["thanks", "thank", "you", "cheers"],
    respond: () => ({
      blocks: [{ t: "p", text: "Any time." }],
      chips: [...PERSISTENT_MENU],
    }),
  },
  {
    id: "goodbye",
    label: "Goodbye",
    source: "authored:03-conversation-script.md §2",
    utterances: ["bye", "goodbye", "see you", "see you later", "that's all", "nothing else", "that is all"],
    keywords: ["bye", "goodbye", "see", "nothing"],
    respond: () => ({
      blocks: [{ t: "p", text: "Goodbye. The panel stays here if you come back." }],
      chips: [asChip.close()],
    }),
  },

  {
    id: "identity.studio",
    label: "Who we are",
    source: "src/sanity/lib/faq-queries.ts:22-24; src/app/components/Sections/ServicesAccordion/types.ts:28,130",
    // The company question, which had no owner anywhere in this table until now. "what do you do" was
    // authored under `services.overview`, whose answer opens by asking the visitor who they sell to, so
    // a first-time visitor asking what the studio is got a sales qualification question back and read
    // the pod as not listening. This is the other half of that: a question about us, answered about us.
    //
    // "who are you" and "about you" moved here from `process.team`, which answered them with two street
    // addresses. "what are you" stays with `smalltalk.areyouhuman` on purpose: that one asks what is
    // talking, this one asks what is behind the door.
    utterances: [
      "what do you do",
      "what do you actually do",
      "what do you guys do",
      "what does marka ubi do",
      "who are you",
      "who are you guys",
      "who is behind this",
      "about you",
      "what is marka ubi",
      "are you an agency",
      "are you a creative agency",
      "is this an agency",
      "what kind of company are you",
      "tell me about yourself",
      "tell me about your studio",
      "tell me about the company",
      "about the studio",
    ],
    // "studio" leads: it is the noun a visitor uses for this company, and the only one of these five
    // that a question about the offering does not also need. "services" is deliberately absent, or this
    // intent would meet every services question at the table.
    keywords: ["studio", "company", "agency", "identity", "positioning"],
    respond: (kb) => ({
      blocks: [
        {
          t: "p",
          text: "Brand work and software from one studio. Plenty of firms split those across an agency and a build shop; Marca Ubi keeps how a brand reads and the systems it runs on in the same team, which is the position the FAQ sets out at greater length.",
        },
        {
          t: "p",
          text: `${kb.counts.servicePages} of that has a page of its own: ${kb.counts.servicesB2B} lines aimed at businesses and ${kb.counts.servicesB2C} at consumer brands.`,
        },
        {
          t: "p",
          text: `The ${kb.studio.locations.length} studios are in Kerala, and the people in them are on the careers page.`,
        },
      ],
      chips: [
        asChip.intent("What we sell", "services.overview"),
        asChip.intent("See the work", "work.overview"),
        asChip.route("Open roles", "/careers"),
        asChip.route("Read the FAQ", FAQ_HREF),
      ],
    }),
  },

  {
    id: "services.overview",
    label: "What we do",
    source: "src/app/services/content.ts:95 SERVICE_DETAILS; src/app/components/Sections/ServicesAccordion/types.ts:28,130",
    // The sentence forms visitors actually type, authored rather than rescued by a threshold: "what
    // are the services available" once scored 0.774 on arithmetic and came back as three chips,
    // because the only word in it nobody had written down was "available". Tier 1 answers a phrase an
    // author published with a decision, so every phrasing this studio is willing to understand is
    // listed here and pinned in the typed table.
    utterances: [
      "what do you offer",
      "what services do you offer",
      "what are your services",
      "what are the services",
      "what is the services",
      "what are the services available",
      "what services are available",
      "what services do you have",
      "what services you provide",
      "services available",
      "available services",
      "tell me about your services",
      "list of services",
      "full list of services",
      "service list",
      "services",
      "your services",
      "what do you sell",
      "what can you do for me",
      "help me with marketing",
    ],
    // "services" must stay first: the leading keyword carries the topic weight, "available" is the
    // word that was missing from the denominator, and appending it cannot demote the subject noun.
    keywords: ["services", "service", "offer", "marketing", "available", "do", "help"],
    respond: (kb) => ({
      blocks: [
        {
          t: "p",
          text: "Who do you sell to, other businesses or consumers? That is the question worth answering first, because the work is organised by it.",
        },
        {
          t: "p",
          text: `Business-facing lines run ${kb.counts.servicesB2B}, consumer-facing lines run ${kb.counts.servicesB2C}, and each one has a page setting out its deliverables.`,
        },
      ],
      chips: [
        asChip.intent("Business-to-business", "services.b2b"),
        asChip.intent("Consumer brands", "services.b2c"),
        asChip.intent("Not sure which", "services.whichone"),
        asChip.route("All service pages", ALL_SERVICES_HREF),
      ],
    }),
  },
  {
    id: "services.b2b",
    label: "Business work",
    source: "src/app/components/Sections/ServicesAccordion/types.ts:28 B2B_SERVICES; src/app/services/content/b2b.ts",
    utterances: [
      "b2b",
      "b2b services",
      "business services",
      "business to business services",
      "what do you do for businesses",
      "enterprise work",
      "business facing services",
    ],
    keywords: ["b2b", "business", "enterprise", "services"],
    respond: (kb) => listSplitReply(kb, "B2B"),
  },
  {
    id: "services.b2c",
    label: "Consumer work",
    source: "src/app/components/Sections/ServicesAccordion/types.ts:130 B2C_SERVICES; src/app/services/content/b2c.ts",
    utterances: [
      "b2c",
      "b2c services",
      "consumer brands",
      "business to consumer services",
      "what do you do for consumer brands",
      "retail work",
      "consumer facing services",
    ],
    keywords: ["b2c", "consumer", "retail", "services"],
    respond: (kb) => listSplitReply(kb, "B2C"),
  },
  {
    id: "services.whichone",
    label: "Which service",
    source: "src/app/services/content.ts:95 SERVICE_DETAILS",
    utterances: [
      "not sure",
      "which service should i pick",
      "which service do i need",
      "which service is right for me",
      "what do i need",
      "recommend",
      "help me choose",
      "i do not know which service to pick",
    ],
    keywords: ["which", "service", "choose", "recommend", "need"],
    respond: () => ({
      blocks: [
        {
          t: "p",
          text: "Tell me the outcome you are after and I will point at the right line. Are you trying to reach new buyers, build how the brand reads, or get more out of the customers you already have?",
        },
      ],
      chips: [
        asChip.intent("Reach new buyers", "services.detail.demand-generation"),
        asChip.intent("Build how the brand reads", "services.detail.integrated-creativity"),
        asChip.intent("Get more from existing customers", "services.detail.crm-and-loyalty"),
        asChip.route("Show me everything", ALL_SERVICES_HREF),
      ],
    }),
  },
  {
    id: "pricing",
    label: "Pricing",
    source: "authored:03-conversation-script.md §3; no rate card exists in the corpus",
    utterances: [
      "how much",
      "how much does it cost",
      "how much is it",
      "how much do you charge",
      "what does a project cost",
      "what are your rates",
      "cost",
      "price",
      "pricing",
      "rates",
      "rate card",
      "fees",
      "what are your fees",
      "quote",
      "budget",
      "expensive",
      "cheap",
      // Pricing asked about a named thing, which is how the question actually arrives. "how much does a
      // rebrand cost" shares one authored word with this intent ("cost") and one with a service page
      // ("rebrand"), so the arithmetic puts it in the ambiguous band every time; a visitor who wants a
      // number is asking this question whatever noun they hang it on, and there is no rate card to be
      // wrong about. The service pages keep their own names.
      "how much does a rebrand cost",
      "what does a rebrand cost",
      "how much does branding cost",
      "how much does a website cost",
      "how much does an app cost",
      "how much for a campaign",
    ],
    keywords: ["price", "pricing", "cost", "rates", "quote", "budget", "charge", "fees"],
    respond: (kb) => ({
      blocks: [
        {
          t: "p",
          text: "We do not publish a rate card, and I am not going to invent a range. Fees depend on scope, markets and duration, so a number from me would be meaningless. The way to get a real one is a short conversation about the project.",
        },
      ],
      chips: [
        asChip.intake("Start that conversation"),
        asChip.route("Open the full form", "/start-project"),
        asChip.external(`Email ${kb.studio.email}`, `mailto:${kb.studio.email}`),
      ],
    }),
  },

  {
    id: "work.overview",
    label: "See the work",
    source: "src/app/works/page.tsx:15 (Selected Works route)",
    utterances: [
      "your work",
      "portfolio",
      "case studies",
      "case study",
      "previous work",
      "what have you done",
      "show me work",
      "show me the work",
      "projects",
    ],
    keywords: ["work", "portfolio", "case", "studies", "projects", "done"],
    respond: () => ({
      blocks: [
        {
          t: "p",
          text: "The work is published on the site, so I will point you at it rather than describe it. Selected campaigns and the thinking behind them sit on the works page.",
        },
      ],
      chips: [
        asChip.route("See the work", "/works"),
        asChip.intent("Latest journal entries", "work.journal"),
        asChip.intake(),
      ],
    }),
  },
  {
    id: "work.journal",
    label: "The journal",
    source: "src/sanity/lib/blog-queries.ts:6 postsQuery",
    utterances: [
      "blog",
      "journal",
      "articles",
      "writing",
      "thoughts",
      "insights",
      "latest posts",
      "recent articles",
      "do you have a blog",
      "journal entries",
    ],
    keywords: ["journal", "blog", "articles", "writing", "insights"],
    respond: (kb) => {
      // No claim about *why* there is nothing to list. `collect.ts` folds a timeout and an empty
      // archive into the same source array, so the pod cannot tell an outage from a quiet journal and
      // must not say "I could not read it" when the truth may be "there is nothing yet".
      if (kb.journal.length === 0) {
        return {
          blocks: [
            {
              t: "p",
              text: "The journal lives at /blog. I have no entries compiled into this page, so I will send you to the index rather than list from memory.",
            },
          ],
          chips: [asChip.route("Open the journal", "/blog")],
        };
      }
      // The line names no count: `counts.journalPosts` is the whole compiled window (up to
      // `JOURNAL_LIMIT`), while this bubble prints five of them, and a figure that does not match the
      // list under it is the invention this module forbids.
      const shown = kb.journal.slice(0, 5);
      return {
        blocks: [
          { t: "p", text: "The most recent entries, in the order the journal prints them:" },
          {
            t: "list",
            items: shown.map((post) => ({ label: post.title, sub: [post.category, post.date].filter(Boolean).join(" · ") })),
          },
        ],
        chips: [
          ...shown.map((post) => asChip.route(post.title, `/blog/${post.slug}`)),
          asChip.route("All entries", "/blog"),
        ],
      };
    },
  },
  {
    id: "work.clients",
    label: "Who we work with",
    source: "src/app/works/page.tsx:15; no testimonial corpus exists",
    utterances: [
      "clients",
      "client list",
      "who do you work with",
      "who are your clients",
      "brands",
      "references",
      "testimonials",
    ],
    keywords: ["clients", "brands", "references", "testimonials", "work"],
    respond: () => ({
      blocks: [
        {
          t: "p",
          text: "Names and engagements are published with the work rather than in a logo strip. What I can answer here is how engagements run, which is usually the more useful question.",
        },
      ],
      chips: [
        asChip.route("See the work", "/works"),
        asChip.intent("How we work", "process.overview"),
        asChip.intake(),
      ],
    }),
  },

  {
    id: "process.overview",
    label: "How we work",
    source: "src/app/components/HowWeWorkSection/HowWeWork.tsx:11-49",
    utterances: [
      "how do you work",
      "how we work",
      "how does it work",
      "how does the process work",
      "what is your process",
      "your process",
      "process",
      "what happens",
      "engagement",
      "onboarding",
      "working with you",
    ],
    keywords: ["process", "engagement", "work", "onboarding", "happens"],
    respond: (kb) => ({
      blocks: [
        { t: "p", text: "Four principles, in the order we work in:" },
        {
          t: "list",
          items: kb.process.map((principle) => ({ label: principle.title, sub: principle.body })),
        },
      ],
      chips: [
        asChip.intake("Start with the brief"),
        asChip.intent("Talk to a person", "contact"),
        asChip.route("Open the full form", "/start-project"),
      ],
    }),
  },
  {
    id: "process.timeline",
    label: "Timelines",
    source: "src/app/components/ProjectForm/steps/Step3Details.tsx:30-63 TIMELINE_OPTIONS",
    utterances: [
      "how long",
      "how long does a project take",
      "how long will it take",
      "how quickly can you deliver",
      "timeline",
      "duration",
      "when can you start",
      "availability",
      "lead time",
    ],
    keywords: ["timeline", "duration", "start", "availability", "lead"],
    respond: (kb) => ({
      blocks: [
        { t: "p", text: "Timelines are set per project. On the brief form you pick yours from a fixed set:" },
        { t: "list", items: kb.timelines.map((label) => ({ label })) },
        { t: "p", text: "We build the plan around the answer rather than the other way round." },
      ],
      chips: [asChip.intake("Give me your timeline"), asChip.route("Open the full form", "/start-project")],
    }),
  },
  {
    id: "process.team",
    label: "The studio",
    source: "src/app/components/Sections/MonumentalFooter.tsx:110-113; src/app/components/Sections/GlobalLocationsCloud.tsx:14-28",
    utterances: [
      "who works there",
      "tell me about the team",
      "team",
      "people",
      "founder",
      "how many people work there",
    ],
    keywords: ["team", "people", "founder", "studio", "works"],
    respond: (kb) => ({
      blocks: [
        { t: "p", text: `Two studios, both in Kerala: ${kb.studio.locations.join("; ")}.` },
        { t: "p", text: "The people and open roles are on the careers page." },
      ],
      chips: [
        asChip.route("Open roles", "/careers"),
        asChip.intent("Talk to a person", "contact"),
        asChip.route("See the work", "/works"),
      ],
    }),
  },

  {
    id: "contact",
    label: "Talk to a person",
    source: "src/app/components/Sections/MonumentalFooter.tsx:90-98,110-113",
    utterances: [
      "talk to a person",
      "speak to someone",
      "i want to talk to someone",
      "real person",
      "human",
      "phone",
      "phone number",
      "call",
      "email",
      "contact",
      "contact details",
      "how do i contact you",
      "get in touch",
      "number",
      "whatsapp",
    ],
    keywords: ["contact", "phone", "call", "email", "human", "person"],
    respond: (kb) => ({
      blocks: [
        {
          t: "p",
          text: `Phone ${kb.studio.phone}. Email ${kb.studio.email}. Both go to the studio, and ${kb.studio.locations[0]} is where most of it happens.`,
        },
      ],
      chips: [
        asChip.external("Call", kb.studio.phoneHref),
        asChip.external("Email", `mailto:${kb.studio.email}`),
        asChip.route("Open the full form", "/start-project"),
      ],
    }),
  },
  {
    id: "contact.press",
    label: "Press and media",
    source: "src/app/components/Sections/ConnectCutout.tsx:80-82",
    utterances: ["press", "press enquiry", "press enquiries", "media enquiry", "press contact", "media kit"],
    keywords: ["press", "media", "enquiry"],
    respond: (kb) => ({
      blocks: [{ t: "p", text: `Press and media go to ${kb.studio.pressEmail}.` }],
      chips: [asChip.external(`Email ${kb.studio.pressEmail}`, `mailto:${kb.studio.pressEmail}`)],
    }),
  },
  {
    id: "contact.socials",
    label: "Social channels",
    source: "src/app/components/Sections/ConnectCutout.tsx:7-13",
    utterances: [
      "instagram",
      "linkedin",
      "twitter",
      "x",
      "social",
      "follow",
      "social media",
      "social channels",
      "your social media",
      "where do you publish",
    ],
    // "social" is deliberately absent from the keyword list: it is the subject noun of two published
    // service lines, and carrying it here let "explain social media marketing" be answered with the
    // studio's Instagram link. This intent is about where the studio publishes, which is what its
    // aliases already say ("social channels", "where do you publish"), so nothing here loses a phrase
    // anybody authored.
    keywords: ["channels", "instagram", "linkedin", "twitter", "follow"],
    respond: (kb) => ({
      blocks: [
        { t: "p", text: "Where the studio publishes outside this site:" },
        { t: "links", items: kb.studio.socials.map((social) => ({ label: social.label, href: social.href })) },
      ],
      chips: [asChip.intent("Talk to a person", "contact")],
    }),
  },
  {
    id: "careers.list",
    label: "Open roles",
    source: "src/sanity/lib/career-queries.ts:101-183 FALLBACK_CAREERS; src/app/components/Sections/MonumentalFooter.tsx:100-103",
    utterances: [
      "jobs",
      "careers",
      "hiring",
      "are you hiring",
      "are you recruiting",
      "open roles",
      "vacancy",
      "vacancies",
      "openings",
      "career opportunities",
      "join",
    ],
    keywords: ["careers", "jobs", "hiring", "vacancy", "openings", "join", "roles"],
    respond: (kb) => {
      if (kb.counts.openRoles === 0) {
        return {
          blocks: [{ t: "p", text: `No roles are listed right now. Speculative applications go to ${kb.studio.careersEmail}.` }],
          chips: [asChip.external("Email careers", `mailto:${kb.studio.careersEmail}`), asChip.route("Careers page", "/careers")],
        };
      }
      // One slice for the list and the chips, so the bubble never names a role it will not open, and
      // no count line: the figure above a five-deep cut of a longer list would be a number the visitor
      // cannot check against what they can see.
      const shown = kb.careers.slice(0, 5);
      return {
        blocks: [
          { t: "p", text: "Roles the studio has open:" },
          { t: "list", items: shown.map((role) => ({ label: role.title, sub: role.location })) },
          { t: "p", text: `Applications go to ${kb.studio.careersEmail}.` },
        ],
        chips: [
          ...shown.map((role) => asChip.route(role.title, `/careers/${role.slug}`)),
          asChip.route("All roles", "/careers"),
          asChip.external("Email careers", `mailto:${kb.studio.careersEmail}`),
        ],
      };
    },
  },
  {
    id: "location",
    label: "Where you are",
    source: "src/app/components/Sections/MonumentalFooter.tsx:110-113; src/app/components/Sections/GlobalLocationsCloud.tsx:14-28",
    utterances: [
      "where are you",
      "where are you located",
      "where are you based",
      "where is your studio",
      "your address",
      "which city are you in",
      "office",
      "location",
      "address",
      "kerala",
      "calicut",
      "trivandrum",
      "india",
    ],
    keywords: ["office", "location", "address", "kerala", "calicut", "trivandrum"],
    respond: (kb) => ({
      blocks: [
        { t: "p", text: "Two addresses, as published in the footer:" },
        { t: "list", items: kb.studio.locations.map((address) => ({ label: address })) },
      ],
      chips: [asChip.external("Call the studio", kb.studio.phoneHref)],
    }),
  },

  {
    id: "intake.trigger",
    label: "Start a project",
    source: "authored:03-conversation-script.md §7; docs/chat_pod/01-architecture.md §8",
    utterances: [
      "start a project",
      "i want to start a project",
      "i have a project",
      "i need help with a project",
      "i need your help with a project",
      "brief",
      "send a brief",
      "submit a brief",
      "enquiry",
      "enquire",
      "hire you",
      "i want to hire you",
      "can we work together",
      "let's talk",
      "get in touch about a project",
      "new project",
      "proposal",
      "i would like a proposal",
      "work with you",
      // The highest-value sentence a visitor can type and the corpus has no page for. Neither half of
      // the published catalogue is titled "website" or "app", so there is no service page to answer
      // with, and arithmetic on "i want a website" produced a fallback for a lead. Authoring it here is
      // the honest route: the brief is what actually takes a build request. The keywords are unchanged
      // on purpose, or every message that mentions a website would start competing with the service
      // pages that do not exist.
      "i want a website",
      "i need a website",
      "we need a website",
      "build me a website",
      "can you build a website",
      "can you build an app",
      "do you build apps",
      "i want an app built",
    ],
    keywords: ["project", "brief", "enquiry", "hire", "proposal", "start"],
    respond: () => ({
      blocks: [
        {
          t: "p",
          text: "Happy to take that. I will ask you a few things, one at a time, and you can stop at any point. Nothing is sent to us until you press send at the end.",
        },
      ],
      chips: [asChip.route("Prefer the full form", "/start-project")],
    }),
  },
  {
    id: "intake.exit",
    label: "Stop the intake",
    source: "docs/chat_pod/01-architecture.md §8 (draft persistence)",
    utterances: [
      "stop",
      "cancel",
      "cancel that",
      "stop asking questions",
      "never mind",
      "back to questions",
      "not now",
      "exit",
    ],
    keywords: ["stop", "cancel", "exit", "never"],
    respond: () => ({
      blocks: [
        {
          t: "p",
          text: `No problem. Nothing was sent. Your answers stay on this device for ${DRAFT_RETENTION_DAYS} days if you come back.`,
        },
      ],
      chips: [...PERSISTENT_MENU],
    }),
  },
];

/**
 * One intent per published service line, authored under the line's published title plus the names
 * people actually use for it.
 *
 * The title is authored even when a second line publishes the same title. Tier 1 is multi-owner:
 * "Public Relations (PR)" is the name of a B2B and a B2C deck, so both claim it, both come back at
 * score 1, and `decide` answers the tie with chips. Skipping the duplicate title was the fix from the
 * window when the dictionary kept only the first writer, and leaving it out pushed the phrase down to
 * Tier 2 keyword arithmetic, which silently favoured whichever deck carried more matching keywords and
 * answered "public relations" with one page. A contested published name is now the intended outcome,
 * not something to author around.
 *
 * `ctx.expanded` is the second ask on the same line ("tell me more"), where the summary has already
 * been read: the full published deliverable list replaces the three-label cut, and the sibling line in
 * the same split is named so there is something to compare it against. With no context the short answer
 * stays, because the first ask should not open with everything.
 */
function serviceDetailIntents(kb: KnowledgeBase): Intent[] {
  return kb.services.map((service, index) => {
    const siblings = kb.services.filter((other) => other.split === service.split && other.slug !== service.slug);
    const related = siblings.length > 0 ? siblings[index % siblings.length] : undefined;
    const utterances: string[] = [service.title, ...(SERVICE_ALIASES[service.slug] ?? [])];

    return {
      id: `services.detail.${service.slug}`,
      label: service.title,
      source: `src/app/services/content.ts:95 SERVICE_DETAILS (slug "${service.slug}"); src/app/services/content/${service.split === "B2B" ? "b2b" : "b2c"}.ts`,
      utterances,
      keywords: [
        ...keywordsFrom(service.title),
        ...service.covers.slice(0, 2).flatMap((cover) => keywordsFrom(cover, 2)),
      ].slice(0, 8),
      respond: (_kb, ctx) => {
        const expanded = ctx?.expanded === true;
        const listed = expanded ? service.covers : service.covers.slice(0, 3);
        return {
          blocks: [
            { t: "p", text: service.summary },
            { t: "p", text: expanded ? "Everything this line publishes:" : "What it covers:" },
            { t: "list", items: listed.map((cover) => ({ label: cover })) },
            // The sibling is only named on the deep pass: on the first answer the visitor has not yet
            // seen what this line does, and a second name in the same breath is a choice made too early.
            ...(expanded && related
              ? [
                  {
                    t: "p" as const,
                    text: `On the same side of the catalogue, ${related.title} covers ${related.covers.slice(0, 2).join(" and ")}.`,
                  },
                ]
              : []),
          ],
          chips: [
            asChip.route("Open the page", `/services/${service.slug}`),
            ...(related ? [asChip.intent(related.title, `services.detail.${related.slug}`)] : []),
            asChip.intent("All business lines", "services.b2b"),
            asChip.intent("All consumer lines", "services.b2c"),
            asChip.intake(),
          ],
        };
      },
    };
  });
}

/** One intent per published FAQ, question used verbatim as the alias and answer verbatim as the reply. */
function faqIntents(kb: KnowledgeBase): Intent[] {
  return kb.faqs.map((faq, index) => ({
    id: `faq.${index + 1}`,
    label: faq.question,
    source: `src/sanity/lib/faq-queries.ts:10 faqsQuery (published FAQ ${index + 1})`,
    utterances: [faq.question],
    keywords: keywordsFrom(faq.question, 8),
    respond: () => ({
      blocks: [{ t: "p", text: faq.answer }],
      chips: [asChip.intent("Talk to a person", "contact"), asChip.intake()],
    }),
  }));
}

/**
 * Journal categories that are also names of things the studio sells.
 *
 * Two published categories read exactly like deliverables ("Brand Strategy", "Design Systems"), and
 * before this the pod answered "what is brand strategy" with a list of posts while the deck that does
 * that work never came up. The map is built from the corpus rather than a hardcoded pair list, so a new
 * category or a renamed deliverable creates or removes the bridge on its own.
 * Keys are lower-cased because the category title and the deliverable label are written by different
 * people in different cases, and that difference is not a fact about the subject.
 */
function serviceBridgeByTopic(kb: KnowledgeBase): Map<string, { id: string; label: string }[]> {
  const bridge = new Map<string, { id: string; label: string }[]>();
  const add = (name: string, entry: { id: string; label: string }) => {
    const key = name.toLowerCase();
    if (key.length === 0) return;
    const existing = bridge.get(key);
    if (!existing) bridge.set(key, [entry]);
    else if (!existing.some((item) => item.id === entry.id)) existing.push(entry);
  };
  for (const service of kb.services) {
    const entry = { id: `services.detail.${service.slug}`, label: service.title };
    for (const name of [service.title, ...service.covers, ...(SERVICE_ALIASES[service.slug] ?? [])]) add(name, entry);
  }
  return bridge;
}

/**
 * One intent per published journal category. Only titles are compiled, so the answer stays inside
 * the twelve entries the pod was given and sends anything it cannot place to the full index rather
 * than implying it knows the whole archive.
 *
 * A category whose title is also a published deliverable is answered as the journal half of the
 * subject and hands the visitor the service line as a chip. It is not silently re-routed to the deck:
 * the `work.journal.topic.` discount in `match.ts` keeps the blog reading second to the service on a
 * shared phrase, and both end up offered. That is the honest shape of "what is brand strategy", where
 * the studio both writes about brand strategy and sells it.
 */
function journalTopicIntents(kb: KnowledgeBase): Intent[] {
  const bridge = serviceBridgeByTopic(kb);
  return kb.journalCategories
    .filter((title) => title.trim().length > 0)
    .map((title) => {
      const matching = kb.journal.filter((post) => post.category === title);
      const services = bridge.get(title.toLowerCase()) ?? [];
      return {
        id: `work.journal.topic.${title}`,
        label: `${title} entries`,
        source: `src/sanity/lib/blog-queries.ts:51 categoriesQuery`,
        // Only the reading forms are authored here. The bare title is also a service name, and the
        // service intent publishes it as its own alias, so the plain phrase is contested at Tier 1 and
        // answered with both owners rather than being won by whichever table was assembled first.
        utterances: [title, `${title} articles`, `${title} journal`],
        keywords: keywordsFrom(title, 4),
        respond: () => ({
          blocks:
            matching.length === 0
              ? [
                  {
                    t: "p",
                    text: `Nothing under ${title} sits in the recent entries I was given. The full index is on the journal page.`,
                  },
                ]
              : [
                  { t: "p", text: `Under ${title}:` },
                  {
                    t: "list",
                    items: matching.map((post) => ({ label: post.title, sub: post.date })),
                  },
                ],
          chips: [
            ...matching.slice(0, 3).map((post) => asChip.route(post.title, `/blog/${post.slug}`)),
            ...services.map((service) => asChip.intent(`${service.label} service`, service.id)),
            asChip.route("All entries", "/blog"),
          ],
        }),
      };
    });
}

let cachedTable: { kb: KnowledgeBase; intents: Intent[] } | null = null;

/**
 * The full table for one compiled corpus. Memoised on identity because `getKnowledgeBase()` hands
 * out the same object within its cache window, and rebuilding on every message would re-allocate
 * the index for no reason.
 */
export function buildIntentTable(kb: KnowledgeBase): Intent[] {
  if (cachedTable && cachedTable.kb === kb) return cachedTable.intents;
  const intents = [...STATIC_INTENTS, ...serviceDetailIntents(kb), ...faqIntents(kb), ...journalTopicIntents(kb)];
  cachedTable = { kb, intents };
  return intents;
}

/** First assistant turn. Not an intent: it is the disclosure, so it must not depend on a match. */
export function openingReply(): Reply {
  return {
    blocks: [
      {
        t: "p",
        text: `Hi. I am ${PERSONA.name}, ${PERSONA.roleLine} for Marca Ubi. I answer from what this site already publishes, so I can cover what we do, the work, and how a project starts. If you would rather talk to a person, say so and I will hand you the number.`,
      },
    ],
    chips: [
      asChip.intent("What do you do?", "services.overview"),
      asChip.intent("Show me the work", "work.overview"),
      asChip.intake(),
    ],
  };
}

/**
 * The three published fallback states. Kept out of the intent table because they are chosen by the
 * resolver's score, never by a matcher lookup, and an intent here would be answerable by typing the
 * words "fallback hard".
 *
 * The three states are different situations, not three phrasings of one apology:
 * - `soft` is not a failure at all. The matcher found real candidates and is asking which one, so this
 *   copy does not apologise; it puts the question and the chips next to each other.
 * - `hard` is the first miss. Matching is still live, so the way forward is to say the same thing in
 *   words this site actually publishes, with a person and a brief behind it.
 * - `capped` is the state after `FALLBACK_LIMIT` misses, where the engine has switched ordinary
 *   matching off. Repeating "I do not know" twice in a row is what makes a pod read as evasive, so this
 *   one states the change instead of the failure: only the escape-hatch intents still answer, which is
 *   why its chips are the two reliable routes and nothing else. None of the three promises to learn,
 *   because nothing here learns.
 */
export const FALLBACK_REPLIES = {
  soft: (candidates: Intent[]): Reply => ({
    blocks: [
      {
        t: "p",
        text: "A few published things match that. Which one is closest, or none of them?",
      },
    ],
    chips: candidates.map((candidate) => asChip.intent(candidate.label, candidate.id)),
  }),
  hard: (): Reply => ({
    blocks: [
      {
        t: "p",
        text: "Nothing published on this site matches that, so I am not going to guess at it. Try the name of a service, or the outcome you want from one.",
      },
      { t: "p", text: "A person can answer what I cannot, and a brief starts the same conversation properly." },
    ],
    chips: [...PERSISTENT_MENU],
  }),
  capped: (kb: KnowledgeBase): Reply => ({
    blocks: [
      {
        t: "p",
        text: `That is twice I have missed, so I am stopping the guessing for this conversation. From here I will only route you, not interpret you.`,
      },
      {
        t: "p",
        text: `Call the studio on ${STUDIO.phone} or send ${STUDIO.email}, and either works as a brief.`,
      },
    ],
    chips: [
      asChip.intent("Talk to a person", "contact"),
      asChip.external(`Call ${STUDIO.phone}`, STUDIO.phoneHref),
      asChip.intake(),
      asChip.route("Open the full form", "/start-project"),
      ...(kb.counts.journalPosts > 0 ? [asChip.route("Read the journal", "/blog")] : []),
    ],
  }),
} as const;
