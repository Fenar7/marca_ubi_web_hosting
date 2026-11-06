import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { getAgencySettingsAction } from '@/app/actions/settings';
import { ROLE_DEFAULT_TABS, type CrmUserRole } from '@/types/crm';
import { SettingsWorkspaceClient } from './components/SettingsWorkspaceClient';
import styles from './settings.module.scss';

export const metadata: Metadata = {
  title: 'Settings | Marca Ubi CRM',
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login?next=%2Fadmin%2Fsettings');
  const { data: profile } = await supabase.from('profiles')
    .select('role, status, allowed_tabs').eq('id', user.id).maybeSingle();
  if (!profile || profile.status !== 'active') redirect('/admin/login?error=account_suspended');
  const role = profile.role as CrmUserRole;
  const allowedTabs = profile.allowed_tabs;
  const allowed = role === 'admin' || (Array.isArray(allowedTabs) && allowedTabs.length > 0
    ? allowedTabs.includes('settings') : Boolean(ROLE_DEFAULT_TABS[role]?.settings));
  if (!allowed) redirect('/admin?error=unauthorized_role_access');

  const [settingsResult, auditResult] = await Promise.all([
    getAgencySettingsAction(),
    supabase.from('team_audit_logs').select('id, action, target_user_email, created_at')
      .order('created_at', { ascending: false }).limit(20),
  ]);
  if (!settingsResult.success || !settingsResult.data) {
    console.error('[admin-settings] Settings unavailable:', settingsResult.error);
  }
  if (auditResult.error) console.error('[admin-settings] Audit query failed:', auditResult.error.message);
  const logs = (auditResult.data ?? []).map((log) => ({
    id: log.id,
    action: log.action,
    target_user_email: log.target_user_email ?? '',
    created_at: log.created_at,
  }));

  return <div className={styles.container}>
    <header className={styles.header}><div className={styles.headerLeft}>
      <span className={styles.eyebrow}>Workspace</span>
      <h1 className={styles.pageTitle}>Settings</h1>
      <p className={styles.pageSubtitle}>Manage operational settings and review recent administrative activity.</p>
    </div></header>
    {settingsResult.success && settingsResult.data ? <SettingsWorkspaceClient
      initialSettings={settingsResult.data} auditLogs={logs} auditUnavailable={Boolean(auditResult.error)} userRole={role}
    /> : <section className={styles.matrixCard} role="status">
      <h2 className={styles.sectionTitle}>Settings unavailable</h2>
      <p>Settings could not be loaded. Refresh the page to try again.</p>
    </section>}
  </div>;
}
