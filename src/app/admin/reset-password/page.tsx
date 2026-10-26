/**
 * @file page.tsx
 * @description Mandatory First-Login Password Reset Interface (/admin/reset-password).
 *              Protected by Next.js 16 Edge Middleware and Server Component authentication.
 *              Enforces security invariants requiring provisioned users to establish permanent credentials.
 *              Strictly conforms to Marca Ubi modern luxury SaaS design tokens.
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
  title: 'Set New Password | Marca Ubi Enterprise CRM',
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

  return (
    <main className={styles.canvas}>
      <section className={styles.cardContainer}>
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
          <h1 className={styles.title}>Set New Password</h1>
          <p className={styles.subtitle}>
            Please choose a strong permanent password for your account
          </p>
        </header>

        <ResetPasswordForm />
      </section>
    </main>
  );
}
