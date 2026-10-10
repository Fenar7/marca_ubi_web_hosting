import type { Metadata } from "next";
import SmoothScrollProvider from "./components/SmoothScrollProvider/SmoothScrollProvider";
import { graphik } from "./fonts";
import "./globals.scss";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Marca Ubi — Brand Identity & Digital Experience Studio",
  description:
    "Marca Ubi builds brand identities, content systems, and digital experiences that stay consistent everywhere your customers see you. Strategy, design, and execution — engineered for modern brands.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png", type: "image/png" }],
    shortcut: ["/icon.png"],
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Marca Ubi — Brand Identity & Digital Experience Studio",
    description:
      "Marca Ubi builds brand identities, content systems, and digital experiences that stay consistent everywhere your customers see you.",
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
    title: "Marca Ubi — Brand Identity & Digital Experience Studio",
    description:
      "Marca Ubi builds brand identities, content systems, and digital experiences that stay consistent everywhere your customers see you.",
    images: ["/images/hero-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={graphik.variable}>
      <head>
        <link rel="preload" as="image" href="/hero/marca-ubi-logo.png" />
      </head>
      <body className="antialiased">
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
