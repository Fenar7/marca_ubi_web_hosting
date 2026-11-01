/**
 * @file intakeOptions.ts
 * @description Single source of truth for the closed value sets the project intake accepts.
 *
 *              These arrays used to be declared locally inside the wizard steps. Two surfaces now
 *              consume them: `/start-project`'s `ProjectForm` and the conversational Chat
 *              Pod intake, and any duplication between them is a lead-quality defect waiting to
 *              happen: a CRM filter built on "Food & Beverage" silently misses a lead stored as
 *              "food and beverage". Extraction is therefore mandatory rather than tidy, and
 *              `ingest-payload-parity.test.ts` asserts both surfaces hold the *same reference*.
 *
 *              Values are canonical strings that reach the database. Chip labels are display-only
 *              and are never stored. Do not "improve" a canonical string: it must match the form's
 *              historic rows byte-for-byte, including `I'm`, the all-caps `NOT`, and the
 *              ampersands.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

/** The eight design disciplines the wizard's Step 1 offers. */
export const INTAKE_CATEGORIES: readonly string[] = [
  "Logo & identity",
  "Web & app design",
  "Business & advertising",
  "Clothing & merchandise",
  "Art & illustration",
  "Packaging & label",
  "Book & magazine",
  "Other",
];

/** 52 granular sub-services grouped by discipline. Order is the wizard's display order. */
export const SERVICES_BY_CATEGORY: Readonly<Record<string, readonly string[]>> = {
  "Logo & identity": [
    "Logo design",
    "Logo & brand identity pack",
    "Logo & social media pack",
    "Logo & hosted website",
    "Logo & business card",
    "Brand guide",
    "Business card",
    "Stationery",
    "Logo & brand guide",
    "Logo & product packaging",
  ],
  "Web & app design": [
    "Web page design",
    "WordPress theme design",
    "Landing page design",
    "Icon or button",
    "App design",
    "Facebook cover",
    "Social media page",
    "Banner ad",
    "Other web or app design",
  ],
  "Business & advertising": [
    "Postcard, flyer or print",
    "Poster",
    "Infographic",
    "Brochure",
    "Car, truck or van wrap",
    "Signage",
    "Email",
    "PowerPoint template",
    "Menu",
    "Other business or advertising",
    "Album Cover",
    "Podcast",
  ],
  "Clothing & merchandise": [
    "T-shirt",
    "Clothing or apparel",
    "Merchandise",
    "Cup or mug",
    "Sticker",
    "Other clothing or merchandise",
  ],
  "Art & illustration": [
    "Illustration or graphics",
    "Card or invitation",
    "Character or mascot",
    "Tattoo",
    "3D",
    "Other art or illustration",
  ],
  "Packaging & label": [
    "Product packaging",
    "Product label",
    "Other packaging or label",
  ],
  "Book & magazine": [
    "Book cover",
    "Magazine cover",
    "Typesetting",
    "Typesetting with imagery",
    "Other book or magazine",
  ],
  Other: ["Other design"],
};

/** Inverted lookup from service name to parent discipline; built once at module load. */
export const SERVICE_TO_CATEGORY: Readonly<Record<string, string>> = Object.freeze(
  Object.entries(SERVICES_BY_CATEGORY).reduce<Record<string, string>>(
    (accumulator, [category, services]) => {
      for (const service of services) accumulator[service] = category;
      return accumulator;
    },
    {},
  ),
);

export const INTAKE_LANGUAGES: readonly string[] = [
  "English",
  "Spanish",
  "French",
  "German",
  "Arabic",
  "Malayalam",
  "Hindi",
  "Other",
];

export const INTAKE_INDUSTRIES: readonly string[] = [
  "Technology",
  "Retail",
  "Healthcare",
  "Finance",
  "Real Estate",
  "Education",
  "Food & Beverage",
  "Luxury & Hospitality",
  "Other",
];

export const INTAKE_REFERRAL_SOURCES: readonly string[] = [
  "Google Search",
  "Social Media",
  "Friend or Colleague",
  "Direct Referral / Industry Partner",
  "Advertisement",
  "Other",
];

/**
 * Straight apostrophes and the capitalised `NOT` are load-bearing: they are the values already
 * stored against historic leads.
 */
export const INTAKE_AGENCY_STATUS_OPTIONS: readonly string[] = [
  "Yes and I'm interested in agency services",
  "Yes and I'm NOT interested in agency services",
  "No, I'm not an agency",
];

export const INTAKE_SHOWCASE_CHOICES: readonly string[] = ["Yes", "No"];

/** Timeline value that becomes the CRM `budget_bracket`. It is a duration, never a money figure. */
export interface IntakeTimelineOption {
  value: string;
  /** Compact label for chip surfaces, which cannot carry the full canonical string. */
  chipLabel: string;
  /** Secondary line shown under the primary label in the wizard. */
  subtitle?: string;
}

export const INTAKE_TIMELINE_OPTIONS: readonly IntakeTimelineOption[] = [
  {
    value: "48 hours (Quick turnaround fees typically apply)",
    chipLabel: "48 hours",
    subtitle: "Quick turnaround fees typically apply",
  },
  { value: "1 week", chipLabel: "1 week" },
  { value: "2 weeks", chipLabel: "2 weeks" },
  { value: "1 month", chipLabel: "1 month" },
  { value: "Choose a start & end date", chipLabel: "Start and end date" },
  {
    value: "Not sure. I'd like to chat with my Brand experience consultant",
    chipLabel: "Not sure",
    subtitle: "I'd like to chat with my Brand experience consultant",
  },
];

/** Display labels for closed-set values too long to fit a chip. Never stored. */
export const AGENCY_STATUS_CHIP_LABELS: Readonly<Record<string, string>> = {
  "Yes and I'm interested in agency services": "Yes, interested",
  "Yes and I'm NOT interested in agency services": "Yes, not interested",
  "No, I'm not an agency": "No, not an agency",
};

/**
 * Maps the wizard's free-form category selections onto the six values the CRM enum accepts
 * (`serviceCategories` in `lib/validations/ingest.ts`).
 *
 * Order matters and is preserved from the original inline implementation: more than two
 * categories means the visitor wants the whole programme, so it escalates to Full-Suite Advisory
 * before any keyword test runs. Substring matching is intentional, not sloppy, because the input
 * is a ", "-joined human list rather than an enum.
 *
 * @param category ", "-joined category string from `formData.category`. Empty or missing is
 *                 legal in the wizard (the schema defaults `service_category`), so it maps to
 *                 "Other" instead of throwing. The original guarded `lower` but split the raw
 *                 value, which is why this takes the nullish path first.
 */
export function mapCategory(category: string | undefined | null): string {
  const raw = category ?? "";
  const lower = raw.toLowerCase();
  const categoriesCount = raw.split(", ").filter(Boolean).length;
  if (categoriesCount > 2) return "Full-Suite Advisory";
  if (lower.includes("brand") || lower.includes("logo") || lower.includes("stationery")) return "Branding";
  if (lower.includes("app") || lower.includes("mobile")) return "Mobile Apps";
  if (lower.includes("digital") || lower.includes("web")) return "Web & Digital";
  if (lower.includes("ui") || lower.includes("ux") || lower.includes("art") || lower.includes("illustration")) return "UI/UX Design";
  if (lower.includes("advisory") || lower.includes("growth") || lower.includes("business") || lower.includes("advertising")) return "Full-Suite Advisory";
  return "Other";
}

/** Separator the wizard uses when storing multi-selections into a single string field. */
export const MULTI_VALUE_SEPARATOR = ", ";

/** Separator the wizard uses for the inspiration-link repeater. */
export const LINK_VALUE_SEPARATOR = "\n";

/** Splits a stored ", "-joined multi-value back into a list, dropping blanks. */
export function splitMultiValue(stored: string | undefined | null): string[] {
  return (stored ?? "").split(MULTI_VALUE_SEPARATOR).filter((part) => part.trim() !== "");
}

/** Splits a stored newline-joined link list, dropping blanks. */
export function splitLinks(stored: string | undefined | null): string[] {
  return (stored ?? "").split(LINK_VALUE_SEPARATOR).filter((part) => part.trim() !== "");
}
