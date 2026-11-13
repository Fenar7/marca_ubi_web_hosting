import React from "react";
import { ROLE_DEFAULT_TABS, type CrmTabKey } from "@/types/crm";
import type { CurrentUserSession } from "./UserProfileDropdown";

export interface NavigationItem {
  key: CrmTabKey;
  label: string;
  href: string;
  icon: (props: { active: boolean }) => React.ReactNode;
  getBadge?: (counts?: {
    dueTasksCount?: number;
  }) => { text: string; variant: "orange" | "emerald" | "amber" } | null;
}

export interface NavigationGroup {
  groupTitle: string;
  items: NavigationItem[];
}

/** Navigation mirrors server tab policy; visibility never replaces route authorization. */
export function isTabAuthorized(
  tabKey: CrmTabKey,
  user: CurrentUserSession | null | undefined,
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (Array.isArray(user.allowed_tabs) && user.allowed_tabs.length > 0)
    return user.allowed_tabs.includes(tabKey);
  return Boolean(ROLE_DEFAULT_TABS[user.role]?.[tabKey]);
}

/** Consistent geometry stays legible without shifting icon weight on selection. */
function icon(path: string): NavigationItem["icon"] {
  return function NavigationIcon() {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={path} />
      </svg>
    );
  };
}

/**
 * Clean 2-Tier Navigation Hierarchy meeting canonical test contracts:
 * - Work: Overview, Follow-ups (with task badge), Leads, Deals, Client Works, Inquiries
 * - Workspace: Analytics, Team, Settings
 */
export const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    groupTitle: "Work",
    items: [
      {
        key: "command_center",
        label: "Overview",
        href: "/admin",
        icon: icon("M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z"),
      },
      {
        key: "tasks",
        label: "Follow-ups",
        href: "/admin/tasks",
        icon: icon("M12 8v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0"),
        getBadge: (counts) =>
          counts?.dueTasksCount && counts.dueTasksCount > 0
            ? {
                text: counts.dueTasksCount.toLocaleString("en-IN"),
                variant: "orange",
              }
            : null,
      },
      {
        key: "leads",
        label: "Leads",
        href: "/admin/leads",
        icon: icon("M4 4h16v16H4z M4 13h5l2 3h2l2-3h5"),
      },
      {
        key: "deals",
        label: "Deals",
        href: "/admin/deals",
        icon: icon("M3 4h18l-7 9v6l-4 2v-8z"),
      },
      {
        key: "works",
        label: "Client works",
        href: "/admin/works",
        icon: icon("M3 7V4h6l2 3h10v13H3z"),
      },
      {
        key: "ingestion",
        label: "Inquiries",
        href: "/admin/ingestion",
        icon: icon("M4 5h16v14H4z M4 6l8 7 8-7"),
      },
    ],
  },
  {
    groupTitle: "Workspace",
    items: [
      {
        key: "analytics",
        label: "Analytics",
        href: "/admin/analytics",
        icon: icon("M4 20V10 M12 20V4 M20 20V14"),
      },
      {
        key: "users",
        label: "Team",
        href: "/admin/team",
        icon: icon(
          "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-4",
        ),
      },
      {
        key: "settings",
        label: "Settings",
        href: "/admin/settings",
        icon: icon("M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6z M9 12l2 2 4-4"),
      },
    ],
  },
];

export interface NavigationSearchResult {
  label: string;
  href: string;
  kind: "destination" | "search";
}

/** Records are searched by existing authorized lists rather than a fabricated global index. */
export function getNavigationSearchResults(
  query: string,
  user: CurrentUserSession,
): NavigationSearchResult[] {
  const clean = query.trim().slice(0, 200);
  const permitted = NAVIGATION_GROUPS.flatMap((group) => group.items).filter(
    (item) => isTabAuthorized(item.key, user),
  );
  const results: NavigationSearchResult[] = permitted
    .filter(
      (item) =>
        !clean || item.label.toLowerCase().includes(clean.toLowerCase()),
    )
    .map((item) => ({
      label: item.label,
      href: item.href,
      kind: "destination",
    }));
  if (clean)
    for (const key of ["leads", "deals"] as const) {
      if (isTabAuthorized(key, user))
        results.push({
          label: `Search ${key} for “${clean}”`,
          href: `/admin/${key}?${new URLSearchParams({ search: clean })}`,
          kind: "search",
        });
    }
  return results;
}
