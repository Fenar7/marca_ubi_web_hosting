'use client';

/**
 * @file AdminWorkspaceShell.tsx
 * @description Master Client Container managing layout geometry, sidebar collapse preferences,
 *              centered luxury modal surfaces, and CSS custom variable injection across the CRM workspace.
 * @architecture Encapsulates persistent UI state (`localStorage`), keyboard shortcuts (`⌘B`, `⌘L`, `⌘M`),
 *               and provides the unified layout grid and modal command center for all CRM routes.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminMobileDrawer } from './AdminMobileDrawer';
import { NewLeadModal } from '@/app/admin/components/modals/NewLeadModal';
import { LeadDetailModal } from '@/app/admin/components/modals/LeadDetailModal';
import { AddTeamMemberModal } from '@/app/admin/components/modals/AddTeamMemberModal';
import {
  CredentialRevealModal,
  type ProvisionedCredentialsPayload,
} from '@/app/admin/(workspace)/team/components/CredentialRevealModal';
import type { CurrentUserSession } from './UserProfileDropdown';
import styles from './AdminWorkspace.module.scss';

// Backward compatibility aliases for existing imports and assertions
export { LeadDetailModal as LeadDetailDrawer } from '@/app/admin/components/modals/LeadDetailModal';
export { NewLeadModal as NewLeadDrawer } from '@/app/admin/components/modals/NewLeadModal';
export { AddTeamMemberModal as AddTeamMemberDrawer } from '@/app/admin/components/modals/AddTeamMemberModal';

interface AdminWorkspaceShellProps {
  currentUser: CurrentUserSession;
  children: React.ReactNode;
}

/**
 * Synchronizes URL query parameters (?leadId=...) with the Centered Client 360 Modal.
 * Encapsulated inside a Suspense boundary to prevent App Router hydration mismatches.
 */
function LeadUrlSync({
  onLeadIdFound,
}: {
  onLeadIdFound: (leadId: string) => void;
}): null {
  const searchParams = useSearchParams();

  useEffect(() => {
    const leadId = searchParams.get('leadId');
    if (leadId) {
      if (
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/admin/leads')
      ) {
        // Leads workspace mounts ClientDossierDrawer directly; dispatch open-lead-drawer
        window.dispatchEvent(
          new CustomEvent('open-lead-drawer', { detail: { leadId } })
        );
      } else {
        onLeadIdFound(leadId);
      }
    }
  }, [searchParams, onLeadIdFound]);

  return null;
}

export function AdminWorkspaceShell({
  currentUser,
  children,
}: AdminWorkspaceShellProps): React.ReactElement {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState<boolean>(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState<boolean>(false);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState<boolean>(false);
  const [revealedCredentials, setRevealedCredentials] = useState<ProvisionedCredentialsPayload | null>(null);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState<boolean>(false);

  // Restore sidebar collapse preference from localStorage upon client hydration
  useEffect(() => {
    try {
      const stored = localStorage.getItem('marca_crm_sidebar_collapsed');
      if (stored !== null) {
        setIsCollapsed(stored === 'true');
      }
    } catch {
      // Invariant: gracefully fall back in restricted incognito or embedded iframe contexts
    }
  }, []);

  const toggleSidebar = useCallback((): void => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('marca_crm_sidebar_collapsed', String(next));
      } catch {
        // Storage access fallback
      }
      return next;
    });
  }, []);

  const handleOpenLead = useCallback((id: string) => {
    setActiveLeadId(id);
    setIsLeadModalOpen(true);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('leadId') !== id) {
        url.searchParams.set('leadId', id);
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    }
  }, []);

  const handleCloseLeadModal = useCallback(() => {
    setIsLeadModalOpen(false);
    setActiveLeadId(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('leadId')) {
        url.searchParams.delete('leadId');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }
    }
  }, []);

  // Listen to open-lead-modal and open-lead-drawer custom events dispatched across any workspace
  useEffect(() => {
    const handleOpenLeadEvent = (e: Event): void => {
      const customEvt = e as CustomEvent<{ leadId?: string } | string>;
      const id =
        typeof customEvt.detail === 'string'
          ? customEvt.detail
          : customEvt.detail?.leadId;
      if (id) {
        // If already on /admin/leads, the LeadsWorkspaceClient mounts ClientDossierDrawer directly
        if (
          e.type === 'open-lead-drawer' &&
          typeof window !== 'undefined' &&
          window.location.pathname.startsWith('/admin/leads')
        ) {
          return;
        }
        handleOpenLead(id);
      }
    };

    window.addEventListener('open-lead-modal', handleOpenLeadEvent);
    window.addEventListener('open-lead-drawer', handleOpenLeadEvent);
    return () => {
      window.removeEventListener('open-lead-modal', handleOpenLeadEvent);
      window.removeEventListener('open-lead-drawer', handleOpenLeadEvent);
    };
  }, [handleOpenLead]);

  // Listen to open-new-lead-modal and open-new-lead-drawer custom events dispatched by quick action buttons
  useEffect(() => {
    const handleOpenNewLead = (): void => {
      if (currentUser.role !== 'viewer') {
        setIsNewLeadModalOpen(true);
      }
    };

    window.addEventListener('open-new-lead-modal', handleOpenNewLead);
    window.addEventListener('open-new-lead-drawer', handleOpenNewLead);
    return () => {
      window.removeEventListener('open-new-lead-modal', handleOpenNewLead);
      window.removeEventListener('open-new-lead-drawer', handleOpenNewLead);
    };
  }, [currentUser.role]);

  // Listen to open-add-member-modal and open-add-member-drawer custom events dispatched by header / workspace buttons
  useEffect(() => {
    const handleOpenAddMember = (): void => {
      if (currentUser.role === 'admin') {
        setIsAddMemberModalOpen(true);
      }
    };

    window.addEventListener('open-add-member-modal', handleOpenAddMember);
    window.addEventListener('open-add-member-drawer', handleOpenAddMember);
    return () => {
      window.removeEventListener('open-add-member-modal', handleOpenAddMember);
      window.removeEventListener('open-add-member-drawer', handleOpenAddMember);
    };
  }, [currentUser.role]);

  // Global keyboard shortcuts: ⌘B toggles rail, ⌘L opens New Lead modal, ⌘M opens Add Member modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        if (currentUser.role !== 'viewer') {
          setIsNewLeadModalOpen((prev) => !prev);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (currentUser.role === 'admin') {
          setIsAddMemberModalOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, currentUser.role]);

  return (
    <div
      className={styles.layoutRoot}
      style={
        {
          '--sidebar-width': isCollapsed ? '72px' : '260px',
        } as React.CSSProperties
      }
    >
      {/* Desktop Sticky Rail Navigation */}
      <AdminSidebar
        currentUser={currentUser}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Mobile Off-Canvas Drawer (Screens < 1024px) */}
      <AdminMobileDrawer
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        currentUser={currentUser}
      />

      {/* Main Viewport Enclave */}
      <div className={styles.mainViewport}>
        <AdminHeader
          currentUser={currentUser}
          onOpenMobileNav={() => setIsMobileOpen(true)}
        />
        <main className={styles.contentContainer} id="main-content">
          {children}
        </main>
      </div>

      {/* Centered New Client Engagement Modal (re-exported as NewLeadDrawer for backward compatibility) */}
      {currentUser.role !== 'viewer' && (
        <NewLeadModal
          isOpen={isNewLeadModalOpen}
          onClose={() => setIsNewLeadModalOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* Centered Administrative Team Member Provisioning Modal (re-exported as AddTeamMemberDrawer) */}
      {currentUser.role === 'admin' && (
        <AddTeamMemberModal
          isOpen={isAddMemberModalOpen}
          onClose={() => setIsAddMemberModalOpen(false)}
          onUserCreated={(credentials) => {
            setRevealedCredentials(credentials);
            setIsCredentialModalOpen(true);
          }}
        />
      )}

      {/* One-Time Credential Reveal Modal */}
      <CredentialRevealModal
        isOpen={isCredentialModalOpen}
        credentials={revealedCredentials}
        onClose={() => {
          setIsCredentialModalOpen(false);
          setRevealedCredentials(null);
        }}
      />

      {/* URL Synchronization Bridge for Centered Client 360 Modal */}
      <Suspense fallback={null}>
        <LeadUrlSync onLeadIdFound={handleOpenLead} />
      </Suspense>

      {/* Centered Client 360 Lead Detail Dossier Modal (re-exported as LeadDetailDrawer) */}
      <LeadDetailModal
        leadId={activeLeadId}
        isOpen={isLeadModalOpen}
        onClose={handleCloseLeadModal}
        currentUser={currentUser}
        onLeadUpdated={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('lead-data-mutated', { detail: activeLeadId })
            );
          }
        }}
      />
    </div>
  );
}
export type { CurrentUserSession };
