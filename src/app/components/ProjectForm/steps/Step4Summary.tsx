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

export default function Step4Summary({ formData, goToStep, handleSubmit, isSubmitting, submitError }: Step4Props) {
  
  const SummarySection = ({ title, step, children }: { title: string, step: number, children: React.ReactNode }) => (
    <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--color-light-grey)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1.25rem", margin: 0 }}>{title}</h3>
        <button 
          onClick={() => goToStep(step)}
          style={{ 
            background: "transparent", 
            border: "none", 
            color: "var(--color-cta-orange)", 
            fontWeight: 600, 
            cursor: "pointer",
            textDecoration: "underline"
          }}
        >
          Edit
        </button>
      </div>
      <div style={{ color: "var(--color-hash-grey)", lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>Review your project brief</h2>
      
      <SummarySection title="1. Design Needs" step={1}>
        <p><strong>Category:</strong> {formData.category || "Not selected"}</p>
        <p><strong>Service:</strong> {formData.service || "Not selected"}</p>
      </SummarySection>

      <SummarySection title="2. Business Details" step={2}>
        <p><strong>Language:</strong> {formData.language || "Not provided"}</p>
        <p><strong>Project Name:</strong> {formData.projectName || "Not provided"}</p>
        <p><strong>Description:</strong> {formData.projectDescription || "Not provided"}</p>
        <p><strong>Industry:</strong> {formData.industry || "Not provided"}</p>
        <p><strong>Website:</strong> {formData.website || "Not provided"}</p>
        <p><strong>Agency Status:</strong> {formData.agencyStatus || "Not provided"}</p>
        <p><strong>Source:</strong> {formData.referral || "Not provided"}</p>
      </SummarySection>

      <SummarySection title="3. Details & Timeline" step={3}>
        <p><strong>Inspiration Links:</strong> {formData.inspirationLinks || "None provided"}</p>
        <p><strong>Timeline:</strong> {formData.timeline || "Not selected"}</p>
        <p><strong>Showcase Permission:</strong> {formData.showcasePermission || "Not selected"}</p>
        <p><strong>Extra Notes:</strong> {formData.extraNotes || "None"}</p>
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
