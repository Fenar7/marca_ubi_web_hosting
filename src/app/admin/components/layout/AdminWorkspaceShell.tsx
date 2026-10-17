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

  // Global keyboard shortcuts: ⌘B / Ctrl+B toggles navigation rail
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

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
    </div>
  );
}
export type { CurrentUserSession };
