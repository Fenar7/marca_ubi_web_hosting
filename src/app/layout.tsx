import type { Metadata } from "next";
import CustomCursor from "./components/CustomCursor/CustomCursor";
import SmoothScrollProvider from "./components/SmoothScrollProvider/SmoothScrollProvider";
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <SmoothScrollProvider>
          <CustomCursor />
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
