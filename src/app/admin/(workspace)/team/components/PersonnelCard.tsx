'use client';

/**
 * @file PersonnelCard.tsx
 * @description PrimeStay-inspired luxury personnel fluid card.
 *              Displays circular photography avatar, online indicator, Raycast monospace role badge,
 *              deal telemetry scorecard, capacity meter, top-right action menu, and symmetrical
 *              dual-button bottom controls.
 * @module app/admin/team/components/PersonnelCard
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState } from 'react';
import Image from 'next/image';
import type { TeamMemberRosterItem, CrmUserRole } from '@/types/crm';
import { SALES_REP_CAPACITY_LIMIT } from '@/app/lib/team-schemas';
import { formatRupees, formatNumber, getInitials } from '@/app/lib/team-utils';
import { PersonnelActionMenu } from './PersonnelActionMenu';
import styles from './PersonnelCard.module.scss';

interface PersonnelCardProps {
  member: TeamMemberRosterItem;
  currentUserId: string;
  currentUserRole: CrmUserRole;
  onOpenAvatarModal: (member: TeamMemberRosterItem) => void;
  onOpenPermissionsModal: (member: TeamMemberRosterItem) => void;
  onOpenReassignmentModal: (member: TeamMemberRosterItem) => void;
  onOpenSuspendModal: (member: TeamMemberRosterItem) => void;
  onReactivateUser: (member: TeamMemberRosterItem) => void;
}

function formatRoleName(role: string): string {
  switch (role) {
    case 'admin':
      return 'ADMIN';
    case 'sales_executive':
      return 'SALES EXEC';
    case 'sales_manager':
      return 'SALES MGR';
    case 'viewer':
      return 'VIEWER';
    default:
      return role.toUpperCase();
  }
}

export function PersonnelCard({
  member,
  currentUserId,
  currentUserRole,
  onOpenAvatarModal,
  onOpenPermissionsModal,
  onOpenReassignmentModal,
  onOpenSuspendModal,
  onReactivateUser,
}: PersonnelCardProps): React.ReactElement {
  const [imageError, setImageError] = useState<boolean>(false);
  const isSelf = member.id === currentUserId;
  const isAdmin = currentUserRole === 'admin';
  const canEditAvatar = isSelf || isAdmin;
  const isSuspended = member.status === 'suspended';

  // Capacity calculations for sales representatives
  const capacityPct = Math.min(
    100,
    Math.round(((member.active_deals_count || 0) / SALES_REP_CAPACITY_LIMIT) * 100)
  );

  const capacityColor =
    capacityPct >= 90 ? '#ef4444' : capacityPct >= 70 ? '#f59e0b' : '#ff6100';

  const roleClass =
    member.role === 'admin'
      ? styles.roleAdmin
      : member.role === 'sales_executive'
      ? styles.roleSales
      : '';

  return (
    <div
      className={`${styles.card} ${isSuspended ? styles.cardSuspended : ''}`}
      tabIndex={0}
      aria-label={`Personnel card for ${member.full_name}`}
    >
      {/* PrimeStay Top-Right Action Menu */}
      <div className={styles.cardTopMenu}>
        <PersonnelActionMenu
          member={member}
          canManageTeam={isAdmin}
          canEditAvatar={canEditAvatar}
          isSelf={isSelf}
          onOpenAvatarModal={() => onOpenAvatarModal(member)}
          onOpenPermissionsModal={() => onOpenPermissionsModal(member)}
          onOpenReassignmentModal={() => onOpenReassignmentModal(member)}
          onOpenSuspendModal={() => onOpenSuspendModal(member)}
          onReactivateUser={() => onReactivateUser(member)}
        />
      </div>

      {/* Card Header: Avatar & Identity */}
      <div className={styles.cardHeader}>
        <div className={styles.avatarWrapper}>
          {member.avatar_url && !imageError ? (
            <Image
              src={member.avatar_url}
              alt={`${member.full_name}'s profile avatar`}
              className={styles.avatarImage}
              width={52}
              height={52}
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className={styles.avatarFallback} aria-hidden="true">
              {getInitials(member.full_name)}
            </div>
          )}

          {/* Hover Camera Overlay for Avatar Upload */}
          {canEditAvatar && (
            <button
              type="button"
              className={styles.cameraOverlay}
              onClick={() => onOpenAvatarModal(member)}
              aria-label={`Change profile photo for ${member.full_name}`}
              title="Change profile photo"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
          )}

          {/* Online / Active Status Pip */}
          <span
            className={`${styles.statusIndicator} ${
              isSuspended ? styles.statusSuspended : styles.statusActive
            }`}
            title={isSuspended ? 'Account Suspended' : 'Active Account'}
            aria-hidden="true"
          />
        </div>

        <div className={styles.identityInfo}>
          <div className={styles.nameRow}>
            <h4 className={styles.memberName} title={member.full_name}>
              {member.full_name}
            </h4>
            {isSelf && <span className={styles.youBadge}>You</span>}
          </div>

          <span className={styles.jobTitle} title={member.job_title || 'Commercial Personnel'}>
            {member.job_title || 'Commercial Personnel'}
          </span>

          <div className={styles.badgesRow}>
            <span className={`${styles.roleBadge} ${roleClass}`}>
              {formatRoleName(member.role)}
            </span>
          </div>
        </div>
      </div>

      {/* Email Identification Row */}
      <div className={styles.emailRow}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        <span className={styles.emailText} title={member.email}>
          {member.email}
        </span>
      </div>

      {/* Telemetry Metrics Scorecard (Canonical en-IN currency and numbers) */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Active Deals</span>
          <span className={styles.metricValue}>
            {formatNumber(member.active_deals_count ?? 0)}
          </span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Portfolio</span>
          <span className={styles.metricValue}>
            {formatRupees(member.total_deal_value ?? 0)}
          </span>
        </div>
      </div>

      {/* Linear Fluid Capacity Progress Bar (for Sales Executives) */}
      {member.role === 'sales_executive' && (
        <div className={styles.capacityBar}>
          <div className={styles.capacityHeader}>
            <span>Workload Capacity</span>
            <span>
              {formatNumber(member.active_deals_count ?? 0)}/{SALES_REP_CAPACITY_LIMIT} ({capacityPct}%)
            </span>
          </div>
          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${capacityPct}%`, backgroundColor: capacityColor }}
            />
          </div>
        </div>
      )}

      {/* PrimeStay Symmetrical Dual-Button Footer (50% / 50% Grid) */}
      <div className={styles.cardFooter}>
        {isAdmin && member.role === 'sales_executive' ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => onOpenReassignmentModal(member)}
          >
            Reassign Deals
          </button>
        ) : isAdmin ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => onOpenPermissionsModal(member)}
          >
            Manage Access
          </button>
        ) : (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => onOpenAvatarModal(member)}
            disabled={!canEditAvatar}
          >
            {member.avatar_url ? 'Change Photo' : 'Set Photo'}
          </button>
        )}

        {isAdmin && member.role !== 'sales_executive' && canEditAvatar ? (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => onOpenAvatarModal(member)}
            title="Update user profile photograph"
          >
            {member.avatar_url ? 'Change Photo' : 'Set Photo'}
          </button>
        ) : (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => onOpenPermissionsModal(member)}
            title="View full personnel dossier"
          >
            View Profile
          </button>
        )}
      </div>
    </div>
  );
}
