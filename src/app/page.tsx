import type { Metadata } from "next";
import { client } from "@/sanity/lib/client";
import { worksQuery } from "@/sanity/lib/queries";
import { postsQuery } from "@/sanity/lib/blog-queries";
import { faqsQuery, FALLBACK_FAQS, type SanityFaqItem } from "@/sanity/lib/faq-queries";
import type { SanityWork } from "./components/WorksSection/WorksSectionClient";
import type { PostSummary } from "@/sanity/types/blog";
import ClientHomeExperience from "./components/ClientHomeExperience/ClientHomeExperience";

export const revalidate = 60; // 60-second Incremental Static Regeneration

/**
 * Explicit Apex Canonical Metadata.
 * Guarantees search engine web crawlers and conversational search indices
 * resolve the apex root canonical URL unambiguously.
 */
export const metadata: Metadata = {
  alternates: {
    canonical: "https://marcaubi.com",
  },
  openGraph: {
    url: "https://marcaubi.com",
  },
};

/**
 * Flagship Client-Facing Homepage Server Component.
 * Concurrently streams dynamic client case studies, editorial dispatches, and FAQs from Sanity CMS,
 * feeding them into the 160over90 alternating living video stream.
 *
 * Emits dynamic Schema.org FAQPage structured data to feed search engine rich snippets
 * and provide authoritative grounding for Generative AI search pipelines (Perplexity, SearchGPT).
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default async function Home() {
  let works: SanityWork[] = [];
  let posts: PostSummary[] = [];
  let faqs: SanityFaqItem[] = FALLBACK_FAQS;

  try {
    const [fetchedWorks, fetchedPosts, fetchedFaqs] = await Promise.all([
      client.fetch<SanityWork[]>(worksQuery),
      client.fetch<PostSummary[]>(postsQuery),
      client.fetch<SanityFaqItem[]>(faqsQuery),
    ]);
    works = fetchedWorks || [];
    posts = fetchedPosts || [];
    if (fetchedFaqs && fetchedFaqs.length > 0) {
      faqs = fetchedFaqs;
    }
  } catch (error) {
    console.error("Sanity data fetch error on flagship homepage:", error);
    works = [];
    posts = [];
    faqs = FALLBACK_FAQS;
  }

  const faqSchema =
    faqs && faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": "https://marcaubi.com/#faq",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null;

  return (
    <>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <ClientHomeExperience works={works} posts={posts} faqs={faqs} />
    </>
  );
}
