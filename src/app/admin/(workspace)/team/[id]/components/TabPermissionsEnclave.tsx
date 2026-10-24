'use client';

/**
 * @file TabPermissionsEnclave.tsx
 * @description Tab permissions enclave presenting the 3 canonical security enclaves:
 *              1. Commercial Pipeline (Command Center, Leads, Deals, Works)
 *              2. Agency Operations (Tasks, User Management, Analytics)
 *              3. System Governance (Website Inquiries, Workspace Settings)
 * @module app/admin/team/[id]/components/TabPermissionsEnclave
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Profile, CrmTabKey } from '@/types/crm';
import { ROLE_DEFAULT_TABS } from '@/types/crm';
import styles from './TabPermissionsEnclave.module.scss';

interface TabPermissionsEnclaveProps {
  profile: Profile;
  canEdit: boolean;
  onOpenPermissionsModal: () => void;
}

interface EnclaveGroup {
  name: string;
  tabs: { key: CrmTabKey; label: string }[];
}

const ENCLAVE_GROUPS: EnclaveGroup[] = [
  {
    name: 'Commercial Pipeline',
    tabs: [
      { key: 'command_center', label: 'Command Center' },
      { key: 'leads', label: 'Inbound Leads' },
      { key: 'deals', label: 'Pipeline Deals' },
      { key: 'works', label: 'Client Works' },
    ],
  },
  {
    name: 'Agency Operations',
    tabs: [
      { key: 'tasks', label: 'Tasks' },
      { key: 'users', label: 'User Management' },
      { key: 'analytics', label: 'Analytics' },
    ],
  },
  {
    name: 'System Governance',
    tabs: [
      { key: 'ingestion', label: 'Website Inquiries' },
      { key: 'settings', label: 'Workspace Settings' },
    ],
  },
];

export function TabPermissionsEnclave({
  profile,
  canEdit,
  onOpenPermissionsModal,
}: TabPermissionsEnclaveProps): React.ReactElement {
  const defaultTabObject = ROLE_DEFAULT_TABS[profile.role] || {};
  const defaultGrantedTabs = Object.entries(defaultTabObject)
    .filter(([, allowed]) => Boolean(allowed))
    .map(([tabKey]) => tabKey);

  const effectiveTabs = new Set<string>(
    Array.isArray(profile.allowed_tabs) && profile.allowed_tabs.length > 0
      ? profile.allowed_tabs
      : defaultGrantedTabs
  );

  return (
    <div className={styles.enclaveCard}>
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h3 className={styles.title}>Workspace Tab Access</h3>
        </div>

        {canEdit && (
          <button
            type="button"
            className={styles.modifyBtn}
            onClick={onOpenPermissionsModal}
            title="Modify tab permissions and role"
          >
            Modify
          </button>
        )}
      </div>

      <div className={styles.enclavesContainer}>
        {ENCLAVE_GROUPS.map((group) => (
          <div key={group.name} className={styles.enclaveBlock}>
            <span className={styles.enclaveTitle}>{group.name}</span>
            <div className={styles.tabsGrid}>
              {group.tabs.map((tab) => {
                const isGranted = effectiveTabs.has(tab.key);
                return (
                  <span
                    key={tab.key}
                    className={`${styles.tabChip} ${isGranted ? styles.granted : styles.denied}`}
                  >
                    <span
                      className={`${styles.dot} ${isGranted ? styles.dotGranted : styles.dotDenied}`}
                    />
                    {tab.label}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
