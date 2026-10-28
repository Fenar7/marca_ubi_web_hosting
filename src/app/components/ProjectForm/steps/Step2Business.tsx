"use client";

import React, { useState } from "react";
import styles from "./Step.module.scss";
import { ProjectFormData } from "../types";

interface Step2Props {
  formData: ProjectFormData;
  updateFormData: (field: keyof ProjectFormData, value: string) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Arabic",
  "Malayalam",
  "Hindi",
  "Other",
];

const INDUSTRIES = [
  "Technology",
  "Retail",
  "Healthcare",
  "Finance",
  "Real Estate",
  "Education",
  "Food & Beverage",
  "Luxury & Hospitality",
  "Other",
];

const REFERRAL_SOURCES = [
  "Google Search",
  "Social Media",
  "Friend or Colleague",
  "Direct Referral / Industry Partner",
  "Advertisement",
  "Other",
];

const AGENCY_STATUS_OPTIONS = [
  "Yes and I'm interested in agency services",
  "Yes and I'm NOT interested in agency services",
  "No, I'm not an agency",
];

/**
 * Step 2: Commercial Brand, Stakeholder & Contact Coordinates.
 * Restores 100% of authentic fields (Instagram, Industry, Agency Status, Referral)
 * with Swiss 2px border radius, high-contrast dark luxury surfaces, and atomic validation.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default function Step2Business({
  formData,
  updateFormData,
  nextStep,
  prevStep,
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
        <h2 className={styles.stepTitle}>Tell us about your business</h2>
        <p className={styles.stepDescription}>
          Share who you are, your brand coordinates, and an overview of your project vision.
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
            className={`${styles.textInput} ${errors.name ? styles.inputError : ""}`}
            placeholder="e.g. John Doe"
            value={formData.name}
            onChange={(e) => updateFormData("name", e.target.value)}
          />
        </div>

        {/* Email Address */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="field-email">
            <span>Corporate or Direct Email *</span>
          </label>
          <input
            id="field-email"
            type="email"
            className={`${styles.textInput} ${errors.email ? styles.inputError : ""}`}
            placeholder="e.g. john@example.com"
            value={formData.email}
            onChange={(e) => updateFormData("email", e.target.value)}
          />
        </div>

        {/* Phone Number */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="field-phone">
            <span>Phone Number</span>
            <span className={styles.optionalTag}>Optional</span>
          </label>
          <input
            id="field-phone"
            type="tel"
            className={styles.textInput}
            placeholder="e.g. +971 50 123 4567"
            value={formData.phone}
            onChange={(e) => updateFormData("phone", e.target.value)}
          />
        </div>

        {/* Instagram Handle */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="field-instagram">
            <span>Instagram Handle</span>
            <span className={styles.optionalTag}>Optional</span>
          </label>
          <input
            id="field-instagram"
            type="text"
            className={styles.textInput}
            placeholder="e.g. @yourbrand"
            value={formData.instagram}
            onChange={(e) => updateFormData("instagram", e.target.value)}
          />
        </div>

        {/* Preferred Working Language */}
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
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Industry */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="field-industry">
            <span>Industry Sector</span>
          </label>
          <select
            id="field-industry"
            className={styles.selectInput}
            value={formData.industry || ""}
            onChange={(e) => updateFormData("industry", e.target.value)}
          >
            <option value="">Select industry sector</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        {/* Brand or Company Name */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="field-proj-name">
            <span>Name Your Project / Brand *</span>
          </label>
          <input
            id="field-proj-name"
            type="text"
            className={`${styles.textInput} ${errors.projectName ? styles.inputError : ""}`}
            placeholder="e.g. Packaging for an organic beverage company"
            value={formData.projectName}
            onChange={(e) => updateFormData("projectName", e.target.value)}
          />
        </div>

        {/* Current Website or Social Link */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="field-website">
            <span>Current Website or Portfolio</span>
            <span className={styles.optionalTag}>Optional</span>
          </label>
          <input
            id="field-website"
            type="url"
            className={styles.textInput}
            placeholder="e.g. https://yourcompany.com"
            value={formData.website}
            onChange={(e) => updateFormData("website", e.target.value)}
          />
        </div>

        {/* Project Scope Description */}
        <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
          <label className={styles.inputLabel} htmlFor="field-desc">
            <span>Describe Your Project *</span>
          </label>
          <textarea
            id="field-desc"
            className={`${styles.textArea} ${errors.projectDescription ? styles.inputError : ""}`}
            placeholder="Tell us what you need designed, target audience, deliverables, and any specific preferences..."
            value={formData.projectDescription}
            onChange={(e) => updateFormData("projectDescription", e.target.value)}
          />
        </div>

        {/* Agency Status Radio Group */}
        <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
          <label className={styles.inputLabel}>
            <span>Are you an agency?</span>
          </label>
          <div className={styles.radioGroupVertical} role="radiogroup" aria-label="Agency Status">
            {AGENCY_STATUS_OPTIONS.map((statusOption) => {
              const isChecked = formData.agencyStatus === statusOption;
              return (
                <label
                  key={statusOption}
                  className={`${styles.radioCardOption} ${isChecked ? styles.active : ""}`}
                >
                  <input
                    type="radio"
                    name="agencyStatus"
                    value={statusOption}
                    checked={isChecked}
                    onChange={(e) => updateFormData("agencyStatus", e.target.value)}
                    className={styles.hiddenRadio}
                  />
                  <span className={styles.customRadioIndicator} aria-hidden="true" />
                  <span className={styles.radioOptionLabel}>{statusOption}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Referral Source */}
        <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
          <label className={styles.inputLabel} htmlFor="field-referral">
            <span>How did you hear about us?</span>
          </label>
          <select
            id="field-referral"
            className={styles.selectInput}
            value={formData.referral || ""}
            onChange={(e) => updateFormData("referral", e.target.value)}
          >
            <option value="">Select channel</option>
            {REFERRAL_SOURCES.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className={styles.dualActionContainer}>
        <button
          type="button"
          className={styles.backButtonAction}
          onClick={prevStep}
          aria-label="Back to services selection"
        >
          <span>&larr; Back</span>
        </button>

        <button
          type="button"
          className={styles.nextButton}
          onClick={validateAndProceed}
          aria-label="Continue to timeline and references"
        >
          <span>Next Step</span>
          <span className={styles.arrow} aria-hidden="true">
            &rarr;
          </span>
        </button>
      </div>
    </div>
  );
}
