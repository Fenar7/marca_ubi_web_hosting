'use client';

/**
 * @file PersonnelProfileWorkspaceClient.tsx
 * @description Orchestrator for the dedicated personnel profile and performance workspace (/admin/team/[id]).
 *              Manages real-time modal coordination, breadcrumb title dispatching,
 *              and reactive state synchronization.
 * @module app/admin/team/[id]/components/PersonnelProfileWorkspaceClient
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type {
  PersonnelProfilePayload,
  TeamMemberRosterItem,
} from '@/types/crm';
import { AvatarUploadModal } from '@/app/admin/(workspace)/team/components/AvatarUploadModal';
import { EditUserPermissionsModal } from '@/app/admin/(workspace)/team/components/EditUserPermissionsModal';
import { ExecutiveMasthead } from './ExecutiveMasthead';
import { CommercialVelocityScorecards } from './CommercialVelocityScorecards';
import { RepresentativeDealLedger } from './RepresentativeDealLedger';
import { PersonnelSecurityEnclave } from './PersonnelSecurityEnclave';
import { TabPermissionsEnclave } from './TabPermissionsEnclave';
import { PersonnelAuditTimeline } from './PersonnelAuditTimeline';
import styles from '../page.module.scss';

interface PersonnelProfileWorkspaceClientProps {
  initialPayload: PersonnelProfilePayload;
  currentUserId: string;
}

export function PersonnelProfileWorkspaceClient({
  initialPayload,
  currentUserId,
}: PersonnelProfileWorkspaceClientProps): React.ReactElement {
  const pathname = usePathname();
  const [profile, setProfile] = useState(initialPayload.profile);
  const { kpis, auditLogs } = initialPayload;
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState<boolean>(false);

  // Dispatch dynamic breadcrumb label override so navigation reads: Marca Ubi / Administration / User Management / [Full Name]
  useEffect(() => {
    if (typeof window !== 'undefined' && pathname && profile.full_name) {
      window.dispatchEvent(
        new CustomEvent('admin-breadcrumb-label-update', {
          detail: {
            path: pathname,
            label: profile.full_name,
          },
        })
      );
    }
  }, [pathname, profile.full_name]);

  const handleAvatarSaved = (newAvatarUrl: string | null): void => {
    setProfile((prev) => ({
      ...prev,
      avatar_url: newAvatarUrl,
    }));
    setIsAvatarModalOpen(false);
  };

  const handlePermissionsUpdated = (targetUserId: string, newTabs: string[]): void => {
    setProfile((prev) => ({
      ...prev,
      allowed_tabs: newTabs,
    }));
    setIsPermissionsModalOpen(false);
  };

  const rosterContext: TeamMemberRosterItem = {
    ...profile,
    active_deals_count: kpis.activeDealsCount,
    total_deal_value: kpis.activePipelineValue + kpis.wonRevenue,
    invited_by_name: initialPayload.invited_by_name,
  };

  return (
    <div className={styles.workspaceContainer}>
      {/* Top Bar Navigation */}
      <div className={styles.topBarNavigation}>
        <Link href="/admin/team" className={styles.backLink} title="Return to Team Directory">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>All Personnel</span>
        </Link>

        <div
          className={`${styles.statusIndicatorTag} ${
            profile.status === 'active' ? styles.active : styles.suspended
          }`}
        >
          <span
            className={`${styles.statusDot} ${
              profile.status === 'active' ? styles.dotActive : styles.dotSuspended
            }`}
          />
          <span>{profile.status === 'active' ? 'Operational' : 'Suspended'}</span>
        </div>
      </div>

      {/* 8:4 Asymmetric Operational Layout */}
      <div className={styles.asymmetricGrid}>
        {/* Left Column (8 units): Identity, Scorecards, Deal Ledger */}
        <div className={styles.mainColumn}>
          <ExecutiveMasthead
            profile={profile}
            invitedByName={initialPayload.invited_by_name}
            canEditAvatar={initialPayload.canEdit || initialPayload.isSelf}
            onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
          />

          <CommercialVelocityScorecards kpis={kpis} />

          <RepresentativeDealLedger userId={profile.id} />
        </div>

        {/* Right Column (4 units): Security Enclave, Tab Permissions, Audit Timeline */}
        <div className={styles.sideColumn}>
          <PersonnelSecurityEnclave
            profile={profile}
            canEdit={initialPayload.canEdit}
            isSelf={initialPayload.isSelf}
          />

          <TabPermissionsEnclave
            profile={profile}
            canEdit={initialPayload.canEdit}
            onOpenPermissionsModal={() => setIsPermissionsModalOpen(true)}
          />

          {initialPayload.canEdit && <PersonnelAuditTimeline auditLogs={auditLogs} />}
        </div>
      </div>

      {/* Reused Modals */}
      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        targetMember={{
          id: profile.id,
          name: profile.full_name,
          avatarUrl: profile.avatar_url,
        }}
        onAvatarSaved={handleAvatarSaved}
      />

      <EditUserPermissionsModal
        isOpen={isPermissionsModalOpen}
        targetMember={rosterContext}
        currentUserId={currentUserId}
        onClose={() => setIsPermissionsModalOpen(false)}
        onPermissionsUpdated={handlePermissionsUpdated}
      />
    </div>
  );
}
