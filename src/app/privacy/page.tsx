import React from "react";
import type { Metadata } from "next";
import ClientHeader from "@/app/components/ClientHeader/ClientHeader";
import MonumentalFooter from "@/app/components/Sections/MonumentalFooter";

export const metadata: Metadata = {
  title: "Privacy Architecture | Marca Ubi",
  description: "Enterprise privacy protocol, telemetry boundaries, and global data governance standards.",
};

export default function PrivacyPage() {
  return (
    <div data-client-shell="true" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "#0b0b0b", color: "#ffffff" }}>
      <ClientHeader />
      <main style={{ flex: 1, padding: "clamp(8rem, 12vw, 12rem) clamp(1.5rem, 5vw, 4.5rem) 6rem", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
        <span style={{ fontFamily: "var(--font-circular)", fontSize: "12px", color: "#ea002a", letterSpacing: "0.1em", textTransform: "uppercase" }}>Governance</span>
        <h1 style={{ fontFamily: "var(--font-circular)", fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, margin: "1rem 0 2rem", letterSpacing: "-0.035em" }}>Privacy Architecture</h1>
        <div style={{ fontFamily: "var(--font-circular)", fontSize: "16px", lineHeight: "1.7", color: "rgba(255, 255, 255, 0.8)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <p>
            Marca Ubi operates with uncompromising data sovereignty standards. We collect only telemetric coordinates strictly required for inquiry routing, commercial contracts, and security enforcement across our studios in Kozhikode and Trivandrum.
          </p>
          <p>
            Client brief submissions are protected by TLS 1.3 cryptographic transit, database encryption at rest, and strict role-based access boundaries. We do not monetize, broker, or syndicate client information.
          </p>
        </div>
      </main>
      <MonumentalFooter />
    </div>
  );
}
