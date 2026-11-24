'use client';

/**
 * @file PersonnelCard.tsx
 * @description Marca Ubi Editorial Luxury personnel roster card for grid view mode (/admin/team).
 *              Renders square-rounded 48px avatar tile, explicit status label, Helvetica Neue 300
 *              portfolio telemetry, accessible capacity meter, and View Profile link.
 * @module app/admin/team/components/PersonnelCard
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState } from 'react';
import Link from 'next/link';
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
      return 'Admin';
    case 'sales_executive':
      return 'Sales Executive';
    case 'sales_manager':
      return 'Sales Manager';
    case 'viewer':
      return 'Viewer';
    default:
      return role;
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

  const capacityPct = Math.min(
    100,
    Math.round(((member.active_deals_count || 0) / SALES_REP_CAPACITY_LIMIT) * 100)
  );

  const capacityColor =
    capacityPct >= 90
      ? 'var(--admin-status-rose-dot, #ea002a)'
      : capacityPct >= 70
      ? 'var(--admin-status-amber-dot, #d97706)'
      : 'var(--admin-status-emerald-dot, #10b981)';

  const roleClass =
    member.role === 'admin'
      ? styles.roleAdmin
      : member.role === 'sales_executive'
      ? styles.roleSales
      : '';

  return (
    <article
      className={`${styles.card} ${isSuspended ? styles.cardSuspended : ''}`}
      aria-label={`Personnel card for ${member.full_name}`}
    >
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

      <div className={styles.cardHeader}>
        <div className={styles.avatarWrapper}>
          {member.avatar_url && !imageError ? (
            <Image
              src={member.avatar_url}
              alt={member.full_name}
              className={styles.avatarImage}
              width={48}
              height={48}
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className={styles.avatarFallback} aria-hidden="true">
              {getInitials(member.full_name)}
            </div>
          )}

          {canEditAvatar && (
            <button
              type="button"
              className={styles.cameraOverlay}
              onClick={() => onOpenAvatarModal(member)}
              aria-label={`Change profile photo for ${member.full_name}`}
              title="Change profile photo"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
          )}
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
            <span
              className={`${styles.statusBadge} ${
                isSuspended ? styles.statusBadgeSuspended : styles.statusBadgeActive
              }`}
            >
              <span className={styles.statusDot} aria-hidden="true" />
              <span>{isSuspended ? 'Suspended' : 'Active'}</span>
            </span>
          </div>
        </div>
      </div>

      <p className={styles.emailRow} title={member.email}>
        {member.email}
      </p>

      <div className={styles.metricsGrid}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Active Deals</span>
          <span className={styles.metricValue}>{formatNumber(member.active_deals_count || 0)}</span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Pipeline Value</span>
          <span className={styles.metricValue}>{formatRupees(member.total_deal_value || 0)}</span>
        </div>
      </div>

      {member.role === 'sales_executive' && (
        <div className={styles.capacityBar}>
          <div className={styles.capacityHeader}>
            <span>Portfolio load</span>
            <span>{capacityPct}%</span>
          </div>
          <div
            className={styles.progressBarTrack}
            role="progressbar"
            aria-valuenow={capacityPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Portfolio load for ${member.full_name}: ${capacityPct}%`}
          >
            <div
              className={styles.progressBarFill}
              style={{ width: `${capacityPct}%`, backgroundColor: capacityColor }}
            />
          </div>
        </div>
      )}

      <div className={styles.cardFooter}>
        {isAdmin && (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => onOpenPermissionsModal(member)}
          >
            Access
          </button>
        )}
        <Link href={`/admin/team/${member.id}`} className={styles.secondaryButton}>
          View Profile
        </Link>
      </div>
    </article>
  );
}
