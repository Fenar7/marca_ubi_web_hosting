import type { Metadata } from "next";
import SmoothScrollProvider from "./components/SmoothScrollProvider/SmoothScrollProvider";
import { graphik, circularXX } from "./fonts";
import "./globals.css";
import "./globals.scss";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Marca Ubi | Brand Identity & Cultural Experience Architecture",
  description:
    "Marca Ubi builds living brand systems, digital flagships, and cultural experiences that move modern enterprise audiences. Strategy, design, and computational execution.",
  icons: {
    icon: [{ url: "/images/marca-ubi-red-png.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.png", type: "image/png" }],
    shortcut: ["/images/marca-ubi-red-png.svg"],
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Marca Ubi | Brand Identity & Cultural Experience Architecture",
    description:
      "Marca Ubi builds living brand systems, digital flagships, and cultural experiences that move modern enterprise audiences.",
    images: [
      {
        url: "/images/hero-image.png",
        width: 1200,
        height: 630,
        alt: "Marca Ubi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Marca Ubi | Brand Identity & Cultural Experience Architecture",
    description:
      "Marca Ubi builds living brand systems, digital flagships, and cultural experiences that move modern enterprise audiences.",
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
    "@type": "ProfessionalService",
    name: "Marca Ubi Enterprise Agency",
    description: "Creative Technology, Strategic Brand Architecture, and High-Performance Digital Experiences.",
    url: siteUrl,
    logo: `${siteUrl}/images/marca-ubi-red-png.svg`,
    address: {
      "@type": "PostalAddress",
      addressCountry: "IN",
      addressRegion: "Kerala",
      addressLocality: "Calicut",
      streetAddress: "HiLITE Business Park, Calicut",
      postalCode: "673014",
    },
    sameAs: [
      "https://linkedin.com/company/marcaubi",
      "https://instagram.com/marcaubi",
    ],
  };

  return (
    <html lang="en" className={`${graphik.variable} ${circularXX.variable}`} suppressHydrationWarning>
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
      </body>
    </html>
  );
}
