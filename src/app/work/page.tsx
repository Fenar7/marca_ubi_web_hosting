import React from "react";
import type { Metadata } from "next";
import ClientHeader from "@/app/components/ClientHeader/ClientHeader";
import WorksSection from "@/app/components/WorksSection/WorksSection";
import MonumentalFooter from "@/app/components/Sections/MonumentalFooter";

export const metadata: Metadata = {
  title: "Selected Work & Case Archives | Marca Ubi",
  description:
    "Curated portfolio of brand architectures, high-performance digital experiences, and cultural identity systems.",
};

export default function WorkPage() {
  return (
    <div data-client-shell="true" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "#000000" }}>
      <ClientHeader />
      <main id="work-archive-main" style={{ flex: 1, paddingTop: "80px" }}>
        <h1 className="sr-only">Selected Work | Marca Ubi</h1>
        <WorksSection />
      </main>
      <MonumentalFooter />
    </div>
  );
}
