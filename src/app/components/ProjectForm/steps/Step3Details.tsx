"use client";

import React, { useState } from "react";
import styles from "./Step.module.scss";
import { ProjectFormData } from "../types";
import {
  ClockIcon,
  CalendarIcon,
  CommentIcon,
  OlistIcon,
  RocketIcon,
  AddIcon,
  TrashIcon,
} from "@sanity/icons";

interface Step3Props {
  formData: ProjectFormData;
  updateFormData: (field: keyof ProjectFormData, value: string) => void;
  nextStep: () => void;
  prevStep: () => void;
}

interface TimelineOption {
  value: string;
  primaryLabel: string;
  subtitle?: string;
  icon: React.ReactNode;
}

const TIMELINE_OPTIONS: TimelineOption[] = [
  {
    value: "48 hours (Quick turnaround fees typically apply)",
    primaryLabel: "48 hours",
    subtitle: "Quick turnaround fees typically apply",
    icon: <RocketIcon />,
  },
  {
    value: "1 week",
    primaryLabel: "1 week",
    icon: <ClockIcon />,
  },
  {
    value: "2 weeks",
    primaryLabel: "2 weeks",
    icon: <CalendarIcon />,
  },
  {
    value: "1 month",
    primaryLabel: "1 month",
    icon: <CalendarIcon />,
  },
  {
    value: "Choose a start & end date",
    primaryLabel: "Choose a start & end date",
    icon: <OlistIcon />,
  },
  {
    value: "Not sure. I'd like to chat with my Brand experience consultant",
    primaryLabel: "Not sure.",
    subtitle: "I'd like to chat with my Brand experience consultant",
    icon: <CommentIcon />,
  },
];

/**
 * Step 3: Project Timeline, Reference Inspiration Benchmarks & Confidentiality.
 * Restores 100% of authentic options (inspiration links repeater, 6 timeline choices with icons,
 * showcase portfolio radio, and extra notes) with Swiss dark luxury geometry.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default function Step3Details({
  formData,
  updateFormData,
  nextStep,
  prevStep,
}: Step3Props) {
  const initialLinks = formData.inspirationLinks
    ? formData.inspirationLinks.split("\n").filter((l) => l.trim() !== "")
    : [""];

  const [links, setLinks] = useState<string[]>(
    initialLinks.length > 0 ? initialLinks : [""]
  );

  const handleLinkChange = (index: number, value: string) => {
    const updated = [...links];
    updated[index] = value;
    setLinks(updated);
    updateFormData(
      "inspirationLinks",
      updated.filter((l) => l.trim() !== "").join("\n")
    );
  };

  const addLinkField = () => {
    if (links.length > 0 && links[links.length - 1].trim() === "") return;
    setLinks([...links, ""]);
  };

  const removeLinkField = (index: number) => {
    const updated = links.filter((_, i) => i !== index);
    const finalLinks = updated.length > 0 ? updated : [""];
    setLinks(finalLinks);
    updateFormData(
      "inspirationLinks",
      finalLinks.filter((l) => l.trim() !== "").join("\n")
    );
  };

  const handleTimelineSelect = (tlValue: string) => {
    updateFormData("timeline", tlValue);
  };

  const isTimelineSelected = Boolean(formData.timeline);

  return (
    <div className={styles.stepContainer}>
      <header className={styles.stepHeaderBlock}>
        <h2 className={styles.stepTitle}>Details &amp; Timeline</h2>
        <p className={styles.stepDescription}>
          Specify delivery horizons, benchmark references, and portfolio showcase permissions.
        </p>
      </header>

      {/* Dynamic Inspiration Links Repeater */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>
          <span>Link to Any Inspiration on the Web</span>
          <span className={styles.optionalTag}>Optional</span>
        </label>
        <p className={styles.fieldHint}>
          Paste URLs to designs, typography, or reference imagery you admire so our team understands your aesthetic vision.
        </p>

        <div className={styles.linksRepeaterContainer}>
          {links.map((link, index) => (
            <div key={index} className={styles.repeaterRow}>
              <input
                type="url"
                className={styles.textInput}
                placeholder="https://behance.net/... or https://pinterest.com/..."
                value={link}
                onChange={(e) => handleLinkChange(index, e.target.value)}
              />
              {links.length > 1 && (
                <button
                  type="button"
                  className={styles.trashLinkBtn}
                  onClick={() => removeLinkField(index)}
                  title="Remove link"
                  aria-label="Remove link"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className={styles.addLinkBtn}
            onClick={addLinkField}
            disabled={links.length > 0 && links[links.length - 1].trim() === ""}
          >
            <AddIcon />
            <span>Add another link</span>
          </button>
        </div>
      </div>

      {/* 6 Authentic Timeline Options */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>
          <span>What&apos;s your timeline?</span>
        </label>
        <div
          className={styles.timelineGrid}
          role="radiogroup"
          aria-label="Project Timeline"
        >
          {TIMELINE_OPTIONS.map((tl) => {
            const isSelected = formData.timeline === tl.value;
            return (
              <button
                key={tl.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`${styles.timelineCard} ${isSelected ? styles.active : ""}`}
                onClick={() => handleTimelineSelect(tl.value)}
              >
                <div className={styles.cardIcon} aria-hidden="true">
                  {tl.icon}
                </div>
                <div className={styles.timelineTextContent}>
                  <span className={styles.timelineName}>{tl.primaryLabel}</span>
                  {tl.subtitle && (
                    <p className={styles.timelineSubtitle}>{tl.subtitle}</p>
                  )}
                </div>
                <span className={styles.selectionDot} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Showcase Permission Radio Buttons */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>
          <span>Can your Brand experience consultant showcase the finished designs in their portfolio?</span>
        </label>
        <div className={styles.radioGroupHorizontal} role="radiogroup" aria-label="Portfolio Showcase">
          {["Yes", "No"].map((choice) => {
            const isChecked = formData.showcasePermission === choice;
            return (
              <label
                key={choice}
                className={`${styles.radioInlineOption} ${isChecked ? styles.active : ""}`}
              >
                <input
                  type="radio"
                  name="showcasePermission"
                  value={choice}
                  checked={isChecked}
                  onChange={(e) => updateFormData("showcasePermission", e.target.value)}
                  className={styles.hiddenRadio}
                />
                <span className={styles.customRadioIndicator} aria-hidden="true" />
                <span className={styles.radioOptionLabel}>{choice}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Extra Notes Textarea */}
      <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
        <label className={styles.inputLabel} htmlFor="field-extra-notes">
          <span>Anything else you&apos;d like to share with your Brand experience consultant?</span>
          <span className={styles.optionalTag}>Optional</span>
        </label>
        <textarea
          id="field-extra-notes"
          className={styles.textArea}
          placeholder="Any additional context, constraints, reference files, or technical specs..."
          value={formData.extraNotes}
          onChange={(e) => updateFormData("extraNotes", e.target.value)}
        />
      </div>

      {/* Navigation Actions */}
      <div className={styles.dualActionContainer}>
        <button
          type="button"
          className={styles.backButtonAction}
          onClick={prevStep}
          aria-label="Back to business details"
        >
          <span>&larr; Back</span>
        </button>

        <button
          type="button"
          className={styles.nextButton}
          onClick={nextStep}
          disabled={!isTimelineSelected}
          aria-label="Continue to review brief"
        >
          <span>Review Brief</span>
          <span className={styles.arrow} aria-hidden="true">
            &rarr;
          </span>
        </button>
      </div>
    </div>
  );
}
