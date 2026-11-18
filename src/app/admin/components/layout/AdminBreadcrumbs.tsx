'use client';

/**
 * @file AdminBreadcrumbs.tsx
 * @description Route-aware context trail with dynamic CRM record labels.
 * @architecture Resolves Next.js App Router paths into a structured 3-tier hierarchy:
 *               [🔥] Marca Ubi / Section / Leaf Node.
 *               The trail provides page context while the sidebar remains the primary navigation.
 *               Supports dynamic client-side label overrides (e.g. 'LD-10492' or 'DEAL-1004') dispatched via
 *               `admin-breadcrumb-label-update` window events.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MarcaUbiLogo } from '@/app/components/ui/MarcaUbiLogo/MarcaUbiLogo';
import styles from './AdminBreadcrumbs.module.scss';

/**
 * Standard RFC 4122 UUID regex pattern for dynamic route parameter interception.
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Commercial lead/deal identifier format regex (e.g., LD-10492, DEAL-1004).
 */
export const LEAD_CODE_REGEX = /^(LD|DEAL)-\d+$/i;

/**
 * Domain dictionary mapping primary route slugs to their high-level organizational sections.
 */
const SECTION_MAP: Record<string, string> = {
  admin: 'Commercial Desk',
  leads: 'Commercial',
  deals: 'Commercial',
  works: 'Delivery',
  ingestion: 'Intelligence',
  team: 'Administration',
  users: 'Administration',
  'user-management': 'Administration',
  analytics: 'Intelligence',
  tasks: 'Operations',
  settings: 'Settings',
};

/**
 * High-value domain dictionary mapping URL path slugs to professional CRM titles.
 */
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
  hasRadarDot?: boolean;
  isRoot?: boolean;
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

  const isRootAdmin = segments.length <= 1 && (segments[0] === 'admin' || !segments[0]);

  // Construct structured 3-tier hierarchy items
  const items: CrumbItem[] = [];

  // Tier 1: Root Workspace Monogram + Title (Always links to /admin)
  items.push({
    id: 'root-marca-ubi',
    label: 'Marca Ubi',
    href: '/admin',
    isLeaf: false,
    isRoot: true,
  });

  if (isRootAdmin) {
    // Tier 2: Executive OS Section
    items.push({
      id: 'root-section',
      label: 'Commercial Desk',
      href: '/admin',
      isLeaf: false,
    });

    // The current route is the final breadcrumb; no live system state is implied.
    items.push({
      id: 'root-leaf',
      label: 'Overview',
      isLeaf: true,
      hasRadarDot: false,
    });
  } else if (segments.length === 2 && segments[0] === 'admin') {
    // 1-Level Sub-Route (e.g. /admin/leads)
    const featureSlug = segments[1];
    const sectionTitle = SECTION_MAP[featureSlug] || 'Commercial CRM';
    const leafTitle = ROUTE_NAME_MAP[featureSlug] || featureSlug.replace(/-/g, ' ');

    // Tier 2: Organizational Section
    items.push({
      id: `section-${featureSlug}`,
      label: sectionTitle,
      href: `/admin/${featureSlug}`,
      isLeaf: false,
    });

    // Tier 3: Page Leaf Node
    items.push({
      id: `leaf-${featureSlug}`,
      label: leafTitle,
      isLeaf: true,
    });
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
        segmentNode = (prevSegment === 'team' || prevSegment === 'users') ? 'Personnel Dossier' : 'Client Dossier';
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
        {items.map((item, index) => {
          const isFirst = index === 0;

          return (
            <React.Fragment key={item.id}>
              {!isFirst && (
                <li className={styles.separator} aria-hidden="true">
                  /
                </li>
              )}
              <li className={styles.breadcrumbItem}>
                {item.isLeaf ? (
                  <span className={styles.currentSegment} aria-current="page">
                    {item.hasRadarDot && <span className={styles.radarDot} aria-hidden="true" />}
                    <span>{item.label}</span>
                  </span>
                ) : item.isRoot ? (
                  <Link href={item.href || '/admin'} className={styles.rootLink} title="Marca Ubi CRM Executive Overview">
                    <span className={styles.rootMonogram} aria-hidden="true">
                      <MarcaUbiLogo variant="monogram" width={14} height={12} color="#ffffff" accentColor="#ea002a" />
                    </span>
                    <span className={styles.rootText}>{item.label}</span>
                  </Link>
                ) : (
                  <Link href={item.href || '/admin'} className={styles.breadcrumbLink}>
                    {item.label}
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
