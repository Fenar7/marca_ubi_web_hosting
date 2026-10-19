/**
 * @file page.tsx
 * @description Administrative Authentication Portal for Marca Ubi Enterprise CRM.
 *              Renders the modern luxury SaaS login portal wrapped in a React Suspense
 *              boundary for safe client search parameter resolution.
 * @module app/admin/login/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';
import styles from './login.module.scss';

export const metadata: Metadata = {
  title: 'Sign In | Marca Ubi Enterprise CRM',
  description: 'Enterprise administration portal for Marca Ubi sales intelligence platform.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage(): React.ReactElement {
  return (
    <main className={styles.canvas}>
      <Suspense
        fallback={
          <div className={styles.cardContainer}>
            <header className={styles.brandHeader}>
              <div className={styles.brandLogoWrap}>
                <img
                  src="/hero/marca-ubi-logo.png"
                  alt="Marca Ubi."
                  className={styles.brandLogo}
                  width={180}
                  height={38}
                />
              </div>
              <h1 className={styles.brandTitle}>Sign in to Marca Ubi</h1>
              <p className={styles.brandSubtitle}>
                Enter your agency credentials to access the CRM console
              </p>
            </header>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '3rem 0',
              }}
              role="status"
              aria-label="Loading authentication portal"
            >
              <div className={styles.btnSpinner} aria-hidden="true" />
              <span className="sr-only">Loading authentication portal...</span>
            </div>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
