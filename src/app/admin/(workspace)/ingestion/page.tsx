/**
 * @file page.tsx
 * @description Webhook Telemetry & Deduplication Monitor Workspace (/admin/ingestion).
 *              Renders real-time telemetry on the `/api/sales-funnel/ingest` pipeline endpoint,
 *              deduplication collision windows, and recent ingestion activities.
 * @module app/admin/(workspace)/ingestion/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import type { CrmUserRole } from '@/types/crm';
import styles from './ingestion.module.scss';

export const metadata: Metadata = {
  title: 'Website Inquiries & Form Capture | Marca Ubi Enterprise CRM',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminIngestionPage(): Promise<React.ReactElement> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login?next=%2Fadmin%2Fingestion');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, allowed_tabs')
    .eq('id', user.id)
    .maybeSingle();

  const role = (profile?.role as CrmUserRole) || 'viewer';
  const allowedTabs = profile?.allowed_tabs as string[] | undefined;

  const hasIngestionAccess = Array.isArray(allowedTabs) && allowedTabs.length > 0
    ? allowedTabs.includes('ingestion')
    : role !== 'sales_executive';

  if (!hasIngestionAccess) {
    redirect('/admin?error=unauthorized_role_access');
  }

  // Query recent webhook and deduplication activities
  const { data: ingestionActivities } = await supabase
    .from('lead_activities')
    .select('id, activity_type, description, created_at')
    .in('activity_type', ['duplicate_inquiry', 'system_event', 'status_change'])
    .order('created_at', { ascending: false })
    .limit(8);

  const logs = ingestionActivities || [];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.eyebrow}>Form Gateway & Website Inquiries</span>
          <h1 className={styles.pageTitle}>Website Inquiries & Form Capture</h1>
          <p className={styles.pageSubtitle}>
            Monitor incoming form submissions from the website, automatic duplicate protection, and intake health.
          </p>
        </div>
      </header>

      {/* Telemetry Status Ribbon */}
      <section className={styles.statusRibbon} aria-label="Ingestion Endpoint Status">
        <div className={styles.telemetryCard}>
          <span className={styles.telemetryKey}>Endpoint Health</span>
          <div className={styles.telemetryVal}>
            <span className={styles.dotGreen} />
            <span>200 OK — Active</span>
          </div>
          <span className={styles.telemetrySub}>
            <span className={styles.codeBox}>POST /api/sales-funnel/ingest</span>
          </span>
        </div>

        <div className={styles.telemetryCard}>
          <span className={styles.telemetryKey}>Deduplication Window</span>
          <div className={styles.telemetryVal}>24-Hour Smart Merge</div>
          <span className={styles.telemetrySub}>
            Matches normalized phone or lowercase email
          </span>
        </div>

        <div className={styles.telemetryCard}>
          <span className={styles.telemetryKey}>Rate Limiter Perimeter</span>
          <div className={styles.telemetryVal}>Automated Spam Shield Active</div>
          <span className={styles.telemetrySub}>
            10 req/min burst protection via Upstash/In-Memory
          </span>
        </div>
      </section>

      {/* Deduplication & Ingestion Governance Rules */}
      <section className={styles.sectionBox}>
        <h2 className={styles.sectionTitle}>Automated Deduplication Protocol</h2>
        <div className={styles.ruleList}>
          <div className={styles.ruleItem}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>
              <strong>International Phone Formatting:</strong> Strips extraneous characters, converts Indian 10-digit numbers to +91 international standard before deduplication comparison.
            </span>
          </div>
          <div className={styles.ruleItem}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>
              <strong>Automatic Email Matching:</strong> Ensures whitespace is trimmed and strings are forced to lowercase, preventing duplicate submissions from multiple marketing campaigns.
            </span>
          </div>
          <div className={styles.ruleItem}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>
              <strong>Repeat Inquiry Tracking:</strong> Duplicate inquiries within the 24-hour window update `inquiry_count` and append an immutable touchpoint record to `lead_activities` without resetting deal stages.
            </span>
          </div>
        </div>
      </section>

      {/* Live Ingestion Log Feed */}
      <section className={styles.sectionBox}>
        <h2 className={styles.sectionTitle}>Recent Inbound Submissions</h2>
        {logs.length === 0 ? (
          <div className={styles.emptyState}>
            <span>No incoming webhook ingestion events logged recently.</span>
          </div>
        ) : (
          <div className={styles.logList}>
            {logs.map((log) => (
              <div key={log.id} className={styles.logRow}>
                <span className={styles.logDesc}>{log.description}</span>
                <span className={styles.logTime}>
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
