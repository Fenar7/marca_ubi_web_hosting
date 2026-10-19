/**
 * @file page.tsx
 * @description Security & System Governance Workspace (/admin/settings).
 *              Server Component role-gated strictly to `admin` accounts.
 *              Integrates the Operational SLA Calibration Console,
 *              Commercial Authorization Matrix, and Tamper-Proof Audit Trail.
 * @module app/admin/(workspace)/settings/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { getAgencySettingsAction } from '@/app/actions/settings';
import type { CrmUserRole } from '@/types/crm';
import { SettingsWorkspaceClient } from './components/SettingsWorkspaceClient';
import styles from './settings.module.scss';

export const metadata: Metadata = {
  title: 'Security & Governance | Marca Ubi Enterprise CRM',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminSettingsPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login?next=%2Fadmin%2Fsettings');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, allowed_tabs')
    .eq('id', user.id)
    .maybeSingle();

  const role = (profile?.role as CrmUserRole) || 'viewer';
  const allowedTabs = profile?.allowed_tabs as string[] | undefined;

  // Perimeter guard: checks granular tab permissions with admin fallback
  const hasSettingsAccess = Array.isArray(allowedTabs)
    ? allowedTabs.includes('settings')
    : role === 'admin';

  if (!hasSettingsAccess) {
    redirect('/admin?error=unauthorized_role_access');
  }

  // Fetch operational settings via server action
  const settingsResult = await getAgencySettingsAction();
  const initialSettings = settingsResult.data || {
    id: 'default' as const,
    lead_response_sla_minutes: 60,
    followup_grace_period_hours: 4,
    stale_deal_threshold_days: 14,
    dedup_window_hours: 24,
    bot_rate_limit_per_minute: 10,
    notification_email: 'executive@marcaubi.com',
  };

  // Fetch audit log entries
  const { data: auditLogs } = await supabase
    .from('team_audit_logs')
    .select('id, action, target_user_email, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  const logs = (auditLogs || []).map((log) => ({
    id: log.id,
    action: log.action || 'system_mutation',
    target_user_email: log.target_user_email || 'system@marcaubi.com',
    created_at: log.created_at || new Date().toISOString(),
  }));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.eyebrow}>Governance & Operational Hardening</span>
          <h1 className={styles.pageTitle}>System Settings & Governance</h1>
          <p className={styles.pageSubtitle}>
            Configure operational SLAs, lead alert grace periods, bot rate limits, and inspect immutable audit trails.
          </p>
        </div>
      </header>

      {/* Interactive Settings and SLA Governance Workspace */}
      <SettingsWorkspaceClient
        initialSettings={initialSettings}
        auditLogs={logs}
        userRole={role}
      />

      {/* Role Authorization Matrix */}
      <section className={styles.matrixCard}>
        <h2 className={styles.sectionTitle}>Commercial Authorization Matrix</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th>Operational Role</th>
                <th>Global Analytics</th>
                <th>Staff Provisioning</th>
                <th>Deal Reassignment</th>
                <th>Assigned Deals Only</th>
              </tr>
            </thead>
            <tbody>
              <tr className={styles.tableRow}>
                <td className={styles.roleName}>Administrator</td>
                <td className={styles.checkMark}>✓ Full Access</td>
                <td className={styles.checkMark}>✓ Create / Suspend</td>
                <td className={styles.checkMark}>✓ Atomic Batch</td>
                <td className={styles.dashMark}>Global Scope</td>
              </tr>
              <tr className={styles.tableRow}>
                <td className={styles.roleName}>Sales Manager</td>
                <td className={styles.checkMark}>✓ Full Access</td>
                <td className={styles.dashMark}>— Read-Only</td>
                <td className={styles.checkMark}>✓ Atomic Batch</td>
                <td className={styles.dashMark}>Global Scope</td>
              </tr>
              <tr className={styles.tableRow}>
                <td className={styles.roleName}>Sales Executive</td>
                <td className={styles.dashMark}>— Sandboxed</td>
                <td className={styles.dashMark}>— Restricted</td>
                <td className={styles.dashMark}>— Restricted</td>
                <td className={styles.checkMark}>✓ Isolated RLS</td>
              </tr>
              <tr className={styles.tableRow}>
                <td className={styles.roleName}>Viewer</td>
                <td className={styles.checkMark}>✓ Read-Only</td>
                <td className={styles.dashMark}>— Restricted</td>
                <td className={styles.dashMark}>— Restricted</td>
                <td className={styles.dashMark}>Global Read-Only</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
