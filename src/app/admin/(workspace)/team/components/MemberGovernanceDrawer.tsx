'use client';

/**
 * @file MemberGovernanceDrawer.tsx
 * @description In-context 480px slide-over Governance Drawer for /admin/team.
 *              Enables administrators to inspect portfolio capacity, switch roles,
 *              toggle 3-enclave workspace tabs, and launch offboarding/reassignment flows
 *              without leaving the active roster context.
 * @module app/admin/team/components/MemberGovernanceDrawer
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useRef, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { TeamMemberRosterItem, CrmUserRole, CrmTabKey } from '@/types/crm';
import { ROLE_DEFAULT_TABS } from '@/types/crm';
import { PERMISSION_ENCLAVES } from '@/app/lib/team-permissions-config';
import { updateTeamUserRole, updateUserPermissions } from '@/app/actions/team';
import { formatDealValuation, formatNumber, getInitials } from '@/app/lib/team-utils';
import styles from './MemberGovernanceDrawer.module.scss';

export interface MemberGovernanceDrawerProps {
  member: TeamMemberRosterItem | null;
  currentUserId: string;
  canManageTeam: boolean;
  canViewFinancials: boolean;
  suppressEscape?: boolean;
  onClose: () => void;
  onRoleUpdated: (userId: string, newRole: CrmUserRole) => void;
  onPermissionsUpdated: (userId: string, newTabs: string[]) => void;
  onOpenAvatarModal: (member: TeamMemberRosterItem) => void;
  onOpenReassignmentModal: (member: TeamMemberRosterItem) => void;
  onOpenSuspendModal: (member: TeamMemberRosterItem) => void;
  onReactivateUser: (member: TeamMemberRosterItem) => void;
}

const ROLE_SCOPE_HINT: Record<CrmUserRole, string> = {
  admin: 'Full governance, team provisioning, audit logs, and all pipeline records.',
  sales_manager: 'Global pipeline oversight and team roster visibility across all representatives.',
  sales_executive: 'Scoped strictly to own assigned deals, inquiries, and follow-up queues.',
  viewer: 'Read-only access to permitted reports without pipeline mutation privileges.',
};

function deriveTabsForMember(member: TeamMemberRosterItem): CrmTabKey[] {
  if (Array.isArray(member.allowed_tabs) && member.allowed_tabs.length > 0) {
    return [...(member.allowed_tabs as CrmTabKey[])];
  }
  const defaults = ROLE_DEFAULT_TABS[member.role];
  if (!defaults) return ['command_center', 'leads', 'deals', 'works', 'tasks'];
  return (Object.keys(defaults) as CrmTabKey[]).filter((k) => defaults[k]);
}

export function MemberGovernanceDrawer({
  member,
  currentUserId,
  canManageTeam,
  canViewFinancials,
  suppressEscape = false,
  onClose,
  onRoleUpdated,
  onPermissionsUpdated,
  onOpenAvatarModal,
  onOpenReassignmentModal,
  onOpenSuspendModal,
  onReactivateUser,
}: MemberGovernanceDrawerProps): React.ReactElement | null {
  const [selectedRole, setSelectedRole] = useState<CrmUserRole>('sales_executive');
  const [allowedTabs, setAllowedTabs] = useState<CrmTabKey[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (member) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      setSelectedRole(member.role);
      setAllowedTabs(deriveTabsForMember(member));
      setFeedback(null);
      setAvatarError(false);
      document.body.style.overflow = 'hidden';

      requestAnimationFrame(() => {
        const closeBtn = drawerRef.current?.querySelector<HTMLElement>('button');
        closeBtn?.focus();
      });
    }

    return () => {
      requestAnimationFrame(() => {
        if (!document.querySelector('[aria-modal="true"]')) {
          document.body.style.overflow = '';
        }
      });
      if (member && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [member]);

  useEffect(() => {
    if (!member) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !isPending && !suppressEscape) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [member, isPending, suppressEscape, onClose]);

  if (!member) {
    return null;
  }

  const isSelf = member.id === currentUserId;
  const isTargetAdmin = member.role === 'admin';
  const canEditAvatar = canManageTeam || isSelf;
  const isSuspended = member.status === 'suspended';

  const initialTabs = deriveTabsForMember(member);
  const hasTabChanges =
    allowedTabs.length !== initialTabs.length ||
    allowedTabs.some((t) => !initialTabs.includes(t));
  const hasRoleChange = selectedRole !== member.role;

  const handleToggleTab = (tabKey: CrmTabKey): void => {
    if (!canManageTeam) return;
    if ((isSelf || isTargetAdmin) && (tabKey === 'users' || tabKey === 'settings')) {
      return;
    }
    setAllowedTabs((prev) =>
      prev.includes(tabKey) ? prev.filter((k) => k !== tabKey) : [...prev, tabKey]
    );
  };

  const handleSaveRole = (): void => {
    if (!canManageTeam || isSelf || !hasRoleChange) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await updateTeamUserRole(member.id, selectedRole);
      if (!res.success) {
        setFeedback({ type: 'error', text: res.error || 'Could not update role.' });
        return;
      }
      onRoleUpdated(member.id, selectedRole);
      setFeedback({ type: 'success', text: `Role updated to ${selectedRole.replace('_', ' ')}.` });
    });
  };

  const handleSavePermissions = (): void => {
    if (!canManageTeam || !hasTabChanges) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await updateUserPermissions({
        targetUserId: member.id,
        allowedTabs,
      });
      if (!res.success) {
        setFeedback({ type: 'error', text: res.error || 'Could not save tab access.' });
        return;
      }
      onPermissionsUpdated(member.id, allowedTabs);
      setFeedback({ type: 'success', text: 'Workspace permissions updated.' });
    });
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-governance-drawer-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          onClose();
        }
      }}
    >
      <aside className={styles.drawer} ref={drawerRef}>
        <header className={styles.drawerHeader}>
          <div className={styles.identityHeader}>
            <div className={styles.avatarFrame}>
              {member.avatar_url && !avatarError ? (
                <Image
                  src={member.avatar_url}
                  alt={member.full_name}
                  width={44}
                  height={44}
                  className={styles.avatarImage}
                  onError={() => setAvatarError(true)}
                  unoptimized
                />
              ) : (
                <span className={styles.avatarInitials} aria-hidden="true">
                  {getInitials(member.full_name)}
                </span>
              )}
              {canEditAvatar && (
                <button
                  type="button"
                  className={styles.avatarEditOverlay}
                  onClick={() => onOpenAvatarModal(member)}
                  aria-label={`Change photo for ${member.full_name}`}
                  title="Change photo"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </button>
              )}
            </div>

            <div className={styles.identityMeta}>
              <div className={styles.nameRow}>
                <h2 id="member-governance-drawer-title" className={styles.drawerTitle}>
                  {member.full_name}
                </h2>
                {isSelf && <span className={styles.youTag}>You</span>}
              </div>
              <p className={styles.identitySubline}>
                {member.job_title || 'Commercial Personnel'} · {member.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={isPending}
            aria-label="Close governance inspector (Esc)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className={styles.drawerSubBar}>
          <span className={`${styles.statusTag} ${isSuspended ? styles.statusSuspended : styles.statusActive}`}>
            <span>{isSuspended ? 'Suspended' : 'Active'}</span>
          </span>
          <Link href={`/admin/team/${member.id}`} className={styles.profileLink}>
            <span>Open full dossier</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </Link>
        </div>

        <div className={styles.drawerBody}>
          {feedback && (
            <div
              role={feedback.type === 'error' ? 'alert' : 'status'}
              aria-live="polite"
              className={feedback.type === 'error' ? styles.errorBanner : styles.successBanner}
            >
              {feedback.text}
            </div>
          )}

          {/* Section 1: Portfolio Snapshot */}
          <section className={styles.sectionBlock} aria-label="Portfolio summary">
            <div className={styles.sectionHeaderRow}>
              <h3 className={styles.sectionHeading}>Assigned portfolio</h3>
              {member.active_deals_count > 0 && (
                <Link href={`/admin/leads?assigned_to=${member.id}`} className={styles.inlineLink}>
                  View deals
                </Link>
              )}
            </div>
            <div className={styles.portfolioRow}>
              <div className={styles.portfolioStat}>
                <span className={styles.statNumber}>{formatNumber(member.active_deals_count)}</span>
                <span className={styles.statCaption}>active deals</span>
              </div>
              {canViewFinancials && (
                <div className={styles.portfolioStat}>
                  <span className={styles.statNumber}>
                    {formatDealValuation(member.total_deal_value)}
                  </span>
                  <span className={styles.statCaption}>pipeline value</span>
                </div>
              )}
            </div>
            {canManageTeam && member.active_deals_count > 0 && (
              <button
                type="button"
                className={styles.secondaryActionBtn}
                onClick={() => onOpenReassignmentModal(member)}
              >
                Reassign active deals
              </button>
            )}
          </section>

          {/* Section 2: Governance Role */}
          <section className={styles.sectionBlock} aria-label="Role configuration">
            <div className={styles.sectionHeaderRow}>
              <h3 className={styles.sectionHeading}>Governance role</h3>
            </div>
            <div className={styles.roleControlRow}>
              <select
                className={styles.roleSelect}
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as CrmUserRole)}
                disabled={!canManageTeam || isSelf || isPending}
                aria-label="Member governance role"
              >
                <option value="sales_executive">Sales Executive</option>
                <option value="sales_manager">Sales Manager</option>
                <option value="admin">Administrator</option>
                <option value="viewer">Viewer</option>
              </select>
              {canManageTeam && !isSelf && hasRoleChange && (
                <button
                  type="button"
                  className={styles.primarySaveBtn}
                  onClick={handleSaveRole}
                  disabled={isPending}
                >
                  Save role
                </button>
              )}
            </div>
            <p className={styles.helperText}>
              {isSelf
                ? 'Administrators cannot demote their own active role.'
                : ROLE_SCOPE_HINT[selectedRole]}
            </p>
          </section>

          {/* Section 3: Tab Permissions Matrix */}
          <section className={styles.sectionBlock} aria-label="Workspace tab permissions">
            <div className={styles.sectionHeaderRow}>
              <h3 className={styles.sectionHeading}>
                Workspace access ({allowedTabs.length}/9)
              </h3>
              {canManageTeam && hasTabChanges && (
                <button
                  type="button"
                  className={styles.primarySaveBtn}
                  onClick={handleSavePermissions}
                  disabled={isPending}
                >
                  Save access
                </button>
              )}
            </div>

            {(isSelf || isTargetAdmin) && canManageTeam && (
              <p className={styles.policyNote}>
                Governance tabs (Team and Security Settings) remain locked for administrator accounts.
              </p>
            )}

            <div className={styles.enclavesStack}>
              {PERMISSION_ENCLAVES.map((enclave) => (
                <div key={enclave.enclaveTitle} className={styles.enclaveGroup}>
                  <span className={styles.enclaveTitle}>{enclave.enclaveTitle}</span>
                  <div className={styles.tabSwitchList}>
                    {enclave.tabs.map((tab) => {
                      const isChecked = allowedTabs.includes(tab.key);
                      const isLocked =
                        !canManageTeam ||
                        ((isSelf || isTargetAdmin) &&
                          (tab.key === 'users' || tab.key === 'settings'));

                      return (
                        <button
                          key={tab.key}
                          type="button"
                          role="switch"
                          aria-checked={isChecked}
                          disabled={isLocked}
                          onClick={() => handleToggleTab(tab.key)}
                          className={`${styles.tabToggleRow} ${
                            isChecked ? styles.tabToggleActive : ''
                          } ${isLocked ? styles.tabToggleLocked : ''}`}
                        >
                          <div className={styles.tabToggleText}>
                            <span className={styles.tabToggleLabel}>{tab.label}</span>
                            <span className={styles.tabToggleHint}>{tab.hint}</span>
                          </div>
                          <span
                            className={`${styles.switchTrack} ${
                              isChecked ? styles.switchTrackOn : ''
                            }`}
                            aria-hidden="true"
                          >
                            <span className={styles.switchThumb} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {canManageTeam && !isSelf && (
          <footer className={styles.drawerFooter}>
            {isSuspended ? (
              <button
                type="button"
                className={styles.activateFooterBtn}
                onClick={() => onReactivateUser(member)}
                disabled={isPending}
              >
                Reactivate account
              </button>
            ) : (
              <button
                type="button"
                className={styles.suspendFooterBtn}
                onClick={() => onOpenSuspendModal(member)}
                disabled={isPending}
              >
                Suspend account &amp; revoke sessions
              </button>
            )}
          </footer>
        )}
      </aside>
    </div>
  );
}
