"use client";

import React, { useState } from "react";
import styles from "./Step.module.scss";
import { ProjectFormData } from "../types";
import { TrashIcon, AddIcon } from "@sanity/icons";

interface Step3Props {
  formData: ProjectFormData;
  updateFormData: (field: keyof ProjectFormData, value: string) => void;
  nextStep: () => void;
}

const TIMELINE_OPTIONS = [
  { value: "immediate", badge: "Immediate (Under 2 Weeks)", detail: "High-priority rapid turn-around directive" },
  { value: "1-2-months", badge: "1 – 2 Months", detail: "Standard full identity or web development sprint" },
  { value: "quarterly", badge: "Quarterly Roadmap", detail: "Multi-phase institutional rollout" },
  { value: "exploratory", badge: "Exploratory / Advisory", detail: "Initial strategy and technical discovery" },
];

/**
 * Step 3: Project Timeline, Reference Benchmarks, and Confidentiality.
 * Clean, human, and professional agency parameters.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default function Step3Details({
  formData,
  updateFormData,
  nextStep,
}: Step3Props) {
  const initialLinks = formData.inspirationLinks
    ? formData.inspirationLinks.split(",").map((s) => s.trim()).filter(Boolean)
    : [""];

  const [links, setLinks] = useState<string[]>(initialLinks.length ? initialLinks : [""]);

  const handleLinkChange = (index: number, value: string) => {
    const updated = [...links];
    updated[index] = value;
    setLinks(updated);
    updateFormData("inspirationLinks", updated.filter(Boolean).join(", "));
  };

  const addLink = () => {
    if (links.length < 4) {
      setLinks([...links, ""]);
    }
  };

  const removeLink = (index: number) => {
    const updated = links.filter((_, i) => i !== index);
    const finalLinks = updated.length ? updated : [""];
    setLinks(finalLinks);
    updateFormData("inspirationLinks", finalLinks.filter(Boolean).join(", "));
  };

  return (
    <div className={styles.stepContainer}>
      <header className={styles.stepHeaderBlock}>
        <h2 className={styles.stepTitle}>Timeline &amp; References</h2>
        <p className={styles.stepDescription}>
          Help us align delivery targets and aesthetic benchmarks.
        </p>
      </header>

      {/* Timeline Selection */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>
          <span>Target Launch Horizon *</span>
        </label>
        <div className={styles.timelineGrid} role="radiogroup" aria-label="Launch Horizon">
          {TIMELINE_OPTIONS.map((t) => {
            const isSelected = formData.timeline === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`${styles.timelineCard} ${isSelected ? styles.active : ""}`}
                onClick={() => updateFormData("timeline", t.value)}
              >
                <span className={styles.timelineBadge}>{t.badge}</span>
                <span className={styles.timelineDetail}>{t.detail}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reference Links */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>
          <span>Reference or Benchmark Links</span>
          <span className={styles.optionalTag}>Optional</span>
        </label>
        <div className={styles.urlRepeater}>
          {links.map((link, idx) => (
            <div key={idx} className={styles.urlRow}>
              <input
                type="url"
                className={`${styles.textInput} ${styles.urlInput}`}
                placeholder={`e.g. https://example.com/site-${idx + 1}`}
                value={link}
                onChange={(e) => handleLinkChange(idx, e.target.value)}
              />
              {links.length > 1 && (
                <button
                  type="button"
                  className={styles.trashBtn}
                  onClick={() => removeLink(idx)}
                  aria-label={`Remove reference link ${idx + 1}`}
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          ))}

          {links.length < 4 && (
            <button
              type="button"
              className={styles.addLinkBtn}
              onClick={addLink}
            >
              <AddIcon />
              <span>Add Another Link</span>
            </button>
          )}
        </div>
      </div>

      {/* NDA / Attribution */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>
          <span>Attribution Preference</span>
        </label>
        <div className={styles.radioGrid} role="radiogroup" aria-label="Attribution">
          <button
            type="button"
            role="radio"
            aria-checked={formData.showcasePermission === "yes"}
            className={`${styles.radioCard} ${formData.showcasePermission === "yes" ? styles.active : ""}`}
            onClick={() => updateFormData("showcasePermission", "yes")}
          >
            <span className={styles.radioLabel}>Public Release Permitted</span>
            <span className={styles.radioDesc}>Marca Ubi may feature the work in our case study archive upon launch</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={formData.showcasePermission === "no"}
            className={`${styles.radioCard} ${formData.showcasePermission === "no" ? styles.active : ""}`}
            onClick={() => updateFormData("showcasePermission", "no")}
          >
            <span className={styles.radioLabel}>Strict NDA</span>
            <span className={styles.radioDesc}>Confidential institutional project with zero external disclosure</span>
          </button>
        </div>
      </div>

      {/* Continue Action Button */}
      <div className={styles.actionContainer}>
        <button
          type="button"
          className={styles.nextButton}
          onClick={nextStep}
          disabled={!formData.timeline}
          aria-label="Continue to brief review"
        >
          <span>Review Brief</span>
          <span className={styles.arrow} aria-hidden="true">&rarr;</span>
        </button>
      </div>
    </div>
  );
}
