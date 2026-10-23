'use client';

/**
 * @file TeamWorkspaceClient.tsx
 * @description PrimeStay-inspired interactive client orchestrator for the Commercial Personnel workspace.
 *              Coordinates state between CategoryUnderlineTabs, FilterControlToolbar, PersonnelCardGrid,
 *              CommercialDirectoryTable, and administrative governance modals (Avatar, Permissions, Reassignment, Suspend).
 * @module app/admin/team/components/TeamWorkspaceClient
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
import { AvatarUploadModal, type TargetMemberAvatarContext } from './AvatarUploadModal';
import { EditUserPermissionsModal } from './EditUserPermissionsModal';
import { LeadReassignmentWizardModal } from './LeadReassignmentWizardModal';
import { SuspendUserModal } from './SuspendUserModal';
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
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Primary roster state
  const [roster, setRoster] = useState<TeamMemberRosterItem[]>(initialRoster);

  // Filter and view states
  const [activeTab, setActiveTab] = useState<TeamTabCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<CrmUserRole | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ProfileAccountStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Governance Modals state
  const [avatarTarget, setAvatarTarget] = useState<TargetMemberAvatarContext | null>(null);
  const [memberForPermissions, setMemberForPermissions] = useState<TeamMemberRosterItem | null>(null);
  const [memberForReassignment, setMemberForReassignment] = useState<TeamMemberRosterItem | null>(null);
  const [memberForSuspend, setMemberForSuspend] = useState<TeamMemberRosterItem | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const isAdmin = currentUserRole === 'admin';

  // Synchronize internal state on external initialRoster updates
  useEffect(() => {
    setRoster(initialRoster);
  }, [initialRoster]);

  // Synchronize real-time avatar mutations across workspace
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

  // Listen for team member creation events
  useEffect(() => {
    const handleMemberCreated = (event: Event): void => {
      const customEvent = event as CustomEvent<{
        id?: string;
        credentials: {
          fullName: string;
          email: string;
          role: string;
          jobTitle: string;
          allowedTabs?: string[];
        };
      }>;
      if (!customEvent.detail?.credentials) return;
      const { id, credentials } = customEvent.detail;

      const newMember: TeamMemberRosterItem = {
        id: id || `usr-${Date.now()}`,
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
      startTransition(() => {
        router.refresh();
      });
    };

    window.addEventListener('team-member-created', handleMemberCreated);
    return () => window.removeEventListener('team-member-created', handleMemberCreated);
  }, [currentUserId, router]);

  // Toast notice auto-dismiss
  useEffect(() => {
    if (toastNotice) {
      const timer = setTimeout(() => setToastNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastNotice]);

  // Compute live counts for category underline tabs
  const tabCounts: TabCounts = useMemo(() => {
    return {
      all: roster.length,
      leadership: roster.filter((m) => m.role === 'admin').length,
      sales: roster.filter((m) => m.role === 'sales_executive').length,
      suspended: roster.filter((m) => m.status === 'suspended').length,
    };
  }, [roster]);

  // Filter roster items based on category tab, search query, role, and status
  const filteredRoster = useMemo(() => {
    return roster.filter((member) => {
      // 1. Underlined Category Tab Filter
      if (activeTab === 'leadership' && member.role !== 'admin') return false;
      if (activeTab === 'sales' && member.role !== 'sales_executive') return false;
      if (activeTab === 'suspended' && member.status !== 'suspended') return false;

      // 2. Role Dropdown Filter
      if (selectedRole !== 'all' && member.role !== selectedRole) return false;

      // 3. Status Dropdown Filter
      if (selectedStatus !== 'all' && member.status !== selectedStatus) return false;

      // 4. Case-insensitive Search Query Filter
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

  const handleResetFilters = (): void => {
    setActiveTab('all');
    setSearchQuery('');
    setSelectedRole('all');
    setSelectedStatus('all');
  };

  // Avatar Modal Handlers
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
    setToastNotice('Profile photo updated successfully.');
  };

  // Permissions Updated Handler
  const handlePermissionsUpdated = (userId: string, newTabs: string[]): void => {
    setRoster((prev) =>
      prev.map((m) => (m.id === userId ? { ...m, allowed_tabs: newTabs } : m))
    );
    setMemberForPermissions(null);
    setToastNotice('Tab access permissions updated.');
    startTransition(() => {
      router.refresh();
    });
  };

  // Lead Reassignment Success Handler
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
    setToastNotice(`Successfully transferred ${reassignedCount} leads.`);
    startTransition(() => {
      router.refresh();
    });
  };

  // Suspend Success Handler
  const handleSuspendSuccess = (_updatedProfile: Profile, suspendedUserId: string): void => {
    setRoster((prev) =>
      prev.map((m) => (m.id === suspendedUserId ? { ...m, status: 'suspended' } : m))
    );
    setMemberForSuspend(null);
    setToastNotice('Account suspended.');
    startTransition(() => {
      router.refresh();
    });
  };

  // Reactivate User Handler
  const handleReactivateUser = async (member: TeamMemberRosterItem): Promise<void> => {
    try {
      const res = await setTeamUserStatus(member.id, 'active');
      if (res.success) {
        setRoster((prev) =>
          prev.map((m) => (m.id === member.id ? { ...m, status: 'active' } : m))
        );
        setToastNotice(`Account for ${member.full_name} reactivated.`);
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      setToastNotice('Failed to reactivate account.');
    }
  };

  return (
    <>
      {/* PrimeStay Underlined Category Tabs & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <CategoryUnderlineTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={tabCounts}
        />

        {isAdmin && (
          <button
            type="button"
            className={styles.primaryActionButton}
            onClick={() => window.dispatchEvent(new CustomEvent('open-add-member-drawer'))}
            aria-label="Open add team member drawer"
            style={{ marginBottom: '1.5rem' }}
          >
            <svg
              width="15"
              height="15"
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
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* Filter and View Mode Toolbar */}
      <FilterControlToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Toast Notification Banner */}
      {toastNotice && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: '0.65rem 1rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#34d399',
            borderRadius: '8px',
            fontSize: '0.82rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Main Roster Enclave: 4-Column Card Grid vs. Compact Table */}
      {viewMode === 'grid' ? (
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
      ) : (
        <CommercialDirectoryTable
          initialRoster={filteredRoster}
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
        />
      )}

      {/* Modal 1: Profile Photo Upload, Crop & Delete Modal */}
      {avatarTarget && (
        <AvatarUploadModal
          isOpen={Boolean(avatarTarget)}
          targetMember={avatarTarget}
          onClose={() => setAvatarTarget(null)}
          onAvatarSaved={handleAvatarSaved}
        />
      )}

      {/* Modal 2: Granular Tab Permissions Modal */}
      {memberForPermissions && (
        <EditUserPermissionsModal
          isOpen={Boolean(memberForPermissions)}
          targetMember={memberForPermissions}
          currentUserId={currentUserId}
          onClose={() => setMemberForPermissions(null)}
          onPermissionsUpdated={handlePermissionsUpdated}
        />
      )}

      {/* Modal 3: Lead Reassignment Wizard */}
      {memberForReassignment && (
        <LeadReassignmentWizardModal
          isOpen={Boolean(memberForReassignment)}
          sourceMember={memberForReassignment}
          activeRoster={roster.filter((m) => m.id !== memberForReassignment.id && m.status === 'active')}
          onClose={() => setMemberForReassignment(null)}
          onSuccess={handleReassignmentSuccess}
        />
      )}

      {/* Modal 4: Account Suspension Modal */}
      {memberForSuspend && (
        <SuspendUserModal
          isOpen={Boolean(memberForSuspend)}
          member={memberForSuspend}
          onClose={() => setMemberForSuspend(null)}
          onSuccess={handleSuspendSuccess}
        />
      )}
    </>
  );
}
