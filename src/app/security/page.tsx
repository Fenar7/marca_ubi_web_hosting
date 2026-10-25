import React from "react";
import type { Metadata } from "next";
import ClientHeader from "@/app/components/ClientHeader/ClientHeader";
import MonumentalFooter from "@/app/components/Sections/MonumentalFooter";

export const metadata: Metadata = {
  title: "Security Protocol | Marca Ubi",
  description: "Enterprise security architecture, rate limiting, and zero-trust ingestion standards.",
};

export default function SecurityPage() {
  return (
    <div data-client-shell="true" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "#0b0b0b", color: "#ffffff" }}>
      <ClientHeader />
      <main style={{ flex: 1, padding: "clamp(8rem, 12vw, 12rem) clamp(1.5rem, 5vw, 4.5rem) 6rem", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
        <span style={{ fontFamily: "var(--font-circular)", fontSize: "12px", color: "#ea002a", letterSpacing: "0.1em", textTransform: "uppercase" }}>Security</span>
        <h1 style={{ fontFamily: "var(--font-circular)", fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, margin: "1rem 0 2rem", letterSpacing: "-0.035em" }}>Security Protocol</h1>
        <div style={{ fontFamily: "var(--font-circular)", fontSize: "16px", lineHeight: "1.7", color: "rgba(255, 255, 255, 0.8)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <p>
            Marca Ubi employs defense-in-depth infrastructure across all client touchpoints and administrative portals. Our inbound ingestion endpoints enforce strict rate-limiting, cryptographic honeypots, and token validation.
          </p>
          <p>
            The Sales Funnel CRM is partitioned behind multi-layered authentication, Row-Level Security (RLS) policies, and isolated server actions, guaranteeing that public marketing visitors cannot access administrative data.
          </p>
        </div>
      </main>
      <MonumentalFooter />
    </div>
  );
}
