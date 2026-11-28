/**
 * @file not-found.tsx
 * @description Workspace-scoped 404 boundary rendered inside AdminWorkspaceShell.
 *              Uses min-height: 60vh so navigation chrome remains intact without vertical push.
 * @module app/admin/(workspace)/not-found
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import Link from 'next/link';
import styles from './not-found.module.scss';

/**
 * Renders an in-shell 404 recovery card for missing workspace records or routes.
 */
export default function WorkspaceNotFound(): React.ReactElement {
  return (
    <section
      className={styles.container}
      aria-labelledby="workspace-not-found-title"
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
          404: Page not found
        </span>

        <h1 id="workspace-not-found-title" className={styles.title}>
          We couldn&apos;t find that page
        </h1>

        <p className={styles.subtitle}>
          The requested workspace record or route could not be found, or you do not have access to view it.
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
            Back to Overview
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
    </section>
  );
}
