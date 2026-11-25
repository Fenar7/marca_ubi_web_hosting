'use client';

/**
 * @file CrmToastHost.tsx
 * @description Global toast notification listener for `crm-toast` CustomEvents dispatched across
 *              all CRM modals, inline dropdowns, and batch governance actions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import styles from './CrmToastHost.module.scss';

export type CrmToastTone = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type: CrmToastTone;
}

interface RawToastDetail {
  type?: CrmToastTone;
  tone?: CrmToastTone;
  title?: string;
  message?: string;
  description?: string;
}

export function CrmToastHost(): React.ReactElement | null {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleToastEvent = (event: Event) => {
      const custom = event as CustomEvent<RawToastDetail>;
      const detail = custom.detail;
      if (!detail) return;

      const text = detail.message || detail.description || detail.title || '';
      if (!text.trim()) return;

      const tone: CrmToastTone = detail.type || detail.tone || 'info';
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setToasts((prev) => [...prev.slice(-3), { id, title: detail.title, message: text, type: tone }]);

      setTimeout(() => {
        dismissToast(id);
      }, 4500);
    };

    window.addEventListener('crm-toast', handleToastEvent);
    return () => window.removeEventListener('crm-toast', handleToastEvent);
  }, [dismissToast]);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.toastViewport} aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.type === 'error' ? 'alert' : 'status'}
          className={`${styles.toastCard} ${styles[`tone_${toast.type}`]}`}
        >
          <div className={styles.toastContent}>
            {toast.title && toast.message !== toast.title && (
              <strong className={styles.toastTitle}>{toast.title}</strong>
            )}
            <p className={styles.toastMessage}>{toast.message}</p>
          </div>
          <button
            type="button"
            className={styles.dismissBtn}
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
