import React from "react";
import type { Metadata } from "next";
import ClientHeader from "@/app/components/ClientHeader/ClientHeader";
import MonumentalFooter from "@/app/components/Sections/MonumentalFooter";

export const metadata: Metadata = {
  title: "Terms of Engagement | Marca Ubi",
  description: "Enterprise commercial governance, IP licensing, and contractual service terms.",
};

export default function TermsPage() {
  return (
    <div data-client-shell="true" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "#0b0b0b", color: "#ffffff" }}>
      <ClientHeader />
      <main style={{ flex: 1, padding: "clamp(8rem, 12vw, 12rem) clamp(1.5rem, 5vw, 4.5rem) 6rem", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
        <span style={{ fontFamily: "var(--font-circular)", fontSize: "12px", color: "#ea002a", letterSpacing: "0.1em", textTransform: "uppercase" }}>Legal</span>
        <h1 style={{ fontFamily: "var(--font-circular)", fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, margin: "1rem 0 2rem", letterSpacing: "-0.035em" }}>Terms of Engagement</h1>
        <div style={{ fontFamily: "var(--font-circular)", fontSize: "16px", lineHeight: "1.7", color: "rgba(255, 255, 255, 0.8)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <p>
            All strategic deliverables, brand architectures, vector marks, and digital platforms engineered by Marca Ubi are subject to executed master service agreements (MSAs) and statement-of-work (SOW) covenants.
          </p>
          <p>
            Intellectual property ownership transfers upon full contractual settlement, preserving proprietary studio tooling, boilerplate component architectures, and foundational utility libraries.
          </p>
        </div>
      </main>
      <MonumentalFooter />
    </div>
  );
}
