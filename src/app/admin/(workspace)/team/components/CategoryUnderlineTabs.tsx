'use client';

/**
 * @file CategoryUnderlineTabs.tsx
 * @description PrimeStay-inspired luxury category underline tabs for personnel roster segmentation.
 *              Enforces accessible ARIA tablist semantics and real-time live count displays.
 * @module app/admin/team/components/CategoryUnderlineTabs
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import styles from './CategoryUnderlineTabs.module.scss';

export type TeamTabCategory = 'all' | 'leadership' | 'sales' | 'suspended';

export interface TabCounts {
  all: number;
  leadership: number;
  sales: number;
  suspended: number;
}

interface CategoryUnderlineTabsProps {
  activeTab: TeamTabCategory;
  onTabChange: (tab: TeamTabCategory) => void;
  counts: TabCounts;
}

interface TabDefinition {
  key: TeamTabCategory;
  label: string;
}

const TAB_DEFINITIONS: TabDefinition[] = [
  { key: 'all', label: 'All Personnel' },
  { key: 'leadership', label: 'Leadership & Admins' },
  { key: 'sales', label: 'Sales Executives' },
  { key: 'suspended', label: 'Suspended / Inactive' },
];

export function CategoryUnderlineTabs({
  activeTab,
  onTabChange,
  counts,
}: CategoryUnderlineTabsProps): React.ReactElement {
  return (
    <nav className={styles.tabsContainer} role="tablist" aria-label="Personnel Directory Segmentation">
      {TAB_DEFINITIONS.map(({ key, label }) => {
        const isActive = activeTab === key;
        const count = counts[key] ?? 0;

        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
            onClick={() => onTabChange(key)}
          >
            <span>{label}</span>
            <span className={styles.counterBadge} aria-label={`${count} members`}>
              {count}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
