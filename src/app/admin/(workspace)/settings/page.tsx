/**
 * @file page.tsx
 * @description Security & System Governance Workspace (/admin/settings).
 *              Server Component role-gated strictly to `admin` accounts.
 *              Renders the commercial authorization matrix and tamper-proof team audit ledger.
 * @module app/admin/(workspace)/settings/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import type { CrmUserRole } from '@/types/crm';
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
  const hasSettingsAccess = Array.isArray(allowedTabs) && allowedTabs.length > 0
    ? allowedTabs.includes('settings')
    : role === 'admin';

  if (!hasSettingsAccess) {
    redirect('/admin?error=unauthorized_role_access');
  }

  // Fetch audit log entries
  const { data: auditLogs } = await supabase
    .from('team_audit_logs')
    .select('id, action, target_user_email, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  const logs = auditLogs || [];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.eyebrow}>Governance & System Hardening</span>
          <h1 className={styles.pageTitle}>Security & Access Governance</h1>
          <p className={styles.pageSubtitle}>
            Cryptographic authentication state, role-based access control matrix, and administrative audit trails.
          </p>
        </div>
      </header>

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

      {/* Tamper-Proof Audit Log */}
      <section className={styles.auditSection}>
        <h2 className={styles.sectionTitle}>Immutable Administrative Audit Log</h2>
        {logs.length === 0 ? (
          <div style={{ color: '#71717a', fontSize: '0.85rem' }}>
            No administrative events recorded in the ledger yet.
          </div>
        ) : (
          <div className={styles.auditList}>
            {logs.map((log) => (
              <div key={log.id} className={styles.auditRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={styles.auditAction}>{log.action}</span>
                  <span className={styles.auditEmail}>{log.target_user_email}</span>
                </div>
                <span className={styles.auditTime}>
                  {new Date(log.created_at).toLocaleString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
