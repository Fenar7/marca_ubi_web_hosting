/**
 * @file src/app/layout.tsx
 * @description Master Root Layout for Marca Ubi Enterprise Digital Platform.
 *              Declares typography systems, viewport smooth-scroll providers,
 *              the conversational AI ChatPod boundary, and the canonical Schema.org
 *              ProfessionalService Knowledge Graph anchor (@id: https://marcaubi.com/#organization)
 *              for global search grounding and AI disambiguation.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import SmoothScrollProvider from "./components/SmoothScrollProvider/SmoothScrollProvider";
import ChatPodBoundary from "./chat-pod/ChatPodBoundary";
import { graphik, circularXX, helveticaNeue } from "./fonts";
import "./globals.css";
import "./globals.scss";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://marcaubi.com").replace(/\/+$/, "");

/**
 * Root Metadata Declaration for Next.js App Router.
 * - Title calibrated to 52 characters (optimal SERP threshold without viewport truncation).
 * - Description calibrated to 156 characters (full-fidelity indexing for search and LLM crawlers).
 * - Absolute canonical URL anchored to prevent multi-domain indexing duplication.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Marca Ubi | Brand Identity & Experience Architecture",
    template: "%s | Marca Ubi",
  },
  description:
    "Marca Ubi engineers living brand systems, digital flagships, and cultural experiences for global enterprises. Strategy, design, and computational execution.",
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [{ url: "/images/marca-ubi-red-png.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.png", type: "image/png" }],
    shortcut: ["/images/marca-ubi-red-png.svg"],
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Marca Ubi",
    title: "Marca Ubi | Brand Identity & Experience Architecture",
    description:
      "Marca Ubi engineers living brand systems, digital flagships, and cultural experiences for global enterprises. Strategy, design, and computational execution.",
    images: [
      {
        url: "/images/hero-image.png",
        width: 1200,
        height: 630,
        alt: "Marca Ubi Enterprise Agency",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Marca Ubi | Brand Identity & Experience Architecture",
    description:
      "Marca Ubi engineers living brand systems, digital flagships, and cultural experiences for global enterprises. Strategy, design, and computational execution.",
    images: ["/images/hero-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schemaOrgData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": "https://marcaubi.com/#organization",
        name: "Marca Ubi Enterprise Agency",
        alternateName: [
          "Marca Ubi",
          "Marca Ubi Creative Technology",
          "Marca Ubi Brand Architecture",
        ],
        description:
          "Enterprise Creative Technology, Strategic Brand Architecture, and Custom Sales Funnel Systems for institutional and luxury brands.",
        url: "https://marcaubi.com",
        logo: "https://marcaubi.com/images/marca-ubi-red-png.svg",
        image: "https://marcaubi.com/images/hero-image.png",
        telephone: "+91-495-276-8800",
        email: "studio@marcaubi.com",
        priceRange: "$$$$",
        currenciesAccepted: "INR, USD, AED, EUR, GBP",
        address: {
          "@type": "PostalAddress",
          streetAddress: "HiLITE Business Park, Calicut",
          addressLocality: "Calicut",
          addressRegion: "Kerala",
          postalCode: "673014",
          addressCountry: "IN",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 11.2588,
          longitude: 75.7804,
        },
        areaServed: [
          { "@type": "Country", name: "India" },
          { "@type": "Country", name: "United Arab Emirates" },
          { "@type": "Country", name: "United States" },
          { "@type": "Country", name: "United Kingdom" },
          { "@type": "AdministrativeArea", name: "Global" },
        ],
        sameAs: [
          "https://linkedin.com/company/marcaubi",
          "https://instagram.com/marcaubi",
          "https://github.com/Fenar7/marca_ubi_web_hosting",
        ],
        knowsAbout: [
          "Brand Transformation & Architecture",
          "Enterprise Demand Generation",
          "Account-Based Marketing (ABM)",
          "Next.js 16 App Router Engineering",
          "Digital Flagship Development",
          "Computational Design Systems",
          "Enterprise CRM & Sales Intelligence",
        ],
      },
    ],
  };

  return (
    <html
      lang="en"
      className={`${graphik.variable} ${circularXX.variable} ${helveticaNeue.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preload" as="image" href="/images/marca-ubi-red-png.svg" type="image/svg+xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgData) }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
        {/* Outside the scroll provider on purpose: Lenis transforms its wrapper, and a fixed element
            inside a transformed ancestor is positioned against that ancestor instead of the viewport.
            Suspense keeps the two Sanity round-trips off the first byte of every page. */}
        <Suspense fallback={null}>
          <ChatPodBoundary />
        </Suspense>
      </body>
    </html>
  );
}
