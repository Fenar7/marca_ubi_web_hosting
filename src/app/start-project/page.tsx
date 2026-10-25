import React from "react";
import ProjectForm from "@/app/components/ProjectForm/ProjectForm";
import ClientHeader from "@/app/components/ClientHeader/ClientHeader";
import MonumentalFooter from "@/app/components/Sections/MonumentalFooter";

export default function StartProjectPage() {
  return (
    <div data-client-shell="true" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "#0b0b0b" }}>
      <ClientHeader />
      <main id="start-project-main" style={{ flex: 1, padding: "clamp(6rem, 10vw, 8rem) clamp(1rem, 4vw, 3rem) 5rem" }}>
        <h1 className="sr-only">Start a Project Brief | Marca Ubi</h1>
        <ProjectForm />
      </main>
      <MonumentalFooter />
    </div>
  );
}
