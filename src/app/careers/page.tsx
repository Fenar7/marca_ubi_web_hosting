import type { Metadata } from "next";
import ClientHeader from "@/app/components/ClientHeader/ClientHeader";
import MonumentalFooter from "@/app/components/Sections/MonumentalFooter";
import { getActiveCareers } from "@/sanity/lib/career-queries";
import CareersListingClient from "./CareersListingClient";
import styles from "./CareersListing.module.scss";

export const revalidate = 60; // 60s ISR revalidation

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://marcaubi.com").replace(/\/+$/, "");

export const metadata: Metadata = {
  title: "Careers & Opportunities | Marca Ubi",
  description:
    "We are always looking for ambitious strategists, designers, and engineers to join our creative studios in Calicut and Trivandrum.",
  alternates: {
    canonical: "/careers",
  },
  openGraph: {
    type: "website",
    title: "Careers & Opportunities | Marca Ubi",
    description:
      "Join our multidisciplinary team crafting institutional brand architectures and digital experiences.",
    url: "/careers",
    siteName: "Marca Ubi",
    images: [
      {
        url: "/images/careers/team-studio.png",
        width: 1200,
        height: 630,
        alt: "Marca Ubi Studio Workspace and Creative Team",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Careers & Opportunities | Marca Ubi",
    description:
      "Join our multidisciplinary team crafting institutional brand architectures and digital experiences.",
    images: ["/images/careers/team-studio.png"],
  },
};

/**
 * Careers Hub Server Page (/careers).
 * Fetches published career postings from Sanity CMS with fallback resilience,
 * wrapped in Marca Ubi client header HUD and monumental footer.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default async function CareersPage() {
  const careers = await getActiveCareers();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/careers#collection`,
    url: `${SITE_URL}/careers`,
    name: "Careers & Opportunities | Marca Ubi",
    description: "Open positions across brand strategy, design direction, and engineering.",
    isPartOf: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/careers`,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: careers.map((career, idx) => ({
        "@type": "JobPosting",
        position: idx + 1,
        title: career.title,
        description: career.overview || career.title,
        jobLocation: {
          "@type": "Place",
          address: career.location,
        },
        employmentType: career.employmentType,
        url: `${SITE_URL}/careers/${career.slug}`,
      })),
    },
  };

  return (
    <div data-client-shell="true" className={styles.careersPageShell}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ClientHeader defaultTheme="light" />
      <main id="main-content" className={styles.careersPageMain} data-header-theme="light">
        <CareersListingClient careers={careers} />
      </main>
      <MonumentalFooter />
    </div>
  );
}
