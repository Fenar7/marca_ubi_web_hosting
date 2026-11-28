/**
 * @file not-found.tsx
 * @description Scoped 404 boundary for unmatched `/admin/*` URLs outside the authenticated workspace shell.
 *              Includes inline flexbox fallback layout so centering holds during dev CSS reloads.
 * @module app/admin/not-found
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import Link from 'next/link';
import styles from './not-found.module.scss';

/**
 * Renders the `/admin` segment 404 recovery page with links back to CRM Overview and Follow-ups.
 */
export default function AdminNotFound(): React.ReactElement {
  return (
    <main
      className={styles.root}
      aria-labelledby="admin-not-found-title"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        padding: '24px 16px',
        boxSizing: 'border-box',
        backgroundColor: '#f5f5f3',
        color: '#111111',
      }}
    >
      <div
        className={styles.card}
        style={{
          width: '100%',
          maxWidth: '460px',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e1',
          borderRadius: '12px',
          padding: 'clamp(20px, 4vw, 32px)',
        }}
      >
        <span className={styles.statusTag} role="status">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          404: CRM route not found
        </span>

        <h1 id="admin-not-found-title" className={styles.title}>
          We couldn&apos;t find that workspace page
        </h1>

        <p className={styles.subtitle}>
          This CRM address does not match an active route or may have moved.
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
            href="/admin"
            className={styles.primaryAction}
            style={{
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Back to CRM Overview
          </Link>

          <Link
            href="/admin/tasks"
            className={styles.secondaryAction}
            style={{
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Open Follow-ups
          </Link>
        </div>
      </div>
    </main>
  );
}
