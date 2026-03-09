import type { Metadata } from "next";
import CustomCursor from "./components/CustomCursor/CustomCursor";
import SmoothScrollProvider from "./components/SmoothScrollProvider/SmoothScrollProvider";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Marca Ubi — Brand Identity & Digital Experience Studio",
  description:
    "Marca Ubi builds brand identities, content systems, and digital experiences that stay consistent everywhere your customers see you. Strategy, design, and execution — engineered for modern brands.",
  icons: {
    icon: "/m-favicon.png",
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
