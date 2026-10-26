'use client';

/**
 * @file PersonnelAuditTimeline.tsx
 * @description Chronological audit timeline displaying compliance and security records
 *              associated with the personnel profile from public.team_audit_logs.
 * @module app/admin/team/[id]/components/PersonnelAuditTimeline
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { PersonnelAuditLogEntry } from '@/types/crm';
import styles from './PersonnelAuditTimeline.module.scss';

interface PersonnelAuditTimelineProps {
  auditLogs: PersonnelAuditLogEntry[];
}

export function PersonnelAuditTimeline({
  auditLogs,
}: PersonnelAuditTimelineProps): React.ReactElement {
  const formatActionTitle = (action: string): string => {
    switch (action) {
      case 'user_created':
        return 'Account Provisioned';
      case 'role_changed':
        return 'Privilege Level Updated';
      case 'user_suspended':
        return 'Account Suspended';
      case 'user_activated':
        return 'Account Reactivated';
      case 'leads_bulk_reassigned':
        return 'Deals Reassigned';
      case 'password_reset_dispatched':
        return 'Credential Reset Dispatched';
      case 'permissions_updated':
        return 'Access Controls Modified';
      default:
        return action.replace(/_/g, ' ');
    }
  };

  const getItemStyleClass = (action: string): string => {
    if (action === 'user_created' || action === 'user_activated') return styles.itemAccent;
    if (action === 'user_suspended' || action === 'password_reset_dispatched') return styles.itemWarning;
    return '';
  };

  return (
    <div className={styles.timelineCard}>
      <div className={styles.headerRow}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <h3 className={styles.title}>Compliance Activity Trail</h3>
      </div>

      {auditLogs.length === 0 ? (
        <div className={styles.emptyTimeline}>
          No compliance audit events recorded for this user yet.
        </div>
      ) : (
        <div className={styles.timelineList}>
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className={`${styles.timelineItem} ${getItemStyleClass(log.action)}`}
            >
              <div className={styles.itemHeader}>
                <span className={styles.actionTitle}>{formatActionTitle(log.action)}</span>
                <span className={styles.itemTime}>
                  {new Date(log.created_at).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <p className={styles.itemActor}>
                Initiated by {log.actor_name || 'System'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
