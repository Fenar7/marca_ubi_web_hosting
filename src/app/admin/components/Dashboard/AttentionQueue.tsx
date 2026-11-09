'use client';

/**
 * @file AttentionQueue.tsx
 * @description High-Priority Operational Triage Queue for the Marca Ubi Commercial Desk.
 *              Inspired by the Rillo queue archetype: features interactive filter tabs
 *              (All, Overdue, Today), client initials avatars, Raycast status tokens,
 *              and direct dossier action triggers.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { formatCrmCurrency } from '@/app/admin/lib/currency';
import type { LeadPriority } from '@/types/crm';
import styles from './AttentionQueue.module.scss';

export interface AttentionQueueItem {
  id: string;
  leadId: string;
  name: string;
  company: string | null;
  stage: string;
  priority: LeadPriority;
  expectedValue: number;
  nextFollowUp: string;
}

export interface AttentionQueueProps {
  items: AttentionQueueItem[];
  overdueCount: number | null;
  dueTodayCount: number | null;
  dataStatus: 'ready' | 'unavailable';
}

function formatFollowUp(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Invalid schedule';
  return (
    new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(date) + ' UTC'
  );
}

function getInitials(name: string): string {
  if (!name) return 'CL';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

type FilterTab = 'all' | 'overdue' | 'today';

export function AttentionQueue({
  items,
  overdueCount,
  dueTodayCount,
  dataStatus,
}: AttentionQueueProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000;

  const filteredItems = items.filter((item) => {
    if (activeTab === 'all') return true;
    const itemDate = new Date(item.nextFollowUp).getTime();
    if (activeTab === 'overdue') {
      return itemDate < startOfToday;
    }
    if (activeTab === 'today') {
      return itemDate >= startOfToday && itemDate <= endOfToday;
    }
    return true;
  });

  return (
    <section className={styles.queueContainer} aria-labelledby="attention-heading">
      {/* Header Block with Title and Rillo-inspired Filter Tabs */}
      <div className={styles.queueHeader}>
        <div className={styles.titleBlock}>
          <div className={styles.eyebrowRow}>
            <span className={styles.pulseDot} aria-hidden="true" />
            <p className={styles.eyebrow}>High-Priority Triage</p>
          </div>
          <h2 id="attention-heading" className={styles.heading}>
            Attention Queue
          </h2>
          <p className={styles.description}>
            Overdue and scheduled commercial touchpoints requiring action.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link className={styles.viewAllBtn} href="/admin/tasks">
            <span>View All Tasks</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      {/* Rillo-style Filter Tabs Strip */}
      <div className={styles.filterStrip} role="tablist" aria-label="Queue filter segments">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'all'}
          onClick={() => setActiveTab('all')}
          className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabActive : ''}`}
        >
          <span>All</span>
          <span className={styles.tabCount}>{items.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overdue'}
          onClick={() => setActiveTab('overdue')}
          className={`${styles.tabBtn} ${activeTab === 'overdue' ? styles.tabActive : ''}`}
        >
          <span>Overdue</span>
          <span className={`${styles.tabCount} ${styles.tabCountAlert}`}>
            {overdueCount ?? 0}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'today'}
          onClick={() => setActiveTab('today')}
          className={`${styles.tabBtn} ${activeTab === 'today' ? styles.tabActive : ''}`}
        >
          <span>Due Today</span>
          <span className={`${styles.tabCount} ${styles.tabCountWarning}`}>
            {dueTodayCount ?? 0}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      {dataStatus === 'unavailable' ? (
        <div className={styles.stateContainer} role="status">
          <p className={styles.stateMessage}>
            Follow-up activity is unavailable. Open Follow-ups to retry the full queue.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className={styles.emptyContainer} role="status">
          <div className={styles.emptyIcon} aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>Queue Cleared</h3>
          <p className={styles.emptySub}>
            No overdue or pending follow-ups scheduled for this timeframe. All client engagements are on track.
          </p>
        </div>
      ) : (
        <ol className={styles.list}>
          {filteredItems.map((item) => (
            <li key={item.id} className={styles.row}>
              {/* Client Monogram Avatar */}
              <div className={styles.avatarPill} aria-hidden="true">
                {getInitials(item.name)}
              </div>

              {/* Client Info */}
              <div className={styles.clientInfo}>
                <Link
                  className={styles.clientLink}
                  href={`/admin/leads?id=${encodeURIComponent(item.id)}`}
                >
                  <span className={styles.clientName}>{item.name}</span>
                </Link>
                <span className={styles.clientMeta}>{item.company || item.leadId}</span>
              </div>

              {/* Stage & Priority */}
              <div className={styles.stageGroup}>
                <span className={styles.stageBadge}>{item.stage}</span>
                <span
                  className={`${styles.priorityBadge} ${
                    item.priority === 'High'
                      ? styles.priorityHigh
                      : item.priority === 'Medium'
                      ? styles.priorityMedium
                      : styles.priorityLow
                  }`}
                >
                  {item.priority}
                </span>
              </div>

              {/* Expected Value */}
              <div className={styles.valueCol}>
                <span className={styles.valueText}>
                  {formatCrmCurrency(item.expectedValue)}
                </span>
                <span className={styles.scheduleText}>
                  {formatFollowUp(item.nextFollowUp)}
                </span>
              </div>

              {/* Action Trigger */}
              <div className={styles.actionCol}>
                <Link
                  href={`/admin/leads?id=${encodeURIComponent(item.id)}`}
                  className={styles.actionTrigger}
                  title="Open Client Dossier"
                  aria-label={`Open dossier for ${item.name}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </Link>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
