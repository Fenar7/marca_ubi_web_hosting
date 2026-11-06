/**
 * @file page.tsx
 * @description Mandatory password rotation inside the shared Commercial Desk auth shell.
 */

import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { AdminAuthShell } from '@/app/admin/components/auth/AdminAuthShell';
import { ResetPasswordForm } from './ResetPasswordForm';
import styles from './reset-password.module.scss';

export const metadata: Metadata = {
  title: 'Set New Password | Marca Ubi Commercial Desk',
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login?next=%2Fadmin%2Freset-password');

  const mustChangePassword = user.app_metadata?.must_change_password === true || user.user_metadata?.must_change_password === true;
  if (!mustChangePassword) redirect('/admin');

  return (
    <AdminAuthShell
      eyebrow="Account setup"
      headline="Set a password you can keep."
      description="Choose a permanent password before opening your Marca Ubi workspace."
    >
      <div className={styles.cardContainer}>
        <header className={styles.brandHeader}>
          <h2 className={styles.title}>Create your password</h2>
          <p className={styles.subtitle}>Use a unique password for this agency account.</p>
        </header>
        <ResetPasswordForm />
      </div>
    </AdminAuthShell>
  );
}
