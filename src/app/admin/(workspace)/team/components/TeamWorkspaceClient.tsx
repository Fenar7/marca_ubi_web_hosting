'use client';

/**
 * @file TeamWorkspaceClient.tsx
 * @description Interactive Client orchestration wrapper for the Commercial Team Management workspace.
 *              Coordinates state between the Commercial Directory Table, Add Team Member Drawer,
 *              and the One-Time Credential Reveal Modal.
 * @module app/admin/team/components/TeamWorkspaceClient
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { TeamMemberRosterItem, CrmUserRole } from '@/types/crm';
import { CommercialDirectoryTable } from './CommercialDirectoryTable';
import styles from '../team.module.scss';

interface TeamWorkspaceClientProps {
  initialRoster: TeamMemberRosterItem[];
  currentUserRole: CrmUserRole;
  currentUserId: string;
}

export function TeamWorkspaceClient({
  initialRoster,
  currentUserRole,
  currentUserId,
}: TeamWorkspaceClientProps): React.ReactElement {
  const isAdmin = currentUserRole === 'admin';

  return (
    <>
      {/* Action Bar / Trigger */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        {isAdmin ? (
          <button
            type="button"
            className={styles.primaryActionButton}
            onClick={() => window.dispatchEvent(new CustomEvent('open-add-member-drawer'))}
            aria-label="Open add team member drawer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Team Member</span>
          </button>
        ) : (
          <div
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.78rem',
              color: '#888888',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Provisioning Restricted to Administrators</span>
          </div>
        )}
      </div>

      {/* Commercial Directory Table */}
      <CommercialDirectoryTable
        initialRoster={initialRoster}
        currentUserRole={currentUserRole}
        currentUserId={currentUserId}
      />
    </>
  );
}
