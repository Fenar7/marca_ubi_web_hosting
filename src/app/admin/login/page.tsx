/**
 * @file page.tsx
 * @description Administrative Authentication Portal for Marca Ubi Enterprise CRM.
 *              Renders the hardened dark luxury login card wrapped in a React Suspense boundary
 *              for safe client search parameter resolution.
 * @module app/admin/login/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';
import styles from './login.module.scss';

export const metadata: Metadata = {
  title: 'Admin Login | Marca Ubi Enterprise CRM',
  description: 'Restricted administrative portal for Marca Ubi sales intelligence platform.',
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
                <span>Internal Access</span>
              </div>
              <h1 className={styles.brandTitle}>Marca Ubi</h1>
              <p className={styles.brandSubtitle}>Enterprise Sales Intelligence</p>
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
