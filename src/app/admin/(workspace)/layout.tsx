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

  // Retrieve authenticated staff profile and verify active operational standing
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status, job_title, allowed_tabs, feature_permissions')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.status === 'suspended') {
    redirect('/admin/login?error=account_suspended');
  }

  const userRole: CrmUserRole =
    (profile?.role as CrmUserRole) ||
    (user.app_metadata?.role as CrmUserRole) ||
    'viewer';

  const userDisplay = {
    id: user.id,
    name: profile?.full_name || user.email?.split('@')[0] || 'Team Member',
    email: user.email || '',
    role: userRole,
    jobTitle: profile?.job_title || 'Commercial Personnel',
    allowed_tabs: (profile?.allowed_tabs as string[]) || undefined,
    feature_permissions: profile?.feature_permissions || undefined,
  };

  // Query live count of due follow-up tasks excluding synthetic benchmark records
  let dueTasksCount = 0;
  try {
    const nowIso = new Date().toISOString();
    const tasksQuery = supabase
      .from('leads')
      .select('id, funnel_statuses!inner(bucket)', { count: 'exact', head: true })
      .lte('next_follow_up', nowIso)
      .in('funnel_statuses.bucket', ['open', 'potential'])
      .or('brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true');

    if (userRole === 'sales_executive') {
      tasksQuery.eq('assigned_to', user.id);
    }

    const { count } = await tasksQuery;
    dueTasksCount = count || 0;
  } catch {
    dueTasksCount = 0;
  }

  return (
    <AdminWorkspaceShell currentUser={userDisplay} dueTasksCount={dueTasksCount}>
      {children}
    </AdminWorkspaceShell>
  );
}
