'use client';

/**
 * @file NewLeadDrawer.tsx
 * @description Slide-out prospective lead creation drawer component.
 *              Enforces instant Zod validation, contact coordinate requirements,
 *              live currency valuation formatting, and accidental dismissal protection.
 *              Integrates with Server Action `createManualLead`.
 * @module app/admin/components/layout/NewLeadDrawer
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import { createManualLead, getActiveTeamAssignees } from '@/app/actions/leads';
import {
  createManualLeadSchema,
  SERVICE_CATEGORIES,
  PREFERRED_CHANNELS,
  LEAD_PRIORITIES,
  BUDGET_TIERS,
  type AssigneeOption,
} from '@/app/lib/lead-schemas';
import { formatDealValuation } from '@/app/lib/team-utils';
import type { CurrentUserSession } from './UserProfileDropdown';
import type { PreferredChannel, ServiceCategory, LeadPriority } from '@/types/crm';
import styles from './NewLeadDrawer.module.scss';

interface NewLeadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUserSession;
}

export function NewLeadDrawer({
  isOpen,
  onClose,
  currentUser,
}: NewLeadDrawerProps): React.ReactElement | null {
  const [isPending, startTransition] = useTransition();
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Form Field State
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredChannel, setPreferredChannel] = useState<PreferredChannel>('Phone');
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>('Web & Digital');
  const [budgetBracket, setBudgetBracket] = useState<string>('₹5L - ₹15L');
  const [expectedValue, setExpectedValue] = useState<number | ''>(500000);
  const [priority, setPriority] = useState<LeadPriority>('Medium');
  const [assignedTo, setAssignedTo] = useState<string>(currentUser.id);
  const [notes, setNotes] = useState('');

  // Assignee options loaded from database
  const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>([]);

  // Validation & Error State
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Unsaved changes modal state
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false);

  // Fetch active team assignees when opening drawer
  useEffect(() => {
    if (isOpen) {
      getActiveTeamAssignees().then((options) => {
        setAssigneeOptions(options);
      });
    }
  }, [isOpen]);

  // Reset form upon opening
  useEffect(() => {
    if (isOpen) {
      setName('');
      setCompany('');
      setCompanyWebsite('');
      setEmail('');
      setPhone('');
      setPreferredChannel('Phone');
      setServiceCategory('Web & Digital');
      setBudgetBracket('₹5L - ₹15L');
      setExpectedValue(500000);
      setPriority('Medium');
      setAssignedTo(currentUser.id);
      setNotes('');
      setFormErrors({});
      setGeneralError(null);
      setShowDiscardPrompt(false);

      // Autofocus client name input
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentUser.id]);

  // Check if form contains modified data
  const isDirty = Boolean(
    name.trim().length > 0 ||
    company.trim().length > 0 ||
    companyWebsite.trim().length > 0 ||
    email.trim().length > 0 ||
    phone.trim().length > 0 ||
    notes.trim().length > 0 ||
    (typeof expectedValue === 'number' && expectedValue !== 500000)
  );

  const requestClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardPrompt(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        if (showDiscardPrompt) {
          setShowDiscardPrompt(false);
        } else {
          requestClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showDiscardPrompt, requestClose]);

  if (!isOpen) {
    return null;
  }

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormErrors({});
    setGeneralError(null);

    const rawPayload = {
      name,
      company: company || undefined,
      companyWebsite: companyWebsite || undefined,
      email: email || undefined,
      phone: phone || undefined,
      preferredChannel,
      serviceCategory,
      budgetBracket: budgetBracket || undefined,
      expectedValue: expectedValue === '' ? 0 : Number(expectedValue),
      priority,
      assignedTo: currentUser.role === 'sales_executive' ? currentUser.id : (assignedTo || currentUser.id),
      notes: notes || undefined,
    };

    const parsed = createManualLeadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const fieldKey = issue.path[0]?.toString() || 'general';
        if (!fieldErrors[fieldKey]) {
          fieldErrors[fieldKey] = issue.message;
        }
      });
      setFormErrors(fieldErrors);
      return;
    }

    startTransition(async () => {
      const result = await createManualLead(parsed.data);
      if (!result.success) {
        setGeneralError(result.error || 'Failed to initialize prospective lead record.');
        return;
      }

      // Signal success to the workspace shell and close drawer
      window.dispatchEvent(
        new CustomEvent('lead-created', {
          detail: { leadId: result.leadId, id: result.id },
        })
      );
      onClose();
    });
  };

  const isExecutive = currentUser.role === 'sales_executive';

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={styles.drawerOverlay}
        onClick={requestClose}
        aria-hidden="true"
      >
        {/* Slide-out Drawer Container */}
        <aside
          className={styles.drawer}
          onClick={(e) => e.stopPropagation()}
          aria-label="Manual Prospective Engagement Drawer"
        >
          {/* Sticky Drawer Header */}
          <div className={styles.drawerHeader}>
            <div className={styles.headerMeta}>
              <span className={styles.eyebrow}>Commercial Intake</span>
              <h2 className={styles.drawerTitle}>+ New Client Engagement</h2>
            </div>
            <button
              type="button"
              className={styles.drawerCloseButton}
              onClick={requestClose}
              aria-label="Close drawer"
              title="Close drawer (Esc)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Form Scroll Area */}
          <form className={styles.drawerBody} onSubmit={handleFormSubmit} noValidate>
            {generalError && (
              <div className={styles.generalErrorAlert} role="alert">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{generalError}</span>
              </div>
            )}

            {/* Section 1: Contact Coordinates */}
            <div className={styles.formSectionHeader}>Primary Decision Maker</div>

            <div className={styles.drawerFormGroup}>
              <label className={styles.drawerLabel} htmlFor="lead-name">
                <span>
                  Client Contact Name
                  <span className={styles.requiredStar}>*</span>
                </span>
              </label>
              <input
                ref={nameInputRef}
                id="lead-name"
                type="text"
                className={`${styles.drawerInput} ${formErrors.name ? styles.inputError : ''}`}
                placeholder="e.g. Tariq Al-Mansoor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isPending}
              />
              {formErrors.name && (
                <p className={styles.fieldError}>{formErrors.name}</p>
              )}
            </div>

            <div className={styles.formRow}>
              <div className={styles.drawerFormGroup}>
                <label className={styles.drawerLabel} htmlFor="lead-company">
                  Company / Entity
                </label>
                <input
                  id="lead-company"
                  type="text"
                  className={`${styles.drawerInput} ${formErrors.company ? styles.inputError : ''}`}
                  placeholder="e.g. Apex Holdings LLC"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={isPending}
                />
                {formErrors.company && (
                  <p className={styles.fieldError}>{formErrors.company}</p>
                )}
              </div>

              <div className={styles.drawerFormGroup}>
                <label className={styles.drawerLabel} htmlFor="lead-website">
                  Entity Website
                </label>
                <input
                  id="lead-website"
                  type="text"
                  className={`${styles.drawerInput} ${formErrors.companyWebsite ? styles.inputError : ''}`}
                  placeholder="https://apexholdings.ae"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  disabled={isPending}
                />
                {formErrors.companyWebsite && (
                  <p className={styles.fieldError}>{formErrors.companyWebsite}</p>
                )}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.drawerFormGroup}>
                <label className={styles.drawerLabel} htmlFor="lead-email">
                  Email Coordinate
                </label>
                <input
                  id="lead-email"
                  type="email"
                  className={`${styles.drawerInput} ${formErrors.email ? styles.inputError : ''}`}
                  placeholder="tariq@apexholdings.ae"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                />
                {formErrors.email && (
                  <p className={styles.fieldError}>{formErrors.email}</p>
                )}
              </div>

              <div className={styles.drawerFormGroup}>
                <label className={styles.drawerLabel} htmlFor="lead-phone">
                  Telephone / WhatsApp
                </label>
                <input
                  id="lead-phone"
                  type="tel"
                  className={`${styles.drawerInput} ${formErrors.phone ? styles.inputError : ''}`}
                  placeholder="+971 50 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isPending}
                />
                {formErrors.phone && (
                  <p className={styles.fieldError}>{formErrors.phone}</p>
                )}
              </div>
            </div>
            <p className={styles.fieldHint}>
              * Either an email address or telephone number is mandatory to establish reachability.
            </p>

            {/* Section 2: Engagement Scope & Valuation */}
            <div className={styles.formSectionHeader}>Commercial Scope & Valuation</div>

            <div className={styles.formRow}>
              <div className={styles.drawerFormGroup}>
                <label className={styles.drawerLabel} htmlFor="lead-service">
                  Service Category
                </label>
                <select
                  id="lead-service"
                  className={styles.drawerSelect}
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value as ServiceCategory)}
                  disabled={isPending}
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.drawerFormGroup}>
                <label className={styles.drawerLabel} htmlFor="lead-channel">
                  Preferred Channel
                </label>
                <select
                  id="lead-channel"
                  className={styles.drawerSelect}
                  value={preferredChannel}
                  onChange={(e) => setPreferredChannel(e.target.value as PreferredChannel)}
                  disabled={isPending}
                >
                  {PREFERRED_CHANNELS.map((chan) => (
                    <option key={chan} value={chan}>
                      {chan}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.drawerFormGroup}>
                <label className={styles.drawerLabel} htmlFor="lead-budget">
                  Budget Bracket
                </label>
                <select
                  id="lead-budget"
                  className={styles.drawerSelect}
                  value={budgetBracket}
                  onChange={(e) => setBudgetBracket(e.target.value)}
                  disabled={isPending}
                >
                  {BUDGET_TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.drawerFormGroup}>
                <label className={styles.drawerLabel} htmlFor="lead-expected-value">
                  <span>Valuation (₹ INR)</span>
                </label>
                <div className={styles.inputWithBadge}>
                  <input
                    id="lead-expected-value"
                    type="number"
                    min="0"
                    step="50000"
                    className={`${styles.drawerInput} ${formErrors.expectedValue ? styles.inputError : ''}`}
                    value={expectedValue}
                    onChange={(e) =>
                      setExpectedValue(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    disabled={isPending}
                  />
                  <span className={styles.valuationBadge}>
                    {formatDealValuation(Number(expectedValue) || 0)}
                  </span>
                </div>
                {formErrors.expectedValue && (
                  <p className={styles.fieldError}>{formErrors.expectedValue}</p>
                )}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.drawerFormGroup}>
                <label className={styles.drawerLabel} htmlFor="lead-priority">
                  Pipeline Priority
                </label>
                <select
                  id="lead-priority"
                  className={styles.drawerSelect}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as LeadPriority)}
                  disabled={isPending}
                >
                  {LEAD_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p} Priority
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.drawerFormGroup}>
                <label className={styles.drawerLabel} htmlFor="lead-assignee">
                  <span>Assigned Representative</span>
                </label>
                {isExecutive ? (
                  <input
                    id="lead-assignee"
                    type="text"
                    className={styles.drawerInput}
                    value={`${currentUser.name} (Self)`}
                    disabled
                    title="Sales Executives are auto-assigned to self per governance rules"
                  />
                ) : (
                  <select
                    id="lead-assignee"
                    className={styles.drawerSelect}
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    disabled={isPending}
                  >
                    {assigneeOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.fullName} ({opt.role.replace('_', ' ')})
                      </option>
                    ))}
                    {assigneeOptions.length === 0 && (
                      <option value={currentUser.id}>{currentUser.name} (Self)</option>
                    )}
                  </select>
                )}
              </div>
            </div>

            {/* Section 3: Notes & Engagement Brief */}
            <div className={styles.drawerFormGroup}>
              <label className={styles.drawerLabel} htmlFor="lead-notes">
                Commercial Notes & Context
              </label>
              <textarea
                id="lead-notes"
                className={`${styles.drawerTextarea} ${formErrors.notes ? styles.inputError : ''}`}
                placeholder="Key discovery notes, initial scope requests, or referral context..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isPending}
              />
              {formErrors.notes && (
                <p className={styles.fieldError}>{formErrors.notes}</p>
              )}
            </div>

            {/* Sticky Drawer Footer */}
            <div className={styles.drawerFooter}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={requestClose}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <span className={styles.buttonSpinner} aria-hidden="true" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <span>Register Prospect</span>
                )}
              </button>
            </div>
          </form>
        </aside>
      </div>

      {/* Accidental Dismissal Confirmation Dialog */}
      {showDiscardPrompt && (
        <div
          className={styles.promptOverlay}
          onClick={() => setShowDiscardPrompt(false)}
          aria-hidden="true"
        >
          <div
            className={styles.promptModal}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-labelledby="discard-title"
            aria-describedby="discard-message"
          >
            <h3 id="discard-title" className={styles.promptTitle}>
              Discard Entered Information?
            </h3>
            <p id="discard-message" className={styles.promptMessage}>
              You have unsaved prospective client details. Exiting will permanently discard all entered fields.
            </p>
            <div className={styles.promptActions}>
              <button
                type="button"
                className={styles.promptKeepBtn}
                onClick={() => setShowDiscardPrompt(false)}
              >
                Keep Editing
              </button>
              <button
                type="button"
                className={styles.promptDiscardBtn}
                onClick={() => {
                  setShowDiscardPrompt(false);
                  onClose();
                }}
              >
                Discard & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
