'use client';

/**
 * @file ConvertedCelebrationModal.tsx
 * @description Guarded modal component enforcing commercial contract terms,
 *              final signed revenue valuation, and payment schedules before
 *              transitioning a deal to Converted (Won).
 *              Triggers 60fps luxury canvas celebration confetti and enforces
 *              post-conversion record locking for non-admin roles (PRD §15.18).
 * @module app/admin/components/modals/ConvertedCelebrationModal
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import { transitionToConvertedAction } from '@/app/actions/stageTransitionActions';
import type { GuardedTransitionResultPayload } from '@/app/lib/stage-transition-schemas';
import { useModalAnimation } from './useModalAnimation';
import styles from './StageModals.module.scss';

export interface ConvertedCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  dealIdCode?: string;
  dealName?: string;
  currentExpectedValue?: number;
  onSuccess?: (payload: GuardedTransitionResultPayload) => void;
}

function formatCurrency(amount: number): string {
  if (!amount || amount <= 0) return '₹0';
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
}

export function ConvertedCelebrationModal({
  isOpen,
  onClose,
  leadId,
  dealIdCode,
  dealName,
  currentExpectedValue = 500000,
  onSuccess,
}: ConvertedCelebrationModalProps): React.ReactElement | null {
  const { shouldRender, isClosing, handleAnimationEnd } = useModalAnimation({
    isOpen,
    exitDurationMs: 160,
  });

  const [isPending, startTransition] = useTransition();
  const [finalRevenue, setFinalRevenue] = useState<number | ''>(currentExpectedValue || 500000);
  const [signedContractDate, setSignedContractDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = useState<string>('50% upfront, 50% upon milestone completion');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCelebrationActive, setIsCelebrationActive] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const revenueInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Reset form upon opening
  useEffect(() => {
    if (isOpen) {
      setFinalRevenue(currentExpectedValue > 0 ? currentExpectedValue : 500000);
      setSignedContractDate(new Date().toISOString().split('T')[0]);
      setPaymentTerms('50% upfront, 50% upon milestone completion');
      setNotes('');
      setErrorMessage(null);
      setIsCelebrationActive(false);

      setTimeout(() => {
        revenueInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, currentExpectedValue]);

  // Trap focus & Escape dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab' && containerRef.current) {
        const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // High-performance canvas particle confetti animation
  const triggerConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const colors = ['#eefb87', '#10b981', '#fbbf24', '#ffffff', '#38bdf8'];
    const particles: Particle[] = [];
    const count = 75;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() * 40 - 20),
        y: canvas.height * 0.45,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 8 - 4,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      });
    }

    setIsCelebrationActive(true);

    const render = (): void => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let activeCount = 0;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // gravity
        p.rotation += p.rotationSpeed;
        p.alpha -= 0.012;

        if (p.alpha > 0) {
          activeCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      }

      if (activeCount > 0) {
        animationFrameRef.current = requestAnimationFrame(render);
      } else {
        setIsCelebrationActive(false);
      }
    };

    render();
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent): void => {
      e.preventDefault();
      setErrorMessage(null);

      const numRevenue = typeof finalRevenue === 'number' ? finalRevenue : parseFloat(finalRevenue);
      if (isNaN(numRevenue) || numRevenue <= 0) {
        setErrorMessage('Final contract value must be a positive number greater than zero.');
        return;
      }

      if (!signedContractDate) {
        setErrorMessage('Signed contract date is required.');
        return;
      }

      if (!paymentTerms || paymentTerms.trim().length < 3) {
        setErrorMessage('Commercial payment terms are required (minimum 3 characters).');
        return;
      }

      startTransition(async () => {
        try {
          const result = await transitionToConvertedAction({
            leadId,
            finalRevenue: numRevenue,
            signedContractDate,
            paymentTerms: paymentTerms.trim(),
            notes: notes.trim() || undefined,
          });

          if (!result.success || !result.data) {
            setErrorMessage(result.error || 'Failed to convert deal.');
            return;
          }

          // Trigger celebratory confetti animation
          triggerConfetti();

          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('crm-toast', {
                detail: {
                  type: 'success',
                  message: `Celebration: Deal Won for ${formatCurrency(numRevenue)}! Record locked.`,
                },
              })
            );
            window.dispatchEvent(
              new CustomEvent('lead-updated', {
                detail: {
                  leadId,
                  field: 'status',
                  status: {
                    id: result.data.newStatusId,
                    name: result.data.newStatusName,
                    bucket: 'converted',
                  },
                },
              })
            );
          }

          onSuccess?.(result.data);

          // Allow the user to see the confetti burst before closing modal
          setTimeout(() => {
            onClose();
          }, 850);
        } catch (err) {
          setErrorMessage(
            err instanceof Error ? err.message : 'An unexpected exception occurred during conversion.'
          );
        }
      });
    },
    [leadId, finalRevenue, signedContractDate, paymentTerms, notes, triggerConfetti, onSuccess, onClose]
  );

  if (!shouldRender) return null;

  const numericRev = typeof finalRevenue === 'number' ? finalRevenue : parseFloat(finalRevenue) || 0;

  return (
    <div
      className={`${styles.modalOverlay} ${isClosing ? styles.closing : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending && !isCelebrationActive) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="converted-modal-title"
    >
      <div
        ref={containerRef}
        className={`${styles.modalContainer} ${isClosing ? styles.closing : ''}`}
        onAnimationEnd={handleAnimationEnd}
        tabIndex={-1}
      >
        <canvas ref={canvasRef} className={styles.confettiCanvas} />

        <header className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.badgeRow}>
              {dealIdCode && <span className={styles.dealIdPill}>{dealIdCode}</span>}
              <span className={`${styles.stageBadge} ${styles.converted}`}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Terminal Won</span>
              </span>
            </div>
            <h2 id="converted-modal-title" className={styles.modalTitle}>
              Convert Deal to Won Client.
            </h2>
            {dealName && (
              <p className={styles.modalSubtitle}>
                Finalizing agency engagement agreement for <strong style={{ color: 'var(--admin-text-primary, #1f242f)' }}>{dealName}</strong>.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close dialog"
            disabled={isPending || isCelebrationActive}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {/* Post-Conversion Lock Notice */}
            <div className={`${styles.infoBanner} ${styles.lockNotice}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>
                <strong>State Machine Record Locking:</strong> Converting this deal marks it read-only
                for Sales Executives and Sales Managers. Only System Administrators can modify terms
                post-conversion.
              </span>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="final-revenue-input" className={styles.fieldLabel}>
                  Final Signed Contract Value <span className={styles.required}>*</span>
                </label>
                {numericRev > 0 && (
                  <span className={styles.livePreviewPill}>
                    {formatCurrency(numericRev)}
                  </span>
                )}
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrefix}>₹</span>
                <input
                  id="final-revenue-input"
                  ref={revenueInputRef}
                  type="number"
                  min="1"
                  step="1000"
                  value={finalRevenue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFinalRevenue(val === '' ? '' : Number(val));
                  }}
                  placeholder="500000"
                  className={`${styles.textInput} ${styles.hasPrefix} ${
                    numericRev <= 0 ? styles.hasError : ''
                  }`}
                  disabled={isPending || isCelebrationActive}
                  required
                />
              </div>
              <span className={styles.fieldHint}>
                Enter the exact agreed contract amount before taxation.
              </span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="contract-date-input" className={styles.fieldLabel}>
                Signed Contract Date <span className={styles.required}>*</span>
              </label>
              <input
                id="contract-date-input"
                type="date"
                value={signedContractDate}
                onChange={(e) => setSignedContractDate(e.target.value)}
                className={styles.textInput}
                disabled={isPending || isCelebrationActive}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="payment-terms-input" className={styles.fieldLabel}>
                Commercial Payment Terms <span className={styles.required}>*</span>
              </label>
              <input
                id="payment-terms-input"
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g. 50% upfront retainer, 50% upon deployment"
                className={styles.textInput}
                disabled={isPending || isCelebrationActive}
                required
              />
              <span className={styles.fieldHint}>
                Milestone or retainer schedules governing agency billing.
              </span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="conversion-notes-textarea" className={styles.fieldLabel}>
                Executive Conversion Notes (Optional)
              </label>
              <textarea
                id="conversion-notes-textarea"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Include commercial stipulations, kickoff milestones, or executive handover instructions..."
                className={styles.textareaInput}
                disabled={isPending || isCelebrationActive}
              />
            </div>

            {errorMessage && (
              <div className={styles.fieldError} role="alert">
                {errorMessage}
              </div>
            )}
          </div>

          <footer className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
              disabled={isPending || isCelebrationActive}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.submitBtn} ${styles.success}`}
              disabled={isPending || isCelebrationActive || numericRev <= 0}
            >
              {isPending && <div className={styles.spinner} />}
              <span>{isPending ? 'Converting Deal...' : 'Confirm Conversion & Lock'}</span>
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
