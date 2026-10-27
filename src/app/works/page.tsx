import type { Metadata } from "next";
import ClientHeader from "@/app/components/ClientHeader/ClientHeader";
import MonumentalFooter from "@/app/components/Sections/MonumentalFooter";
import { client } from "@/sanity/lib/client";
import { worksQuery } from "@/sanity/lib/queries";
import type { SanityWork } from "@/app/components/WorksSection/WorksSectionClient";
import WorksGalleryClient from "./WorksGalleryClient";
import styles from "./Works.module.scss";

export const revalidate = 60; // ISR cache revalidation every 60s

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://marcaubi.com").replace(/\/+$/, "");

export const metadata: Metadata = {
  title: "Selected Works & Brand Architecture | Marca Ubi",
  description:
    "Curated portfolio of institutional brand identities, enterprise platforms, and digital experiences engineered to endure.",
  alternates: {
    canonical: "/works",
  },
  openGraph: {
    type: "website",
    title: "Selected Works & Brand Architecture | Marca Ubi",
    description:
      "Curated portfolio of institutional brand identities, enterprise platforms, and digital experiences engineered to endure.",
    url: "/works",
    siteName: "Marca Ubi",
    images: [
      {
        url: "/images/bg-cover-image-2.png",
        width: 1200,
        height: 630,
        alt: "Marca Ubi Selected Works Archive",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Selected Works & Brand Architecture | Marca Ubi",
    description:
      "Curated portfolio of institutional brand identities, enterprise platforms, and digital experiences engineered to endure.",
    images: ["/images/bg-cover-image-2.png"],
  },
};

/**
 * Dedicated Client Works & Portfolio Showcase Server Page (/works).
 * Streams curated project deliverables from Sanity CMS with fallback resilience,
 * presenting an interactive Swiss broadsheet gallery with category taxonomy filtering.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default async function WorksPage() {
  let works: SanityWork[] = [];

  try {
    const fetchedWorks = await client.fetch<SanityWork[]>(worksQuery, {}, { next: { revalidate: 60 } });
    works = fetchedWorks || [];
  } catch (error) {
    console.error("Sanity CMS fetch error on /works page:", error);
    works = [];
  }

  // Resilient fallback case studies if Sanity CMS is unseeded or temporarily unreachable
  const displayWorks: SanityWork[] = works.length > 0 ? works : [
    {
      _id: "fallback-primestay",
      title: "PrimeStay Luxury Living",
      subtext: "Complete brand architecture, interior sensory language, and digital hospitality platform.",
      coverImage: null as unknown as SanityWork["coverImage"],
      caseStudyLink: undefined,
      viewWorkLink: "https://primestay.ae",
    },
    {
      _id: "fallback-logip",
      title: "LogiP Supply Chain Intelligence",
      subtext: "Enterprise design system, executive analytics workspace, and predictive freight platform.",
      coverImage: null as unknown as SanityWork["coverImage"],
      caseStudyLink: undefined,
      viewWorkLink: "https://marcaubi.com",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/works#collection`,
    url: `${SITE_URL}/works`,
    name: "Selected Works & Brand Architecture | Marca Ubi",
    description: "Curated portfolio of institutional brand identities and digital flagships.",
    isPartOf: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/works`,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: displayWorks.map((work, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: work.title,
        description: work.subtext,
        url: work.viewWorkLink || `${SITE_URL}/works`,
      })),
    },
  };

  return (
    <div data-client-shell="true" className={styles.worksPageContainer}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ClientHeader defaultTheme="dark" />
      <main id="main-content" className={styles.worksPageMain} data-header-theme="dark">
        <WorksGalleryClient initialWorks={displayWorks} />
      </main>
      <MonumentalFooter />
    </div>
  );
}
