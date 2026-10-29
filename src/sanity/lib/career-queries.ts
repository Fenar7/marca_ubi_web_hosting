import { groq } from "next-sanity";
import { client } from "./client";

/**
 * Career Posting data model.
 * Represents an open position published via Sanity Studio or statically loaded via fallback.
 */
export interface CareerPosting {
  _id: string;
  _createdAt?: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  workplaceType: "On-site" | "Hybrid" | "Remote" | string;
  employmentType: "Full-time" | "Contract" | "Part-time" | "Internship" | string;
  experience: string;
  overview?: string;
  responsibilities?: string[];
  qualifications?: string[];
  order?: number;
  isActive?: boolean;
}

/**
 * Application submission payload interface for inbound candidate filings.
 */
export interface CareerApplicationSubmission {
  positionId?: string;
  positionTitle: string;
  fullName: string;
  email: string;
  phone: string;
  linkedIn?: string;
  portfolio?: string;
  coverNote?: string;
  resumeFile?: {
    _type: "file";
    asset: {
      _type: "reference";
      _ref: string;
    };
  };
}

/**
 * GROQ query retrieving all currently active career postings ordered by priority.
 */
export const activeCareersQuery = groq`
  *[_type == "careerPosting" && isActive != false && !(_id in path('drafts.**'))] | order(order asc, _createdAt desc) {
    _id,
    _createdAt,
    title,
    "slug": slug.current,
    department,
    location,
    workplaceType,
    employmentType,
    experience,
    overview,
    responsibilities,
    qualifications,
    order,
    isActive
  }
`;

/**
 * GROQ query retrieving a single detailed career posting by its slug.
 */
export const careerBySlugQuery = groq`
  *[_type == "careerPosting" && slug.current == $slug && !(_id in path('drafts.**'))][0] {
    _id,
    _createdAt,
    title,
    "slug": slug.current,
    department,
    location,
    workplaceType,
    employmentType,
    experience,
    overview,
    responsibilities,
    qualifications,
    order,
    isActive
  }
`;

/**
 * GROQ query retrieving all valid career slugs for Next.js static generation.
 */
export const allCareerSlugsQuery = groq`
  *[_type == "careerPosting" && defined(slug.current) && isActive != false && !(_id in path('drafts.**'))][].slug.current
`;

/**
 * Static fallback dataset aligned with Marca Ubi agency brand architecture.
 * Guarantees zero empty-state regressions if Sanity CMS is uninitialized or in test mode.
 */
export const FALLBACK_CAREERS: CareerPosting[] = [
  {
    _id: "fallback-brand-account-manager",
    _createdAt: "2026-01-15T09:00:00Z",
    title: "Brand & Account Manager",
    slug: "brand-account-manager",
    department: "Brand Strategy",
    location: "Chennai / Calicut",
    workplaceType: "On-site",
    employmentType: "Full-time",
    experience: "3–4 years experience",
    overview:
      "We are seeking a seasoned Brand & Account Manager to bridge high-touch client partnerships and creative strategy. You will orchestrate brand positioning campaigns, manage high-stakes executive relationships, and steer multidisciplinary creative sprints with flawless delivery.",
    responsibilities: [
      "Own executive-level client relationships across luxury hospitality, real estate, and retail portfolios.",
      "Architect brand briefs, positioning roadmaps, and campaign deliverables alongside creative directors.",
      "Manage account profitability, scope boundaries, project timelines, and high-velocity team sprint allocations.",
      "Present strategic narrative decks and campaign performance reviews to founder-level stakeholders.",
    ],
    qualifications: [
      "3–4 years of account management or brand strategy experience within an agency or premium boutique studio.",
      "Demonstrated track record of directing omnichannel luxury branding and digital design productions.",
      "Exceptional verbal and written narrative capabilities with uncompromising eye for design craft.",
      "Fluency in client scoping, retainer forecasting, and proactive conflict resolution.",
    ],
    order: 0,
    isActive: true,
  },
  {
    _id: "fallback-copywriter-strategist",
    _createdAt: "2026-01-20T10:30:00Z",
    title: "Copywriter & Strategist",
    slug: "copywriter-strategist",
    department: "Design & Creative Direction",
    location: "Calicut",
    workplaceType: "Hybrid",
    employmentType: "Full-time",
    experience: "2–3 years experience",
    overview:
      "As a Copywriter & Strategist at Marca Ubi, you will define the linguistic soul and narrative cadence for ambitious brands. From provocative campaign taglines to immersive long-form storytelling and product microcopy, your words will establish enduring cultural resonance.",
    responsibilities: [
      "Craft distinctive verbal identities, tone of voice guidelines, and conceptual brand manifestos.",
      "Write razor-sharp headline suites, video scripts, editorial essays, and high-converting campaign collateral.",
      "Collaborate in daily creative pairings with art directors and product designers on conceptual explorations.",
      "Conduct brand voice audits and competitive messaging analyses to uncover authentic differentiation.",
    ],
    qualifications: [
      "2–3 years of copy and brand storytelling experience at a design studio, advertising agency, or editorial brand.",
      "Portfolio showcasing high-caliber conceptual depth, tonal variety, and precise typographic layout sensibility.",
      "Relentless curiosity across contemporary architecture, art, technology, and luxury consumer cultures.",
      "Ability to synthesize complex strategic briefs into intuitive, memorable, and emotional prose.",
    ],
    order: 1,
    isActive: true,
  },
  {
    _id: "fallback-ui-ux-designer",
    _createdAt: "2026-01-25T11:15:00Z",
    title: "UI/UX Designer",
    slug: "ui-ux-designer",
    department: "Engineering & Technology",
    location: "Calicut",
    workplaceType: "On-site",
    employmentType: "Full-time",
    experience: "3+ years experience",
    overview:
      "We are looking for a UI/UX Designer who obsesses over visual hierarchy, typography, motion physics, and tactile interaction design. You will craft bespoke digital flagships, web applications, and immersive digital platforms that redefine enterprise design standards.",
    responsibilities: [
      "Design end-to-end digital experiences from low-fidelity architectural wireframes to interactive Figma prototypes.",
      "Develop scalable design systems, token architectures, and component libraries with obsessive attention to detail.",
      "Partner closely with frontend engineers to ensure design precision, fluid framer-motion transitions, and zero visual compromises.",
      "Conduct interactive user testing and heuristic evaluations to continuously refine digital conversion and delight.",
    ],
    qualifications: [
      "3+ years designing complex web interfaces, e-commerce platforms, or bespoke brand digital flagships.",
      "Mastery of Figma, component variants, auto-layout, interactive prototyping, and modern design token frameworks.",
      "Deep understanding of web typography, micro-interactions, responsive grids, and accessibility standards.",
      "Strong portfolio showing shipped digital products with clean execution, bespoke aesthetics, and sound UX rationale.",
    ],
    order: 2,
    isActive: true,
  },
];

/**
 * Fetches all active career postings from Sanity, falling back gracefully to static records on CMS omission or network fault.
 */
export async function getActiveCareers(): Promise<CareerPosting[]> {
  try {
    const postings = await client.fetch<CareerPosting[]>(activeCareersQuery);

    if (Array.isArray(postings) && postings.length > 0) {
      return postings;
    }
    return FALLBACK_CAREERS;
  } catch (error: unknown) {
    console.warn(
      "[Sanity Careers] Live query failed; serving fallback career dataset:",
      error instanceof Error ? error.message : String(error)
    );
    return FALLBACK_CAREERS;
  }
}

/**
 * Fetches a single career posting by slug, falling back to static records if absent or if network fails.
 */
export async function getCareerBySlug(slug: string): Promise<CareerPosting | null> {
  try {
    const posting = await client.fetch<CareerPosting | null>(careerBySlugQuery, { slug });

    if (posting) {
      return posting;
    }
  } catch (error: unknown) {
    console.warn(
      `[Sanity Careers] Live query for slug '${slug}' failed; inspecting fallback set:`,
      error instanceof Error ? error.message : String(error)
    );
  }

  const fallbackMatch = FALLBACK_CAREERS.find((p) => p.slug === slug);
  return fallbackMatch || null;
}

/**
 * Retrieves all unique slugs across Sanity and fallback dataset for static path generation.
 */
export async function getAllCareerSlugs(): Promise<string[]> {
  try {
    const slugs = await client.fetch<string[]>(allCareerSlugsQuery);
    if (Array.isArray(slugs) && slugs.length > 0) {
      const set = new Set([...slugs, ...FALLBACK_CAREERS.map((p) => p.slug)]);
      return Array.from(set);
    }
  } catch (error: unknown) {
    console.warn(
      "[Sanity Careers] Failed to fetch career slugs for static params:",
      error instanceof Error ? error.message : String(error)
    );
  }

  return FALLBACK_CAREERS.map((p) => p.slug);
}
