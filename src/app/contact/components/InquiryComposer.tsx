"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { submitContactInquiry } from "@/app/actions/contactActions";
import type { ContactTrack, ContactActionResult } from "@/app/lib/validations/contact";
import styles from "../Contact.module.scss";

const TRACKS: { id: ContactTrack; label: string }[] = [
  { id: "new-business", label: "An Agency" },
  { id: "partnerships", label: "Career Opportunities" },
  { id: "press-media", label: "Press & Media" },
  { id: "general", label: "Something Else" },
];

/**
 * Editorial Inquiry Composer.
 * Synthesizes 160/90 intent pill selectors (Screenshot 155708) with Whoa Mama
 * minimal form architecture (Screenshot 155743):
 * - Conversational 'I'm looking for...' capsule selector.
 * - Minimal, quiet inputs with light border and clear typographical hierarchy.
 * - Simple budget amount input without clunky tier dropdowns.
 * - Cryptographic honeypot field (marca_contact_hp) for invisible bot interception.
 * - React 19 useTransition async submission dispatching to submitContactInquiry.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default function InquiryComposer() {
  const [selectedTrack, setSelectedTrack] = useState<ContactTrack>("new-business");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ContactActionResult | null>(null);

  const handleTrackSelect = (track: ContactTrack) => {
    setSelectedTrack(track);
    if (track === "partnerships") {
      const el = document.getElementById("careers-callout");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("track", selectedTrack);

    startTransition(async () => {
      try {
        const response = await submitContactInquiry(null, formData);
        setResult(response);
        if (response.success) {
          form.reset();
        }
      } catch {
        setResult({
          success: false,
          message: "An unexpected network error occurred. Please try again or email hello@marcaubi.com.",
        });
      }
    });
  };

  return (
    <div className={styles.inquiryComposerShell}>
      {/* Editorial Lead-in Text (160/90 Reference Standard) */}
      <div className={styles.composerHeader}>
        <p className={styles.leadParagraph}>
          Whether you’re exploring a new agency partner, have a specific brief in hand,
          or just want to learn more about what we do, we’d love to hear from you.
          Let us know what you’re looking for and we’ll connect you with the right team.
        </p>

        <h2 className={styles.intentPrompt}>I’m looking for...</h2>

        {/* Intent Pills (Capsule Buttons) */}
        <div className={styles.trackPillsCluster} role="tablist" aria-label="Inquiry Category Selector">
          {TRACKS.map((track) => (
            <button
              key={track.id}
              type="button"
              role="tab"
              aria-selected={selectedTrack === track.id}
              className={`${styles.trackPill} ${selectedTrack === track.id ? styles.trackPillActive : ""}`}
              onClick={() => handleTrackSelect(track.id)}
            >
              {track.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Form Container (Whoa Mama Minimal Standard) */}
      <div className={styles.formContainerCard}>
        <div className={styles.formCardHeader}>
          <h3 className={styles.formTitle}>
            {selectedTrack === "press-media"
              ? "Press & Speaking Inquiries"
              : selectedTrack === "general"
              ? "General Inquiries"
              : "Business Enquiries"}
          </h3>
          <p className={styles.careersRedirectText}>
            Looking to join our team? Check out our{" "}
            <Link href="/careers" className={styles.careersLink}>
              careers page
            </Link>
          </p>
        </div>

        {result?.success ? (
          <div className={styles.successCard} role="status">
            <h4 className={styles.successHeadline}>Inquiry Received</h4>
            <p className={styles.successBody}>
              {result.message ?? "Thank you for reaching out. A studio partner will review your inquiry and follow up promptly."}
            </p>
            {result.receiptId && (
              <p className={styles.receiptToken}>
                Reference Token: <code>{result.receiptId}</code>
              </p>
            )}
            <button
              type="button"
              className={styles.resetButton}
              onClick={() => setResult(null)}
            >
              Send Another Inquiry
            </button>
          </div>
        ) : (
          <form className={styles.editorialForm} onSubmit={handleSubmit} noValidate>
            {result && !result.success && (
              <div className={styles.errorBanner} role="alert">
                {result.message ?? "Please review and correct the marked fields below."}
              </div>
            )}

            {/* Hidden Honeypot Spam Protection Field */}
            <input
              type="text"
              name="marca_contact_hp"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className={styles.honeypotField}
            />

            {/* Row 1: Name & Email */}
            <div className={styles.formRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="contact-name" className={styles.fieldLabel}>
                  Full Name <span className={styles.requiredMark}>*</span>
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Eleanor Vance"
                  className={styles.textInput}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="contact-email" className={styles.fieldLabel}>
                  Email Address <span className={styles.requiredMark}>*</span>
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  placeholder="e.g. eleanor@vance-corp.com"
                  className={styles.textInput}
                />
              </div>
            </div>

            {/* Row 2: Phone & Company */}
            <div className={styles.formRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="contact-phone" className={styles.fieldLabel}>
                  Phone Number
                </label>
                <input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  placeholder="e.g. +91 98400 12345 or +1 415 555 0199"
                  className={styles.textInput}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="contact-company" className={styles.fieldLabel}>
                  Company Name
                </label>
                <input
                  id="contact-company"
                  name="organization"
                  type="text"
                  placeholder="e.g. Vance Luxury Group"
                  className={styles.textInput}
                />
              </div>
            </div>

            {/* Row 3: Approximate Budget Amount */}
            <div className={styles.fieldGroup}>
              <label htmlFor="contact-budget" className={styles.fieldLabel}>
                Approximate Budget
              </label>
              <input
                id="contact-budget"
                name="budgetAmount"
                type="text"
                placeholder="e.g. ₹15,00,000 or $25,000"
                className={styles.textInput}
              />
            </div>

            {/* Row 4: Message / Details */}
            <div className={styles.fieldGroup}>
              <label htmlFor="contact-message" className={styles.fieldLabel}>
                Tell us about your project and timeline <span className={styles.requiredMark}>*</span>
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={4}
                required
                placeholder="Outline your project objectives, timeline, desired deliverables, and high-level vision..."
                className={styles.textAreaInput}
              />
            </div>

            {/* Submit Action */}
            <div className={styles.submitRow}>
              <button
                type="submit"
                disabled={isPending}
                className={styles.submitButton}
              >
                {isPending ? "Transmitting..." : "Submit Inquiry →"}
              </button>

              <span className={styles.slaReassurance}>
                We typically respond within 24 business hours. Mutual NDA by default.
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
