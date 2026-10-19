/**
 * @file navigationConfig.tsx
 * @description Canonical Navigation Architecture & RBAC Authorization Mapping for Marca Ubi CRM.
 * @architecture Defines the unified 9-tab navigation taxonomy organized into 3 logical enclaves:
 *               Commercial Pipeline, Agency Operations, and System Governance.
 *               Enforces granular tab-level authorization gating based on authenticated user allowed_tabs
 *               and provides calibrated SVG icons adhering to the Marca Ubi Dark Luxury tokens.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { CrmTabKey } from '@/types/crm';
import { ROLE_DEFAULT_TABS } from '@/types/crm';
import type { CurrentUserSession } from './UserProfileDropdown';

export interface NavigationItem {
  key: CrmTabKey;
  label: string;
  href: string;
  icon: (props: { active: boolean }) => React.ReactNode;
  getBadge?: (counts?: { dueTasksCount?: number }) => { text: string; variant: 'orange' | 'emerald' | 'amber' } | null;
}

export interface NavigationGroup {
  groupTitle: string;
  items: NavigationItem[];
}

/**
 * Evaluates whether an authenticated user is authorized to access a canonical workspace tab.
 * 
 * Evaluation Hierarchy:
 * 1. Explicit Profile Array: Evaluates containment within user's persisted allowed_tabs.
 * 2. Role Default Fallback: Reverts to static role baseline if allowed_tabs is unpopulated.
 * 3. Default Sandbox: Returns false if no matching permissions exist.
 */
export function isTabAuthorized(tabKey: CrmTabKey, user: CurrentUserSession | null | undefined): boolean {
  if (!user) {
    return false;
  }

  if (Array.isArray(user.allowed_tabs)) {
    return user.allowed_tabs.includes(tabKey);
  }

  const roleDefaults = user.role ? ROLE_DEFAULT_TABS[user.role] : undefined;
  if (roleDefaults) {
    return Boolean(roleDefaults[tabKey]);
  }

  return false;
}

/**
 * Canonical Navigation Groups structured by operational workflow.
 */
export const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    groupTitle: 'Commercial Pipeline',
    items: [
      {
        key: 'command_center',
        label: 'Executive Overview',
        href: '/admin',
        icon: ({ active }) => (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={active ? '2.2' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        ),
      },
      {
        key: 'leads',
        label: 'Inbound Leads',
        href: '/admin/leads',
        icon: ({ active }) => (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={active ? '2.2' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
          </svg>
        ),
      },
      {
        key: 'deals',
        label: 'Pipeline Deals',
        href: '/admin/deals',
        icon: ({ active }) => (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={active ? '2.2' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        ),
      },
      {
        key: 'works',
        label: 'Client Works',
        href: '/admin/works',
        icon: ({ active }) => (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={active ? '2.2' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="2" />
          </svg>
        ),
      },
      {
        key: 'tasks',
        label: 'Follow-up Tasks',
        href: '/admin/tasks',
        getBadge: (counts) => {
          if (counts?.dueTasksCount && counts.dueTasksCount > 0) {
            return {
              text: `${counts.dueTasksCount} Due`,
              variant: 'orange',
            };
          }
          return null;
        },
        icon: ({ active }) => (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={active ? '2.2' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
      },
    ],
  },
  {
    groupTitle: 'Agency Operations',
    items: [
      {
        key: 'users',
        label: 'User Management',
        href: '/admin/team',
        icon: ({ active }) => (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={active ? '2.2' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
      {
        key: 'analytics',
        label: 'Executive Analytics',
        href: '/admin/analytics',
        icon: ({ active }) => (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={active ? '2.2' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        ),
      },
      {
        key: 'ingestion',
        label: 'Website Inquiries',
        href: '/admin/ingestion',
        icon: ({ active }) => (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={active ? '2.2' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
        ),
      },
    ],
  },
  {
    groupTitle: 'System & Governance',
    items: [
      {
        key: 'settings',
        label: 'Security & Settings',
        href: '/admin/settings',
        icon: ({ active }) => (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={active ? '2.2' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ),
      },
    ],
  },
];
