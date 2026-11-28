/**
 * @file not-found.tsx
 * @description Scoped 404 recovery boundary for `/admin/ingestion/[id]` when an inquiry
 *              identifier is invalid, missing, or outside the caller's RLS scope.
 * @module app/admin/(workspace)/ingestion/[id]/not-found
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import Link from 'next/link';
import styles from './not-found.module.scss';

/**
 * Renders the missing-inquiry recovery view inside AdminWorkspaceShell.
 */
export default function InquiryNotFound(): React.ReactElement {
  return (
    <section
      className={styles.container}
      aria-labelledby="inquiry-not-found-title"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        className={styles.card}
        style={{
          width: '100%',
          maxWidth: '460px',
          boxSizing: 'border-box',
        }}
      >
        <span className={styles.statusTag} role="status">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          404: Inquiry not found
        </span>

        <h1 id="inquiry-not-found-title" className={styles.title}>
          Inquiry record unavailable
        </h1>

        <p className={styles.subtitle}>
          The requested inquiry could not be found, or you do not have access to view it.
        </p>

        <div
          className={styles.actions}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '8px',
          }}
        >
          <Link
            href="/admin/ingestion"
            className={styles.primaryAction}
            style={{
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Back to Inquiries
          </Link>

          <Link
            href="/admin"
            className={styles.secondaryAction}
            style={{
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Back to Overview
          </Link>
        </div>
      </div>
    </section>
  );
}
