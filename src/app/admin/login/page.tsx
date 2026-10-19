/**
 * @file page.tsx
 * @description Administrative Authentication Portal for Marca Ubi Enterprise CRM.
 *              Renders the Accordion Executive Advisory light login portal wrapped in a React Suspense
 *              boundary for safe client search parameter resolution.
 * @module app/admin/login/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';
import styles from './login.module.scss';

export const metadata: Metadata = {
  title: 'Executive Portal | Marca Ubi Enterprise CRM',
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
            <div className={styles.brandHeader}>
              <div className={styles.brandBadge}>
                <span className={styles.brandBadgeDot} aria-hidden="true" />
                <span>Executive Access</span>
              </div>
              <div className={styles.brandLogoWrap}>
                <img
                  src="/hero/marca-ubi-logo.png"
                  alt="Marca Ubi."
                  className={styles.brandLogo}
                  width={180}
                  height={38}
                />
              </div>
              <p className={styles.brandSubtitle}>Enterprise Administration</p>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '3rem 0',
              }}
            >
              <div className={styles.btnSpinner} aria-hidden="true" />
            </div>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
