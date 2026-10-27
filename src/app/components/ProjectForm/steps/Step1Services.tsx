"use client";

import React, { useState } from "react";
import styles from "./Step.module.scss";
import { ProjectFormData } from "../types";

interface Step1Props {
  formData: ProjectFormData;
  updateFormData: (field: keyof ProjectFormData, value: string) => void;
  nextStep: () => void;
}

interface AgencyPillar {
  id: string;
  category: string;
  title: string;
  tagline: string;
  scopeList: string[];
}

const AGENCY_PILLARS: AgencyPillar[] = [
  {
    id: "brand-identity",
    category: "Branding",
    title: "Brand Strategy & Visual Identity",
    tagline: "Institutional brand systems, positioning, visual guidelines, typography, and tone of voice.",
    scopeList: ["Brand Strategy & Positioning", "Visual Identity Systems", "Brand Architecture", "Typography & Design Systems"],
  },
  {
    id: "digital-web",
    category: "Web & Digital",
    title: "Digital Infrastructure & Web Platforms",
    tagline: "Bespoke high-performance Next.js websites, mobile applications, interactive platforms, and eCommerce.",
    scopeList: ["Flagship Corporate Websites", "Interactive Web Applications", "Mobile App UI/UX", "Full-Stack Web Engineering"],
  },
  {
    id: "creative-motion",
    category: "Creative Direction",
    title: "Creative Direction & Motion Cinema",
    tagline: "Cinematic 3D animation, brand films, showreels, high-impact campaign creative, and editorial content.",
    scopeList: ["Brand Films & Showreels", "3D & Motion Graphics", "Campaign Art Direction", "Editorial & Spatial Design"],
  },
  {
    id: "advisory-growth",
    category: "Full-Suite Advisory",
    title: "Enterprise Advisory & Full-Suite Growth",
    tagline: "Comprehensive end-to-end agency partnership, marketing architecture, GTM strategy, and brand scaling.",
    scopeList: ["Go-to-Market Strategy", "Integrated Marketing Architecture", "Ongoing Creative Partnership", "Brand Performance & Scale"],
  },
];

/**
 * Step 1: Core Agency Discipline Selection.
 * Replaces outdated freelance checkboxes (mugs, t-shirts, beer labels) with authentic agency disciplines.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default function Step1Services({
  formData,
  updateFormData,
  nextStep,
}: Step1Props) {
  const [selectedPillarId, setSelectedPillarId] = useState<string>(() => {
    const matched = AGENCY_PILLARS.find((p) => p.title === formData.service);
    return matched ? matched.id : "";
  });

  const handleSelectPillar = (pillar: AgencyPillar) => {
    setSelectedPillarId(pillar.id);
    updateFormData("category", pillar.category);
    updateFormData("service", pillar.title);
  };

  return (
    <div className={styles.stepContainer}>
      <header className={styles.stepHeaderBlock}>
        <h2 className={styles.stepTitle}>Select Your Focus Discipline</h2>
        <p className={styles.stepDescription}>
          Choose the core capability required for your project. We assemble dedicated specialist teams around each engagement.
        </p>
      </header>

      {/* 4 Authentic Agency Pillars */}
      <div className={styles.pillarGrid} role="radiogroup" aria-label="Core Capabilities">
        {AGENCY_PILLARS.map((pillar, idx) => {
          const isSelected = selectedPillarId === pillar.id;
          return (
            <button
              key={pillar.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`${styles.pillarCard} ${isSelected ? styles.active : ""}`}
              onClick={() => handleSelectPillar(pillar)}
            >
              <div className={styles.pillarTop}>
                <span className={styles.pillarIndex}>0{idx + 1}</span>
                <span className={styles.selectionDot} aria-hidden="true" />
              </div>

              <h3 className={styles.pillarTitle}>{pillar.title}</h3>
              <p className={styles.pillarTagline}>{pillar.tagline}</p>

              <div className={styles.scopeTags}>
                {pillar.scopeList.map((scope) => (
                  <span key={scope} className={styles.scopeTag}>
                    {scope}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Continue Action Button */}
      <div className={styles.actionContainer}>
        <button
          type="button"
          className={styles.nextButton}
          onClick={nextStep}
          disabled={!formData.service}
          aria-label="Continue to venture and scope details"
        >
          <span>Continue</span>
          <span className={styles.arrow} aria-hidden="true">&rarr;</span>
        </button>
      </div>
    </div>
  );
}
