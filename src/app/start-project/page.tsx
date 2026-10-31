import type { Metadata } from "next";
import ProjectForm from "@/app/components/ProjectForm/ProjectForm";
import ClientHeader from "@/app/components/ClientHeader/ClientHeader";
import MonumentalFooter from "@/app/components/Sections/MonumentalFooter";
import StartProjectHero from "./StartProjectHero";
import styles from "./StartProject.module.scss";

export const metadata: Metadata = {
  title: "Start a Project | Marca Ubi",
  description:
    "Brief the Marca Ubi studio across brand, digital, and design disciplines. Four steps: scope, business context, timeline, and a read-back before submission.",
  alternates: {
    canonical: "/start-project",
  },
};

/**
 * Dedicated intake page for the multi-step project brief. Replaces the former
 * homepage popup: the same ProjectForm wizard now lives on the light editorial
 * canvas beneath a 45vh cinematic band of the studio's main film.
 */
export default function StartProjectPage() {
  return (
    <div data-client-shell="true" className={styles.pageShell}>
      <ClientHeader defaultTheme="light" />
      <main id="start-project-main" className={styles.pageMain} data-header-theme="light">
        <StartProjectHero />
        <section className={styles.formSection}>
          <ProjectForm />
        </section>
      </main>
      <MonumentalFooter />
    </div>
  );
}
