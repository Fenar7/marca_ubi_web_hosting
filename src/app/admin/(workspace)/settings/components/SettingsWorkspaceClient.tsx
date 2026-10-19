'use client';

/**
 * @file SettingsWorkspaceClient.tsx
 * @description Interactive Client Component for Agency Governance & Operational SLA Settings (/admin/settings).
 *              Allows administrators to configure real-time response SLAs, alert grace periods,
 *              deduplication windows, and inspect immutable audit logs.
 * @module app/admin/(workspace)/settings/components/SettingsWorkspaceClient
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useTransition } from 'react';
import type { AgencySettings, UpdateAgencySettingsInput } from '@/app/lib/agency-settings-schemas';
import { updateAgencySettingsAction } from '@/app/actions/settings';
import styles from './SettingsWorkspaceClient.module.scss';

export interface AuditLogItem {
  id: string;
  action: string;
  target_user_email: string;
  created_at: string;
}

interface SettingsWorkspaceClientProps {
  initialSettings: AgencySettings;
  auditLogs: AuditLogItem[];
  userRole: string;
}

export function SettingsWorkspaceClient({
  initialSettings,
  auditLogs,
  userRole,
}: SettingsWorkspaceClientProps): React.ReactElement {
  const [settings, setSettings] = useState<AgencySettings>(initialSettings);
  const [formData, setFormData] = useState<UpdateAgencySettingsInput>({
    lead_response_sla_minutes: initialSettings.lead_response_sla_minutes,
    followup_grace_period_hours: initialSettings.followup_grace_period_hours,
    stale_deal_threshold_days: initialSettings.stale_deal_threshold_days,
    dedup_window_hours: initialSettings.dedup_window_hours,
    bot_rate_limit_per_minute: initialSettings.bot_rate_limit_per_minute,
    notification_email: initialSettings.notification_email || '',
  });

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [auditSearch, setAuditSearch] = useState<string>('');

  const isAdmin = userRole === 'admin';

  // Check if form has unsaved modifications
  const isDirty =
    formData.lead_response_sla_minutes !== settings.lead_response_sla_minutes ||
    formData.followup_grace_period_hours !== settings.followup_grace_period_hours ||
    formData.stale_deal_threshold_days !== settings.stale_deal_threshold_days ||
    formData.dedup_window_hours !== settings.dedup_window_hours ||
    formData.bot_rate_limit_per_minute !== settings.bot_rate_limit_per_minute ||
    (formData.notification_email || '') !== (settings.notification_email || '');

  const handleFieldChange = (field: keyof UpdateAgencySettingsInput, value: number | string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setFeedback(null);
  };

  const handleReset = () => {
    setFormData({
      lead_response_sla_minutes: settings.lead_response_sla_minutes,
      followup_grace_period_hours: settings.followup_grace_period_hours,
      stale_deal_threshold_days: settings.stale_deal_threshold_days,
      dedup_window_hours: settings.dedup_window_hours,
      bot_rate_limit_per_minute: settings.bot_rate_limit_per_minute,
      notification_email: settings.notification_email || '',
    });
    setFeedback(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    startTransition(async () => {
      const res = await updateAgencySettingsAction(formData);
      if (res.success && res.data) {
        setSettings(res.data);
        setFeedback({
          type: 'success',
          message: 'Agency operational thresholds and SLA configurations updated successfully.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to update agency settings.',
        });
      }
    });
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (!auditSearch) return true;
    const q = auditSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      (log.target_user_email && log.target_user_email.toLowerCase().includes(q))
    );
  });

  return (
    <div className={styles.workspaceWrapper}>
      {/* SLA & Governance Form Section */}
      <section className={styles.settingsSection} aria-label="Operational SLAs and Alerts">
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Operational SLAs & Automated Alert Thresholds</h2>
            <p className={styles.sectionSubtitle}>
              Calibrate agency response speed, follow-up grace intervals, and spam defense parameters.
            </p>
          </div>
          {isAdmin && (
            <div className={styles.formActionGroup}>
              {isDirty && (
                <button
                  type="button"
                  className={styles.resetBtn}
                  onClick={handleReset}
                  disabled={isPending}
                >
                  Discard Changes
                </button>
              )}
              <button
                type="submit"
                form="agency-settings-form"
                className={styles.saveBtn}
                disabled={!isDirty || isPending}
              >
                {isPending ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          )}
        </div>

        {feedback && (
          <div
            className={feedback.type === 'success' ? styles.alertSuccess : styles.alertError}
            role="alert"
          >
            <span>{feedback.message}</span>
          </div>
        )}

        <form id="agency-settings-form" onSubmit={handleSubmit} className={styles.formGrid}>
          {/* Card 1: Lead Response SLA */}
          <div className={styles.configCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardStep}>SLA 01</span>
              <span className={styles.cardTag}>Inbound Speed</span>
            </div>
            <label htmlFor="lead_response_sla" className={styles.configLabel}>
              Lead Response SLA (Minutes)
            </label>
            <p className={styles.configHelp}>
              Target window for sales representatives to make first contact with a new inbound brief.
            </p>
            <div className={styles.inputWrap}>
              <input
                id="lead_response_sla"
                type="number"
                min="5"
                max="1440"
                step="5"
                disabled={!isAdmin || isPending}
                className={styles.numberInput}
                value={formData.lead_response_sla_minutes}
                onChange={(e) =>
                  handleFieldChange('lead_response_sla_minutes', parseInt(e.target.value, 10) || 60)
                }
              />
              <span className={styles.unitSuffix}>min</span>
            </div>
          </div>

          {/* Card 2: Follow-up Grace Period */}
          <div className={styles.configCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardStep}>SLA 02</span>
              <span className={styles.cardTag}>Overdue Grace</span>
            </div>
            <label htmlFor="followup_grace_period" className={styles.configLabel}>
              Follow-up Grace Interval (Hours)
            </label>
            <p className={styles.configHelp}>
              Buffer duration after scheduled touchpoint time before an overdue escalation alert triggers.
            </p>
            <div className={styles.inputWrap}>
              <input
                id="followup_grace_period"
                type="number"
                min="0"
                max="72"
                step="1"
                disabled={!isAdmin || isPending}
                className={styles.numberInput}
                value={formData.followup_grace_period_hours}
                onChange={(e) =>
                  handleFieldChange('followup_grace_period_hours', parseInt(e.target.value, 10) || 0)
                }
              />
              <span className={styles.unitSuffix}>hrs</span>
            </div>
          </div>

          {/* Card 3: Stale Deal Inactivity Alert */}
          <div className={styles.configCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardStep}>SLA 03</span>
              <span className={styles.cardTag}>Pipeline Health</span>
            </div>
            <label htmlFor="stale_deal_threshold" className={styles.configLabel}>
              Stale Deal Inactivity Alert (Days)
            </label>
            <p className={styles.configHelp}>
              Number of days without an activity touchpoint before an active proposal is marked as stalled.
            </p>
            <div className={styles.inputWrap}>
              <input
                id="stale_deal_threshold"
                type="number"
                min="1"
                max="90"
                step="1"
                disabled={!isAdmin || isPending}
                className={styles.numberInput}
                value={formData.stale_deal_threshold_days}
                onChange={(e) =>
                  handleFieldChange('stale_deal_threshold_days', parseInt(e.target.value, 10) || 14)
                }
              />
              <span className={styles.unitSuffix}>days</span>
            </div>
          </div>

          {/* Card 4: Deduplication Smart Merge Window */}
          <div className={styles.configCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardStep}>SLA 04</span>
              <span className={styles.cardTag}>Smart Merge</span>
            </div>
            <label htmlFor="dedup_window" className={styles.configLabel}>
              Smart Merge Window (Hours)
            </label>
            <p className={styles.configHelp}>
              Inquiries from the same phone or email within this window merge into the existing timeline.
            </p>
            <div className={styles.inputWrap}>
              <input
                id="dedup_window"
                type="number"
                min="1"
                max="168"
                step="1"
                disabled={!isAdmin || isPending}
                className={styles.numberInput}
                value={formData.dedup_window_hours}
                onChange={(e) =>
                  handleFieldChange('dedup_window_hours', parseInt(e.target.value, 10) || 24)
                }
              />
              <span className={styles.unitSuffix}>hrs</span>
            </div>
          </div>

          {/* Card 5: Spam & Abuse Rate Limiting */}
          <div className={styles.configCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardStep}>SEC 01</span>
              <span className={styles.cardTag}>Bot Shield</span>
            </div>
            <label htmlFor="bot_rate_limit" className={styles.configLabel}>
              Spam Shield Request Cap (Req/Min)
            </label>
            <p className={styles.configHelp}>
              Maximum rate-limited brief submissions permitted per IP address within 60 seconds.
            </p>
            <div className={styles.inputWrap}>
              <input
                id="bot_rate_limit"
                type="number"
                min="5"
                max="120"
                step="1"
                disabled={!isAdmin || isPending}
                className={styles.numberInput}
                value={formData.bot_rate_limit_per_minute}
                onChange={(e) =>
                  handleFieldChange('bot_rate_limit_per_minute', parseInt(e.target.value, 10) || 10)
                }
              />
              <span className={styles.unitSuffix}>req/m</span>
            </div>
          </div>

          {/* Card 6: Notification Email */}
          <div className={styles.configCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardStep}>SEC 02</span>
              <span className={styles.cardTag}>Alert Dispatch</span>
            </div>
            <label htmlFor="notification_email" className={styles.configLabel}>
              Executive Alert Notification Email
            </label>
            <p className={styles.configHelp}>
              Destination address for critical security escalations, offboarding alerts, and SLA breaches.
            </p>
            <div className={styles.inputWrap}>
              <input
                id="notification_email"
                type="email"
                disabled={!isAdmin || isPending}
                placeholder="executive@marcaubi.com"
                className={styles.textInput}
                value={formData.notification_email || ''}
                onChange={(e) => handleFieldChange('notification_email', e.target.value)}
              />
            </div>
          </div>
        </form>
      </section>

      {/* Immutable Security Audit Trail */}
      <section className={styles.auditSection} aria-label="System Governance Audit Ledger">
        <div className={styles.auditHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Security & Governance Audit Trail</h2>
            <p className={styles.sectionSubtitle}>
              Immutable cryptographic ledger tracking administrative mutations and permission updates.
            </p>
          </div>
          <div className={styles.searchBox}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search audit actions or emails..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className={styles.emptyLogs}>
            <span>No administrative audit events found matching query.</span>
          </div>
        ) : (
          <div className={styles.logList}>
            {filteredLogs.map((log) => (
              <div key={log.id} className={styles.logItem}>
                <div className={styles.logLeft}>
                  <span className={styles.logBadge}>{log.action.replace(/_/g, ' ')}</span>
                  <span className={styles.logTarget}>{log.target_user_email}</span>
                </div>
                <time className={styles.logDate}>
                  {new Date(log.created_at).toLocaleString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
