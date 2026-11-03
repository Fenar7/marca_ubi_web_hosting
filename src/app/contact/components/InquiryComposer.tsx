'use client';

/**
 * @file InquiryComposer.tsx
 * @description Interactive inquiry composer component for `/contact`.
 *              Implements tri-track category switching, friction-free single-line budget amount entry,
 *              cryptographic honeypot defense, client-side validation, and Server Action integration.
 * @module contact/components/InquiryComposer
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useTransition } from 'react';
import { submitContactInquiry } from '@/app/actions/contactActions';
import type { ContactTrack, ContactActionResult } from '@/app/lib/validations/contact';
import styles from '../Contact.module.scss';

const TRACKS: Array<{ id: ContactTrack; code: string; label: string }> = [
  { id: 'new-business', code: '[01]', label: 'New Business & Commissions' },
  { id: 'press-media', code: '[02]', label: 'Press & Speaking' },
  { id: 'partnerships', code: '[03]', label: 'Partnerships & General' },
];

export default function InquiryComposer() {
  const [selectedTrack, setSelectedTrack] = useState<ContactTrack>('new-business');
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ContactActionResult | null>(null);
  const [clientErrors, setClientErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setClientErrors({});

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set('track', selectedTrack);

    startTransition(async () => {
      const res = await submitContactInquiry(null, formData);
      if (res.success) {
        setResult(res);
        form.reset();
      } else {
        if (res.errors) {
          setClientErrors(res.errors);
        } else if (res.message) {
          setClientErrors({ global: [res.message] });
        }
      }
    });
  };

  const handleReset = () => {
    setResult(null);
    setClientErrors({});
  };

  if (result?.success) {
    return (
      <div className={styles.rightColumn} role="region" aria-label="Inquiry Transmitted">
        <div className={styles.successBanner}>
          <span className={styles.successIcon} aria-hidden="true">&#x2713;</span>
          <h3 className={styles.successHeading}>Inquiry Successfully Transmitted</h3>
          <p className={styles.successMessage}>
            {result.message || 'Your inquiry has been received. Our leadership reviews all transmissions within 24 business hours.'}
          </p>
          {result.receiptId && (
            <span className={styles.receiptTag}>
              TRANSMISSION ID: {result.receiptId}
            </span>
          )}
          <button type="button" className={styles.resetBtn} onClick={handleReset}>
            Send Another Transmission
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.rightColumn} role="region" aria-label="Inquiry Composer">
      <div className={styles.composerHeader}>
        <h2 className={styles.composerTitle}>Transmit an Inquiry</h2>
        <p className={styles.composerSubtitle}>
          Direct dispatch to our client directors and executive engineering leadership.
        </p>
      </div>

      {/* Tri-Track Selector Pills */}
      <div className={styles.trackSelector}>
        <span className={styles.trackLabel}>Select Communication Track:</span>
        <div className={styles.trackPills} role="tablist" aria-label="Inquiry Tracks">
          {TRACKS.map((track) => {
            const isActive = selectedTrack === track.id;
            return (
              <button
                key={track.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`${styles.trackPill} ${isActive ? styles.activeTrack : ''}`}
                onClick={() => setSelectedTrack(track.id)}
              >
                <span style={{ opacity: 0.6, marginRight: '0.4rem', fontFamily: 'monospace' }}>
                  {track.code}
                </span>
                <span>{track.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Form Error if any */}
      {clientErrors.global && (
        <div className={styles.errorMessage} role="alert">
          {clientErrors.global.join(' ')}
        </div>
      )}

      {/* Main Inquiry Form */}
      <form className={styles.inquiryForm} onSubmit={handleSubmit} noValidate>
        {/* Anti-Spam Cryptographic Honeypot */}
        <div className={styles.honeypotField} aria-hidden="true">
          <label htmlFor="marca_contact_hp">Leave this field blank</label>
          <input
            id="marca_contact_hp"
            name="marca_contact_hp"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* Row 1: Name and Email */}
        <div className={styles.formRow}>
          <div className={styles.fieldGroup}>
            <label htmlFor="contact_name" className={styles.fieldLabel}>
              <span>Full Name</span>
              <span className={styles.requiredMark} aria-hidden="true">*</span>
            </label>
            <input
              id="contact_name"
              name="name"
              type="text"
              required
              placeholder="e.g. Eleanor Vance"
              className={`${styles.fieldInput} ${clientErrors.name ? styles.fieldError : ''}`}
              aria-invalid={!!clientErrors.name}
              aria-describedby={clientErrors.name ? 'contact_name_err' : undefined}
            />
            {clientErrors.name && (
              <span id="contact_name_err" className={styles.errorMessage} role="alert">
                {clientErrors.name[0]}
              </span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="contact_email" className={styles.fieldLabel}>
              <span>Work Email</span>
              <span className={styles.requiredMark} aria-hidden="true">*</span>
            </label>
            <input
              id="contact_email"
              name="email"
              type="email"
              required
              placeholder="e.g. eleanor@vance-corp.com"
              className={`${styles.fieldInput} ${clientErrors.email ? styles.fieldError : ''}`}
              aria-invalid={!!clientErrors.email}
              aria-describedby={clientErrors.email ? 'contact_email_err' : undefined}
            />
            {clientErrors.email && (
              <span id="contact_email_err" className={styles.errorMessage} role="alert">
                {clientErrors.email[0]}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Organization and Phone */}
        <div className={styles.formRow}>
          <div className={styles.fieldGroup}>
            <label htmlFor="contact_org" className={styles.fieldLabel}>
              <span>Organization / Brand</span>
            </label>
            <input
              id="contact_org"
              name="organization"
              type="text"
              placeholder="e.g. Vance Luxury Group"
              className={styles.fieldInput}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="contact_phone" className={styles.fieldLabel}>
              <span>Direct Phone / WhatsApp</span>
            </label>
            <input
              id="contact_phone"
              name="phone"
              type="tel"
              placeholder="e.g. +91 98400 12345 or +1 415 555 0199"
              className={styles.fieldInput}
            />
          </div>
        </div>

        {/* Row 3: Approximate Budget Amount (shown for New Business track) */}
        {selectedTrack === 'new-business' && (
          <div className={styles.fieldGroup}>
            <label htmlFor="contact_budget" className={styles.fieldLabel}>
              <span>Approximate Budget</span>
            </label>
            <input
              id="contact_budget"
              name="budgetAmount"
              type="text"
              placeholder="Enter amount (e.g. ₹15,00,000 or $25,000)"
              className={styles.fieldInput}
            />
          </div>
        )}

        {/* Row 4: Message / Brief */}
        <div className={styles.fieldGroup}>
          <label htmlFor="contact_message" className={styles.fieldLabel}>
            <span>Project Scope / Inquiry Details</span>
            <span className={styles.requiredMark} aria-hidden="true">*</span>
          </label>
          <textarea
            id="contact_message"
            name="message"
            required
            rows={5}
            placeholder={
              selectedTrack === 'new-business'
                ? 'Outline your project objectives, timeline, desired deliverables, and high-level vision...'
                : selectedTrack === 'press-media'
                  ? 'Detail publication timeline, interview topics, editorial format, and deadline...'
                  : 'Describe your partnership proposition or strategic introduction...'
            }
            className={`${styles.fieldTextarea} ${clientErrors.message ? styles.fieldError : ''}`}
            aria-invalid={!!clientErrors.message}
            aria-describedby={clientErrors.message ? 'contact_msg_err' : undefined}
          />
          {clientErrors.message && (
            <span id="contact_msg_err" className={styles.errorMessage} role="alert">
              {clientErrors.message[0]}
            </span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className={styles.submitBtn}
        >
          {isPending ? 'Transmitting to Desks...' : 'Transmit Inquiry \u2192'}
        </button>

        {/* SLA Guarantee Strip */}
        <div className={styles.reassuranceStrip}>
          <div className={styles.slaItem}>
            <span className={styles.slaCheck} aria-hidden="true">&#x2713;</span>
            <span>24-Hour Business Response</span>
          </div>
          <div className={styles.slaItem}>
            <span className={styles.slaCheck} aria-hidden="true">&#x2713;</span>
            <span>Mutual Non-Disclosure Protected</span>
          </div>
          <div className={styles.slaItem}>
            <span className={styles.slaCheck} aria-hidden="true">&#x2713;</span>
            <span>Direct Partner Review</span>
          </div>
        </div>
      </form>
    </div>
  );
}
