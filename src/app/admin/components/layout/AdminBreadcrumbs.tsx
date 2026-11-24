'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminBreadcrumbs.module.scss';

/**
 * Standard RFC 4122 UUID regex pattern for dynamic route parameter interception.
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Commercial lead/deal identifier format regex (e.g., LD-10492, DEAL-1004).
 */
export const LEAD_CODE_REGEX = /^(LD|DEAL)-\d+$/i;

const ROUTE_NAME_MAP: Record<string, string> = {
  admin: 'Overview',
  leads: 'Inbound Leads',
  deals: 'Pipeline Deals',
  works: 'Client Works',
  tasks: 'Follow-up Tasks',
  team: 'User Management',
  users: 'User Management',
  'user-management': 'User Management',
  analytics: 'Executive Analytics',
  ingestion: 'Website Inquiries',
  settings: 'Workspace Settings',
};

/**
 * Event detail contract for dynamic breadcrumb label overrides dispatched by client workspaces.
 */
export interface AdminBreadcrumbLabelUpdateDetail {
  path: string;
  label: string;
}

interface CrumbItem {
  id: string;
  label: React.ReactNode;
  href?: string;
  isLeaf: boolean;
}

/** Keep detail context navigable and substitute readable labels for record IDs. */
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

  const items: CrumbItem[] = [];

  if (segments.length <= 1) {
    items.push({ id: '/admin', label: 'Overview', isLeaf: true });
  } else {
    // Multi-Level Sub-Routes (e.g. /admin/leads/[uuid] or /admin/settings/sub)
    // Non-root segments starting after 'admin'
    const routeSegments = segments[0] === 'admin' ? segments.slice(1) : segments;
    let accumulatedPath = '/admin';

    routeSegments.forEach((segment, idx) => {
      accumulatedPath += `/${segment}`;
      const isLeaf = idx === routeSegments.length - 1;
      const cleanAccumulatedPath = accumulatedPath.replace(/\/+$/, '');
      const cleanCurrentPath = pathname.replace(/\/+$/, '');

      // Dynamic label lookup: checks accumulated route, full pathname, or segment code
      const dynamicOverride =
        dynamicLabels[cleanAccumulatedPath] ||
        dynamicLabels[accumulatedPath] ||
        (isLeaf ? dynamicLabels[cleanCurrentPath] || dynamicLabels[pathname] || dynamicLabels[segment] : undefined);

      const isUuid = UUID_REGEX.test(segment);
      const isLeadCode = LEAD_CODE_REGEX.test(segment);
      const prevSegment = idx > 0 ? routeSegments[idx - 1] : '';

      let segmentNode: React.ReactNode;
      if (dynamicOverride) {
        segmentNode = <span className={styles.monoSegmentChip}>{dynamicOverride}</span>;
      } else if (isUuid) {
        segmentNode = prevSegment === 'ingestion' ? 'Inquiry details' :
          ['team', 'users', 'user-management'].includes(prevSegment) ? 'Personnel Dossier' :
          prevSegment === 'works' ? 'Project details' : 'Client Dossier';
      } else if (isLeadCode) {
        segmentNode = <span className={styles.monoSegmentChip}>{segment.toUpperCase()}</span>;
      } else {
        segmentNode = ROUTE_NAME_MAP[segment] || segment.replace(/-/g, ' ');
      }

      items.push({
        id: `segment-${accumulatedPath}`,
        label: segmentNode,
        href: isLeaf ? undefined : accumulatedPath,
        isLeaf,
      });
    });
  }

  return (
    <nav aria-label="Breadcrumb Navigation" className={styles.breadcrumbNav}>
      <ol className={styles.breadcrumbList}>
        {items.map((item, index) => (
          <li key={item.id} className={styles.breadcrumbItem} data-parent={!item.isLeaf || undefined}>
            {index > 0 && (
              <svg className={styles.separator} width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="m4 2.5 3.5 3.5L4 9.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {item.href ? (
              <Link href={item.href} className={styles.breadcrumbLink}>{item.label}</Link>
            ) : (
              <span className={styles.currentSegment} aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
