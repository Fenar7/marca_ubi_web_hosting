/**
 * @file layout.tsx
 * @description Master root layout for all /admin routes (including /admin, /admin/login, /admin/reset-password).
 *              Ensures native cursor standards and disables brand smooth scroll engine across all admin panels.
 * @module app/admin/layout
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Metadata } from 'next';
import { AdminRootClientProvider } from './components/layout/AdminRootClientProvider';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <AdminRootClientProvider>
      {children}
    </AdminRootClientProvider>
  );
}
