'use client';

/**
 * @file PersonnelCardGrid.tsx
 * @description 4-column responsive grid container rendering personnel cards with empty-state handling.
 * @module app/admin/team/components/PersonnelCardGrid
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { TeamMemberRosterItem, CrmUserRole } from '@/types/crm';
import { PersonnelCard } from './PersonnelCard';
import styles from './PersonnelCardGrid.module.scss';

interface PersonnelCardGridProps {
  members: TeamMemberRosterItem[];
  currentUserId: string;
  currentUserRole: CrmUserRole;
  onResetFilters: () => void;
  onOpenAvatarModal: (member: TeamMemberRosterItem) => void;
  onOpenPermissionsModal: (member: TeamMemberRosterItem) => void;
  onOpenReassignmentModal: (member: TeamMemberRosterItem) => void;
  onOpenSuspendModal: (member: TeamMemberRosterItem) => void;
  onReactivateUser: (member: TeamMemberRosterItem) => void;
}

export function PersonnelCardGrid({
  members,
  currentUserId,
  currentUserRole,
  onResetFilters,
  onOpenAvatarModal,
  onOpenPermissionsModal,
  onOpenReassignmentModal,
  onOpenSuspendModal,
  onReactivateUser,
}: PersonnelCardGridProps): React.ReactElement {
  if (members.length === 0) {
    return (
      <div className={styles.emptyState}>
        <svg
          className={styles.emptyIcon}
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <h3 className={styles.emptyTitle}>No personnel found</h3>
        <p className={styles.emptyText}>
          No team members matched your active search query or selected category filter.
        </p>
        <button type="button" className={styles.resetButton} onClick={onResetFilters}>
          Reset Search & Filters
        </button>
      </div>
    );
  }

  return (
    <div className={styles.gridContainer}>
      {members.map((member) => (
        <PersonnelCard
          key={member.id}
          member={member}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onOpenAvatarModal={onOpenAvatarModal}
          onOpenPermissionsModal={onOpenPermissionsModal}
          onOpenReassignmentModal={onOpenReassignmentModal}
          onOpenSuspendModal={onOpenSuspendModal}
          onReactivateUser={onReactivateUser}
        />
      ))}
    </div>
  );
}
