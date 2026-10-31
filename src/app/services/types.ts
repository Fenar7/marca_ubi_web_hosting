/**
 * @file src/app/services/types.ts
 * @description Shared content contracts for the 16 dedicated Services detail pages.
 *              `SubServiceDoc.label` values MUST match the WHAT WE DO bullet strings in
 *              `src/app/components/Sections/ServicesAccordion/types.ts` verbatim — the
 *              homepage accordion deep-links derive anchor keys from those bullets via
 *              `subAnchorKey`, so any drift silently breaks navigation.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

export type ServiceCategory = "B2B" | "B2C";

export interface SubServiceDoc {
  /** Verbatim accordion bullet, e.g. "Paid media strategy" */
  label: string;
  /** Single-sentence promise shown at the top of the expanded panel */
  summary: string;
  /** 2–3 substantive paragraphs: mechanism, execution, client outcome */
  body: string[];
}

export interface ServiceDetailDoc {
  slug: string;
  /** Links the detail record back to its accordion card id, e.g. "b2b-demand-generation" */
  sourceId: string;
  category: ServiceCategory;
  number: string;
  title: string;
  shortDescription: string;
  /** Exactly five entries, in accordion bullet order */
  subServices: SubServiceDoc[];
}

export interface ServiceHero {
  imageUrl: string;
  alt: string;
}

export interface ServiceDetailContent extends ServiceDetailDoc {
  hero: ServiceHero;
}

/**
 * Canonical anchor-key derivation shared by the homepage accordion links and the
 * detail-page deep-link resolver. Lowercase, non-alphanumerics collapse to single
 * hyphens, leading/trailing hyphens stripped (e.g. "Public Relations (PR)" → "public-relations-pr").
 */
export function subAnchorKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
