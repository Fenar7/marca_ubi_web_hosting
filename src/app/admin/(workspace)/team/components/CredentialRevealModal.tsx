'use client';

/**
 * @file CredentialRevealModal.tsx
 * @description High-security One-Time Credential Reveal Modal for newly provisioned personnel.
 *              Maintains strict React hooks order, cyclical focus trapping, focus restoration,
 *              60-second clipboard auto-purge timer, and WCAG aria-live announcements.
 * @module app/admin/team/components/CredentialRevealModal
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../team.module.scss';

export interface ProvisionedCredentialsPayload {
  fullName: string;
  email: string;
  role: string;
  jobTitle: string;
  tempPassword: string;
  allowedTabs?: string[];
}

interface CredentialRevealModalProps {
  isOpen: boolean;
  credentials: ProvisionedCredentialsPayload | null;
  onClose: () => void;
}

export function CredentialRevealModal({
  isOpen,
  credentials,
  onClose,
}: CredentialRevealModalProps): React.ReactElement | null {
  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const modalCardRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const purgeClipboard = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText('').catch(() => {});
    } else if (typeof document !== 'undefined') {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = '';
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch {
        // Non-secure context clipboard cleanup ignored
      }
    }
  }, []);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const handleDone = useCallback(() => {
    if (copied) {
      purgeClipboard();
    }
    clearTimers();
    onClose();
  }, [copied, purgeClipboard, clearTimers, onClose]);

  const copiedRef = useRef(false);

  useEffect(() => {
    copiedRef.current = copied;
  }, [copied]);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = 'hidden';
      setCopied(false);
      setSecondsRemaining(60);
      clearTimers();

      requestAnimationFrame(() => {
        const copyBtn = modalCardRef.current?.querySelector<HTMLElement>('button:not([disabled])');
        copyBtn?.focus();
      });

      return () => {
        clearTimers();
        if (copiedRef.current) {
          purgeClipboard();
        }
        requestAnimationFrame(() => {
          if (!document.querySelector('[aria-modal="true"]')) {
            document.body.style.overflow = '';
          }
        });
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
          previousFocusRef.current.focus();
          previousFocusRef.current = null;
        }
      };
    }

    clearTimers();
    return undefined;
  }, [isOpen, clearTimers, purgeClipboard]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        handleDone();
        return;
      }

      if (e.key === 'Tab' && isOpen && modalCardRef.current) {
        const focusable = modalCardRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDone]);

  if (!isOpen || !credentials) {
    return null;
  }

  const handleCopy = async () => {
    clearTimers();

    const portalUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/admin/login`
        : 'https://marcaubi.com/admin/login';

    const formattedPayload = [
      'MARCA UBI ENTERPRISE CRM: TEMPORARY ACCESS CREDENTIALS',
      `Full Name: ${credentials.fullName}`,
      `Work Email: ${credentials.email}`,
      `Assigned Role: ${credentials.role.toUpperCase()}`,
      `Temporary Password: ${credentials.tempPassword}`,
      `Portal Address: ${portalUrl}`,
      'Security Policy: You will be required to establish a permanent password upon first login.',
    ].join('\n');

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(formattedPayload);
      } else if (typeof document !== 'undefined') {
        const textArea = document.createElement('textarea');
        textArea.value = formattedPayload;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setSecondsRemaining(60);

      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearTimers();
            purgeClipboard();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      timerRef.current = setTimeout(() => {
        purgeClipboard();
        clearTimers();
      }, 60000);
    } catch (err: unknown) {
      console.error('[CLIPBOARD_ERROR] Failed to write credentials to system clipboard:', err);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="credential-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleDone();
        }
      }}
    >
      <div ref={modalCardRef} className={styles.modalCard}>
        <div className={styles.modalAlertBanner}>
          <svg
            className={styles.modalAlertIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <h3 id="credential-modal-title" className={styles.modalHeading}>
              One-Time Credential Reveal.
            </h3>
            <p className={styles.modalAlertText}>
              These temporary credentials are displayed strictly once. Distribute them to the team member through a verified secure channel.
            </p>
          </div>
        </div>

        <div className={styles.credentialTokenContainer}>
          <div className={styles.credentialRow}>
            <span className={styles.credentialKey}>Personnel</span>
            <span className={styles.credentialValue}>{credentials.fullName}</span>
          </div>

          <div className={styles.credentialRow}>
            <span className={styles.credentialKey}>Corporate Email</span>
            <span className={styles.credentialValue}>{credentials.email}</span>
          </div>

          <div className={styles.credentialRow}>
            <span className={styles.credentialKey}>Assigned Role</span>
            <span className={styles.credentialValue}>{credentials.role.toUpperCase()}</span>
          </div>

          <div className={styles.credentialRow}>
            <span className={styles.credentialKey}>Job Title</span>
            <span className={styles.credentialValue}>{credentials.jobTitle}</span>
          </div>

          <div className={styles.credentialRow}>
            <span className={styles.credentialKey}>Temporary Password</span>
            <span className={styles.credentialPasscode}>{credentials.tempPassword}</span>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.copyButton}
            onClick={handleCopy}
            aria-label="Copy credentials payload to system clipboard"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>{copied ? 'Credentials Copied' : 'Copy Credentials'}</span>
          </button>

          <button type="button" className={styles.doneButton} onClick={handleDone}>
            Done
          </button>
        </div>

        {copied && (
          <div className={styles.clipboardCountdown} role="status" aria-live="polite">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>
              {secondsRemaining > 0
                ? `Clipboard auto-purge in ${secondsRemaining}s`
                : 'Clipboard purged'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
