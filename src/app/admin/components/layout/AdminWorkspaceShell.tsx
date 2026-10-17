'use client';

/**
 * @file AdminWorkspaceShell.tsx
 * @description Master Client Container managing layout geometry, sidebar collapse preferences,
 *              responsive drawers, and CSS custom variable injection across the CRM workspace.
 * @architecture Encapsulates persistent UI state (`localStorage`), keyboard shortcuts (`⌘B`),
 *               and provides the unified layout grid for all authenticated CRM routes.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminMobileDrawer } from './AdminMobileDrawer';
import { NewLeadDrawer } from './NewLeadDrawer';
import { AddTeamMemberDrawer } from '@/app/admin/(workspace)/team/components/AddTeamMemberDrawer';
import {
  CredentialRevealModal,
  type ProvisionedCredentialsPayload,
} from '@/app/admin/(workspace)/team/components/CredentialRevealModal';
import type { CurrentUserSession } from './UserProfileDropdown';
import styles from './AdminWorkspace.module.scss';

interface AdminWorkspaceShellProps {
  currentUser: CurrentUserSession;
  children: React.ReactNode;
}

export function AdminWorkspaceShell({
  currentUser,
  children,
}: AdminWorkspaceShellProps): React.ReactElement {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isNewLeadDrawerOpen, setIsNewLeadDrawerOpen] = useState<boolean>(false);
  const [isAddMemberDrawerOpen, setIsAddMemberDrawerOpen] = useState<boolean>(false);
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

  // Listen to open-new-lead-drawer custom events dispatched by sidebar / header buttons
  useEffect(() => {
    const handleOpenDrawer = (): void => {
      if (currentUser.role !== 'viewer') {
        setIsNewLeadDrawerOpen(true);
      }
    };

    window.addEventListener('open-new-lead-drawer', handleOpenDrawer);
    return () => window.removeEventListener('open-new-lead-drawer', handleOpenDrawer);
  }, [currentUser.role]);

  // Listen to open-add-member-drawer custom events dispatched by header / workspace buttons
  useEffect(() => {
    const handleOpenAddMember = (): void => {
      if (currentUser.role === 'admin') {
        setIsAddMemberDrawerOpen(true);
      }
    };

    window.addEventListener('open-add-member-drawer', handleOpenAddMember);
    return () => window.removeEventListener('open-add-member-drawer', handleOpenAddMember);
  }, [currentUser.role]);

  // Global keyboard shortcuts: ⌘B / Ctrl+B toggles rail, ⌘L / Ctrl+L opens New Lead drawer, ⌘M / Ctrl+M opens Add Member drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        if (currentUser.role !== 'viewer') {
          setIsNewLeadDrawerOpen((prev) => !prev);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (currentUser.role === 'admin') {
          setIsAddMemberDrawerOpen((prev) => !prev);
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

      {/* New Client Engagement Drawer */}
      {currentUser.role !== 'viewer' && (
        <NewLeadDrawer
          isOpen={isNewLeadDrawerOpen}
          onClose={() => setIsNewLeadDrawerOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* Administrative Team Member Provisioning Drawer */}
      {currentUser.role === 'admin' && (
        <AddTeamMemberDrawer
          isOpen={isAddMemberDrawerOpen}
          onClose={() => setIsAddMemberDrawerOpen(false)}
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
    </div>
  );
}
export type { CurrentUserSession };
