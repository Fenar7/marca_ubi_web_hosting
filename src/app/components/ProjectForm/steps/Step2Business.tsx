"use client";

import React, { useState } from "react";
import styles from "./Step.module.scss";
import { ProjectFormData } from "../types";

interface Step2Props {
  formData: ProjectFormData;
  updateFormData: (field: keyof ProjectFormData, value: string) => void;
  nextStep: () => void;
}

const LANGUAGES = [
  "English",
  "Malayalam",
  "Arabic",
  "Hindi",
  "German",
  "French",
  "Spanish",
  "Other",
];

/**
 * Step 2: Brand & Stakeholder Details.
 * Clean, modern form inputs with zero AI-slop robotic prefixes.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default function Step2Business({
  formData,
  updateFormData,
  nextStep,
}: Step2Props) {
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});

  const validateAndProceed = () => {
    const newErrors: { [key: string]: boolean } = {};
    if (!formData.name.trim()) newErrors.name = true;
    if (!formData.email.trim()) newErrors.email = true;
    if (!formData.projectName.trim()) newErrors.projectName = true;
    if (!formData.projectDescription.trim()) newErrors.projectDescription = true;

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      nextStep();
    }
  };

  return (
    <div className={styles.stepContainer}>
      <header className={styles.stepHeaderBlock}>
        <h2 className={styles.stepTitle}>Tell Us About Your Brand</h2>
        <p className={styles.stepDescription}>
          Share who you are and an overview of what you want to build.
        </p>
      </header>

      <div className={styles.formGrid}>
        {/* Your Name */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="field-name">
            <span>Your Name *</span>
          </label>
          <input
            id="field-name"
            type="text"
            className={styles.textInput}
            placeholder="e.g. Alexander Vance"
            value={formData.name}
            onChange={(e) => updateFormData("name", e.target.value)}
            style={errors.name ? { borderColor: "#ea002a" } : undefined}
          />
        </div>

        {/* Corporate Email */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="field-email">
            <span>Work Email *</span>
          </label>
          <input
            id="field-email"
            type="email"
            className={styles.textInput}
            placeholder="e.g. alexander@enterprise.com"
            value={formData.email}
            onChange={(e) => updateFormData("email", e.target.value)}
            style={errors.email ? { borderColor: "#ea002a" } : undefined}
          />
        </div>

        {/* Contact Phone */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="field-phone">
            <span>Phone / WhatsApp</span>
            <span className={styles.optionalTag}>Optional</span>
          </label>
          <input
            id="field-phone"
            type="tel"
            className={styles.textInput}
            placeholder="+91 00000 00000"
            value={formData.phone}
            onChange={(e) => updateFormData("phone", e.target.value)}
          />
        </div>

        {/* Working Language */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="field-lang">
            <span>Preferred Language</span>
          </label>
          <select
            id="field-lang"
            className={styles.selectInput}
            value={formData.language || "English"}
            onChange={(e) => updateFormData("language", e.target.value)}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang} style={{ background: "#0c0c0c", color: "#ffffff" }}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Company / Brand Name */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="field-proj-name">
            <span>Brand or Company Name *</span>
          </label>
          <input
            id="field-proj-name"
            type="text"
            className={styles.textInput}
            placeholder="e.g. Apex Global Logistics"
            value={formData.projectName}
            onChange={(e) => updateFormData("projectName", e.target.value)}
            style={errors.projectName ? { borderColor: "#ea002a" } : undefined}
          />
        </div>

        {/* Current Website */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="field-website">
            <span>Current Website or Deck</span>
            <span className={styles.optionalTag}>Optional</span>
          </label>
          <input
            id="field-website"
            type="url"
            className={styles.textInput}
            placeholder="https://..."
            value={formData.website}
            onChange={(e) => updateFormData("website", e.target.value)}
          />
        </div>

        {/* Project Scope Description */}
        <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
          <label className={styles.inputLabel} htmlFor="field-desc">
            <span>Project Overview &amp; Objectives *</span>
          </label>
          <textarea
            id="field-desc"
            className={styles.textArea}
            placeholder="Describe what you are looking to achieve, your timeline expectations, and any specific requirements..."
            value={formData.projectDescription}
            onChange={(e) => updateFormData("projectDescription", e.target.value)}
            style={errors.projectDescription ? { borderColor: "#ea002a" } : undefined}
          />
        </div>
      </div>

      {/* Continue Action Button */}
      <div className={styles.actionContainer}>
        <button
          type="button"
          className={styles.nextButton}
          onClick={validateAndProceed}
          aria-label="Continue to timeline and budget details"
        >
          <span>Continue</span>
          <span className={styles.arrow} aria-hidden="true">&rarr;</span>
        </button>
      </div>
    </div>
  );
}
