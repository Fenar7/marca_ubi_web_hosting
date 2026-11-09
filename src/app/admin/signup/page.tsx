/**
 * @file page.tsx
 * @description Staff account registration entry for the Marca Ubi Commercial Desk.
 * @module admin/signup/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { SignupForm } from './SignupForm';
import { AdminAuthShell } from '@/app/admin/components/auth/AdminAuthShell';
import styles from './signup.module.scss';

export const metadata: Metadata = {
  title: 'Create Account | Marca Ubi Commercial Desk',
  description: 'Register for your Marca Ubi agency commercial workspace.',
  robots: { index: false, follow: false },
};

export default function AdminSignupPage(): React.ReactElement {
  return (
    <AdminAuthShell
      eyebrow="A WISE QUOTE"
      headline="Precision in Commercial Execution"
      description="The future belongs to those who build it with uncompromising craft, discipline, and meticulous focus."
    >
      <Suspense
        fallback={
          <div className={styles.loadingPanel} role="status">
            <span className={styles.btnSpinner} aria-hidden="true" />
            Loading registration form
          </div>
        }
      >
        <SignupForm />
      </Suspense>
    </AdminAuthShell>
  );
}
