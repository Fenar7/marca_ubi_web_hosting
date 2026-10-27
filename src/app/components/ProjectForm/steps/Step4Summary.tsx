"use client";

import React from "react";
import styles from "./Step.module.scss";
import { ProjectFormData } from "../types";

interface Step4Props {
  formData: ProjectFormData;
  goToStep: (step: number) => void;
  handleSubmit: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}

/**
 * Step 4: Executive Review & Submission.
 * Clean review summary with direct communication channels and solid error handling.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default function Step4Summary({
  formData,
  goToStep,
  handleSubmit,
  isSubmitting,
  submitError,
}: Step4Props) {
  return (
    <div className={styles.stepContainer}>
      <header className={styles.stepHeaderBlock}>
        <h2 className={styles.stepTitle}>Review Your Project Brief</h2>
        <p className={styles.stepDescription}>
          Please verify your parameters before sending. Our partners review every brief personally.
        </p>
      </header>

      {/* Review Dossiers */}
      <div className={styles.dossierCluster}>
        {/* Discipline & Scope */}
        <div className={styles.dossierCard}>
          <div className={styles.dossierHeader}>
            <span className={styles.dossierTitle}>Focus Area</span>
            <button
              type="button"
              className={styles.editButton}
              onClick={() => goToStep(1)}
              aria-label="Edit Discipline"
            >
              Edit
            </button>
          </div>
          <div className={styles.dossierRows}>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Selected Discipline</span>
              <span className={styles.itemValue}>{formData.service || "Not selected"}</span>
            </div>
          </div>
        </div>

        {/* Brand & Contact */}
        <div className={styles.dossierCard}>
          <div className={styles.dossierHeader}>
            <span className={styles.dossierTitle}>Contact &amp; Venture</span>
            <button
              type="button"
              className={styles.editButton}
              onClick={() => goToStep(2)}
              aria-label="Edit Brand & Contact"
            >
              Edit
            </button>
          </div>
          <div className={styles.dossierRows}>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Contact Name</span>
              <span className={styles.itemValue}>{formData.name}</span>
            </div>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Email</span>
              <span className={styles.itemValue}>{formData.email}</span>
            </div>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Brand / Entity</span>
              <span className={styles.itemValue}>{formData.projectName}</span>
            </div>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Phone</span>
              <span className={styles.itemValue}>{formData.phone || "Not provided"}</span>
            </div>
            <div className={`${styles.dossierItem} ${styles.fullWidth}`}>
              <span className={styles.itemLabel}>Project Scope</span>
              <span className={styles.itemValue}>{formData.projectDescription}</span>
            </div>
          </div>
        </div>

        {/* Timeline & Parameters */}
        <div className={styles.dossierCard}>
          <div className={styles.dossierHeader}>
            <span className={styles.dossierTitle}>Timeline &amp; Parameters</span>
            <button
              type="button"
              className={styles.editButton}
              onClick={() => goToStep(3)}
              aria-label="Edit Timeline"
            >
              Edit
            </button>
          </div>
          <div className={styles.dossierRows}>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Target Horizon</span>
              <span className={styles.itemValue}>{formData.timeline || "Not specified"}</span>
            </div>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Attribution</span>
              <span className={styles.itemValue}>
                {formData.showcasePermission === "no" ? "Strict NDA Confidentiality" : "Public Release Permitted"}
              </span>
            </div>
            {formData.inspirationLinks && (
              <div className={`${styles.dossierItem} ${styles.fullWidth}`}>
                <span className={styles.itemLabel}>Reference Links</span>
                <span className={styles.itemValue}>{formData.inspirationLinks}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {submitError && (
        <div className={styles.notionCalloutError} role="alert">
          <span className={styles.calloutKicker}>Submission Notice</span>
          <p className={styles.calloutText}>{submitError}</p>
        </div>
      )}

      {/* Direct Transmission Action */}
      <div className={styles.actionContainer}>
        <button
          type="button"
          className={styles.submitCommandButton}
          onClick={handleSubmit}
          disabled={isSubmitting}
          aria-label="Submit Project Brief"
        >
          {isSubmitting ? (
            <span>Sending Project Brief...</span>
          ) : (
            <>
              <span>Send Project Brief</span>
              <span aria-hidden="true">&rarr;</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
