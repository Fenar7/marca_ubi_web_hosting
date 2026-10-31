import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClientHeader from "@/app/components/ClientHeader/ClientHeader";
import MonumentalFooter from "@/app/components/Sections/MonumentalFooter";
import { getAllServiceSlugs, getServiceBySlug } from "../content";
import ServiceDetailClient from "./ServiceDetailClient";
import styles from "./ServiceDetail.module.scss";

/**
 * All 16 detail records are bundled compile-time data, so the route renders
 * fully static and any slug outside the generated set 404s without a runtime
 * render pass.
 */
export const dynamicParams = false;

type PageProps = {
  params: Promise<{ slug: string }>;
};

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://marcaubi.com").replace(/\/+$/, "");

export function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    return { title: "Service Not Found | Marca Ubi" };
  }

  const title = `${service.title} | Marca Ubi`;
  const url = `${siteUrl}/services/${service.slug}`;

  return {
    title,
    description: service.shortDescription,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description: service.shortDescription,
      url,
      siteName: "Marca Ubi",
      images: [
        {
          url: service.hero.imageUrl,
          width: 2400,
          height: 1263,
          alt: service.hero.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: service.shortDescription,
      images: [service.hero.imageUrl],
    },
  };
}

/**
 * Dedicated Services Capability Page (/services/[slug]).
 * Editorial light-canvas detail page per capability: breadcrumb, title, summary,
 * full-bleed hero and the "What we do" sub-service accordion. Homepage accordion
 * bullets deep-link here via `#<anchor-key>` which auto-expands the matching row.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    serviceType: service.title,
    description: service.shortDescription,
    url: `${siteUrl}/services/${service.slug}`,
    provider: {
      "@type": "Organization",
      name: "Marca Ubi",
      url: siteUrl,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `What we do — ${service.title}`,
      itemListElement: service.subServices.map((sub) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: sub.label,
          description: sub.summary,
        },
      })),
    },
  };

  return (
    <div data-client-shell="true" className={styles.servicePageShell}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ClientHeader defaultTheme="light" />
      <main id="main-content" className={styles.servicePageMain} data-header-theme="light">
        <ServiceDetailClient content={service} />
      </main>
      <MonumentalFooter />
    </div>
  );
}
