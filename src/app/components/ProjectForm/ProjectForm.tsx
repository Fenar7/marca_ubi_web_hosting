"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./ProjectForm.module.scss";
import { ProjectFormData, initialFormData } from "./types";
import { ArrowLeftIcon, CheckmarkIcon } from "@sanity/icons";
import Step1Services from "./steps/Step1Services";
import Step2Business from "./steps/Step2Business";
import Step3Details from "./steps/Step3Details";
import Step4Summary from "./steps/Step4Summary";

/**
 * Master Project Brief Form Wizard.
 * Clean, minimal 160over90 Agency Standard with zero AI-slop metadata.
 * Restores 100% of authentic multi-step questionnaire flow and options.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default function ProjectForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<string | null>(null);

  const updateFormData = (field: keyof ProjectFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const goToStep = (step: number) => setCurrentStep(step);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `brief-${Date.now()}`;

    // Map client category to CRM enum whitelist: 'Branding' | 'Web & Digital' | 'Mobile Apps' | 'UI/UX Design' | 'Full-Suite Advisory' | 'Other'
    const mapCategory = (cat: string) => {
      const lower = (cat || "").toLowerCase();
      if (lower.includes("brand") || lower.includes("logo") || lower.includes("stationery")) return "Branding";
      if (lower.includes("app") || lower.includes("mobile")) return "Mobile Apps";
      if (lower.includes("digital") || lower.includes("web")) return "Web & Digital";
      if (lower.includes("ui") || lower.includes("ux") || lower.includes("art") || lower.includes("illustration")) return "UI/UX Design";
      if (lower.includes("advisory") || lower.includes("growth") || lower.includes("business") || lower.includes("advertising")) return "Full-Suite Advisory";
      return "Other";
    };

    const combinedNotes = [
      formData.projectDescription ? `Project Scope: ${formData.projectDescription}` : "",
      formData.extraNotes ? `Additional Notes: ${formData.extraNotes}` : "",
      formData.inspirationLinks ? `Inspiration References:\n${formData.inspirationLinks}` : "",
      formData.instagram ? `Instagram: ${formData.instagram}` : "",
      formData.agencyStatus ? `Agency Status: ${formData.agencyStatus}` : "",
      formData.referral ? `Referral Channel: ${formData.referral}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      company: formData.projectName.trim() || undefined,
      company_website: formData.website.trim() || undefined,
      industry: formData.industry.trim() || undefined,
      service_category: mapCategory(formData.category),
      budget_bracket: formData.timeline.trim() || undefined,
      notes: combinedNotes || undefined,
      source_name: "Website Form",
      source_detail: "Start Project Brief Wizard",
      brief_payload: {
        category: formData.category,
        service: formData.service,
        language: formData.language,
        projectName: formData.projectName,
        projectDescription: formData.projectDescription,
        industry: formData.industry,
        website: formData.website,
        agencyStatus: formData.agencyStatus,
        referral: formData.referral,
        timeline: formData.timeline,
        inspirationLinks: formData.inspirationLinks,
        showcasePermission: formData.showcasePermission,
        extraNotes: formData.extraNotes,
        instagram: formData.instagram,
        idempotencyKey,
      },
    };

    let attempt = 0;
    const maxAttempts = 3;
    let success = false;

    while (attempt < maxAttempts && !success) {
      attempt++;
      try {
        const response = await fetch("/api/sales-funnel/ingest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          success = true;
          setSubmissionReceipt(idempotencyKey);
          setSubmitSuccess(true);
          return;
        }

        const data = await response.json().catch(() => ({}));
        if (attempt === maxAttempts) {
          throw new Error(data.error || `Server responded with status ${response.status}`);
        }
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      } catch (err: unknown) {
        if (attempt === maxAttempts) {
          const msg =
            err instanceof Error ? err.message : "Transmission failed. Please verify connection.";
          setSubmitError(msg);
        } else {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        }
      } finally {
        if (attempt === maxAttempts || success) {
          setIsSubmitting(false);
        }
      }
    }
  };

  if (submitSuccess) {
    return (
      <div className={styles.formContainer}>
        <div className={styles.successContainer}>
          <div className={styles.successCard}>
            <div className={styles.successEmblem} aria-hidden="true">
              <CheckmarkIcon />
            </div>

            <h2>Brief Received</h2>
            <p className={styles.successMessage}>
              Thank you. Your project brief has been routed to our Calicut &amp; Trivandrum commercial desks.
              An executive partner will review your specifications and respond promptly.
            </p>

            <div className={styles.receiptMetadataBox}>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Reference ID</span>
                <span className={styles.receiptValue}>{submissionReceipt}</span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Target Entity</span>
                <span className={styles.receiptValue}>{formData.projectName}</span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Primary Discipline</span>
                <span className={styles.receiptValue}>{formData.service}</span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Direct Coordinates</span>
                <span className={styles.receiptValue}>+91 7012 052 472 / hello@marcaubi.com</span>
              </div>
            </div>

            <Link href="/" className={styles.actionHomeButton}>
              <span>&larr; Return to Overview</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <header className={styles.formHeader}>
        {/* Step Indicator Controls */}
        <div className={styles.stepIndicatorContainer}>
          {currentStep > 1 ? (
            <button
              type="button"
              className={styles.backButton}
              onClick={prevStep}
              aria-label="Return to previous step"
            >
              <ArrowLeftIcon />
              <span>Back</span>
            </button>
          ) : (
            <span />
          )}

          <div className={styles.stepCounter}>
            <span className={styles.activeStepNum}>0{currentStep}</span>
            <span>/</span>
            <span>04</span>
          </div>
        </div>

        {/* Minimal Progress Rail */}
        <div
          className={styles.progressBarContainer}
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={4}
        >
          {[1, 2, 3, 4].map((step) => {
            let stateClass = "";
            if (currentStep === step) stateClass = styles.active;
            else if (currentStep > step) stateClass = styles.completed;

            return (
              <div
                key={step}
                className={`${styles.progressPill} ${stateClass}`}
              />
            );
          })}
        </div>
      </header>

      {/* Main Step Body */}
      <div className={styles.stepContent}>
        {currentStep === 1 && (
          <Step1Services
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
          />
        )}
        {currentStep === 2 && (
          <Step2Business
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        {currentStep === 3 && (
          <Step3Details
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        {currentStep === 4 && (
          <Step4Summary
            formData={formData}
            goToStep={goToStep}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitError={submitError}
          />
        )}
      </div>
    </div>
  );
}
