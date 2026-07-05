"use client";

import React, { useState } from "react";
import styles from "./ProjectForm.module.scss";
import { ProjectFormData, initialFormData } from "./types";
import { MobileDeviceIcon, EnvelopeIcon } from "@sanity/icons";
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

    try {
      const response = await fetch("/api/submit-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit project brief.");
      }

      setSubmitSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
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
              <a href="tel:+18001234567" className={styles.contactLink}>
                <MobileDeviceIcon /> +1 (800) 123-4567
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
    <div className={styles.formContainer}>
      <div className={styles.stepIndicator}>
        Step {currentStep} of 4
      </div>
      
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
