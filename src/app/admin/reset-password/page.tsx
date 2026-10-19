/**
 * @file page.tsx
 * @description Mandatory First-Login Password Reset Interface (/admin/reset-password).
 *              Protected by Next.js 16 Edge Middleware and Server Component authentication.
 *              Enforces security invariants requiring provisioned users to establish permanent credentials.
 *              Strictly conforms to Accordion Executive Advisory & Sypher design system tokens.
 * @module app/admin/reset-password/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { ResetPasswordForm } from './ResetPasswordForm';
import styles from './reset-password.module.scss';

export const metadata: Metadata = {
  title: 'Establish Permanent Password | Marca Ubi Enterprise CRM',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ResetPasswordPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login?next=%2Fadmin%2Freset-password');
  }

  // Verify that the user actually requires credential rotation
  const mustChangePassword =
    user.app_metadata?.must_change_password === true ||
    user.user_metadata?.must_change_password === true;

  if (!mustChangePassword) {
    // If credentials are already rotated, redirect to workspace
    redirect('/admin');
  }

  const staffEmail = user.email || 'Commercial Team Member';

  return (
    <main className={styles.canvas}>
      <section className={styles.cardContainer}>
        <header className={styles.brandHeader}>
          <div className={styles.securityBadge}>
            <span className={styles.securityBadgeDot} aria-hidden="true" />
            <span>Identity Governance Protocol</span>
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
          <h1 className={styles.title}>Establish Credentials.</h1>
          <p className={styles.subtitle}>Account Security Invariant</p>

          <div className={styles.policyNotice}>
            <div className={styles.policyNoticeTitle}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Mandatory Initial Credential Rotation</span>
            </div>
            <p className={styles.policyNoticeText}>
              Welcome, <strong>{staffEmail}</strong>. Your account was provisioned with a temporary
              passphrase. Agency governance policy requires establishing a high-entropy permanent
              password before accessing CRM dossiers.
            </p>
          </div>
        </header>

        <ResetPasswordForm />
      </section>
    </main>
  );
}
