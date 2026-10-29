import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClientHeader from "@/app/components/ClientHeader/ClientHeader";
import MonumentalFooter from "@/app/components/Sections/MonumentalFooter";
import { getAllCareerSlugs, getCareerBySlug } from "@/sanity/lib/career-queries";
import JobDetailClient from "./JobDetailClient";
import styles from "./JobDetail.module.scss";

export const revalidate = 60; // 60s ISR cache revalidation

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  try {
    const slugs = await getAllCareerSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error("[Careers Static Params] Error fetching slugs:", error);
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const career = await getCareerBySlug(slug);

  if (!career) {
    return {
      title: "Position Not Found | Marca Ubi Careers",
    };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://marcaubi.com").replace(/\/+$/, "");

  return {
    title: `${career.title} | Careers at Marca Ubi`,
    description:
      career.overview ||
      `Apply for the ${career.title} position at Marca Ubi in ${career.location}. Join our multidisciplinary creative studio.`,
    alternates: {
      canonical: `${siteUrl}/careers/${career.slug}`,
    },
    openGraph: {
      type: "website",
      title: `${career.title} | Careers at Marca Ubi`,
      description:
        career.overview ||
        `Apply for the ${career.title} position at Marca Ubi in ${career.location}.`,
      url: `${siteUrl}/careers/${career.slug}`,
      siteName: "Marca Ubi",
      images: [
        {
          url: "/images/careers/team-studio.png",
          width: 1200,
          height: 630,
          alt: `Marca Ubi - ${career.title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${career.title} | Careers at Marca Ubi`,
      description:
        career.overview ||
        `Apply for the ${career.title} position at Marca Ubi in ${career.location}.`,
      images: ["/images/careers/team-studio.png"],
    },
  };
}

/**
 * Dedicated Career Position & Application Page (/careers/[slug]).
 * Displays role overview, daily responsibilities, and values with an integrated Swiss application form.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const career = await getCareerBySlug(slug);

  if (!career) {
    notFound();
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://marcaubi.com").replace(/\/+$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: career.title,
    description: career.overview || career.title,
    datePosted: career._createdAt || "2026-01-01",
    employmentType: career.employmentType,
    hiringOrganization: {
      "@type": "Organization",
      name: "Marca Ubi",
      sameAs: "https://marcaubi.com",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: career.location,
        addressCountry: "IN",
      },
    },
    responsibilities: career.responsibilities?.join("; "),
    qualifications: career.qualifications?.join("; "),
    url: `${siteUrl}/careers/${career.slug}`,
  };

  return (
    <div data-client-shell="true" className={styles.jobDetailPageShell}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ClientHeader defaultTheme="light" />
      <main id="main-content" className={styles.jobDetailPageMain} data-header-theme="light">
        <JobDetailClient career={career} />
      </main>
      <MonumentalFooter />
    </div>
  );
}
