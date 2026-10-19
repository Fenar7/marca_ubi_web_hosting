'use client';

/**
 * @file CommercialDirectoryTable.tsx
 * @description Interactive Commercial Personnel Directory table component (/admin/team).
 *              Renders Linear Fluid Cards row rhythm, provides instant client search and filtering,
 *              formats pipeline values in tabular-nums, and enables administrative role governance
 *              and account status transitions.
 * @module app/admin/team/components/CommercialDirectoryTable
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { TeamMemberRosterItem, CrmUserRole, ProfileAccountStatus, Profile, CrmTabKey } from '@/types/crm';
import { ROLE_DEFAULT_TABS } from '@/types/crm';
import { updateTeamUserRole, setTeamUserStatus } from '@/app/actions/team';
import { formatDealValuation, getInitials } from '@/app/lib/team-utils';
import { SuspendUserModal } from './SuspendUserModal';
import { LeadReassignmentWizardModal } from './LeadReassignmentWizardModal';
import { EditUserPermissionsModal } from './EditUserPermissionsModal';
import styles from '../team.module.scss';

interface CommercialDirectoryTableProps {
  initialRoster: TeamMemberRosterItem[];
  currentUserRole: CrmUserRole;
  currentUserId: string;
}

export function CommercialDirectoryTable({
  initialRoster,
  currentUserRole,
  currentUserId,
}: CommercialDirectoryTableProps): React.ReactElement {
  const router = useRouter();
  const [roster, setRoster] = useState<TeamMemberRosterItem[]>(initialRoster);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Synchronize internal state if initialRoster reference changes
  useEffect(() => {
    setRoster(initialRoster);
  }, [initialRoster]);

  // F-03 & F-04: Single authoritative listener for team-member-created with real UUID
  useEffect(() => {
    const handleTeamMemberCreated = (event: Event): void => {
      const customEvent = event as CustomEvent<{
        id?: string;
        credentials: {
          fullName: string;
          email: string;
          role: string;
          jobTitle: string;
          tempPassword?: string;
          allowedTabs?: string[];
        };
      }>;
      if (!customEvent.detail?.credentials) return;
      const { id, credentials } = customEvent.detail;

      const newMember: TeamMemberRosterItem = {
        id: id || `temp-${Date.now()}`,
        full_name: credentials.fullName,
        email: credentials.email,
        role: credentials.role as CrmUserRole,
        job_title: credentials.jobTitle,
        phone: null,
        status: 'active',
        avatar_url: null,
        invited_by: currentUserId,
        last_login_at: null,
        must_change_password: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        allowed_tabs: credentials.allowedTabs || ['command_center', 'leads', 'deals', 'works', 'tasks'],
        active_deals_count: 0,
        total_deal_value: 0,
      };

      setRoster((prev) => [newMember, ...prev]);
      router.refresh();
    };

    window.addEventListener('team-member-created', handleTeamMemberCreated);
    return () => window.removeEventListener('team-member-created', handleTeamMemberCreated);
  }, [currentUserId, router]);

  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Tab Permissions modal state
  const [memberForPermissions, setMemberForPermissions] = useState<TeamMemberRosterItem | null>(null);

  // Role modification modal state
  const [targetMemberForRole, setTargetMemberForRole] = useState<TeamMemberRosterItem | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<CrmUserRole>('sales_executive');

  // Dedicated offboarding & suspension modal state (Sprint 4.1)
  const [memberToSuspend, setMemberToSuspend] = useState<TeamMemberRosterItem | null>(null);

  // Reactivation confirmation modal state
  const [memberToActivate, setMemberToActivate] = useState<TeamMemberRosterItem | null>(null);

  // Dedicated lead reassignment wizard modal state (Sprint 4.2)
  const [memberToReassign, setMemberToReassign] = useState<TeamMemberRosterItem | null>(null);

  // Modal Escape key dismissal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) {
        if (targetMemberForRole) setTargetMemberForRole(null);
        if (memberToActivate) setMemberToActivate(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetMemberForRole, memberToActivate, isPending]);

  // Optimistic handler for updated tab permissions
  const handlePermissionsUpdated = (userId: string, newTabs: string[]) => {
    setRoster((prev) =>
      prev.map((item) =>
        item.id === userId ? { ...item, allowed_tabs: newTabs } : item
      )
    );
    setSuccessNotice('Tab permissions updated successfully.');
    router.refresh();
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  // Filter roster dynamically
  const filteredRoster = useMemo(() => {
    return roster.filter((member) => {
      // Search matching: name, email, job title
      const matchesSearch =
        !searchQuery.trim() ||
        member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.job_title.toLowerCase().includes(searchQuery.toLowerCase());

      // Role filter matching
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;

      // Status filter matching
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roster, searchQuery, roleFilter, statusFilter]);

  const isAdmin = currentUserRole === 'admin';

  // Handle Role Change Execution
  const handleConfirmRoleChange = () => {
    if (!targetMemberForRole || !selectedNewRole) return;
    if (targetMemberForRole.id === currentUserId && selectedNewRole !== 'admin') {
      setActionError(
        'Security Policy Violation: Administrators cannot demote their own account. Another administrator must perform this action.'
      );
      return;
    }
    setActionError(null);

    startTransition(async () => {
      try {
        const result = await updateTeamUserRole(targetMemberForRole.id, selectedNewRole);

        if (!result.success) {
          setActionError(result.error || 'Failed to update team member role.');
          return;
        }

        // Optimistically update local roster
        setRoster((prev) =>
          prev.map((item) =>
            item.id === targetMemberForRole.id ? { ...item, role: selectedNewRole } : item
          )
        );

        setTargetMemberForRole(null);
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
        setActionError(msg);
      }
    });
  };

  // Handle Account Reactivation Execution
  const handleConfirmReactivation = () => {
    if (!memberToActivate) return;
    setActionError(null);

    startTransition(async () => {
      try {
        const result = await setTeamUserStatus(memberToActivate.id, 'active');

        if (!result.success) {
          setActionError(result.error || 'Failed to reactivate team account.');
          return;
        }

        // Optimistically update local roster
        setRoster((prev) =>
          prev.map((item) =>
            item.id === memberToActivate.id ? { ...item, status: 'active' } : item
          )
        );

        setSuccessNotice(`Account for ${memberToActivate.full_name} has been successfully reactivated.`);
        setMemberToActivate(null);
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
        setActionError(msg);
      }
    });
  };

  return (
    <div className={styles.tableContainer}>
      {actionError && (
        <div style={{ padding: '0.85rem 1.25rem', background: 'var(--admin-status-rose-bg, #fef2f2)', borderBottom: '1px solid var(--admin-status-rose-border, #fecaca)', color: 'var(--admin-status-rose-text, #991b1b)', fontSize: '0.84rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--admin-status-rose-text, #991b1b)', cursor: 'pointer', minHeight: '44px', minWidth: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Dismiss error notice"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {successNotice && (
        <div style={{ padding: '0.85rem 1.25rem', background: 'var(--admin-status-emerald-bg, #ecfdf5)', borderBottom: '1px solid var(--admin-status-emerald-border, #a7f3d0)', color: 'var(--admin-status-emerald-text, #065f46)', fontSize: '0.84rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{successNotice}</span>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--admin-status-emerald-text, #065f46)', cursor: 'pointer', minHeight: '44px', minWidth: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Dismiss success notice"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Directory Filter Toolbar */}
      <div className={styles.tableToolbar}>
        <div className={styles.searchBox}>
          <svg
            className={styles.searchIcon}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by personnel name, email, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Filter team members by name, email, or title"
          />
        </div>

        <div className={styles.filterControls}>
          <select
            className={styles.filterSelect}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter directory by commercial role"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="sales_manager">Sales Managers</option>
            <option value="sales_executive">Sales Executives</option>
            <option value="viewer">Viewers</option>
          </select>

          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter directory by account status"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Commercial Personnel Directory Grid */}
      <div className={styles.tableResponsiveWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Personnel Identity</th>
              <th className={styles.th}>Governance Role</th>
              <th className={styles.th}>Job Title</th>
              <th className={styles.th}>Tab Permissions</th>
              <th className={styles.th}>Active Portfolio</th>
              <th className={styles.th}>Account Status</th>
              {isAdmin && <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredRoster.length > 0 ? (
              filteredRoster.map((member) => {
                const isSelf = member.id === currentUserId;

                return (
                  <tr key={member.id} className={styles.tr}>
                    {/* Personnel Identity */}
                    <td className={styles.td}>
                      <div className={styles.identityCell}>
                        <div className={styles.avatar}>
                          {getInitials(member.full_name)}
                        </div>
                        <div className={styles.identityInfo}>
                          <span className={styles.fullName}>
                            {member.full_name}
                            {isSelf && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--admin-text-secondary, #525965)', marginLeft: '0.4rem', fontWeight: 600 }}>
                                (You)
                              </span>
                            )}
                          </span>
                          <span className={styles.emailSubtext}>
                            <a
                              href={`mailto:${member.email}`}
                              style={{ color: 'inherit', textDecoration: 'none' }}
                              onClick={(e) => e.stopPropagation()}
                              title={`Compose email to ${member.email}`}
                            >
                              {member.email}
                            </a>
                            {member.phone && (
                              <>
                                {' · '}
                                <a
                                  href={`tel:${member.phone}`}
                                  style={{ color: 'inherit', textDecoration: 'none' }}
                                  onClick={(e) => e.stopPropagation()}
                                  title={`Call ${member.phone}`}
                                >
                                  {member.phone}
                                </a>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Governance Role */}
                    <td className={styles.td}>
                      {member.role === 'admin' && (
                        <span className={`${styles.roleBadge} ${styles.roleAdmin}`}>
                          Admin
                        </span>
                      )}
                      {member.role === 'sales_manager' && (
                        <span className={`${styles.roleBadge} ${styles.roleSalesManager}`}>
                          Sales Manager
                        </span>
                      )}
                      {member.role === 'sales_executive' && (
                        <span className={`${styles.roleBadge} ${styles.roleSalesExecutive}`}>
                          Sales Executive
                        </span>
                      )}
                      {member.role === 'viewer' && (
                        <span className={`${styles.roleBadge} ${styles.roleViewer}`}>
                          Viewer
                        </span>
                      )}
                    </td>

                    {/* Job Title */}
                    <td className={styles.td} style={{ color: '#cccccc' }}>
                      {member.job_title}
                    </td>

                    {/* Granular Tab Permissions */}
                    <td className={styles.td}>
                      {(() => {
                        const memberTabs = Array.isArray(member.allowed_tabs)
                          ? member.allowed_tabs
                          : (Object.keys(ROLE_DEFAULT_TABS[member.role] || {}) as CrmTabKey[]).filter(
                              (k) => ROLE_DEFAULT_TABS[member.role]?.[k]
                            );
                        const tabCount = memberTabs.length;
                        const isFull = tabCount === 9;

                        return (
                          <button
                            type="button"
                            className={`${styles.permissionsPill} ${
                              isFull ? styles.permissionsFull : styles.permissionsCustom
                            }`}
                            onClick={() => isAdmin && setMemberForPermissions(member)}
                            disabled={!isAdmin}
                            title={
                              isAdmin
                                ? `Click to configure permissions for ${member.full_name} (${tabCount}/9 tabs authorized)`
                                : `${tabCount}/9 tabs authorized`
                            }
                            aria-label={`Configure permissions for ${member.full_name}: ${tabCount} of 9 tabs authorized`}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <span>{tabCount}/9 Tabs</span>
                          </button>
                        );
                      })()}
                    </td>

                    {/* Active Deals Load / Active Portfolio */}
                    <td className={styles.td}>
                      {member.active_deals_count > 0 ? (
                        <Link
                          href={`/admin/leads?assigned_to=${member.id}`}
                          className={styles.dealsPill}
                          style={{
                            textDecoration: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                          title={`View ${member.active_deals_count} active deals assigned to ${member.full_name}`}
                        >
                          <span className={styles.dealsCount}>{member.active_deals_count}</span>
                          <span>deals</span>
                          {member.total_deal_value > 0 && (
                            <span className={styles.dealsValuation}>
                              ({formatDealValuation(member.total_deal_value)})
                            </span>
                          )}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </Link>
                      ) : (
                        <div className={styles.dealsPill}>
                          <span className={styles.dealsCount}>0</span>
                          <span>deals</span>
                        </div>
                      )}
                    </td>

                    {/* Account Status */}
                    <td className={styles.td}>
                      <div
                        className={`${styles.statusIndicator} ${
                          member.status === 'active' ? styles.statusActive : styles.statusSuspended
                        }`}
                      >
                        <span className={styles.statusDot} />
                        <span>{member.status === 'active' ? 'Active' : 'Suspended'}</span>
                      </div>
                    </td>

                    {/* Administrative Actions */}
                    {isAdmin && (
                      <td className={styles.td} style={{ textAlign: 'right' }}>
                        <div className={styles.actionButtonGroup} style={{ justifyContent: 'flex-end' }}>
                          {member.active_deals_count > 0 && (
                            <button
                              type="button"
                              className={`${styles.rowActionButton} ${styles.reassignButton}`}
                              onClick={() => setMemberToReassign(member)}
                              disabled={isPending}
                              aria-label={`Reassign active deals from ${member.full_name}`}
                              title="Reassign Active Deals"
                            >
                              <span>Reassign</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className={`${styles.rowActionButton} ${styles.permissionsButton}`}
                            onClick={() => setMemberForPermissions(member)}
                            disabled={isPending}
                            aria-label={`Configure tab permissions for ${member.full_name}`}
                            title="Configure Tab Permissions"
                          >
                            <span>Permissions</span>
                          </button>

                          <button
                            type="button"
                            className={styles.rowActionButton}
                            onClick={() => {
                              setTargetMemberForRole(member);
                              setSelectedNewRole(member.role);
                            }}
                            disabled={isPending}
                            aria-label={`Change role for ${member.full_name}`}
                          >
                            <span>Role</span>
                          </button>

                          <button
                            type="button"
                            className={`${styles.rowActionButton} ${
                              member.status === 'active' ? styles.dangerButton : styles.activateButton
                            }`}
                            onClick={() => {
                              if (member.status === 'active') {
                                setMemberToSuspend(member);
                              } else {
                                setMemberToActivate(member);
                              }
                            }}
                            disabled={isPending || (member.status === 'active' && isSelf)}
                            title={isSelf ? 'Cannot suspend your own account' : undefined}
                            aria-label={`${
                              member.status === 'active' ? 'Suspend' : 'Activate'
                            } account for ${member.full_name}`}
                          >
                            <span>
                              {member.status === 'active'
                                ? isSelf
                                  ? 'Self'
                                  : 'Suspend'
                                : 'Activate'}
                            </span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={isAdmin ? 7 : 6}>
                  <div className={styles.emptyState}>
                    <p className={styles.emptyStateTitle}>No Commercial Personnel Found</p>
                    <p className={styles.emptyStateText}>
                      No team members matched your active search query or filter selection.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Role Modification Modal Dialog */}
      {targetMemberForRole && (() => {
        const isSelfRoleEdit = targetMemberForRole.id === currentUserId;

        return (
          <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isPending) {
                setTargetMemberForRole(null);
              }
            }}
          >
            <div className={styles.modalCard} style={{ maxWidth: '440px' }}>
              <h3 id="role-modal-title" style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>
                Modify Governance Role
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#888888', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
                Update access permissions and database RLS boundaries for{' '}
                <strong>{targetMemberForRole.full_name}</strong> ({targetMemberForRole.email}).
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="new-role-select" className={styles.drawerLabel} style={{ marginBottom: '0.4rem', display: 'block' }}>
                  Assigned Role
                </label>
                <select
                  id="new-role-select"
                  className={styles.drawerSelect}
                  value={selectedNewRole}
                  onChange={(e) => {
                    const roleVal = e.target.value as CrmUserRole;
                    if (isSelfRoleEdit && roleVal !== 'admin') {
                      return;
                    }
                    setSelectedNewRole(roleVal);
                  }}
                  disabled={isPending || isSelfRoleEdit}
                >
                  <option value="sales_executive" disabled={isSelfRoleEdit}>
                    Sales Executive (Own Deals Only)
                  </option>
                  <option value="sales_manager" disabled={isSelfRoleEdit}>
                    Sales Manager (Global Pipeline View)
                  </option>
                  <option value="admin">Administrator (Full Access & Governance)</option>
                  <option value="viewer" disabled={isSelfRoleEdit}>
                    Viewer (Read-Only Financials)
                  </option>
                </select>

                {isSelfRoleEdit && (
                  <div className={styles.modalAlertBanner} style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={styles.modalAlertIcon}
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className={styles.modalAlertText}>
                      Administrators cannot demote their own account. Another administrator must perform this action.
                    </p>
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.copyButton}
                  onClick={() => setTargetMemberForRole(null)}
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.doneButton}
                  onClick={handleConfirmRoleChange}
                  disabled={
                    isPending ||
                    selectedNewRole === targetMemberForRole.role ||
                    (isSelfRoleEdit && selectedNewRole !== 'admin')
                  }
                >
                  {isPending ? 'Updating...' : 'Save Role'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Dedicated Employee Offboarding & Suspension Modal (Sprint 4.1) */}
      <SuspendUserModal
        member={memberToSuspend}
        isOpen={Boolean(memberToSuspend)}
        onClose={() => setMemberToSuspend(null)}
        onSuccess={(updatedProfile, suspendedUserId) => {
          const suspendedMember = memberToSuspend;
          setRoster((prev) =>
            prev.map((item) =>
              item.id === suspendedUserId ? { ...item, status: 'suspended' } : item
            )
          );
          setSuccessNotice(
            `Account for ${suspendedMember?.full_name} has been suspended and all sessions revoked.`
          );
          router.refresh();
          // If suspended representative has active deals, immediately open Lead Reassignment Wizard
          if (suspendedMember && suspendedMember.active_deals_count > 0) {
            setMemberToReassign({
              ...suspendedMember,
              status: 'suspended',
            });
          }
        }}
      />

      {/* Dedicated Pipeline Lead Reassignment Wizard Modal (Sprint 4.2) */}
      <LeadReassignmentWizardModal
        sourceMember={memberToReassign}
        activeRoster={roster}
        isOpen={Boolean(memberToReassign)}
        onClose={() => setMemberToReassign(null)}
        onSuccess={(result, sourceId, destinationId) => {
          // Optimistically update deal counts and valuations across roster
          setRoster((prev) =>
            prev.map((item) => {
              if (item.id === sourceId) {
                return {
                  ...item,
                  active_deals_count: 0,
                  total_deal_value: 0,
                };
              }
              if (item.id === destinationId) {
                return {
                  ...item,
                  active_deals_count: item.active_deals_count + result.reassigned_count,
                  total_deal_value: item.total_deal_value + result.total_value,
                };
              }
              return item;
            })
          );
          setSuccessNotice(
            `Successfully transferred ${result.reassigned_count} active deal(s) valued at ${formatDealValuation(result.total_value)}.`
          );
          router.refresh();
        }}
      />

      {/* Account Reactivation Confirmation Modal */}
      {memberToActivate && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reactivate-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) {
              setMemberToActivate(null);
            }
          }}
        >
          <div className={styles.modalCard} style={{ maxWidth: '440px' }}>
            <div className={styles.modalAlertBanner} style={{ borderColor: 'rgba(34, 197, 94, 0.3)', background: 'rgba(34, 197, 94, 0.08)' }}>
              <svg
                className={styles.modalAlertIcon}
                style={{ color: '#22c55e' }}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
              <div>
                <h3 id="reactivate-modal-title" style={{ margin: '0 0 0.25rem 0', fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
                  Reactivate Commercial Personnel
                </h3>
                <p className={styles.modalAlertText}>
                  Reactivating <strong>{memberToActivate.full_name}</strong> will restore their login access and pipeline permissions across the platform.
                </p>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.copyButton}
                onClick={() => setMemberToActivate(null)}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.doneButton}
                style={{
                  background: '#22c55e',
                  borderColor: '#22c55e',
                }}
                onClick={handleConfirmReactivation}
                disabled={isPending}
              >
                {isPending ? 'Reactivating...' : 'Reactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Permissions Configuration Modal */}
      <EditUserPermissionsModal
        isOpen={Boolean(memberForPermissions)}
        targetMember={memberForPermissions}
        currentUserId={currentUserId}
        onClose={() => setMemberForPermissions(null)}
        onPermissionsUpdated={handlePermissionsUpdated}
      />
    </div>
  );
}
