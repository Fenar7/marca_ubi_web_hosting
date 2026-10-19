'use client';

/**
 * @file AdminBreadcrumbs.tsx
 * @description Dynamic breadcrumb engine resolving Next.js App Router pathnames into
 *              hierarchical agency navigation markers.
 * @architecture Extracts URL segments via `usePathname()`, correlates segments against
 *               commercial route mappings, and renders accessible ARIA breadcrumb markup.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminBreadcrumbs.module.scss';

/**
 * High-value domain dictionary mapping URL path slugs to professional CRM titles.
 */
const ROUTE_NAME_MAP: Record<string, string> = {
  admin: 'Command Center',
  leads: 'Inbound Leads',
  deals: 'Pipeline Deals',
  works: 'Client Works',
  tasks: 'Follow-up Tasks',
  team: 'User Management',
  analytics: 'Executive Analytics',
  ingestion: 'Website Inquiries',
  settings: 'Security & Settings',
};

export function AdminBreadcrumbs(): React.ReactElement {
  const pathname = usePathname() || '/admin';
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="Breadcrumb Navigation" className={styles.breadcrumbNav}>
      <ol className={styles.breadcrumbList}>
        <li className={styles.breadcrumbItem}>
          <Link href="/admin" className={styles.rootLink}>
            Marca Ubi CRM
          </Link>
        </li>

        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const title = ROUTE_NAME_MAP[segment] || segment.replace(/-/g, ' ');

          // Prevent rendering redundant 'admin' segment when deeper inside sub-routes
          if (segment === 'admin' && segments.length > 1) {
            return null;
          }

          return (
            <React.Fragment key={href}>
              <li className={styles.separator} aria-hidden="true">
                /
              </li>
              <li className={styles.breadcrumbItem}>
                {isLast ? (
                  <span className={styles.currentSegment} aria-current="page">
                    {title}
                  </span>
                ) : (
                  <Link href={href} className={styles.breadcrumbLink}>
                    {title}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
