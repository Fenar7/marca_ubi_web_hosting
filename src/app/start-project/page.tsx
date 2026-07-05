import React from "react";
import ProjectForm from "@/app/components/ProjectForm/ProjectForm";
import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";

export default function StartProjectPage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--color-light-grey)" }}>
      <Header />
      <div style={{ flex: 1, padding: "8rem 2rem 4rem 2rem" }}>
        <ProjectForm />
      </div>
      <Footer />
    </main>
  );
}
