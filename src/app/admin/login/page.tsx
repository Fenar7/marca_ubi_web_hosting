/**
 * @file page.tsx
 * @description Staff sign-in entry for the Marca Ubi Commercial Desk.
 */

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';
import { AdminAuthShell } from '@/app/admin/components/auth/AdminAuthShell';
import styles from './login.module.scss';

export const metadata: Metadata = {
  title: 'Sign In | Marca Ubi Commercial Desk',
  description: 'Sign in to the Marca Ubi agency workspace.',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage(): React.ReactElement {
  return (
    <AdminAuthShell
      eyebrow="Marca Ubi · Staff workspace"
      headline="Your commercial work, in one place."
      description="Sign in with your agency account to manage leads, client work, and follow-ups."
    >
      <Suspense fallback={<div className={styles.loadingPanel} role="status"><span className={styles.btnSpinner} aria-hidden="true" />Loading sign-in form</div>}>
        <LoginForm />
      </Suspense>
    </AdminAuthShell>
  );
}
