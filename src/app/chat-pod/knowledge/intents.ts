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
 *              1. Tier 1 utterances are globally unique. An ambiguous phrase belongs in `keywords`
 *                 so it reaches the disambiguation chips instead of being won by whichever intent
 *                 was declared first.
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

import { normalise } from "../engine/normalise";
import type { Chip, Intent, KnowledgeBase, Reply } from "../types";
import {
  ALL_SERVICES_HREF,
  DRAFT_RETENTION_DAYS,
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
    id: "services.overview",
    label: "What we do",
    source: "src/app/services/content.ts:95 SERVICE_DETAILS; src/app/components/Sections/ServicesAccordion/types.ts:28,130",
    utterances: [
      "what do you do",
      "what do you offer",
      "what services do you offer",
      "what are your services",
      "what do you sell",
      "what can you do for me",
      "help me with marketing",
      "services",
      "service list",
      "your services",
    ],
    keywords: ["services", "service", "offer", "marketing", "do", "help"],
    respond: (kb) => ({
      blocks: [
        {
          t: "p",
          text: `We publish ${kb.counts.servicePages} service lines: ${kb.counts.servicesB2B} aimed at businesses and ${kb.counts.servicesB2C} at consumer brands. Each one has a page setting out the deliverables.`,
        },
        { t: "p", text: "Which group is closest to what you need?" },
      ],
      chips: [
        asChip.intent("Business work", "services.b2b"),
        asChip.intent("Consumer work", "services.b2c"),
        asChip.route("All service pages", ALL_SERVICES_HREF),
        asChip.intent("Not sure which", "services.whichone"),
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
    ],
    keywords: ["b2b", "business", "enterprise", "services"],
    respond: (kb) => {
      const lines = kb.services.filter((service) => service.split === "B2B");
      return {
        blocks: [
          { t: "p", text: "Business-to-business work:" },
          { t: "list", items: lines.map((line) => ({ label: line.title })) },
        ],
        chips: [
          ...lines.slice(0, 8).map((line) => asChip.route(line.title, `/services/${line.slug}`)),
          asChip.route("All service pages", ALL_SERVICES_HREF),
        ],
      };
    },
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
    ],
    keywords: ["b2c", "consumer", "retail", "services"],
    respond: (kb) => {
      const lines = kb.services.filter((service) => service.split === "B2C");
      return {
        blocks: [
          { t: "p", text: "Business-to-consumer work:" },
          { t: "list", items: lines.map((line) => ({ label: line.title })) },
        ],
        chips: [
          ...lines.slice(0, 8).map((line) => asChip.route(line.title, `/services/${line.slug}`)),
          asChip.route("All service pages", ALL_SERVICES_HREF),
        ],
      };
    },
  },
  {
    id: "services.whichone",
    label: "Which service",
    source: "src/app/services/content.ts:95 SERVICE_DETAILS",
    utterances: [
      "not sure",
      "which service",
      "which service do i need",
      "which service is right for me",
      "what do i need",
      "recommend",
      "help me choose",
      "i do not know which service",
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
      "who are you",
      "about you",
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
    keywords: ["social", "follow", "instagram", "linkedin", "twitter"],
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
 * One intent per published service line. The bare title is only authored as an alias where it is
 * unique across the sixteen: Public Relations (PR) is the title of both a B2B and a B2C line, and
 * letting a dictionary first-wins decide which page "public relations" means is precisely the
 * arbitrary behaviour the margin rule exists to prevent. Colliding titles stay as keywords, so the
 * visitor gets the two candidates as chips and chooses.
 */
function serviceDetailIntents(kb: KnowledgeBase): Intent[] {
  const titleKeyCounts = new Map<string, number>();
  for (const service of kb.services) {
    const key = normalise(service.title);
    titleKeyCounts.set(key, (titleKeyCounts.get(key) ?? 0) + 1);
  }

  return kb.services.map((service, index) => {
    const siblings = kb.services.filter((other) => other.split === service.split && other.slug !== service.slug);
    const related = siblings.length > 0 ? siblings[index % siblings.length] : undefined;

    const utterances: string[] = [];
    if ((titleKeyCounts.get(normalise(service.title)) ?? 0) === 1) utterances.push(service.title);
    for (const alias of SERVICE_ALIASES[service.slug] ?? []) utterances.push(alias);

    return {
      id: `services.detail.${service.slug}`,
      label: service.title,
      source: `src/app/services/content.ts:95 SERVICE_DETAILS (slug "${service.slug}"); src/app/services/content/${service.split === "B2B" ? "b2b" : "b2c"}.ts`,
      utterances,
      keywords: [
        ...keywordsFrom(service.title),
        ...service.covers.slice(0, 2).flatMap((cover) => keywordsFrom(cover, 2)),
      ].slice(0, 8),
      respond: () => ({
        blocks: [
          { t: "p", text: service.summary },
          { t: "p", text: "What it covers:" },
          { t: "list", items: service.covers.slice(0, 3).map((cover) => ({ label: cover })) },
        ],
        chips: [
          asChip.route("Open the page", `/services/${service.slug}`),
          ...(related ? [asChip.intent(related.title, `services.detail.${related.slug}`)] : []),
          asChip.intake(),
        ],
      }),
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
 * One intent per published journal category. Only titles are compiled, so the answer stays inside
 * the twelve entries the pod was given and sends anything it cannot place to the full index rather
 * than implying it knows the whole archive.
 */
function journalTopicIntents(kb: KnowledgeBase): Intent[] {
  return kb.journalCategories
    .filter((title) => title.trim().length > 0)
    .map((title) => {
      const matching = kb.journal.filter((post) => post.category === title);
      return {
        id: `work.journal.topic.${title}`,
        label: `${title} entries`,
        source: `src/sanity/lib/blog-queries.ts:51 categoriesQuery`,
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
 */
export const FALLBACK_REPLIES = {
  soft: (candidates: Intent[]): Reply => ({
    blocks: [{ t: "p", text: "That could mean a few things. Which is closest?" }],
    chips: candidates.map((candidate) => asChip.intent(candidate.label, candidate.id)),
  }),
  hard: (): Reply => ({
    blocks: [
      {
        t: "p",
        text: "I do not have an answer for that. I only know what is published on this site. Here is what I can do.",
      },
    ],
    chips: [...PERSISTENT_MENU],
  }),
  capped: (kb: KnowledgeBase): Reply => ({
    blocks: [
      {
        t: "p",
        text: "I am going to stop guessing. I only know what is on this site, and I would rather tell you that than make something up.",
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
