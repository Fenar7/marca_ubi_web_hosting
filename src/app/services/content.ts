/**
 * @file src/app/services/content.ts
 * @description Single source of truth for the 16 Services detail pages. Merges the
 *              B2B/B2C copy decks with curated hero imagery and enforces a hard
 *              referential-integrity gate against the homepage accordion dataset:
 *              every detail record must mirror its card's slug, title, number and
 *              WHAT WE DO bullet strings verbatim, because deep-link anchors are
 *              derived from those bullets. Any drift fails the build loudly instead
 *              of shipping silently broken navigation.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import {
  B2B_SERVICES,
  B2C_SERVICES,
  type ServiceItem,
} from "@/app/components/Sections/ServicesAccordion/types";
import { B2B_SERVICE_DETAILS } from "./content/b2b";
import { B2C_SERVICE_DETAILS } from "./content/b2c";
import { SERVICE_HEROES } from "./content/heroes";
import type { ServiceDetailContent, ServiceDetailDoc } from "./types";

const ACCORDION_CARDS: ServiceItem[] = [...B2B_SERVICES, ...B2C_SERVICES];
const CARD_BY_ID = new Map(ACCORDION_CARDS.map((card) => [card.id, card]));

/**
 * Collects every integrity violation so a single build run reports the full
 * drift surface rather than failing on the first mismatch.
 */
function validateDeck(doc: ServiceDetailDoc): string[] {
  const errors: string[] = [];
  const card = CARD_BY_ID.get(doc.sourceId);

  if (!card) {
    return [`"${doc.slug}": sourceId "${doc.sourceId}" matches no accordion card`];
  }
  if (doc.slug !== card.slug) {
    errors.push(`"${doc.slug}": slug disagrees with accordion card slug "${card.slug}"`);
  }
  if (doc.title !== card.title) {
    errors.push(`"${doc.slug}": title "${doc.title}" != accordion title "${card.title}"`);
  }
  if (doc.number !== card.number) {
    errors.push(`"${doc.slug}": number "${doc.number}" != accordion number "${card.number}"`);
  }
  if (doc.category !== (card.id.startsWith("b2b-") ? "B2B" : "B2C")) {
    errors.push(`"${doc.slug}": category disagrees with its accordion tier`);
  }
  if (
    doc.subServices.length !== card.services.length ||
    doc.subServices.some((sub, i) => sub.label !== card.services[i])
  ) {
    errors.push(
      `"${doc.slug}": sub-service labels must equal accordion bullets verbatim and in order: ${card.services.join(" | ")}`,
    );
  }
  if (!doc.shortDescription?.trim()) {
    errors.push(`"${doc.slug}": shortDescription is empty`);
  }
  doc.subServices.forEach((sub) => {
    if (!sub.summary?.trim()) errors.push(`"${doc.slug}/${sub.label}": summary is empty`);
    if (!Array.isArray(sub.body) || sub.body.length < 2 || sub.body.some((p) => !p?.trim())) {
      errors.push(`"${doc.slug}/${sub.label}": body needs 2–3 non-empty paragraphs`);
    }
  });

  const hero = SERVICE_HEROES[doc.slug];
  if (!hero) {
    errors.push(`"${doc.slug}": no hero entry in SERVICE_HEROES`);
  } else {
    if (!hero.imageUrl.startsWith("https://images.unsplash.com/photo-")) {
      errors.push(`"${doc.slug}": hero imageUrl must be a verified images.unsplash.com photo URL`);
    }
    if (!hero.alt?.trim()) errors.push(`"${doc.slug}": hero alt text is empty`);
  }
  return errors;
}

const ALL_DOCS: ServiceDetailDoc[] = [...B2B_SERVICE_DETAILS, ...B2C_SERVICE_DETAILS];

const deckErrors = [
  ...ALL_DOCS.map(validateDeck).flat(),
  ...ACCORDION_CARDS
    .filter((card) => !ALL_DOCS.some((doc) => doc.sourceId === card.id))
    .map((card) => `accordion card "${card.id}" has no detail page record`),
];

if (deckErrors.length > 0) {
  throw new Error(
    `[services/content] Integrity gate failed:\n- ${deckErrors.join("\n- ")}\n` +
      "Fix the copy decks or accordion dataset so slugs, titles, numbers and bullet labels align.",
  );
}

export const SERVICE_DETAILS: ServiceDetailContent[] = ALL_DOCS.map((doc) => ({
  ...doc,
  hero: SERVICE_HEROES[doc.slug],
}));

export function getAllServiceSlugs(): string[] {
  return SERVICE_DETAILS.map((service) => service.slug);
}

/** Slug lookup is case-insensitive; unknown or malformed input yields undefined. */
export function getServiceBySlug(rawSlug: string): ServiceDetailContent | undefined {
  const slug = rawSlug.toLowerCase().trim();
  return SERVICE_DETAILS.find((service) => service.slug === slug);
}
