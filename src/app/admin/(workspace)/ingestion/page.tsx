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

  if (!profile || profile.status !== 'active') {
    redirect('/admin/login?error=account_suspended');
  }

  const role = profile.role as CrmUserRole;
  const allowedTabs = profile.allowed_tabs as string[] | undefined;

  const hasIngestionAccess = role === 'admin' || (Array.isArray(allowedTabs) && allowedTabs.length > 0
    ? allowedTabs.includes('ingestion')
    : role === 'sales_manager');

  if (!hasIngestionAccess) {
    redirect('/admin?error=unauthorized_role_access');
  }

  // Calculate dynamic deduplication window baseline
  const window24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Aggregate verified inquiry volume within active rolling window
  const { count: inboundCount, error: inboundError } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', window24h)
    .or('brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true');

  // Aggregate duplicate smart merges logged during identical window
  const { count: dedupCount, error: dedupError } = await supabase
    .from('lead_activities')
    .select('*', { count: 'exact', head: true })
    .eq('activity_type', 'duplicate_inquiry')
    .gte('created_at', window24h)
    .or('metadata->synthetic_benchmark.is.null,metadata->>synthetic_benchmark.neq.true');

  // Retrieve calibrated operational settings for rate limiting and dedup thresholds
  const settingsResult = await getAgencySettingsAction();
  const settings = settingsResult.success ? settingsResult.data : null;
  if (inboundError || dedupError || !settings) {
    console.error('[admin-ingestion] Telemetry unavailable:', inboundError?.message ?? dedupError?.message ?? settingsResult.error);
  }

  const telemetry: IngestionTelemetryData = {
    inboundCount24h: inboundError ? null : inboundCount,
    dedupMerges24h: dedupError ? null : dedupCount,
    dedupWindowHours: settings?.dedup_window_hours ?? null,
    botRateLimit: settings?.bot_rate_limit_per_minute ?? null,
    endpointHealth: 'Unavailable',
  };

  // Hydrate recent inbound brief submissions with raw payload structures
  const { data: recentLeads, error: recentLeadsError } = await supabase
    .from('leads')
    .select('id, lead_id, name, company, email, phone, service_category, expected_value, created_at, brief_payload')
    .or('brief_payload->synthetic_benchmark.is.null,brief_payload->>synthetic_benchmark.neq.true')
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
  const { data: ingestionActivities, error: activitiesError } = await supabase
    .from('lead_activities')
    .select('id, activity_type, description, created_at')
    .in('activity_type', ['duplicate_inquiry', 'system_event', 'status_change'])
    .or('metadata->synthetic_benchmark.is.null,metadata->>synthetic_benchmark.neq.true')
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
          <span className={styles.eyebrow}>Commercial CRM</span>
          <h1 className={styles.pageTitle}>Website inquiries</h1>
          <p className={styles.pageSubtitle}>
            Review recent leads and intake activity. The list includes leads from all sources.
          </p>
        </div>
      </header>

      {/* Interactive Ingestion Workspace Client Component */}
      <IngestionWorkspaceClient
        telemetry={telemetry}
        recentSubmissions={submissions}
        recentActivities={activities}
        submissionsUnavailable={Boolean(recentLeadsError)}
        activitiesUnavailable={Boolean(activitiesError)}
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
              <strong>Repeat Inquiry Tracking:</strong> Duplicate inquiries can add an activity to the existing lead without resetting its stage.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
