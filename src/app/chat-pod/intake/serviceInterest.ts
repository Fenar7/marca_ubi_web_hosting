import { B2B_SERVICES, B2C_SERVICES } from "@/app/components/Sections/ServicesAccordion/types";

/** Public marketing enquiries need discovery by the advisory team, not a fabricated design deliverable. */
export const SERVICE_INTEREST_ROUTING = {
  "demand-generation": "Paid acquisition and pipeline scope require advisory discovery.",
  "integrated-marketing": "A coordinated marketing programme requires advisory discovery.",
  "corporate-communications": "Corporate messaging and communications require advisory discovery.",
  "social-influencer-marketing": "B2B social strategy spans deliverables beyond the legacy design list.",
  "content-and-scale": "Content operations require scope and capacity discovery.",
  "public-relations-pr": "B2B PR requires communications discovery.",
  "customer-marketing": "Customer programmes require lifecycle discovery.",
  "account-based-marketing": "Account programmes require sales and marketing discovery.",
  "integrated-creativity": "Creative platforms span branding, campaigns, and production.",
  "social-influencer": "Consumer social programmes require channel and creator discovery.",
  "digital-performance": "Performance work requires acquisition and measurement discovery.",
  "sports-marketing": "Sports partnerships and activation require advisory discovery.",
  "crm-and-loyalty": "Retention programmes require lifecycle and platform discovery.",
  "public-relations": "Consumer PR requires communications discovery.",
  "live-experiences": "Live production requires experience and operational discovery.",
  "retail-activation": "Retail programmes require channel and activation discovery.",
} as const;

export const UNDECIDED_SERVICE = "undecided";

export const SERVICE_INTEREST_OPTIONS = [...B2B_SERVICES, ...B2C_SERVICES].map((service) => ({
  value: service.slug,
  chip: `${service.title} (${service.id.startsWith("b2b-") ? "B2B" : "B2C"})`,
}));

/** IDs are checked against both the published catalogue and explicit routing policy before storage. */
export function isServiceInterest(value: string): boolean {
  return value === UNDECIDED_SERVICE || (
    Object.hasOwn(SERVICE_INTEREST_ROUTING, value) && SERVICE_INTEREST_OPTIONS.some((option) => option.value === value)
  );
}

/** Reject malformed/mixed-uncertain values rather than silently dropping an intended service. */
export function validateServiceInterests(raw: unknown): string[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > SERVICE_INTEREST_OPTIONS.length) return null;
  if (!raw.every((value): value is string => typeof value === "string" && isServiceInterest(value))) return null;
  const values = [...new Set(raw)];
  return values.includes(UNDECIDED_SERVICE) && values.length > 1 ? null : values;
}

/** Labels carry audience context because the two public catalogues share service titles. */
export function serviceInterestLabel(value: string): string {
  return value === UNDECIDED_SERVICE ? "Not sure yet" : SERVICE_INTEREST_OPTIONS.find((option) => option.value === value)?.chip ?? value;
}
