# Marca Ubi — Enterprise Agency CRM & Sales Intelligence Platform
## Technical Architecture Specification: CRM Workspace Shell, Persistent Navigation & Admin Layout
**Document ID:** `SPEC-MARCA-CRM-WORKSPACE-SHELL-01`  
**Target Release:** Production Phase 1 (Enterprise-Grade CRM Foundation)  
**Primary Stack:** Next.js 16 (App Router, Turbopack, React 19) + Supabase SSR + SCSS Modules  
**Author:** Staff UI/UX Designer & CRM Systems Architect  
**Classification:** Internal Commercial Engineering Architecture Specification  

---

### Executive Summary & Problem Diagnosis

During live verification of the Marca Ubi CRM portal at `http://localhost:3002/admin`, the user authenticated as `admin@marcaubi.com` and encountered a bare black screen containing only an isolated debug card stating *"Session Authenticated - Your administrative identity has been cryptographically validated..."* (Evidence: `Screenshot 2026-10-17 105723.png`).

Furthermore:
1. **Zero Workspace Shell or Navigation**: There is no persistent left sidebar, no top header utility bar, no breadcrumbs, and no navigation links to access the Commercial Personnel Directory (`/admin/team`) or incoming pipeline modules.
2. **Raw 404 Error on Direct Traversal**: Navigating directly to `/admin/tasks` triggers a raw Next.js 404 "Page Not Found" screen.
3. **Fragmented Page Implementations**: While `/admin/team` was engineered with high-density Stripe Scorecards and an interactive personnel roster, it operates in complete isolation with its own standalone `<main>` container and hardcoded "Back to Command Center" link rather than living inside a unified persistent layout shell.

This specification provides the root-cause diagnosis, Next.js 16 route group architecture, component blueprints, design token mappings, and step-by-step engineering rollout to elevate `/admin` into an enterprise-grade dark luxury CRM workspace shell.

---

### 1. Root Cause Analysis

```
CURRENT REPOSITORY HIERARCHY (FRAGMENTED):
src/app/
├── layout.tsx                <-- Root public agency layout (Lenis, fonts, global.scss)
├── admin/
    ├── page.tsx              <-- Standalone page with INLINE STYLES rendering debug card only
    ├── login/page.tsx        <-- Standalone unauthenticated auth screen
    ├── reset-password/page.tsx<-- Standalone first-login password reset
    ├── team/page.tsx         <-- Standalone page rendering its own <main> and header
    └── (NO layout.tsx!)      <-- Missing layout boundary entirely!
```

#### 1.1 The Missing Layout Boundary
In Next.js App Router (Next.js 16), persistent navigation elements (sidebars, app rails, headers) must be declared in a `layout.tsx` file. Because `src/app/admin/layout.tsx` does not exist:
* Next.js renders `/admin` and `/admin/team` directly inside the root `src/app/layout.tsx` (the marketing website layout).
* Every page navigation triggers a full DOM dismount and unmount of the page tree, making persistent state, sidebar collapse memory, and seamless route transitions impossible.

#### 1.2 The Route Group Dilemma (Auth vs. Authenticated Workspace)
A naive creation of `src/app/admin/layout.tsx` at the root of `admin/` would inadvertently wrap the unauthenticated `/admin/login` and `/admin/reset-password` routes with the CRM sidebar and header. 
To prevent this without altering URL slugs, Next.js 16 provides **Route Groups** via parenthesis syntax `(groupName)`:
* `src/app/admin/(workspace)/layout.tsx` encapsulates authenticated CRM routes (`/admin`, `/admin/team`, `/admin/leads`, `/admin/tasks`, `/admin/analytics`, `/admin/settings`).
* `src/app/admin/login` and `src/app/admin/reset-password` remain outside the `(workspace)` group and retain their standalone, high-security visual presentation.
* The public URL paths remain completely unchanged (e.g., `http://localhost:3002/admin` and `http://localhost:3002/admin/team`).

#### 1.3 The `/admin/tasks` 404 Root Cause
The file `src/app/admin/tasks/page.tsx` does not exist on disk. Navigating to `/admin/tasks` produces a raw Next.js 404 error. The workspace shell must provide a dedicated route and structured graceful placeholder component for upcoming phases so that navigation across the sidebar never breaks or disorients the user.

---

### 2. Architectural Blueprint & Target File Hierarchy

```
src/app/admin/
├── (workspace)/                               <-- Route Group (does not alter URL paths)
│   ├── layout.tsx                             <-- Master CRM Workspace Shell (Server Component)
│   ├── workspace.module.scss                  <-- Layout grid & CSS variable definitions
│   ├── page.tsx                               <-- Executive Pipeline Command Center (/admin)
│   ├── team/
│   │   ├── page.tsx                           <-- Commercial Personnel Directory (/admin/team)
│   │   ├── team.module.scss
│   │   └── components/
│   ├── tasks/
│   │   ├── page.tsx                           <-- Follow-up Scheduler & Overdue Tasks (/admin/tasks)
│   │   └── tasks.module.scss
│   ├── analytics/
│   │   └── page.tsx                           <-- Dedicated Commercial Analytics (/admin/analytics)
│   └── settings/
│       └── page.tsx                           <-- System Governance & Security Logs (/admin/settings)
├── components/
│   └── layout/
│       ├── AdminWorkspaceShell.tsx            <-- Client shell managing responsive sidebar state
│       ├── AdminSidebar.tsx                   <-- Desktop collapsible rail with active route states
│       ├── AdminSidebar.module.scss
│       ├── AdminHeader.tsx                    <-- Top utility rail (breadcrumbs, search, profile)
│       ├── AdminHeader.module.scss
│       ├── AdminBreadcrumbs.tsx               <-- Dynamic route path resolver
│       ├── AdminBreadcrumbs.module.scss
│       ├── AdminMobileDrawer.tsx              <-- Mobile off-canvas slide-out sheet (< 1024px)
│       ├── AdminMobileDrawer.module.scss
│       ├── UserProfileDropdown.tsx            <-- Identity card, role badge, session logout
│       └── RoutePlaceholder.tsx               <-- Graceful phase roadmap view for pending modules
├── login/
│   ├── page.tsx                               <-- Preserved standalone auth screen
│   └── login.module.scss
└── reset-password/
    ├── page.tsx                               <-- Preserved standalone password reset
    └── reset-password.module.scss
```

---

### 3. Visual Language & Marca Ubi Dark Luxury Design Tokens

The workspace shell strictly adheres to **Marca Ubi Brand Soul** (`DESIGN.md`) and **Master UI/UX Design System** (`master-ui-ux-design-system/SKILL.md`):

```yaml
Design Read:
  Liveliness Dial: ENERGY 2 / RHYTHM 2 / MOTION 1
  Palette: Obsidian Base (#000000, #0b0b0b) | Specular Card (#111111) | Accent (#ff6100)
  Border Physics: Hairline Specular (1px solid rgba(255, 255, 255, 0.08))
  Typography: SF Pro Display / Text + Tabular Numerals (tabular-nums) + SF Mono
  Archetypes:
    - Sidebar & Navigation: Linear Fluid Cards (dense 36-40px rhythm, ambient highlight)
    - Header & Floating Bars: Apple HIG Vibrancy (backdrop-filter: blur(24px), top specular sheen)
    - Badges & Role Tokens: Raycast Monospace Tokens (compact 6px radius, radar indicator)
    - KPI Elements: Stripe Scorecards (tabular values, specular rims, delta pills)
```

#### 3.1 Zero-Tolerance Anti-AI-Slop Governance
1. **Zero Generic Blue**: Strictly no `#2563eb` or standard blue button defaults.
2. **Zero Nested Bento Clutter**: The layout shell provides clean framing without nesting bordered boxes within bordered boxes.
3. **Zero Toy Emojis**: All navigation and status items use bespoke 1.5px stroke SVG micro-vectors or glowing radar status dots.
4. **Zero AI Buzzwords**: Clean, direct enterprise terminology: "Commercial Directory", "Pipeline & Deals", "Follow-up Queue".
5. **Zero Em-Dashes (`—`) in UI copy**: Comma, dot, or bracket formatting only.
6. **Strict Keyboard & Accessibility Ergonomics**: Focus rings (`outline: 2px solid #ff6100`), full ARIA navigation roles, and `active: scale(0.98)` tactile feedback.

---

### 4. Component Architecture & Structural Blueprints

#### 4.1 Master Workspace Layout (`src/app/admin/(workspace)/layout.tsx`)
The root layout is an async Next.js Server Component that verifies user identity, extracts the role claims (`admin`, `sales_manager`, `sales_executive`, `viewer`), checks suspension status, and streams the initial state into the client workspace shell:

```tsx
/**
 * @file layout.tsx
 * @description Master CRM Workspace Shell Layout for all authenticated /admin routes.
 *              Verifies active Supabase session and user role, injects layout CSS variables,
 *              and provides persistent sidebar, header, and mobile navigation drawers.
 * @module app/admin/(workspace)/layout
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import type { CrmUserRole } from '@/types/crm';
import { AdminWorkspaceShell } from '@/app/admin/components/layout/AdminWorkspaceShell';

export const metadata: Metadata = {
  title: {
    template: '%s | Marca Ubi Enterprise CRM',
    default: 'Command Center | Marca Ubi Enterprise CRM',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login?next=%2Fadmin');
  }

  // Fetch caller profile and verify active operational standing
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status, job_title')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.status === 'suspended') {
    redirect('/admin/login?error=account_suspended');
  }

  const userRole: CrmUserRole = (profile?.role as CrmUserRole) || 
    (user.app_metadata?.role as CrmUserRole) || 
    'viewer';

  const userDisplay = {
    id: user.id,
    name: profile?.full_name || user.email?.split('@')[0] || 'Team Member',
    email: user.email || '',
    role: userRole,
    jobTitle: profile?.job_title || 'Commercial Personnel',
  };

  return (
    <AdminWorkspaceShell currentUser={userDisplay}>
      {children}
    </AdminWorkspaceShell>
  );
}
```

---

#### 4.2 Interactive Shell Wrapper (`src/app/admin/components/layout/AdminWorkspaceShell.tsx`)
A client boundary managing layout dimensions, sidebar collapse toggle (persisted via `localStorage`), and mobile drawer visibility:

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminMobileDrawer } from './AdminMobileDrawer';
import type { CrmUserRole } from '@/types/crm';
import styles from './AdminWorkspace.module.scss';

export interface CurrentUserSession {
  id: string;
  name: string;
  email: string;
  role: CrmUserRole;
  jobTitle: string;
}

interface AdminWorkspaceShellProps {
  currentUser: CurrentUserSession;
  children: React.ReactNode;
}

export function AdminWorkspaceShell({ currentUser, children }: AdminWorkspaceShellProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Restore collapsed rail preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('marca_crm_sidebar_collapsed');
      if (stored !== null) {
        setIsCollapsed(stored === 'true');
      }
    } catch {
      // Invariant: localStorage fallback in restricted iframe/incognito environments
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('marca_crm_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div
      className={styles.layoutRoot}
      style={{
        '--sidebar-width': isCollapsed ? '72px' : '260px',
      } as React.CSSProperties}
    >
      {/* Desktop Sticky Rail Navigation */}
      <AdminSidebar
        currentUser={currentUser}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Mobile Drawer (Viewports < 1024px) */}
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
```

---

#### 4.3 Desktop Persistent Sidebar (`src/app/admin/components/layout/AdminSidebar.tsx`)
Implements the **Linear Fluid Card** navigation paradigm with high-density grouping, active route matching via `usePathname`, role-based feature gating, and Raycast-style keyboard shortcut tokens:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CurrentUserSession } from './AdminWorkspaceShell';
import styles from './AdminSidebar.module.scss';

interface AdminSidebarProps {
  currentUser: CurrentUserSession;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: (props: { active: boolean }) => React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'orange' | 'emerald' | 'amber';
  requiredRoles?: Array<'admin' | 'sales_manager' | 'sales_executive' | 'viewer'>;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export function AdminSidebar({ currentUser, isCollapsed, onToggleCollapse }: AdminSidebarProps) {
  const pathname = usePathname();

  const navigationGroups: NavGroup[] = [
    {
      groupTitle: 'Commercial Pipeline',
      items: [
        {
          label: 'Command Center',
          href: '/admin',
          icon: ({ active }) => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          ),
        },
        {
          label: 'Follow-up Tasks',
          href: '/admin/tasks',
          badge: '4 Due',
          badgeVariant: 'orange',
          icon: ({ active }) => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ),
        },
      ],
    },
    {
      groupTitle: 'Intelligence & Roster',
      items: [
        {
          label: 'Commercial Team',
          href: '/admin/team',
          requiredRoles: ['admin', 'sales_manager'],
          icon: ({ active }) => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
        {
          label: 'Executive Analytics',
          href: '/admin/analytics',
          icon: ({ active }) => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          ),
        },
      ],
    },
    {
      groupTitle: 'System & Governance',
      items: [
        {
          label: 'Security & Settings',
          href: '/admin/settings',
          requiredRoles: ['admin'],
          icon: ({ active }) => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          ),
        },
      ],
    },
  ];

  const isRouteActive = (href: string): boolean => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}
      aria-label="Administrative Navigation Rail"
    >
      {/* Brand Header */}
      <div className={styles.brandContainer}>
        <Link href="/admin" className={styles.logoLink} title="Marca Ubi CRM Command Center">
          <img
            src="/hero/marca-ubi-logo.png"
            alt="Marca Ubi."
            className={styles.brandLogo}
          />
          {!isCollapsed && (
            <div className={styles.brandMeta}>
              <span className={styles.brandTitle}>Marca Ubi</span>
              <span className={styles.systemTag}>CRM Portal</span>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggleCollapse}
          className={styles.collapseToggle}
          title={isCollapsed ? "Expand navigation rail (⌘B)" : "Collapse navigation rail (⌘B)"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isCollapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </button>
      </div>

      {/* Quick Action Button */}
      <div className={styles.quickActionBox}>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-new-lead-drawer'))}
          className={styles.newLeadBtn}
          title="Log new prospective engagement"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {!isCollapsed && <span>New Lead</span>}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className={styles.navScrollArea}>
        {navigationGroups.map((group) => {
          const authorizedItems = group.items.filter((item) => {
            if (!item.requiredRoles) return true;
            return item.requiredRoles.includes(currentUser.role);
          });

          if (authorizedItems.length === 0) return null;

          return (
            <div key={group.groupTitle} className={styles.navGroup}>
              {!isCollapsed && (
                <div className={styles.groupHeading}>{group.groupTitle}</div>
              )}
              <ul className={styles.navList}>
                {authorizedItems.map((item) => {
                  const active = isRouteActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <div className={styles.iconWrapper}>
                          {item.icon({ active })}
                        </div>
                        {!isCollapsed && (
                          <div className={styles.itemContent}>
                            <span className={styles.itemLabel}>{item.label}</span>
                            {item.badge && (
                              <span className={`${styles.badge} ${styles[item.badgeVariant || 'orange']}`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                        {active && <span className={styles.activePill} />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer System Status Radar */}
      <div className={styles.sidebarFooter}>
        <div className={styles.systemStatusBlock}>
          <span className={styles.statusRadarDot} />
          {!isCollapsed && (
            <div className={styles.statusText}>
              <span className={styles.statusLabel}>Supabase Cloud</span>
              <span className={styles.statusSub}>Production Node</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
```

---

#### 4.4 Top Utility Header (`src/app/admin/components/layout/AdminHeader.tsx`)
Features Apple HIG Vibrancy frosted glass backdrop, responsive mobile hamburger toggle, dynamic breadcrumbs, quick search trigger (`⌘K`), and the authenticated user profile dropdown:

```tsx
'use client';

import React from 'react';
import { AdminBreadcrumbs } from './AdminBreadcrumbs';
import { UserProfileDropdown } from './UserProfileDropdown';
import type { CurrentUserSession } from './AdminWorkspaceShell';
import styles from './AdminHeader.module.scss';

interface AdminHeaderProps {
  currentUser: CurrentUserSession;
  onOpenMobileNav: () => void;
}

export function AdminHeader({ currentUser, onOpenMobileNav }: AdminHeaderProps) {
  return (
    <header className={styles.header}>
      {/* Left: Mobile Toggle & Dynamic Breadcrumbs */}
      <div className={styles.headerLeft}>
        <button
          type="button"
          onClick={onOpenMobileNav}
          className={styles.mobileHamburger}
          aria-label="Open mobile navigation menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <AdminBreadcrumbs />
      </div>

      {/* Right: Global Search Trigger & User Capsule */}
      <div className={styles.headerRight}>
        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          className={styles.omniSearchTrigger}
          title="Search deals, clients, or reps (⌘K)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className={styles.searchPlaceholder}>Quick search...</span>
          <kbd className={styles.searchKbd}>⌘K</kbd>
        </button>

        {/* User Identity & Logout Popover */}
        <UserProfileDropdown currentUser={currentUser} />
      </div>
    </header>
  );
}
```

---

#### 4.5 Dynamic Breadcrumb Engine (`src/app/admin/components/layout/AdminBreadcrumbs.tsx`)
Translates URL segments into clean, hierarchical agency terminology without layout jitter:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminBreadcrumbs.module.scss';

const ROUTE_NAME_MAP: Record<string, string> = {
  admin: 'Command Center',
  team: 'Commercial Directory',
  tasks: 'Follow-up Scheduler',
  analytics: 'Executive Analytics',
  settings: 'Security & Governance',
  leads: 'Pipeline Deals',
};

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="Breadcrumb Navigation" className={styles.breadcrumbNav}>
      <ol className={styles.breadcrumbList}>
        <li className={styles.breadcrumbItem}>
          <Link href="/admin" className={styles.rootLink}>
            Marca Ubi CRM
          </Link>
        </li>

        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const title = ROUTE_NAME_MAP[segment] || segment.replace(/-/g, ' ');

          // Skip root "admin" segment in secondary display if already at root
          if (segment === 'admin' && segments.length > 1) return null;

          return (
            <React.Fragment key={href}>
              <li className={styles.separator} aria-hidden="true">/</li>
              <li className={styles.breadcrumbItem}>
                {isLast ? (
                  <span className={styles.currentSegment} aria-current="page">
                    {title}
                  </span>
                ) : (
                  <Link href={href} className={styles.breadcrumbLink}>
                    {title}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
```

---

#### 4.6 User Identity Capsule & Sign Out (`src/app/admin/components/layout/UserProfileDropdown.tsx`)
Replaces unstyled inline text with an Apple HIG Vibrancy frosted glass menu, displaying user avatar initials, role badge, job title, and the official `logoutAction`:

```tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { logoutAction } from '@/app/actions/auth';
import type { CurrentUserSession } from './AdminWorkspaceShell';
import styles from './UserProfileDropdown.module.scss';

interface UserProfileDropdownProps {
  currentUser: CurrentUserSession;
}

export function UserProfileDropdown({ currentUser }: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={styles.userTrigger}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={`Logged in as ${currentUser.name}`}
      >
        <div className={styles.avatarPill}>{initials}</div>
        <div className={styles.identityDetails}>
          <span className={styles.userName}>{currentUser.name}</span>
          <span className={styles.roleChip}>{currentUser.role.replace('_', ' ')}</span>
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu} role="menu">
          <div className={styles.menuHeader}>
            <span className={styles.menuEmail}>{currentUser.email}</span>
            <span className={styles.menuTitle}>{currentUser.jobTitle}</span>
          </div>

          <div className={styles.divider} />

          <div className={styles.menuSection}>
            <div className={styles.menuInfoRow}>
              <span className={styles.infoKey}>User ID</span>
              <span className={styles.infoVal}>{currentUser.id.substring(0, 8)}...</span>
            </div>
            <div className={styles.menuInfoRow}>
              <span className={styles.infoKey}>Security Tier</span>
              <span className={styles.infoValGreen}>TLS 1.3 / Edge Guarded</span>
            </div>
          </div>

          <div className={styles.divider} />

          <form action={logoutAction} className={styles.logoutForm}>
            <button type="submit" className={styles.signOutButton} role="menuitem">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign Out of CRM</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
```

---

#### 4.7 Graceful Roadmap View (`src/app/admin/components/layout/RoutePlaceholder.tsx`)
Eliminates 404 dead-ends for `/admin/tasks`, `/admin/analytics`, and `/admin/settings` by rendering a structured dark luxury preview card within the workspace shell:

```tsx
import React from 'react';
import Link from 'next/link';
import styles from './RoutePlaceholder.module.scss';

interface RoutePlaceholderProps {
  phaseNumber: string;
  moduleTitle: string;
  description: string;
  features: string[];
}

export function RoutePlaceholder({
  phaseNumber,
  moduleTitle,
  description,
  features,
}: RoutePlaceholderProps) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.badgeRow}>
          <span className={styles.phaseBadge}>{phaseNumber}</span>
          <span className={styles.statusBadge}>Engineering Delivery In Progress</span>
        </div>

        <h1 className={styles.title}>{moduleTitle}</h1>
        <p className={styles.description}>{description}</p>

        <div className={styles.featureBox}>
          <span className={styles.featureHeader}>Planned Capabilities:</span>
          <ul className={styles.featureList}>
            {features.map((feat, idx) => (
              <li key={idx} className={styles.featureItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff6100" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.actionRow}>
          <Link href="/admin" className={styles.primaryLink}>
            Return to Command Center
          </Link>
          <Link href="/admin/team" className={styles.secondaryLink}>
            View Commercial Directory
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

### 5. SCSS Master Tokens & Shell Layout Styling

```scss
// src/app/admin/components/layout/AdminWorkspace.module.scss
.layoutRoot {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  background-color: #0b0b0b;
  color: #ffffff;
  position: relative;
  overflow-x: hidden;
}

.mainViewport {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; // Prevent flex child blowouts
  margin-left: var(--sidebar-width);
  transition: margin-left 0.22s cubic-bezier(0.16, 1, 0.3, 1);

  @media (max-width: 1024px) {
    margin-left: 0;
  }
}

.contentContainer {
  flex: 1;
  padding: 2rem 2.5rem 4rem;
  max-width: 1680px;
  width: 100%;
  margin: 0 auto;

  @media (max-width: 1024px) {
    padding: 1.5rem 1.25rem 3rem;
  }

  @media (max-width: 640px) {
    padding: 1rem 0.75rem 2.5rem;
  }
}
```

```scss
// src/app/admin/components/layout/AdminSidebar.module.scss
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background-color: #000000;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  z-index: 40;
  transition: width 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;

  @media (max-width: 1024px) {
    display: none;
  }
}

.brandContainer {
  height: 64px;
  padding: 0 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.brandLogo {
  width: 110px;
  height: auto;
  display: block;
}

.navGroup {
  margin-bottom: 1.5rem;
}

.groupHeading {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #7c7c7c;
  padding: 0 1rem;
  margin-bottom: 0.5rem;
}

.navItem {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  margin: 0.15rem 0.65rem;
  border-radius: 8px;
  color: #a1a1aa;
  font-size: 0.84rem;
  font-weight: 500;
  text-decoration: none;
  position: relative;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    color: #ffffff;
  }

  &Active {
    background: rgba(255, 97, 0, 0.12);
    color: #ffffff;
    font-weight: 600;

    .iconWrapper {
      color: #ff6100;
    }
  }
}

.activePill {
  position: absolute;
  left: -0.65rem;
  top: 15%;
  bottom: 15%;
  width: 3px;
  background-color: #ff6100;
  border-radius: 0 4px 4px 0;
  box-shadow: 0 0 8px rgba(255, 97, 0, 0.6);
}
```

---

### 6. Verification and PR Gate Criteria

Before this architecture is merged into production, the following verification gates must pass:

1. **Zero 404 Traversals**:
   - `/admin` loads within the persistent workspace shell.
   - `/admin/team` loads within the persistent workspace shell, preserving all Stripe Scorecards and roster controls while discarding its redundant outer header.
   - `/admin/tasks` loads cleanly inside the workspace shell with a planned Phase 9 roadmap preview card.
2. **Zero Auth Leakage**:
   - `/admin/login` and `/admin/reset-password` remain isolated and do not render the workspace shell.
3. **Role-Gated Navigation Visibility**:
   - Users with the `sales_executive` or `viewer` role do not see the "Commercial Team" navigation link in their sidebar.
4. **100% Anti-AI-Slop Compliance**:
   - Zero `#2563eb` generic blue.
   - Zero emoji iconography.
   - Zero layout shift during sidebar collapse or mobile drawer opening.
   - Hairline borders (`1px solid rgba(255, 255, 255, 0.08)`).
5. **TypeScript and Lint Integrity**:
   - `tsc --noEmit` exits with 0 errors.
   - ESLint passes with 0 warnings.
