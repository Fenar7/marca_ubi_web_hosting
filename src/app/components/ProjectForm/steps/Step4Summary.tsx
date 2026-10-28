"use client";

import React from "react";
import styles from "./Step.module.scss";
import { ProjectFormData } from "../types";
import { EditIcon } from "@sanity/icons";

interface Step4Props {
  formData: ProjectFormData;
  goToStep: (step: number) => void;
  handleSubmit: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}

/**
 * Step 4: Executive Brief Dossier Review & Direct CRM Pipeline Transmission.
 * Restores all 3 comprehensive summary dossiers with dedicated edit jump actions,
 * verified error banner states, and high-contrast dark luxury surfaces.
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
        <h2 className={styles.stepTitle}>Review your project brief</h2>
        <p className={styles.stepDescription}>
          Please verify your parameters and requirements before sending. Our partners personally evaluate every brief.
        </p>
      </header>

      {/* Dossier Clusters */}
      <div className={styles.dossierCluster}>
        {/* Section 1: Design Scope */}
        <div className={styles.dossierCard}>
          <div className={styles.dossierHeader}>
            <span className={styles.dossierTitle}>1. Design Needs</span>
            <button
              type="button"
              className={styles.editButton}
              onClick={() => goToStep(1)}
              aria-label="Edit Design Needs"
            >
              <EditIcon />
              <span>Edit</span>
            </button>
          </div>
          <div className={styles.dossierRows}>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Category</span>
              <span className={styles.itemValue}>{formData.category || "Not selected"}</span>
            </div>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Service</span>
              <span className={styles.itemValue}>{formData.service || "Not selected"}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Business & Stakeholder Details */}
        <div className={styles.dossierCard}>
          <div className={styles.dossierHeader}>
            <span className={styles.dossierTitle}>2. Business Details</span>
            <button
              type="button"
              className={styles.editButton}
              onClick={() => goToStep(2)}
              aria-label="Edit Business Details"
            >
              <EditIcon />
              <span>Edit</span>
            </button>
          </div>
          <div className={styles.dossierRows}>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Contact Name</span>
              <span className={styles.itemValue}>{formData.name || "Not provided"}</span>
            </div>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Email Address</span>
              <span className={styles.itemValue}>{formData.email || "Not provided"}</span>
            </div>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Phone Number</span>
              <span className={styles.itemValue}>{formData.phone || "Not provided"}</span>
            </div>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Instagram Handle</span>
              <span className={styles.itemValue}>{formData.instagram || "Not provided"}</span>
            </div>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Preferred Language</span>
              <span className={styles.itemValue}>{formData.language || "Not provided"}</span>
            </div>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Project / Brand Name</span>
              <span className={styles.itemValue}>{formData.projectName || "Not provided"}</span>
            </div>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Industry</span>
              <span className={styles.itemValue}>{formData.industry || "Not provided"}</span>
            </div>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Website</span>
              <span className={styles.itemValue}>{formData.website || "Not provided"}</span>
            </div>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Agency Status</span>
              <span className={styles.itemValue}>{formData.agencyStatus || "Not provided"}</span>
            </div>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Referral Source</span>
              <span className={styles.itemValue}>{formData.referral || "Not provided"}</span>
            </div>
            <div className={`${styles.dossierItem} ${styles.fullWidth}`}>
              <span className={styles.itemLabel}>Project Description</span>
              <span className={styles.itemValue}>{formData.projectDescription || "Not provided"}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Timeline & Reference Details */}
        <div className={styles.dossierCard}>
          <div className={styles.dossierHeader}>
            <span className={styles.dossierTitle}>3. Details &amp; Timeline</span>
            <button
              type="button"
              className={styles.editButton}
              onClick={() => goToStep(3)}
              aria-label="Edit Details and Timeline"
            >
              <EditIcon />
              <span>Edit</span>
            </button>
          </div>
          <div className={styles.dossierRows}>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Timeline</span>
              <span className={styles.itemValue}>{formData.timeline || "Not selected"}</span>
            </div>
            <div className={styles.dossierItem}>
              <span className={styles.itemLabel}>Showcase Permission</span>
              <span className={styles.itemValue}>{formData.showcasePermission || "Not selected"}</span>
            </div>
            {formData.inspirationLinks && (
              <div className={`${styles.dossierItem} ${styles.fullWidth}`}>
                <span className={styles.itemLabel}>Inspiration Reference Links</span>
                <span className={styles.itemValue}>{formData.inspirationLinks}</span>
              </div>
            )}
            {formData.extraNotes && (
              <div className={`${styles.dossierItem} ${styles.fullWidth}`}>
                <span className={styles.itemLabel}>Extra Notes</span>
                <span className={styles.itemValue}>{formData.extraNotes}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submission Error Banner */}
      {submitError && (
        <div className={styles.notionCalloutError} role="alert">
          <span className={styles.calloutKicker}>Submission Notice</span>
          <p className={styles.calloutText}>{submitError}</p>
        </div>
      )}

      {/* Final Transmission Command Action */}
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
