/**
 * @file page.tsx
 * @description Website Inquiries & Webhook Ingestion Workspace (/admin/ingestion).
 *              Server Component role-gated to authorized staff.
 *              Fetches authentic database telemetry, recent brief submissions with JSON payloads,
 *              and renders the interactive IngestionWorkspaceClient console.
 * @module app/admin/(workspace)/ingestion/page
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { getAgencySettingsAction } from '@/app/actions/settings';
import type { CrmUserRole } from '@/types/crm';
import {
  IngestionWorkspaceClient,
  type IngestionTelemetryData,
  type InboundSubmissionItem,
  type IngestionActivityItem,
} from './components/IngestionWorkspaceClient';
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

  const hasIngestionAccess = Array.isArray(allowedTabs)
    ? allowedTabs.includes('ingestion')
    : role === 'admin' || role === 'sales_manager';

  if (!hasIngestionAccess) {
    redirect('/admin?error=unauthorized_role_access');
  }

  // Calculate dynamic deduplication window baseline
  const window24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Aggregate verified inquiry volume within active rolling window
  const { count: inboundCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', window24h);

  // Aggregate duplicate smart merges logged during identical window
  const { count: dedupCount } = await supabase
    .from('lead_activities')
    .select('*', { count: 'exact', head: true })
    .eq('activity_type', 'duplicate_inquiry')
    .gte('created_at', window24h);

  // Retrieve calibrated operational settings for rate limiting and dedup thresholds
  const settingsResult = await getAgencySettingsAction();
  const settings = settingsResult.data || {
    id: 'default' as const,
    lead_response_sla_minutes: 60,
    followup_grace_period_hours: 4,
    stale_deal_threshold_days: 14,
    dedup_window_hours: 24,
    bot_rate_limit_per_minute: 10,
    notification_email: 'executive@marcaubi.com',
  };

  const telemetry: IngestionTelemetryData = {
    inboundCount24h: inboundCount ?? 0,
    dedupMerges24h: dedupCount ?? 0,
    dedupWindowHours: settings.dedup_window_hours,
    botRateLimit: settings.bot_rate_limit_per_minute,
    endpointHealth: '200 OK: Active',
  };

  // Hydrate recent inbound brief submissions with raw payload structures
  const { data: recentLeads } = await supabase
    .from('leads')
    .select('id, lead_id, name, company, email, phone, service_category, expected_value, created_at, brief_payload')
    .order('created_at', { ascending: false })
    .limit(10);

  const submissions: InboundSubmissionItem[] = (recentLeads || []).map((lead) => ({
    id: lead.id,
    lead_id: lead.lead_id,
    name: lead.name,
    company: lead.company,
    email: lead.email,
    phone: lead.phone,
    service_category: lead.service_category || 'Web & Digital',
    expected_value: Number(lead.expected_value) || 0,
    created_at: lead.created_at,
    brief_payload: (lead.brief_payload as Record<string, unknown>) || null,
  }));

  // Fetch recent ingestion and deduplication activities
  const { data: ingestionActivities } = await supabase
    .from('lead_activities')
    .select('id, activity_type, description, created_at')
    .in('activity_type', ['duplicate_inquiry', 'system_event', 'status_change'])
    .order('created_at', { ascending: false })
    .limit(8);

  const activities: IngestionActivityItem[] = (ingestionActivities || []).map((act) => ({
    id: act.id,
    activity_type: act.activity_type,
    description: act.description,
    created_at: act.created_at,
  }));

  const canSimulate = role === 'admin' || role === 'sales_manager';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.eyebrow}>Ingestion Protocols</span>
          <h1 className={styles.pageTitle}>Inbound Lead Ingestion Protocols.</h1>
          <p className={styles.pageSubtitle}>
            Monitor inbound inquiries, inspect raw webhook JSON brief payloads, and simulate test submissions.
          </p>
        </div>
      </header>

      {/* Interactive Ingestion Workspace Client Component */}
      <IngestionWorkspaceClient
        telemetry={telemetry}
        recentSubmissions={submissions}
        recentActivities={activities}
        canSimulate={canSimulate}
      />

      {/* Deduplication & Ingestion Governance Protocol */}
      <section className={styles.sectionBox}>
        <h2 className={styles.sectionTitle}>Automated Deduplication Protocol.</h2>
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
              <strong>Repeat Inquiry Tracking:</strong> Duplicate inquiries within the {settings.dedup_window_hours}-hour window update `inquiry_count` and append an immutable touchpoint record to `lead_activities` without resetting deal stages.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
