/**
 * @file collect.ts
 * @description The I/O half of the knowledge layer: read the published corpus from Sanity, degrade
 *              honestly when it is slow or down, and hand `compile.ts` the sources. Compiled once
 *              per cache window per server process and serialized into the pod's props, which is what
 *              lets a visitor's message be answered with no network request at all.
 *
 *              This file is imported only from the server. Nothing in it crosses to the client; the
 *              boundary is the `KnowledgeBase` value, which is plain JSON by contract.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { categoriesQuery, postsQuery } from "@/sanity/lib/blog-queries";
import { FALLBACK_CAREERS, getActiveCareers } from "@/sanity/lib/career-queries";
import { client } from "@/sanity/lib/client";
import { FALLBACK_FAQS, getFaqs } from "@/sanity/lib/faq-queries";
import type { Category, PostSummary } from "@/sanity/types/blog";

import type { KnowledgeBase } from "../types";
import { compileKnowledgeBase, type KnowledgeSources } from "./compile";

/**
 * How long a compiled corpus stays valid on the server. Without this, the mount in `layout.tsx`
 * would put four Sanity round-trips in front of every page render on the site, which is the single
 * largest threat to the pod's performance budget. The value matches the ISR cadence the journal
 * listing already runs at (`src/app/blog/page.tsx:11`), so the pod is never staler than the page it
 * sits on.
 */
const COMPILE_TTL_MS = 60_000;

/**
 * Ceiling on the Sanity half of the compile. A slow CMS costs the pod its journal entries rather
 * than delaying first paint site-wide; services, process and contact facts are static imports and
 * therefore always available.
 */
const SANITY_TIMEOUT_MS = 1_500;

/**
 * Resolves to `fallback` if the promise rejects or overruns the ceiling. The reason is logged with
 * the query name every time: an outage must be visible in server logs while the page still paints,
 * which is the difference between degradation and a silent lie.
 */
async function withTimeout<T>(label: string, work: Promise<T>, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const guard = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`[chat-pod] ${label} exceeded ${SANITY_TIMEOUT_MS}ms; compiling without it.`);
      resolve(fallback);
    }, SANITY_TIMEOUT_MS);
  });

  try {
    return await Promise.race([work, guard]);
  } catch (error) {
    console.warn(`[chat-pod] ${label} failed; compiling without it:`, error);
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function gatherSources(): Promise<KnowledgeSources> {
  const [posts, categories, faqs, careers] = await Promise.all([
    withTimeout<PostSummary[]>("postsQuery", client.fetch<PostSummary[]>(postsQuery), []),
    withTimeout<Category[]>("categoriesQuery", client.fetch<Category[]>(categoriesQuery), []),
    // getFaqs and getActiveCareers already substitute their own published fallbacks on error;
    // these constants cover the timeout path, so a slow CMS cannot silently delete the answers.
    withTimeout("faqQuery", getFaqs(), FALLBACK_FAQS),
    withTimeout("careersQuery", getActiveCareers(), FALLBACK_CAREERS),
  ]);

  return {
    // A resolved empty array means "the query worked and nothing is published"; a timeout is also
    // empty here, and both read as zero entries. Disclosing an outage in copy would require the pod
    // to claim knowledge of the CMS's health, which it does not have.
    posts,
    categories,
    faqs: faqs.map((faq) => ({ question: faq.question, answer: faq.answer })),
    careers: careers.map((career) => ({ slug: career.slug, title: career.title, location: career.location })),
  };
}

let memo: { at: number; kb: KnowledgeBase } | null = null;

/**
 * Site-wide entry point, called from the root layout. Memoised for `COMPILE_TTL_MS` so the pod costs
 * at most one compile per server process per minute rather than one per page render.
 */
export async function getKnowledgeBase(): Promise<KnowledgeBase> {
  const now = Date.now();
  if (memo && now - memo.at < COMPILE_TTL_MS) return memo.kb;

  const kb = compileKnowledgeBase(await gatherSources());
  memo = { at: now, kb };
  return kb;
}
