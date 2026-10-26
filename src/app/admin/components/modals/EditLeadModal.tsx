'use client';

/**
 * @file EditLeadModal.tsx
 * @description Centered modal dialog for editing client contact coordinates, commercial scope,
 *              deal valuation, budget tier, and executive notes directly from the Client 360° Dossier.
 *              Integrates with Server Action updateLeadDetailsAction.
 * @module app/admin/components/modals/EditLeadModal
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { updateLeadDetailsAction } from '@/app/actions/leads';
import {
  SERVICE_CATEGORIES,
  PREFERRED_CHANNELS,
  LEAD_PRIORITIES,
  BUDGET_TIERS,
} from '@/app/lib/lead-schemas';
import type { LeadDossierData } from '@/app/admin/components/DossierDrawer/ClientDossierDrawer';
import type { PreferredChannel, ServiceCategory, LeadPriority } from '@/types/crm';
import { useModalAnimation } from './useModalAnimation';
import styles from './EditLeadModal.module.scss';

export interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: LeadDossierData | null;
  onSuccess?: (updated: Partial<LeadDossierData>) => void;
}

function formatCurrencyLive(val: number): string {
  if (!val || val <= 0) return '₹0';
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(1)}L`;
  }
  return `₹${val.toLocaleString('en-IN')}`;
}

export function EditLeadModal({
  isOpen,
  onClose,
  lead,
  onSuccess,
}: EditLeadModalProps): React.ReactElement | null {
  const { shouldRender, isClosing, handleAnimationEnd } = useModalAnimation({
    isOpen,
    exitDurationMs: 180,
  });

  const dialogRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredChannel, setPreferredChannel] = useState<PreferredChannel>('Phone');
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>('Web & Digital');
  const [budgetBracket, setBudgetBracket] = useState<string>('₹5L - ₹15L');
  const [expectedValue, setExpectedValue] = useState<number>(0);
  const [priority, setPriority] = useState<LeadPriority>('Medium');
  const [notes, setNotes] = useState('');

  // Prefill fields from active lead
  useEffect(() => {
    if (lead) {
      setName(lead.name || '');
      setCompany(lead.company || '');
      setCompanyWebsite(lead.company_website || '');
      setIndustry(lead.industry || '');
      setEmail(lead.email || '');
      setPhone(lead.phone || '');
      setPreferredChannel(
        PREFERRED_CHANNELS.includes(lead.preferred_channel as PreferredChannel)
          ? (lead.preferred_channel as PreferredChannel)
          : 'Phone'
      );
      setServiceCategory(
        SERVICE_CATEGORIES.includes(lead.service_category as ServiceCategory)
          ? (lead.service_category as ServiceCategory)
          : 'Web & Digital'
      );
      setBudgetBracket(lead.budget_bracket || '₹5L - ₹15L');
      setExpectedValue(Number(lead.expected_value) || 0);
      setPriority(
        lead.priority === 'High' || lead.priority === 'Medium' || lead.priority === 'Low'
          ? (lead.priority as LeadPriority)
          : 'Medium'
      );
      setNotes(lead.notes || '');
      setErrorMessage(null);
    }
  }, [lead, isOpen]);

  // Keyboard accessibility: Escape key dismissal (WCAG 2.1 AA)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, onClose]);

  // Focus Trapping: Confines keyboard Tab navigation to modal dialog when open
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length > 0) {
      focusables[0].focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const elements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleTabKey);
    return () => window.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  /**
   * Dispatches the atomic lead parameter update through updateLeadDetailsAction.
   * Enforces non-destructive rollbacks on failure and updates local drawer cache optimistically.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setErrorMessage(null);

    startTransition(async () => {
      const result = await updateLeadDetailsAction({
        leadId: lead.id,
        name: name.trim(),
        company: company.trim() || null,
        companyWebsite: companyWebsite.trim() || null,
        industry: industry.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        preferredChannel,
        serviceCategory,
        budgetBracket: budgetBracket.trim() || null,
        expectedValue,
        priority,
        notes: notes.trim() || null,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to update lead details.');
        return;
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('crm-toast', {
            detail: {
              type: 'success',
              message: `Lead details updated successfully for ${lead.lead_id}`,
            },
          })
        );
      }

      if (onSuccess) {
        onSuccess({
          name: name.trim(),
          company: company.trim() || null,
          company_website: companyWebsite.trim() || null,
          industry: industry.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          preferred_channel: preferredChannel,
          service_category: serviceCategory,
          budget_bracket: budgetBracket.trim() || null,
          expected_value: expectedValue,
          priority,
          notes: notes.trim() || null,
        });
      }

      onClose();
    });
  };

  if (!shouldRender || !lead) return null;

  return (
    <div
      className={`${styles.modalOverlay} ${isClosing ? styles.closing : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Edit Commercial Scope & Lead Details"
    >
      <div
        ref={dialogRef}
        className={`${styles.modalDialog} ${isClosing ? styles.closing : ''}`}
        onAnimationEnd={handleAnimationEnd}
      >
        <header className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <span className={styles.modalEyebrow}>Lead {lead.lead_id}</span>
            <h3 className={styles.modalTitle}>Edit Commercial Scope & Details</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className={styles.closeButton}
            aria-label="Close dialog"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {errorMessage && (
            <div className={styles.errorBanner} role="alert">
              {errorMessage}
            </div>
          )}

          <div className={styles.sectionHeading}>Contact Coordinates</div>
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="edit-name">
                Primary Contact Name *
              </label>
              <input
                id="edit-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.inputField}
                placeholder="e.g. Zayd Al-Hadi"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="edit-email">
                Business Email
              </label>
              <input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.inputField}
                placeholder="zayd@client.com"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="edit-phone">
                Direct Phone
              </label>
              <input
                id="edit-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={styles.inputField}
                placeholder="+971 50 123 4567"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="edit-channel">
                Preferred Channel
              </label>
              <select
                id="edit-channel"
                value={preferredChannel}
                onChange={(e) => setPreferredChannel(e.target.value as PreferredChannel)}
                className={styles.selectField}
              >
                {PREFERRED_CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.sectionHeading}>Organization & Market</div>
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="edit-company">
                Company Name
              </label>
              <input
                id="edit-company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={styles.inputField}
                placeholder="e.g. Acme Luxury Holdings"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="edit-website">
                Company Website / Domain
              </label>
              <input
                id="edit-website"
                type="text"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                className={styles.inputField}
                placeholder="https://client.ae"
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <label className={styles.fieldLabel} htmlFor="edit-industry">
                Industry / Sector
              </label>
              <input
                id="edit-industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={styles.inputField}
                placeholder="e.g. Luxury Real Estate, Private Equity"
              />
            </div>
          </div>

          <div className={styles.sectionHeading}>Commercial Scope & Terms</div>
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="edit-category">
                Service Scope Category
              </label>
              <select
                id="edit-category"
                value={serviceCategory}
                onChange={(e) => setServiceCategory(e.target.value as ServiceCategory)}
                className={styles.selectField}
              >
                {SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="edit-priority">
                Commercial Priority
              </label>
              <select
                id="edit-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as LeadPriority)}
                className={styles.selectField}
              >
                {LEAD_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p} Priority
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="edit-valuation">
                Expected Valuation (₹)
              </label>
              <input
                id="edit-valuation"
                type="number"
                min="0"
                step="10000"
                value={expectedValue}
                onChange={(e) => setExpectedValue(Number(e.target.value) || 0)}
                className={styles.inputField}
              />
              <span className={styles.valuationPreview}>
                Formatted: {formatCurrencyLive(expectedValue)}
              </span>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="edit-budget">
                Budget Tier Bracket
              </label>
              <select
                id="edit-budget"
                value={budgetBracket}
                onChange={(e) => setBudgetBracket(e.target.value)}
                className={styles.selectField}
              >
                {BUDGET_TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
            </div>

            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <label className={styles.fieldLabel} htmlFor="edit-notes">
                Executive Deal Notes
              </label>
              <textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={styles.textareaField}
                placeholder="Key discovery takeaways, client motivations, budget flexibility, timeline requirements..."
              />
            </div>
          </div>

          <footer className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={styles.saveButton}
            >
              {isPending ? 'Saving Changes...' : 'Save Lead Scope'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
