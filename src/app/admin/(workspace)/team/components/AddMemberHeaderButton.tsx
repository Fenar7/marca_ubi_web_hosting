'use client';

/**
 * @file AddMemberHeaderButton.tsx
 * @description Single primary editorial CTA in the /admin/team masthead.
 *              Dispatches 'open-add-member-drawer' to trigger the global AdminWorkspaceShell
 *              provisioning modal only for active administrators.
 * @module app/admin/(workspace)/team/components/AddMemberHeaderButton
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { CrmUserRole } from '@/types/crm';
import styles from '../team.module.scss';

export interface AddMemberHeaderButtonProps {
  userRole: CrmUserRole;
}

export function AddMemberHeaderButton({
  userRole,
}: AddMemberHeaderButtonProps): React.ReactElement | null {
  if (userRole !== 'admin') {
    return null;
  }

  return (
    <button
      type="button"
      className={styles.primaryActionButton}
      onClick={() => window.dispatchEvent(new CustomEvent('open-add-member-drawer'))}
      aria-label="Add new team member"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      <span>Add Member</span>
    </button>
  );
}
