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

export default function Step4Summary({ formData, goToStep, handleSubmit, isSubmitting, submitError }: Step4Props) {
  
  const SummaryItem = ({ label, value }: { label: string, value: string }) => (
    <div className={styles.summaryItem}>
      <div className={styles.summaryLabel}>{label}</div>
      <div className={styles.summaryValue}>{value}</div>
    </div>
  );

  const SummarySection = ({ title, step, children }: { title: string, step: number, children: React.ReactNode }) => (
    <div className={styles.summaryCard}>
      <div className={styles.summaryHeader}>
        <h3>{title}</h3>
        <button 
          onClick={() => goToStep(step)}
          className={styles.editButton}
        >
          <EditIcon /> Edit
        </button>
      </div>
      <div className={styles.summaryContent}>
        {children}
      </div>
    </div>
  );

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>Review your project brief</h2>
      
      <SummarySection title="1. Design Needs" step={1}>
        <SummaryItem label="Category" value={formData.category || "Not selected"} />
        <SummaryItem label="Service" value={formData.service || "Not selected"} />
      </SummarySection>

      <SummarySection title="2. Business Details" step={2}>
        <SummaryItem label="Language" value={formData.language || "Not provided"} />
        <SummaryItem label="Project Name" value={formData.projectName || "Not provided"} />
        <SummaryItem label="Description" value={formData.projectDescription || "Not provided"} />
        <SummaryItem label="Industry" value={formData.industry || "Not provided"} />
        <SummaryItem label="Website" value={formData.website || "Not provided"} />
        <SummaryItem label="Agency Status" value={formData.agencyStatus || "Not provided"} />
        <SummaryItem label="Source" value={formData.referral || "Not provided"} />
      </SummarySection>

      <SummarySection title="3. Details & Timeline" step={3}>
        <SummaryItem label="Inspiration Links" value={formData.inspirationLinks || "None provided"} />
        <SummaryItem label="Timeline" value={formData.timeline || "Not selected"} />
        <SummaryItem label="Showcase Permission" value={formData.showcasePermission || "Not selected"} />
        <SummaryItem label="Extra Notes" value={formData.extraNotes || "None"} />
      </SummarySection>

      {submitError && (
        <div style={{ color: "red", padding: "1rem", backgroundColor: "#fff0f0", borderRadius: "8px", marginBottom: "1rem" }}>
          <strong>Error:</strong> {submitError}
        </div>
      )}

      <div className={styles.buttonGroup}>
        <button className={styles.btnPrimary} onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Let's do this!"}
        </button>
      </div>
    </div>
  );
}
