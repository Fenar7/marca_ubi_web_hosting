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

interface AdminRootClientProviderProps {
  children: React.ReactNode;
}

export function AdminRootClientProvider({
  children,
}: AdminRootClientProviderProps): React.ReactElement {
  useEffect(() => {
    // Flag documentElement to disable public custom orange cursor and enforce system native cursors
    document.documentElement.setAttribute('data-admin-route', 'true');

    // Purge any residual Lenis smooth-scroll class names that could impact admin scroll containers
    document.documentElement.classList.remove(
      'lenis',
      'lenis-smooth',
      'lenis-scrolling',
      'lenis-stopped'
    );

    return () => {
      document.documentElement.removeAttribute('data-admin-route');
    };
  }, []);

  return (
    <div data-admin-root="true" style={{ minHeight: '100vh', width: '100%' }}>
      {children}
    </div>
  );
}
