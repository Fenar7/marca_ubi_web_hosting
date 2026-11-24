'use client';

/**
 * @file TeamWorkspaceClient.tsx
 * @description Single-source interactive coordinator for the /admin/team workspace.
 *              Unifies CategoryUnderlineTabs, FilterControlToolbar, CommercialDirectoryTable,
 *              PersonnelCardGrid, MemberGovernanceDrawer (?member=<id> sync),
 *              and shared governance modals without duplicate dialog mounts.
 * @module app/admin/team/components/TeamWorkspaceClient
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useMemo, useTransition, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type {
  TeamMemberRosterItem,
  CrmUserRole,
  ProfileAccountStatus,
  Profile,
  AtomicReassignmentResult,
} from '@/types/crm';
import { setTeamUserStatus } from '@/app/actions/team';
import { CategoryUnderlineTabs, type TeamTabCategory, type TabCounts } from './CategoryUnderlineTabs';
import { FilterControlToolbar, type ViewMode } from './FilterControlToolbar';
import { PersonnelCardGrid } from './PersonnelCardGrid';
import { CommercialDirectoryTable } from './CommercialDirectoryTable';
import { MemberGovernanceDrawer } from './MemberGovernanceDrawer';
import { AvatarUploadModal, type TargetMemberAvatarContext } from './AvatarUploadModal';
import { EditUserPermissionsModal } from './EditUserPermissionsModal';
import { ModifyRoleModal } from './ModifyRoleModal';
import { LeadReassignmentWizardModal } from './LeadReassignmentWizardModal';
import { SuspendUserModal } from './SuspendUserModal';
import styles from '../team.module.scss';

interface TeamWorkspaceClientProps {
  initialRoster: TeamMemberRosterItem[];
  currentUserRole: CrmUserRole;
  currentUserId: string;
  canViewFinancials?: boolean;
}

export function TeamWorkspaceClient({
  initialRoster,
  currentUserRole,
  currentUserId,
  canViewFinancials = true,
}: TeamWorkspaceClientProps): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [roster, setRoster] = useState<TeamMemberRosterItem[]>(initialRoster);
  const [activeTab, setActiveTab] = useState<TeamTabCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<CrmUserRole | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ProfileAccountStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Unified single-source drawer and modal targets
  const [inspectedMemberId, setInspectedMemberId] = useState<string | null>(() =>
    searchParams.get('member')
  );
  const [avatarTarget, setAvatarTarget] = useState<TargetMemberAvatarContext | null>(null);
  const [memberForPermissions, setMemberForPermissions] = useState<TeamMemberRosterItem | null>(null);
  const [memberForRole, setMemberForRole] = useState<TeamMemberRosterItem | null>(null);
  const [memberForReassignment, setMemberForReassignment] = useState<TeamMemberRosterItem | null>(null);
  const [memberForSuspend, setMemberForSuspend] = useState<TeamMemberRosterItem | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const isAdmin = currentUserRole === 'admin';

  useEffect(() => {
    setRoster(initialRoster);
  }, [initialRoster]);

  useEffect(() => {
    const memberParam = searchParams.get('member');
    setInspectedMemberId(memberParam);
  }, [searchParams]);

  // Synchronize real-time avatar mutations
  useEffect(() => {
    const handleAvatarUpdated = (event: Event): void => {
      const customEvent = event as CustomEvent<{ userId: string; avatarUrl: string | null }>;
      if (!customEvent.detail) return;
      const { userId, avatarUrl } = customEvent.detail;
      setRoster((prev) =>
        prev.map((member) => (member.id === userId ? { ...member, avatar_url: avatarUrl } : member))
      );
    };

    window.addEventListener('user-avatar-updated', handleAvatarUpdated);
    return () => window.removeEventListener('user-avatar-updated', handleAvatarUpdated);
  }, []);

  // Synchronize newly provisioned team members
  useEffect(() => {
    const handleMemberCreated = (): void => {
      startTransition(() => {
        router.refresh();
      });
    };

    window.addEventListener('team-member-created', handleMemberCreated);
    return () => window.removeEventListener('team-member-created', handleMemberCreated);
  }, [router]);

  useEffect(() => {
    if (!toastNotice) return;
    const timer = setTimeout(() => setToastNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [toastNotice]);

  const handleOpenInspector = useCallback((member: TeamMemberRosterItem): void => {
    setInspectedMemberId(member.id);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('member', member.id);
      window.history.replaceState(null, '', url.toString());
    }
  }, []);

  const handleCloseInspector = useCallback((): void => {
    setInspectedMemberId(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('member');
      window.history.replaceState(null, '', url.toString());
    }
  }, []);

  const inspectedMember = useMemo(
    () => (inspectedMemberId ? roster.find((m) => m.id === inspectedMemberId) || null : null),
    [roster, inspectedMemberId]
  );

  const tabCounts: TabCounts = useMemo(() => {
    return {
      all: roster.length,
      leadership: roster.filter((m) => m.role === 'admin' || m.role === 'sales_manager').length,
      sales: roster.filter((m) => m.role === 'sales_executive').length,
      suspended: roster.filter((m) => m.status === 'suspended').length,
    };
  }, [roster]);

  const filteredRoster = useMemo(() => {
    return roster.filter((member) => {
      if (activeTab === 'leadership' && member.role !== 'admin' && member.role !== 'sales_manager') return false;
      if (activeTab === 'sales' && member.role !== 'sales_executive') return false;
      if (activeTab === 'suspended' && member.status !== 'suspended') return false;
      if (selectedRole !== 'all' && member.role !== selectedRole) return false;
      if (selectedStatus !== 'all' && member.status !== selectedStatus) return false;

      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = member.full_name.toLowerCase().includes(query);
        const emailMatch = member.email.toLowerCase().includes(query);
        const titleMatch = (member.job_title || '').toLowerCase().includes(query);
        if (!nameMatch && !emailMatch && !titleMatch) return false;
      }
      return true;
    });
  }, [roster, activeTab, selectedRole, selectedStatus, searchQuery]);

  const hasActiveFilters =
    activeTab !== 'all' ||
    searchQuery.trim().length > 0 ||
    selectedRole !== 'all' ||
    selectedStatus !== 'all';

  const handleResetFilters = (): void => {
    setActiveTab('all');
    setSearchQuery('');
    setSelectedRole('all');
    setSelectedStatus('all');
  };

  const handleOpenAvatarModal = (member: TeamMemberRosterItem): void => {
    setAvatarTarget({
      id: member.id,
      name: member.full_name,
      avatarUrl: member.avatar_url,
    });
  };

  const handleAvatarSaved = (newAvatarUrl: string | null): void => {
    if (!avatarTarget) return;
    setRoster((prev) =>
      prev.map((m) => (m.id === avatarTarget.id ? { ...m, avatar_url: newAvatarUrl } : m))
    );
    setToastNotice('Profile photo updated.');
  };

  const handleRoleUpdated = (userId: string, newRole: CrmUserRole): void => {
    setRoster((prev) =>
      prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m))
    );
    setMemberForRole(null);
    setToastNotice('Governance role updated.');
    startTransition(() => {
      router.refresh();
    });
  };

  const handlePermissionsUpdated = (userId: string, newTabs: string[]): void => {
    setRoster((prev) =>
      prev.map((m) => (m.id === userId ? { ...m, allowed_tabs: newTabs } : m))
    );
    setMemberForPermissions(null);
    setToastNotice('Workspace tab permissions updated.');
    startTransition(() => {
      router.refresh();
    });
  };

  const handleReassignmentSuccess = (
    result: AtomicReassignmentResult,
    sourceMemberId: string,
    destinationMemberId: string
  ): void => {
    const reassignedCount = result.reassigned_count;
    setRoster((prev) =>
      prev.map((m) => {
        if (m.id === sourceMemberId) {
          return {
            ...m,
            active_deals_count: Math.max(0, (m.active_deals_count || 0) - reassignedCount),
          };
        }
        if (m.id === destinationMemberId) {
          return {
            ...m,
            active_deals_count: (m.active_deals_count || 0) + reassignedCount,
          };
        }
        return m;
      })
    );
    setMemberForReassignment(null);
    setToastNotice(`Transferred ${reassignedCount} active deals.`);
    startTransition(() => {
      router.refresh();
    });
  };

  const handleSuspendSuccess = (_updatedProfile: Profile, suspendedUserId: string): void => {
    setRoster((prev) =>
      prev.map((m) => (m.id === suspendedUserId ? { ...m, status: 'suspended' } : m))
    );
    setMemberForSuspend(null);
    setToastNotice('Account suspended and active sessions revoked.');
    startTransition(() => {
      router.refresh();
    });
  };

  const handleReactivateUser = async (member: TeamMemberRosterItem): Promise<void> => {
    try {
      const res = await setTeamUserStatus(member.id, 'active');
      if (res.success) {
        setRoster((prev) =>
          prev.map((m) => (m.id === member.id ? { ...m, status: 'active' } : m))
        );
        setToastNotice(`Reactivated account for ${member.full_name}.`);
        startTransition(() => {
          router.refresh();
        });
      } else {
        setToastNotice(res.error || 'Could not reactivate this account.');
      }
    } catch (error) {
      console.error('[team] Account reactivation failed:', error);
      setToastNotice('Failed to reactivate account.');
    }
  };

  return (
    <section className={styles.directorySurface} aria-label="Team directory">
      <div className={styles.directoryTabsRow}>
        <CategoryUnderlineTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={tabCounts}
        />
      </div>

      <FilterControlToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
        visibleCount={filteredRoster.length}
        totalCount={roster.length}
      />

      {toastNotice && (
        <div role="status" aria-live="polite" className={styles.noticeBanner}>
          <span>{toastNotice}</span>
          <button
            type="button"
            className={styles.noticeDismiss}
            onClick={() => setToastNotice(null)}
            aria-label="Dismiss notification"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className={styles.gridWrap}>
          <PersonnelCardGrid
            members={filteredRoster}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onResetFilters={handleResetFilters}
            onOpenAvatarModal={handleOpenAvatarModal}
            onOpenPermissionsModal={setMemberForPermissions}
            onOpenReassignmentModal={setMemberForReassignment}
            onOpenSuspendModal={setMemberForSuspend}
            onReactivateUser={handleReactivateUser}
          />
        </div>
      ) : (
        <CommercialDirectoryTable
          initialRoster={filteredRoster}
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
          canViewFinancials={canViewFinancials}
          onInspectMember={isAdmin ? handleOpenInspector : undefined}
          onOpenAvatarModal={handleOpenAvatarModal}
          onOpenPermissionsModal={setMemberForPermissions}
          onOpenRoleModal={setMemberForRole}
          onOpenReassignmentModal={setMemberForReassignment}
          onOpenSuspendModal={setMemberForSuspend}
          onReactivateUser={handleReactivateUser}
          onResetFilters={hasActiveFilters ? handleResetFilters : undefined}
        />
      )}

      {/* In-Context Governance Slide-Over Inspector (?member=<id>) */}
      <MemberGovernanceDrawer
        member={inspectedMember}
        currentUserId={currentUserId}
        canManageTeam={isAdmin}
        canViewFinancials={canViewFinancials}
        suppressEscape={Boolean(
          avatarTarget ||
            memberForPermissions ||
            memberForRole ||
            memberForReassignment ||
            memberForSuspend
        )}
        onClose={handleCloseInspector}
        onRoleUpdated={handleRoleUpdated}
        onPermissionsUpdated={handlePermissionsUpdated}
        onOpenAvatarModal={handleOpenAvatarModal}
        onOpenReassignmentModal={setMemberForReassignment}
        onOpenSuspendModal={setMemberForSuspend}
        onReactivateUser={handleReactivateUser}
      />

      {/* Shared Governance Modals */}
      {avatarTarget && (
        <AvatarUploadModal
          isOpen={Boolean(avatarTarget)}
          targetMember={avatarTarget}
          onClose={() => setAvatarTarget(null)}
          onAvatarSaved={handleAvatarSaved}
        />
      )}

      {memberForPermissions && (
        <EditUserPermissionsModal
          isOpen={Boolean(memberForPermissions)}
          targetMember={memberForPermissions}
          currentUserId={currentUserId}
          onClose={() => setMemberForPermissions(null)}
          onPermissionsUpdated={handlePermissionsUpdated}
        />
      )}

      {memberForRole && (
        <ModifyRoleModal
          isOpen={Boolean(memberForRole)}
          targetMember={memberForRole}
          currentUserId={currentUserId}
          onClose={() => setMemberForRole(null)}
          onRoleUpdated={handleRoleUpdated}
        />
      )}

      {memberForReassignment && (
        <LeadReassignmentWizardModal
          isOpen={Boolean(memberForReassignment)}
          sourceMember={memberForReassignment}
          activeRoster={roster.filter(
            (m) => m.id !== memberForReassignment.id && m.status === 'active'
          )}
          onClose={() => setMemberForReassignment(null)}
          onSuccess={handleReassignmentSuccess}
        />
      )}

      {memberForSuspend && (
        <SuspendUserModal
          isOpen={Boolean(memberForSuspend)}
          member={memberForSuspend}
          onClose={() => setMemberForSuspend(null)}
          onSuccess={handleSuspendSuccess}
        />
      )}
    </section>
  );
}
