/**
 * @file compile.ts
 * @description The pure half of the knowledge layer: given the published sources, derive the one
 *              object the pod is allowed to speak from. No Sanity import and no I/O, so the figures
 *              the pod quotes are assertable in a unit run. `collect.ts` owns the fetch, the timeout
 *              and the fallbacks; this file owns the arithmetic.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { INTAKE_CATEGORIES, INTAKE_TIMELINE_OPTIONS, SERVICES_BY_CATEGORY } from "@/app/lib/intake/intakeOptions";
import { SERVICE_DETAILS } from "@/app/services/content";
import type { Category, PostSummary } from "@/sanity/types/blog";

import type {
  KnowledgeBase,
  KnowledgeCareer,
  KnowledgeFaq,
  KnowledgeJournalPost,
  KnowledgeService,
} from "../types";
import { PROCESS_PRINCIPLES, STUDIO } from "./corpus";

/** The pod lists at most this many recent journal entries; the /blog index remains the full set. */
export const JOURNAL_LIMIT = 12;

/**
 * Raw inputs to the compiler. `null` is legal on the two Sanity halves so a caller can say "I never got
 * an answer" out loud, and it compiles to the same empty list as a genuinely quiet archive. That
 * collapse is deliberate: `collect.ts` serves a timeout as `[]`, so the pod cannot tell an outage from
 * zero posts and must not claim either one. See `work.journal` in `intents.ts`.
 */
export interface KnowledgeSources {
  posts: PostSummary[] | null;
  categories: Category[] | null;
  faqs: { question: string; answer: string }[];
  careers: { slug: string; title: string; location: string }[];
}

const journalDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/**
 * en-GB sentence-case date ("31 Oct 2026"), formatted here rather than in the browser so the locale
 * cannot drift to the visitor's device settings and so the pod cannot disagree with the dates the
 * journal surfaces print. An unparseable or absent date yields an empty string, which the answer
 * templates drop rather than printing "Invalid date".
 */
export function formatJournalDate(iso: string | undefined): string {
  if (!iso) return "";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return journalDateFormatter.format(parsed);
}

/**
 * Derives the corpus. Every count is the length of the array it describes, so a number in an answer
 * is always the size of the list printed next to it and cannot be a figure someone typed in.
 */
export function compileKnowledgeBase(sources: KnowledgeSources): KnowledgeBase {
  const services: KnowledgeService[] = SERVICE_DETAILS.map((deck) => ({
    slug: deck.slug,
    title: deck.title,
    split: deck.category,
    summary: deck.shortDescription,
    covers: deck.subServices.map((sub) => sub.label),
  }));

  const journal: KnowledgeJournalPost[] = (sources.posts ?? []).slice(0, JOURNAL_LIMIT).map((post) => ({
    slug: post.slug,
    title: post.title,
    category: post.category?.title ?? "",
    date: formatJournalDate(post.publishedAt),
  }));

  const journalCategories: string[] = (sources.categories ?? []).map((category) => category.title);

  const faqs: KnowledgeFaq[] = sources.faqs
    .filter((faq) => faq.question.trim().length > 0 && faq.answer.trim().length > 0)
    .map((faq) => ({ question: faq.question, answer: faq.answer }));

  const careers: KnowledgeCareer[] = sources.careers
    .filter((career) => Boolean(career.slug) && Boolean(career.title))
    .map((career) => ({ slug: career.slug, title: career.title, location: career.location }));

  return {
    generatedAt: new Date().toISOString(),
    services,
    journal,
    journalCategories,
    process: PROCESS_PRINCIPLES.map((principle) => ({ ...principle })),
    // The chip labels, not the stored strings: "48 hours" is what a visitor should read, while the
    // value they carry ("48 hours (Quick turnaround fees typically apply)") is a form payload.
    timelines: INTAKE_TIMELINE_OPTIONS.map((option) => option.chipLabel),
    faqs,
    careers,
    studio: STUDIO,
    counts: {
      servicePages: services.length,
      servicesB2B: services.filter((service) => service.split === "B2B").length,
      servicesB2C: services.filter((service) => service.split === "B2C").length,
      serviceOptions: Object.values(SERVICES_BY_CATEGORY).reduce((total, list) => total + list.length, 0),
      serviceCategories: INTAKE_CATEGORIES.length,
      journalPosts: journal.length,
      faqs: faqs.length,
      openRoles: careers.length,
    },
  };
}
