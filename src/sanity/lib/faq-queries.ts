export interface SanityFaqItem {
  _id?: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
  isActive?: boolean;
}

export const faqsQuery = `*[_type == "faqItem" && isActive == true] | order(order asc, _createdAt asc) {
  _id,
  question,
  answer,
  category,
  order,
  isActive
}`;

export const FALLBACK_FAQS: SanityFaqItem[] = [
  {
    _id: "faq-distinction",
    question: "What distinguishes Marca Ubi from conventional advertising agencies or software dev shops?",
    answer:
      "We do not treat brand identity and software engineering as disconnected outputs. Traditional agencies design visual decks without knowing how systems behave in production, while software dev shops write code without understanding cultural resonance. Marca Ubi unites brand engineering, artistic direction, and full-stack software architecture under a single studio discipline, building enduring operating systems for commercial influence.",
    category: "Agency & Philosophy",
    order: 1,
    isActive: true,
  },
  {
    _id: "faq-cadence",
    question: "How does an engagement typically start, and what is your delivery cadence?",
    answer:
      "Every partnership begins with an architectural brief and a comprehensive diagnostic audit of your brand core and technology footprint. From there, we work in rigorous sprint cadences: defining the strategic thesis, shaping the visual and interactive language, and engineering production platforms with bi-weekly client checkpoints and live staging previews.",
    category: "Engagements & Delivery",
    order: 2,
    isActive: true,
  },
  {
    _id: "faq-ventures",
    question: "Do you work with early-stage ventures or exclusively institutional enterprises?",
    answer:
      "We collaborate with ambitious founders launching category-defining ventures as well as institutional enterprises modernizing legacy digital infrastructure. Our criteria is not head count or company age, but an unwavering commitment to craftsmanship, decisive leadership, and the ambition to set the standard in their sector.",
    category: "Agency & Philosophy",
    order: 3,
    isActive: true,
  },
  {
    _id: "faq-studios",
    question: "Where are your studios located, and can we collaborate across global time zones?",
    answer:
      "Our physical headquarters and core engineering/design ateliers are located at HiLITE Business Park in Calicut, with executive coordination out of Trivandrum, Kerala. We operate seamlessly across EMEA, APAC, and North American time zones, maintaining structured asynchronous communication and real-time sprint alignments.",
    category: "Engagements & Delivery",
    order: 4,
    isActive: true,
  },
  {
    _id: "faq-ip",
    question: "Who retains intellectual property, source code, and design master assets upon completion?",
    answer:
      "You do, 100%. Upon commercial completion and settlement, full intellectual property, Figma design systems, code repositories, vector typography licenses, and production deployment credentials are unconditionally transferred to your organization with zero proprietary lock-in.",
    category: "IP & Commercial Terms",
    order: 5,
    isActive: true,
  },
];

export async function getFaqs(): Promise<SanityFaqItem[]> {
  try {
    const { client } = await import("./client");
    const data = await client.fetch<SanityFaqItem[]>(faqsQuery);
    if (data && data.length > 0) {
      return data;
    }
    return FALLBACK_FAQS;
  } catch (error) {
    console.warn("[Sanity FAQ Query Error] Falling back to pre-seeded static FAQs:", error);
    return FALLBACK_FAQS;
  }
}
