"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./ProjectForm.module.scss";
import { ProjectFormData, initialFormData } from "./types";
import { MobileDeviceIcon, EnvelopeIcon, ArrowLeftIcon } from "@sanity/icons";
import Step1Services from "./steps/Step1Services";
import Step2Business from "./steps/Step2Business";
import Step3Details from "./steps/Step3Details";
import Step4Summary from "./steps/Step4Summary";

export default function ProjectForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const updateFormData = (field: keyof ProjectFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const goToStep = (step: number) => setCurrentStep(step);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const idempotencyKey = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `brief-${Date.now()}`;

    // Map form category to CRM service category enum
    const mapCategory = (cat: string) => {
      const lower = (cat || "").toLowerCase();
      if (lower.includes("brand")) return "Branding";
      if (lower.includes("web")) return "Web & Digital";
      if (lower.includes("mobile") || lower.includes("app")) return "Mobile Apps";
      if (lower.includes("ui") || lower.includes("ux") || lower.includes("design")) return "UI/UX Design";
      if (lower.includes("advisory") || lower.includes("strategy") || lower.includes("full")) return "Full-Suite Advisory";
      return "Web & Digital";
    };

    const combinedNotes = [
      formData.projectDescription ? `Project Scope: ${formData.projectDescription}` : "",
      formData.extraNotes ? `Additional Notes: ${formData.extraNotes}` : "",
      formData.inspirationLinks ? `Inspiration References: ${formData.inspirationLinks}` : "",
      formData.referral ? `Referral: ${formData.referral}` : "",
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
        idempotencyKey,
      },
    };

    // Resilient submission with exponential backoff retry for network interruptions
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

        if (!response.ok) {
          const errData = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(errData.error || `Server responded with status ${response.status}`);
        }

        success = true;

        // Asynchronous non-blocking Sanity brief sync for legacy studio workflows
        fetch("/api/submit-brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }).catch((sanityErr: unknown) => {
          console.warn("[SANITY_SYNC_WARNING] Background brief sync failed:", sanityErr);
        });

        setSubmitSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err: unknown) {
        if (attempt >= maxAttempts) {
          const message = err instanceof Error ? err.message : "Failed to submit project brief.";
          setSubmitError(message);
        } else {
          // Exponential backoff delay before retry (300ms, 600ms)
          await new Promise((resolve) => setTimeout(resolve, attempt * 300));
        }
      }
    }

    setIsSubmitting(false);
  };

  if (submitSuccess) {
    return (
      <div className={styles.successContainer}>
        <div className={styles.successCard}>
          <svg className={styles.checkmark} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none"/>
            <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
          
          <h2>Project Brief Submitted!</h2>
          <p className={styles.successMessage}>
            Thank you for reaching out. Our team will review your requirements and get back to you within 24-48 hours.
          </p>
          
          <div className={styles.contactCard}>
            <p>Need immediate assistance?</p>
            <div className={styles.contactDetails}>
              <a href="tel:+917012052472" className={styles.contactLink}>
                <MobileDeviceIcon /> +91 7012 052472
              </a>
              <a href="mailto:hello@marcaubi.com" className={styles.contactLink}>
                <EnvelopeIcon /> hello@marcaubi.com
              </a>
            </div>
          </div>

          <button className={styles.btnPrimary} onClick={() => window.location.href = "/"}>Return to Homepage</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formContainer} id="project-form">
      <div className={styles.formHeader}>
        {currentStep > 1 ? (
          <button className={styles.backButton} onClick={prevStep} aria-label="Go back">
            <ArrowLeftIcon />
            <span>Back</span>
          </button>
        ) : (
          <Link href="/" className={styles.backButton} aria-label="Go to homepage">
            <ArrowLeftIcon />
            <span>Back</span>
          </Link>
        )}
        <div className={styles.stepIndicatorContainer}>
          <div className={styles.stepIndicatorText}>
            Step {currentStep} of 4
          </div>
          <div className={styles.progressBarContainer}>
            {[1, 2, 3, 4].map((step) => (
              <div 
                key={step} 
                className={`${styles.progressPill} ${currentStep >= step ? styles.active : ""}`} 
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className={styles.stepContent} key={currentStep}>
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
