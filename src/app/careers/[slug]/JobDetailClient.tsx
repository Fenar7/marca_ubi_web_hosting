"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import type { CareerPosting } from "@/sanity/lib/career-queries";
import styles from "./JobDetail.module.scss";

export interface JobDetailClientProps {
  career: CareerPosting;
}

/**
 * Job Detail & Candidate Application Client Component.
 * Presents Swiss hairline typography for role specifications, dash-bulleted responsibilities,
 * and a minimalist underline application form connected to /api/submit-application.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export function JobDetailClient({ career }: JobDetailClientProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const metaItems = [
    career.location,
    career.workplaceType,
    career.employmentType,
    career.experience,
  ].filter(Boolean);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = 12 * 1024 * 1024; // 12 MB
    if (file.size > maxBytes) {
      setErrorMessage("File exceeds the 12 MB limit. Please select a smaller document.");
      return;
    }

    const validExtensions = [".pdf", ".doc", ".docx", ".rtf"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setErrorMessage("Invalid file format. Please upload a PDF, DOC, DOCX, or RTF.");
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setErrorMessage("Please complete all required fields (Name, Email, Phone).");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("fullName", fullName.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.trim());
      formData.append("positionTitle", career.title);
      if (career._id) {
        formData.append("positionId", career._id);
      }
      if (linkedIn.trim()) {
        formData.append("linkedIn", linkedIn.trim());
      }
      if (portfolio.trim()) {
        formData.append("portfolio", portfolio.trim());
      }
      if (coverNote.trim()) {
        formData.append("coverNote", coverNote.trim());
      }
      if (selectedFile) {
        formData.append("resumeFile", selectedFile);
      }

      // Cryptographic honeypot empty value
      const honeypotInput = e.currentTarget.elements.namedItem(
        "_hp_careers_confirm"
      ) as HTMLInputElement | null;
      if (honeypotInput) {
        formData.append("_hp_careers_confirm", honeypotInput.value);
      }

      const response = await fetch("/api/submit-application", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Application submission failed. Please retry.");
      }

      setSubmitSuccess(true);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred during submission."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className={styles.breadcrumbNav}>
        <ol className={styles.breadcrumbList}>
          <li className={styles.breadcrumbItem}>
            <Link href="/" className={styles.breadcrumbLink}>
              Home
            </Link>
          </li>
          <li className={styles.breadcrumbSeparator} aria-hidden="true">
            /
          </li>
          <li className={styles.breadcrumbItem}>
            <Link href="/careers" className={styles.breadcrumbLink}>
              Careers
            </Link>
          </li>
          <li className={styles.breadcrumbSeparator} aria-hidden="true">
            /
          </li>
          <li className={styles.breadcrumbItem} aria-current="page">
            <span className={styles.breadcrumbCurrent}>{career.title}</span>
          </li>
        </ol>
      </nav>

      <div className={styles.layoutGrid}>
        {/* Left Column: Role Details */}
        <article className={styles.roleContent}>
          <header className={styles.roleHeader}>
            <h1 className={styles.roleTitle}>{career.title}</h1>
            <div className={styles.metadataStrip} aria-label="Position Metadata">
              {metaItems.map((meta, idx) => (
                <span key={idx} className={styles.metadataBadge}>
                  {meta}
                </span>
              ))}
            </div>
          </header>

          {/* Overview */}
          {career.overview ? (
            <section className={styles.sectionBlock} aria-label="Role Overview">
              <p className={styles.overviewText}>{career.overview}</p>
            </section>
          ) : null}

          {/* Responsibilities */}
          {career.responsibilities && career.responsibilities.length > 0 ? (
            <section className={styles.sectionBlock} aria-label="Key Responsibilities">
              <h2 className={styles.sectionHeading}>On any given day you might</h2>
              <ul className={styles.dashList}>
                {career.responsibilities.map((item, idx) => (
                  <li key={idx} className={styles.dashListItem}>
                    <span className={styles.dashIcon} aria-hidden="true">
                      -
                    </span>
                    <span className={styles.itemText}>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Qualifications / Values */}
          {career.qualifications && career.qualifications.length > 0 ? (
            <section className={styles.sectionBlock} aria-label="What We Value">
              <h2 className={styles.sectionHeading}>What we value</h2>
              <ul className={styles.dashList}>
                {career.qualifications.map((item, idx) => (
                  <li key={idx} className={styles.dashListItem}>
                    <span className={styles.dashIcon} aria-hidden="true">
                      -
                    </span>
                    <span className={styles.itemText}>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>

        {/* Right Column: Swiss Minimalist Application Form */}
        <aside className={styles.formSidebar} aria-label="Application Form">
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>Apply for this position</h2>

            {submitSuccess ? (
              <div className={styles.successMessage} role="status">
                <h3 className={styles.successHeading}>Application Received.</h3>
                <p className={styles.successBody}>
                  Thank you for applying to the <strong>{career.title}</strong> role. Our team
                  in Calicut will review your submission and reach out if there is a mutual alignment.
                </p>
                <Link href="/careers" className={styles.returnLink}>
                  &larr; Explore Other Positions
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.applicationForm} noValidate>
                {/* Honeypot anti-spam trap */}
                <input
                  type="text"
                  name="_hp_careers_confirm"
                  tabIndex={-1}
                  autoComplete="off"
                  style={{ display: "none" }}
                  aria-hidden="true"
                />

                {errorMessage ? (
                  <div className={styles.errorAlert} role="alert">
                    {errorMessage}
                  </div>
                ) : null}

                {/* Full Name */}
                <div className={styles.fieldGroup}>
                  <label htmlFor="careers-fullName" className={styles.fieldLabel}>
                    Full Name <span className={styles.requiredMark}>*</span>
                  </label>
                  <input
                    id="careers-fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={styles.underlineInput}
                    placeholder="E.g. Elena Rostova"
                  />
                </div>

                {/* Email */}
                <div className={styles.fieldGroup}>
                  <label htmlFor="careers-email" className={styles.fieldLabel}>
                    Email Address <span className={styles.requiredMark}>*</span>
                  </label>
                  <input
                    id="careers-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.underlineInput}
                    placeholder="elena@domain.com"
                  />
                </div>

                {/* Phone */}
                <div className={styles.fieldGroup}>
                  <label htmlFor="careers-phone" className={styles.fieldLabel}>
                    Phone Number <span className={styles.requiredMark}>*</span>
                  </label>
                  <input
                    id="careers-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={styles.underlineInput}
                    placeholder="+91 98765 43210"
                  />
                </div>

                {/* LinkedIn */}
                <div className={styles.fieldGroup}>
                  <label htmlFor="careers-linkedIn" className={styles.fieldLabel}>
                    LinkedIn Profile
                  </label>
                  <input
                    id="careers-linkedIn"
                    type="url"
                    value={linkedIn}
                    onChange={(e) => setLinkedIn(e.target.value)}
                    className={styles.underlineInput}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                {/* Portfolio / Link */}
                <div className={styles.fieldGroup}>
                  <label htmlFor="careers-portfolio" className={styles.fieldLabel}>
                    Portfolio Website / Link
                  </label>
                  <input
                    id="careers-portfolio"
                    type="url"
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                    className={styles.underlineInput}
                    placeholder="https://yourportfolio.com"
                  />
                </div>

                {/* Resume File Upload */}
                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Resume / CV</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.rtf"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                    aria-label="Upload Resume File"
                  />

                  <div className={styles.filePickerControls}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={styles.attachButton}
                    >
                      Attach
                    </button>
                    <span className={styles.fileNotice}>*doc, docx, rtf, pdf under 12 MB</span>
                  </div>

                  {selectedFile ? (
                    <div className={styles.fileSelectedBar}>
                      <span className={styles.selectedFileName}>
                        {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className={styles.removeFileBtn}
                        aria-label="Remove attached resume"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Cover Note */}
                <div className={styles.fieldGroup}>
                  <label htmlFor="careers-coverNote" className={styles.fieldLabel}>
                    Cover Note / Message
                  </label>
                  <textarea
                    id="careers-coverNote"
                    rows={4}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    className={styles.underlineTextarea}
                    placeholder="Tell us about yourself and what drives your craft..."
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.submitButton}
                  aria-label="Submit Career Application"
                >
                  <span className={styles.buttonLabel}>
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </span>
                  {!isSubmitting && (
                    <span className={styles.arrowIcon} aria-hidden="true">
                      &rarr;
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default JobDetailClient;
