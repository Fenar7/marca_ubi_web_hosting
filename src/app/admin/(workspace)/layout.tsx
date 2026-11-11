/**
 * @file layout.tsx
 * @description Master CRM Workspace Shell Layout for all authenticated /admin routes.
 *              Verifies active Supabase session and user role, injects layout CSS variables,
 *              and provides persistent sidebar, header, and mobile navigation drawers.
 * @module app/admin/(workspace)/layout
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import type { CrmUserRole } from "@/types/crm";
import { AdminWorkspaceShell } from "@/app/admin/components/layout/AdminWorkspaceShell";
import { isTabAuthorized } from "@/app/admin/components/layout/navigationConfig";
import { getUtcDayWindow } from "@/app/admin/lib/followUpQueue";

/**
 * Guarantees dynamic request-time rendering and zero stale cache across all authenticated CRM routes.
 * Prevents build-time prerendering workers from attempting unauthenticated database queries.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: {
    template: "%s | Marca Ubi Enterprise CRM",
    default: "Command Center | Marca Ubi Enterprise CRM",
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
    redirect("/admin/login?next=%2Fadmin");
  }

  // Retrieve authenticated staff profile and verify active operational standing
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, role, status, job_title, allowed_tabs, feature_permissions, avatar_url",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.status === "suspended") {
    redirect("/admin/login?error=account_suspended");
  }

  const userRole: CrmUserRole =
    (profile?.role as CrmUserRole) ||
    (user.app_metadata?.role as CrmUserRole) ||
    "viewer";

  const userDisplay = {
    id: user.id,
    name: profile?.full_name || user.email?.split("@")[0] || "Team Member",
    email: user.email || "",
    role: userRole,
    jobTitle: profile?.job_title || "Commercial Personnel",
    avatarUrl: profile?.avatar_url || null,
    allowed_tabs: (profile?.allowed_tabs as string[]) || undefined,
    feature_permissions: profile?.feature_permissions || undefined,
  };

  // Match visible overdue + today queues; unavailable counts are omitted instead of reported as zero.
  let dueTasksCount: number | undefined;
  try {
    if (isTabAuthorized("tasks", userDisplay)) {
      const { end, date } = getUtcDayWindow(new Date());
      const tasksQuery = supabase
        .from("leads")
        .select("id, funnel_statuses!inner(bucket)", {
          count: "exact",
          head: true,
        })
        .not("next_follow_up", "is", null)
        .lte("next_follow_up", end)
        .in("funnel_statuses.bucket", ["open", "potential"])
        .or(
          `and(or(revisit_date.is.null,revisit_date.lte.${date}),or(brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true))`,
        );
      const { count, error } = await tasksQuery;
      if (error)
        console.error("[workspace] Due follow-up count unavailable", {
          code: error.code,
        });
      else if (count !== null) dueTasksCount = count;
    }
  } catch (cause: unknown) {
    console.error(
      "[workspace] Due follow-up count request failed",
      cause instanceof Error ? cause.name : "UnknownError",
    );
  }

  return (
    <AdminWorkspaceShell
      currentUser={userDisplay}
      dueTasksCount={dueTasksCount}
    >
      {children}
    </AdminWorkspaceShell>
  );
}
