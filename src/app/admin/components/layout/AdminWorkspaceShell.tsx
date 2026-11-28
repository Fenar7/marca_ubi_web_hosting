"use client";

/**
 * @file AdminWorkspaceShell.tsx
 * @description Master Client Container managing layout geometry, sidebar collapse preferences,
 *              centered luxury modal surfaces, and CSS custom variable injection across the CRM workspace.
 * @architecture Encapsulates persistent UI state (`localStorage`), keyboard shortcuts (`⌘B`, `⌘L`, `⌘M`),
 *               and provides the unified layout grid and modal command center for all CRM routes.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useEffect, useCallback, useSyncExternalStore, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminMobileDrawer } from "./AdminMobileDrawer";
import { WorkspaceLauncher } from "./WorkspaceLauncher";
import { isTabAuthorized } from "./navigationConfig";
import { NewLeadModal } from "@/app/admin/components/modals/NewLeadModal";
import { AddTeamMemberModal } from "@/app/admin/components/modals/AddTeamMemberModal";
import {
  CredentialRevealModal,
  type ProvisionedCredentialsPayload,
} from "@/app/admin/(workspace)/team/components/CredentialRevealModal";
import type { CurrentUserSession } from "./UserProfileDropdown";
import styles from "./admin-shell.module.scss";

// Backward compatibility aliases for existing imports and assertions
export { ClientDossierDrawer as LeadDetailDrawer } from "@/app/admin/components/DossierDrawer";
export { NewLeadModal as NewLeadDrawer } from "@/app/admin/components/modals/NewLeadModal";
export { AddTeamMemberModal as AddTeamMemberDrawer } from "@/app/admin/components/modals/AddTeamMemberModal";

interface AdminWorkspaceShellProps {
  currentUser: CurrentUserSession;
  children: React.ReactNode;
  dueTasksCount?: number;
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
    const leadId = searchParams.get("id") || searchParams.get("leadId");
    if (leadId) {
      onLeadIdFound(leadId);
    }
  }, [searchParams, onLeadIdFound]);

  return null;
}

export function AdminWorkspaceShell(
  props: AdminWorkspaceShellProps,
): React.ReactElement {
  const pathname = usePathname();
  return <AdminWorkspaceShellState key={pathname} {...props} />;
}

const SIDEBAR_SYNC_EVENT = "marca-sidebar-collapse-sync";

function subscribeSidebarCollapse(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(SIDEBAR_SYNC_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SIDEBAR_SYNC_EVENT, callback);
  };
}

function getSidebarCollapsedSnapshot(): boolean {
  try {
    return localStorage.getItem("marca_crm_sidebar_collapsed") === "true";
  } catch {
    return false;
  }
}

function AdminWorkspaceShellState({
  currentUser,
  children,
  dueTasksCount,
}: AdminWorkspaceShellProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const isOverview = pathname === "/admin";
  const isCollapsed = useSyncExternalStore(
    subscribeSidebarCollapse,
    getSidebarCollapsedSnapshot,
    () => false,
  );
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const closeMobileNav = useCallback(() => setIsMobileOpen(false), []);
  // A launcher opened from the account menu replaces mobile navigation rather than nesting focus traps.
  useEffect(() => {
    window.addEventListener("open-command-palette", closeMobileNav);
    return () =>
      window.removeEventListener("open-command-palette", closeMobileNav);
  }, [closeMobileNav]);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState<boolean>(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] =
    useState<boolean>(false);
  const [revealedCredentials, setRevealedCredentials] =
    useState<ProvisionedCredentialsPayload | null>(null);
  const [isCredentialModalOpen, setIsCredentialModalOpen] =
    useState<boolean>(false);
  // Route-keyed remounting clears route-scoped overlays; this cleanup releases scroll lock.
  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
      }
    };
  }, []);

  const toggleSidebar = useCallback((): void => {
    const next = !getSidebarCollapsedSnapshot();
    try {
      localStorage.setItem("marca_crm_sidebar_collapsed", String(next));
      window.dispatchEvent(new Event(SIDEBAR_SYNC_EVENT));
    } catch {
      // Invariant: gracefully fall back in restricted incognito or embedded iframe contexts
    }
  }, []);

  const navigateToLeadCommandPage = useCallback(
    (id: string) => {
      const isDeals =
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/admin/deals");
      const targetRoute = isDeals ? `/admin/deals/${id}` : `/admin/leads/${id}`;
      router.push(targetRoute);
    },
    [router],
  );

  // Route open-lead-modal / open-lead-drawer events directly to the full-page dossier workspace
  useEffect(() => {
    const handleOpenLeadEvent = (e: Event): void => {
      const customEvt = e as CustomEvent<{ leadId?: string; id?: string } | string>;
      const id =
        typeof customEvt.detail === "string"
          ? customEvt.detail
          : customEvt.detail?.leadId || customEvt.detail?.id;
      if (id) {
        navigateToLeadCommandPage(id);
      }
    };

    window.addEventListener("open-lead-modal", handleOpenLeadEvent);
    window.addEventListener("open-lead-drawer", handleOpenLeadEvent);
    return () => {
      window.removeEventListener("open-lead-modal", handleOpenLeadEvent);
      window.removeEventListener("open-lead-drawer", handleOpenLeadEvent);
    };
  }, [navigateToLeadCommandPage]);

  // Listen to open-new-lead-modal and open-new-lead-drawer custom events dispatched by quick action buttons
  useEffect(() => {
    const handleOpenNewLead = (): void => {
      if (
        currentUser.role !== "viewer" &&
        isTabAuthorized("leads", currentUser)
      ) {
        setIsNewLeadModalOpen(true);
      }
    };

    window.addEventListener("open-new-lead-modal", handleOpenNewLead);
    window.addEventListener("open-new-lead-drawer", handleOpenNewLead);
    return () => {
      window.removeEventListener("open-new-lead-modal", handleOpenNewLead);
      window.removeEventListener("open-new-lead-drawer", handleOpenNewLead);
    };
  }, [currentUser]);

  // Listen to open-add-member-modal and open-add-member-drawer custom events dispatched by header / workspace buttons
  useEffect(() => {
    const handleOpenAddMember = (): void => {
      if (
        currentUser.role === "admin" &&
        isTabAuthorized("users", currentUser)
      ) {
        setIsAddMemberModalOpen(true);
      }
    };

    window.addEventListener("open-add-member-modal", handleOpenAddMember);
    window.addEventListener("open-add-member-drawer", handleOpenAddMember);
    return () => {
      window.removeEventListener("open-add-member-modal", handleOpenAddMember);
      window.removeEventListener("open-add-member-drawer", handleOpenAddMember);
    };
  }, [currentUser]);

  // Global keyboard shortcuts: ⌘B toggles rail, ⌘L opens New Lead modal, ⌘M opens Add Member modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement | null;
      if (
        target?.closest(
          'input, textarea, select, [contenteditable="true"], [role="dialog"], dialog[open]',
        )
      )
        return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "l") {
        const target = e.target as HTMLElement | null;
        if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
          return;
        e.preventDefault();
        if (
          currentUser.role !== "viewer" &&
          isTabAuthorized("leads", currentUser)
        ) {
          setIsNewLeadModalOpen(true);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "m") {
        const target = e.target as HTMLElement | null;
        if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
          return;
        e.preventDefault();
        if (currentUser.role === "admin") {
          setIsAddMemberModalOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar, currentUser]);

  return (
    <div
      className={styles.layoutRoot}
      style={
        {
          "--sidebar-width": isCollapsed ? "72px" : "240px",
        } as React.CSSProperties
      }
    >
      <a href="#main-content" className={styles.skipLink}>
        Skip to workspace content
      </a>
      <WorkspaceLauncher currentUser={currentUser} />
      <AdminSidebar
        currentUser={currentUser}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleSidebar}
        dueTasksCount={dueTasksCount}
      />

      {/* Mobile Off-Canvas Drawer (Screens < 1024px) */}
      <AdminMobileDrawer
        isOpen={isMobileOpen}
        onClose={closeMobileNav}
        currentUser={currentUser}
        dueTasksCount={dueTasksCount}
      />

      {/* Main Viewport Enclave */}
      <div
        className={`${styles.mainViewport} ${isOverview ? styles.overviewViewport : ""}`}
        inert={isMobileOpen}
      >
        <AdminHeader
          isMobileNavOpen={isMobileOpen}
          onOpenMobileNav={() => setIsMobileOpen(true)}
          className={isOverview ? styles.overviewHeader : undefined}
        />
        <main className={styles.contentContainer} id="main-content">
          {children}
        </main>
      </div>

      {/* Centered New Client Engagement Modal (re-exported as NewLeadDrawer for backward compatibility) */}
      {currentUser.role !== "viewer" &&
        isTabAuthorized("leads", currentUser) && (
          <NewLeadModal
            isOpen={isNewLeadModalOpen}
            onClose={() => setIsNewLeadModalOpen(false)}
            currentUser={currentUser}
          />
        )}

      {/* Centered Administrative Team Member Provisioning Modal (re-exported as AddTeamMemberDrawer) */}
      {currentUser.role === "admin" && (
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

      {/* URL Synchronization Bridge redirecting legacy deep links to the Command Page */}
      <Suspense fallback={null}>
        <LeadUrlSync onLeadIdFound={navigateToLeadCommandPage} />
      </Suspense>
    </div>
  );
}
export type { CurrentUserSession };
