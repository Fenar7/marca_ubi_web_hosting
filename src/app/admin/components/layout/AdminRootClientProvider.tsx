'use client';

/**
 * @file AdminRootClientProvider.tsx
 * @description Master client boundary establishing native cursor behavior and disabling
 *              brand smooth scrolling across all authenticated and unauthenticated /admin surfaces.
 *              Sets data-admin-route="true" on <html> during mount, restores standard system cursor,
 *              and purges any residual Lenis smooth scroll engine classes.
 * @module app/admin/components/layout/AdminRootClientProvider
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useEffect } from 'react';
import { CrmToastHost } from './CrmToastHost';

interface AdminRootClientProviderProps {
  children: React.ReactNode;
  fontVariables?: string;
}

export function AdminRootClientProvider({
  children,
  fontVariables,
}: AdminRootClientProviderProps): React.ReactElement {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Flag documentElement & body so portaled modals/drawers inherit --admin-* tokens without escape
    document.documentElement.setAttribute('data-admin-route', 'true');
    document.body.setAttribute('data-admin-root', 'true');

    // Purge any residual Lenis smooth-scroll class names that could impact admin scroll containers
    document.documentElement.classList.remove(
      'lenis',
      'lenis-smooth',
      'lenis-scrolling',
      'lenis-stopped'
    );

    return () => {
      if (typeof document === 'undefined') return;
      document.documentElement.removeAttribute('data-admin-route');
      document.body.removeAttribute('data-admin-root');
    };
  }, []);

  return (
    <div
      data-admin-root="true"
      className={fontVariables}
      style={{ minHeight: '100vh', width: '100%' }}
    >
      {children}
      <CrmToastHost />
    </div>
  );
}
