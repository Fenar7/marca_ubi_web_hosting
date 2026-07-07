"use client";

import React from "react";
import styles from "./Step.module.scss";
import { ProjectFormData } from "../types";

interface Step2Props {
  formData: ProjectFormData;
  updateFormData: (field: keyof ProjectFormData, value: string) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const languages = ["English", "Spanish", "French", "German", "Arabic", "Other"];
const industries = ["Technology", "Retail", "Healthcare", "Finance", "Real Estate", "Education", "Food & Beverage", "Other"];
const referralSources = ["Google", "Social Media", "Friend/Colleague", "Advertisement", "Other"];

export default function Step2Business({ formData, updateFormData, nextStep, prevStep }: Step2Props) {
  const isComplete = 
    formData.name.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.projectName.trim() !== "" && 
    formData.projectDescription.trim() !== "";

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>Tell us about your business</h2>

      <div className={styles.formGroup}>
        <label>Your Name *</label>
        <input 
          type="text" 
          className={styles.formInput}
          placeholder="E.g. John Doe"
          value={formData.name}
          onChange={(e) => updateFormData("name", e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Email Address *</label>
        <input 
          type="email" 
          className={styles.formInput}
          placeholder="E.g. john@example.com"
          value={formData.email}
          onChange={(e) => updateFormData("email", e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Phone Number</label>
        <input 
          type="tel" 
          className={styles.formInput}
          placeholder="E.g. +1 234 567 8900"
          value={formData.phone}
          onChange={(e) => updateFormData("phone", e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Instagram Handle</label>
        <input 
          type="text" 
          className={styles.formInput}
          placeholder="E.g. @johndoe"
          value={formData.instagram}
          onChange={(e) => updateFormData("instagram", e.target.value)}
        />
      </div>
      
      <div className={styles.formGroup}>
        <label>Choose your preferred language</label>
        <select 
          className={styles.formSelect}
          value={formData.language}
          onChange={(e) => updateFormData("language", e.target.value)}
        >
          <option value="">Select language</option>
          {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Name your project *</label>
        <input 
          type="text" 
          className={styles.formInput}
          placeholder="E.g. Packaging for an organic juice company"
          value={formData.projectName}
          onChange={(e) => updateFormData("projectName", e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Describe your project *</label>
        <textarea 
          className={styles.formTextarea}
          placeholder="Tell us what you need..."
          value={formData.projectDescription}
          onChange={(e) => updateFormData("projectDescription", e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>What industry are you in?</label>
        <select 
          className={styles.formSelect}
          value={formData.industry}
          onChange={(e) => updateFormData("industry", e.target.value)}
        >
          <option value="">Select industry</option>
          {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Add your website and/or social media pages</label>
        <input 
          type="text" 
          className={styles.formInput}
          placeholder="E.g. www.best-site-ever.com"
          value={formData.website}
          onChange={(e) => updateFormData("website", e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Is your company a digital, marketing or design agency?</label>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input 
              type="radio" 
              name="agencyStatus" 
              value="Yes and I'm interested in agency services"
              checked={formData.agencyStatus === "Yes and I'm interested in agency services"}
              onChange={(e) => updateFormData("agencyStatus", e.target.value)}
            />
            Yes and I'm interested in agency services
          </label>
          <label className={styles.radioLabel}>
            <input 
              type="radio" 
              name="agencyStatus" 
              value="Yes and I'm NOT interested in agency services"
              checked={formData.agencyStatus === "Yes and I'm NOT interested in agency services"}
              onChange={(e) => updateFormData("agencyStatus", e.target.value)}
            />
            Yes and I'm NOT interested in agency services
          </label>
          <label className={styles.radioLabel}>
            <input 
              type="radio" 
              name="agencyStatus" 
              value="No, I'm not an agency"
              checked={formData.agencyStatus === "No, I'm not an agency"}
              onChange={(e) => updateFormData("agencyStatus", e.target.value)}
            />
            No, I'm not an agency
          </label>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>How did you hear about us?</label>
        <select 
          className={styles.formSelect}
          value={formData.referral}
          onChange={(e) => updateFormData("referral", e.target.value)}
        >
          <option value="">Select channel</option>
          {referralSources.map(ref => <option key={ref} value={ref}>{ref}</option>)}
        </select>
      </div>

      <div className={styles.buttonGroup}>
        <button className={styles.btnSecondary} onClick={prevStep}>Back</button>
        <button 
          className={styles.btnPrimary} 
          onClick={nextStep}
          disabled={!isComplete}
        >
          Next Step
        </button>
      </div>
    </div>
  );
}
