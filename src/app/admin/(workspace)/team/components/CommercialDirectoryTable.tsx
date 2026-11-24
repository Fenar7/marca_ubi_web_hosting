'use client';

/**
 * @file CommercialDirectoryTable.tsx
 * @description High-density 6-column Editorial Luxury personnel table with responsive
 *              mobile stack cards (< 900px), keyboard row traversal (J/K/Enter),
 *              merged Role & Title presentation, and single unified action triggers.
 * @module app/admin/team/components/CommercialDirectoryTable
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { TeamMemberRosterItem, CrmUserRole, CrmTabKey } from '@/types/crm';
import { ROLE_DEFAULT_TABS } from '@/types/crm';
import { formatDealValuation, formatNumber, getInitials } from '@/app/lib/team-utils';
import { PersonnelActionMenu } from './PersonnelActionMenu';
import styles from '../team.module.scss';

interface CommercialDirectoryTableProps {
  initialRoster: TeamMemberRosterItem[];
  currentUserRole: CrmUserRole;
  currentUserId: string;
  canViewFinancials?: boolean;
  onInspectMember?: (member: TeamMemberRosterItem) => void;
  onOpenAvatarModal?: (member: TeamMemberRosterItem) => void;
  onOpenPermissionsModal?: (member: TeamMemberRosterItem) => void;
  onOpenRoleModal?: (member: TeamMemberRosterItem) => void;
  onOpenReassignmentModal?: (member: TeamMemberRosterItem) => void;
  onOpenSuspendModal?: (member: TeamMemberRosterItem) => void;
  onReactivateUser?: (member: TeamMemberRosterItem) => void;
  onResetFilters?: () => void;
}

function getRoleLabel(role: CrmUserRole): string {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'sales_manager':
      return 'Sales Manager';
    case 'sales_executive':
      return 'Sales Executive';
    case 'viewer':
      return 'Viewer';
    default:
      return String(role);
  }
}

function getMemberTabCount(member: TeamMemberRosterItem): number {
  if (Array.isArray(member.allowed_tabs) && member.allowed_tabs.length > 0) {
    return member.allowed_tabs.length;
  }
  const defaults = ROLE_DEFAULT_TABS[member.role];
  if (!defaults) return 0;
  return (Object.keys(defaults) as CrmTabKey[]).filter((k) => defaults[k]).length;
}

export function CommercialDirectoryTable({
  initialRoster,
  currentUserRole,
  currentUserId,
  canViewFinancials = true,
  onInspectMember,
  onOpenAvatarModal,
  onOpenPermissionsModal,
  onOpenRoleModal,
  onOpenReassignmentModal,
  onOpenSuspendModal,
  onReactivateUser,
  onResetFilters,
}: CommercialDirectoryTableProps): React.ReactElement {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);
  const isAdmin = currentUserRole === 'admin';

  // Keyboard traversal across table rows (J / K / Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
        return;
      }
      if (initialRoster.length === 0) return;

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        const next = Math.min(initialRoster.length - 1, focusedIndex + 1);
        setFocusedIndex(next);
        rowRefs.current[next]?.focus();
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        const prev = Math.max(0, focusedIndex - 1);
        setFocusedIndex(prev);
        rowRefs.current[prev]?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [initialRoster.length, focusedIndex]);

  if (initialRoster.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyStateTitle}>No matching team members</p>
        <p className={styles.emptyStateText}>
          No commercial personnel matched the active search query or filter selection.
        </p>
        {onResetFilters && (
          <button
            type="button"
            className={styles.rowActionButton}
            onClick={onResetFilters}
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.directoryBody}>
      {/* Desktop High-Density 6-Column Roster Table */}
      <div className={styles.tableDesktopWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Member</th>
              <th className={styles.th}>Role &amp; Title</th>
              <th className={styles.th}>Access</th>
              <th className={styles.th}>Assigned Portfolio</th>
              <th className={styles.th}>Status</th>
              <th className={styles.thRight}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialRoster.map((member, idx) => {
              const isSelf = member.id === currentUserId;
              const isSuspended = member.status === 'suspended';
              const tabCount = getMemberTabCount(member);
              const roleBadgeClass =
                member.role === 'admin'
                  ? styles.roleAdmin
                  : member.role === 'sales_manager'
                  ? styles.roleSalesManager
                  : member.role === 'sales_executive'
                  ? styles.roleSalesExecutive
                  : styles.roleViewer;

              return (
                <tr
                  key={member.id}
                  ref={(el) => {
                    rowRefs.current[idx] = el;
                  }}
                  tabIndex={0}
                  className={`${styles.tr} ${onInspectMember ? styles.trInteractive : ''}`}
                  onClick={() => onInspectMember?.(member)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target === e.currentTarget) {
                      e.preventDefault();
                      onInspectMember?.(member);
                    }
                  }}
                  aria-label={`${member.full_name}, ${getRoleLabel(member.role)}`}
                >
                  {/* 1. Member Identity */}
                  <td className={styles.td}>
                    <div className={styles.identityCell}>
                      <div className={styles.avatar}>
                        {member.avatar_url ? (
                          <Image
                            src={member.avatar_url}
                            alt={member.full_name}
                            width={40}
                            height={40}
                            className={styles.avatarImg}
                            unoptimized
                          />
                        ) : (
                          <span>{getInitials(member.full_name)}</span>
                        )}
                      </div>
                      <div className={styles.identityInfo}>
                        <div className={styles.nameLine}>
                          <Link
                            href={`/admin/team/${member.id}`}
                            className={styles.profileLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {member.full_name}
                          </Link>
                          {isSelf && <span className={styles.youTag}>You</span>}
                        </div>
                        <span className={styles.emailSubtext}>
                          <a
                            href={`mailto:${member.email}`}
                            className={styles.contactLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {member.email}
                          </a>
                          {member.phone && (
                            <>
                              {' · '}
                              <a
                                href={`tel:${member.phone}`}
                                className={styles.contactLink}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {member.phone}
                              </a>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 2. Role & Job Title (Merged Primary + Secondary) */}
                  <td className={styles.td}>
                    <div className={styles.roleTitleStack}>
                      <span className={`${styles.roleBadge} ${roleBadgeClass}`}>
                        {getRoleLabel(member.role)}
                      </span>
                      <span className={styles.jobTitleSub}>
                        {member.job_title || 'Commercial Personnel'}
                      </span>
                    </div>
                  </td>

                  {/* 3. Workspace Access Scope */}
                  <td className={styles.td}>
                    {isAdmin && onOpenPermissionsModal ? (
                      <button
                        type="button"
                        className={styles.accessInlineBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPermissionsModal(member);
                        }}
                        aria-label={`Configure tab permissions for ${member.full_name}: ${tabCount} of 9 tabs`}
                      >
                        <span className={styles.accessNumeral}>{tabCount} / 9</span>
                        <span className={styles.accessUnit}>tabs</span>
                      </button>
                    ) : (
                      <span className={styles.accessStatic}>
                        <span className={styles.accessNumeral}>{tabCount} / 9</span> tabs
                      </span>
                    )}
                  </td>

                  {/* 4. Assigned Portfolio */}
                  <td className={styles.td}>
                    {member.active_deals_count > 0 ? (
                      <Link
                        href={`/admin/leads?assigned_to=${member.id}`}
                        className={styles.portfolioLink}
                        onClick={(e) => e.stopPropagation()}
                        title={`Inspect ${member.active_deals_count} active deals for ${member.full_name}`}
                      >
                        <span className={styles.portfolioDeals}>
                          {formatNumber(member.active_deals_count)} deals
                        </span>
                        {canViewFinancials && member.total_deal_value > 0 && (
                          <span className={styles.portfolioValue}>
                            {formatDealValuation(member.total_deal_value)}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <span className={styles.portfolioZero}>0 deals</span>
                    )}
                  </td>

                  {/* 5. Account Status */}
                  <td className={styles.td}>
                    <span
                      className={`${styles.statusIndicator} ${
                        isSuspended ? styles.statusSuspended : styles.statusActive
                      }`}
                    >
                      <span className={styles.statusDot} aria-hidden="true" />
                      <span>{isSuspended ? 'Suspended' : 'Active'}</span>
                    </span>
                  </td>

                  {/* 6. Contextual Actions */}
                  <td className={styles.tdRight} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.actionButtonGroup}>
                      {isAdmin && onInspectMember ? (
                        <button
                          type="button"
                          className={styles.rowActionButton}
                          onClick={() => onInspectMember(member)}
                          aria-label={`Manage ${member.full_name}`}
                        >
                          Manage
                        </button>
                      ) : (
                        <Link href={`/admin/team/${member.id}`} className={styles.rowActionButton}>
                          Profile
                        </Link>
                      )}

                      <PersonnelActionMenu
                        member={member}
                        canManageTeam={isAdmin}
                        canEditAvatar={isAdmin || isSelf}
                        isSelf={isSelf}
                        onInspectMember={onInspectMember ? () => onInspectMember(member) : undefined}
                        onOpenAvatarModal={() => onOpenAvatarModal?.(member)}
                        onOpenPermissionsModal={() => onOpenPermissionsModal?.(member)}
                        onOpenRoleModal={onOpenRoleModal ? () => onOpenRoleModal(member) : undefined}
                        onOpenReassignmentModal={() => onOpenReassignmentModal?.(member)}
                        onOpenSuspendModal={() => onOpenSuspendModal?.(member)}
                        onReactivateUser={() => onReactivateUser?.(member)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Responsive Mobile Stack Cards (< 900px, Zero Horizontal Scroll) */}
      <div className={styles.mobileRosterList} aria-label="Team members mobile list">
        {initialRoster.map((member) => {
          const isSelf = member.id === currentUserId;
          const isSuspended = member.status === 'suspended';
          const tabCount = getMemberTabCount(member);
          const roleBadgeClass =
            member.role === 'admin'
              ? styles.roleAdmin
              : member.role === 'sales_manager'
              ? styles.roleSalesManager
              : member.role === 'sales_executive'
              ? styles.roleSalesExecutive
              : styles.roleViewer;

          return (
            <article key={member.id} className={styles.mobileMemberCard}>
              <div className={styles.mobileCardTop}>
                <div className={styles.identityCell}>
                  <div className={styles.avatar}>
                    {member.avatar_url ? (
                      <Image
                        src={member.avatar_url}
                        alt={member.full_name}
                        width={40}
                        height={40}
                        className={styles.avatarImg}
                        unoptimized
                      />
                    ) : (
                      <span>{getInitials(member.full_name)}</span>
                    )}
                  </div>
                  <div className={styles.identityInfo}>
                    <div className={styles.nameLine}>
                      <Link href={`/admin/team/${member.id}`} className={styles.profileLink}>
                        {member.full_name}
                      </Link>
                      {isSelf && <span className={styles.youTag}>You</span>}
                    </div>
                    <span className={styles.jobTitleSub}>
                      {member.job_title || 'Commercial Personnel'}
                    </span>
                    <span className={styles.emailSubtext}>{member.email}</span>
                  </div>
                </div>

                <span
                  className={`${styles.statusIndicator} ${
                    isSuspended ? styles.statusSuspended : styles.statusActive
                  }`}
                >
                  <span className={styles.statusDot} aria-hidden="true" />
                  <span>{isSuspended ? 'Suspended' : 'Active'}</span>
                </span>
              </div>

              <div className={styles.mobileCardMetaRow}>
                <span className={`${styles.roleBadge} ${roleBadgeClass}`}>
                  {getRoleLabel(member.role)}
                </span>
                <span className={styles.mobileMetaDivider}>·</span>
                <span className={styles.mobileMetaStat}>{tabCount}/9 tabs</span>
                <span className={styles.mobileMetaDivider}>·</span>
                <span className={styles.mobileMetaStat}>
                  {formatNumber(member.active_deals_count)} deals
                  {canViewFinancials && member.total_deal_value > 0
                    ? ` (${formatDealValuation(member.total_deal_value)})`
                    : ''}
                </span>
              </div>

              <div className={styles.mobileCardActions}>
                {isAdmin && onInspectMember ? (
                  <button
                    type="button"
                    className={styles.mobilePrimaryBtn}
                    onClick={() => onInspectMember(member)}
                  >
                    Manage access
                  </button>
                ) : (
                  <Link href={`/admin/team/${member.id}`} className={styles.mobilePrimaryBtn}>
                    View profile
                  </Link>
                )}

                <PersonnelActionMenu
                  member={member}
                  canManageTeam={isAdmin}
                  canEditAvatar={isAdmin || isSelf}
                  isSelf={isSelf}
                  onInspectMember={onInspectMember ? () => onInspectMember(member) : undefined}
                  onOpenAvatarModal={() => onOpenAvatarModal?.(member)}
                  onOpenPermissionsModal={() => onOpenPermissionsModal?.(member)}
                  onOpenRoleModal={onOpenRoleModal ? () => onOpenRoleModal(member) : undefined}
                  onOpenReassignmentModal={() => onOpenReassignmentModal?.(member)}
                  onOpenSuspendModal={() => onOpenSuspendModal?.(member)}
                  onReactivateUser={() => onReactivateUser?.(member)}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
