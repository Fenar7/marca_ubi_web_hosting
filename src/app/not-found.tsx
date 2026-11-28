/**
 * @file not-found.tsx
 * @description Canonical root 404 boundary for Marca Ubi public and unmatched routes.
 *              Uses Marca Ubi Editorial Light tokens with self-contained inline flexbox
 *              layout guards so centering and readability hold even if CSS chunks fail
 *              during a dev server restart.
 * @module app/not-found
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import Link from 'next/link';
import styles from './not-found.module.scss';

/**
 * Renders the root 404 recovery page with direct links to the public homepage and CRM.
 */
export default function RootNotFound(): React.ReactElement {
  return (
    <main
      className={styles.root}
      aria-labelledby="root-not-found-title"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        padding: '24px',
        boxSizing: 'border-box',
        backgroundColor: '#f5f5f3',
        color: '#111111',
      }}
    >
      <div
        role="alert"
        className={styles.card}
        style={{
          width: '100%',
          maxWidth: '460px',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e1',
          borderRadius: '12px',
          padding: '32px',
        }}
      >
        <span className={styles.statusTag}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          404: Page not found
        </span>

        <h1 id="root-not-found-title" className={styles.title}>
          We couldn&apos;t find that page
        </h1>

        <p className={styles.subtitle}>
          The page you requested does not exist or may have moved.
        </p>

        <div className={styles.actions}>
          <Link
            href="/"
            className={styles.primaryAction}
            style={{
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Go to homepage
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
            Open CRM
          </Link>
        </div>
      </div>
    </main>
  );
}
