import React from "react";
import ProjectForm from "@/app/components/ProjectForm/ProjectForm";
import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";

export default function StartProjectPage() {
  return (
    <main id="start-project" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--color-light-grey)" }}>
      <Header />
      <div style={{ flex: 1, padding: "clamp(5rem, 10vw, 8rem) clamp(0.85rem, 3.5vw, 2rem) 4rem clamp(0.85rem, 3.5vw, 2rem)" }}>
        <ProjectForm />
      </div>
      <Footer />
    </main>
  );
}
