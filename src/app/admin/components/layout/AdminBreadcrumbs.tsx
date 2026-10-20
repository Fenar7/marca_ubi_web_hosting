'use client';

/**
 * @file AdminBreadcrumbs.tsx
 * @description Dynamic breadcrumb engine resolving Next.js App Router pathnames into
 *              hierarchical agency navigation markers with real-time dynamic label overrides.
 * @architecture Extracts URL segments via `usePathname()`, correlates segments against
 *               commercial route mappings, intercepts dynamic UUID parameters, and subscribes to
 *               custom window events for client-level label overrides (e.g. 'LD-10343' or 'DEAL-1004').
 *               Guarantees that raw 36-character database UUIDs are never exposed in the user-facing DOM.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminBreadcrumbs.module.scss';

/**
 * Standard RFC 4122 UUID regex pattern for dynamic route parameter interception.
 * Exported for rigorous unit testing across dynamic route matrix cases.
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * High-value domain dictionary mapping URL path slugs to professional CRM titles.
 */
const ROUTE_NAME_MAP: Record<string, string> = {
  admin: 'Executive Overview',
  leads: 'Inbound Leads',
  deals: 'Pipeline Deals',
  works: 'Client Works',
  tasks: 'Follow-up Tasks',
  team: 'User Management',
  analytics: 'Executive Analytics',
  ingestion: 'Website Inquiries',
  settings: 'Security & Settings',
};

/**
 * Event detail contract for dynamic breadcrumb label overrides dispatched by client workspaces.
 */
export interface AdminBreadcrumbLabelUpdateDetail {
  path: string;
  label: string;
}

export function AdminBreadcrumbs(): React.ReactElement {
  const pathname = usePathname() || '/admin';
  const segments = pathname.split('/').filter(Boolean);

  // Client-side state storing dynamic lead/deal identifier overrides keyed by route pathname
  const [dynamicLabels, setDynamicLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    function handleLabelUpdate(event: Event) {
      const customEvent = event as CustomEvent<AdminBreadcrumbLabelUpdateDetail>;
      if (
        customEvent.detail &&
        typeof customEvent.detail.path === 'string' &&
        typeof customEvent.detail.label === 'string'
      ) {
        const cleanPath = customEvent.detail.path.replace(/\/+$/, '') || '/';
        setDynamicLabels((prev) => ({
          ...prev,
          [cleanPath]: customEvent.detail.label,
        }));
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('admin-breadcrumb-label-update', handleLabelUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('admin-breadcrumb-label-update', handleLabelUpdate);
      }
    };
  }, []);

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

          // Prevent rendering redundant 'admin' segment when deeper inside sub-routes
          if (segment === 'admin' && segments.length > 1) {
            return null;
          }

          const isUuid = UUID_REGEX.test(segment);
          const cleanHref = href.replace(/\/+$/, '');
          const cleanPathname = pathname.replace(/\/+$/, '');
          const dynamicOverride =
            dynamicLabels[cleanHref] ||
            dynamicLabels[cleanPathname] ||
            dynamicLabels[href] ||
            dynamicLabels[pathname];

          let segmentNode: React.ReactNode;
          if (isUuid) {
            if (dynamicOverride) {
              segmentNode = <span className={styles.monoSegmentChip}>{dynamicOverride}</span>;
            } else {
              // Graceful human-readable fallback masking raw database primary key
              segmentNode = 'Client Dossier';
            }
          } else {
            segmentNode = ROUTE_NAME_MAP[segment] || segment.replace(/-/g, ' ');
          }

          return (
            <React.Fragment key={href}>
              <li className={styles.separator} aria-hidden="true">
                /
              </li>
              <li className={styles.breadcrumbItem}>
                {isLast ? (
                  <span className={styles.currentSegment} aria-current="page">
                    {segmentNode}
                  </span>
                ) : (
                  <Link href={href} className={styles.breadcrumbLink}>
                    {segmentNode}
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
