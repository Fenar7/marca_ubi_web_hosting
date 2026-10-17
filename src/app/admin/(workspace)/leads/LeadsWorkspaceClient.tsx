'use client';

/**
 * @file LeadsWorkspaceClient.tsx
 * @description Interactive Client Component for the Pipeline Deals Workspace (/admin/leads).
 *              Provides instantaneous client-side search filtering across company, contact,
 *              and lead ID, with real-time bucket tab counters and Linear Fluid Card data tables.
 * @module app/admin/(workspace)/leads/LeadsWorkspaceClient
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useMemo } from 'react';
import type { FunnelBucket } from '@/types/crm';
import styles from './leads.module.scss';

export interface HydratedLeadItem {
  id: string;
  lead_id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  preferred_channel: string;
  service_category: string;
  expected_value: number;
  priority: string;
  status_id: string;
  status_name: string;
  status_color: string;
  bucket: FunnelBucket;
  assigned_to_name: string;
  next_follow_up: string | null;
  created_at: string;
}

interface LeadsWorkspaceClientProps {
  initialLeads: HydratedLeadItem[];
}

function formatCurrency(amount: number): string {
  if (!amount || amount <= 0) return '₹0';
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function LeadsWorkspaceClient({
  initialLeads,
}: LeadsWorkspaceClientProps): React.ReactElement {
  const [selectedBucket, setSelectedBucket] = useState<'all' | FunnelBucket>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Bucket counts
  const counts = useMemo(() => {
    return {
      all: initialLeads.length,
      open: initialLeads.filter((l) => l.bucket === 'open').length,
      potential: initialLeads.filter((l) => l.bucket === 'potential').length,
      converted: initialLeads.filter((l) => l.bucket === 'converted').length,
      lost: initialLeads.filter((l) => l.bucket === 'lost').length,
    };
  }, [initialLeads]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return initialLeads.filter((lead) => {
      // Bucket check
      if (selectedBucket !== 'all' && lead.bucket !== selectedBucket) {
        return false;
      }

      // Search query check
      if (!q) return true;
      return (
        lead.name.toLowerCase().includes(q) ||
        (lead.company && lead.company.toLowerCase().includes(q)) ||
        lead.lead_id.toLowerCase().includes(q) ||
        (lead.email && lead.email.toLowerCase().includes(q)) ||
        (lead.phone && lead.phone.toLowerCase().includes(q)) ||
        lead.service_category.toLowerCase().includes(q)
      );
    });
  }, [initialLeads, selectedBucket, searchQuery]);

  return (
    <>
      {/* Controls Bar: Bucket Tabs & Search */}
      <div className={styles.controlsBar}>
        <div className={styles.bucketTabs} role="tablist" aria-label="Pipeline Stages">
          <button
            type="button"
            role="tab"
            aria-selected={selectedBucket === 'all'}
            onClick={() => setSelectedBucket('all')}
            className={`${styles.tabBtn} ${selectedBucket === 'all' ? styles.tabBtnActive : ''}`}
          >
            <span>All Deals</span>
            <span className={styles.tabCount}>{counts.all}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedBucket === 'open'}
            onClick={() => setSelectedBucket('open')}
            className={`${styles.tabBtn} ${selectedBucket === 'open' ? styles.tabBtnActive : ''}`}
          >
            <span>Open</span>
            <span className={styles.tabCount}>{counts.open}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedBucket === 'potential'}
            onClick={() => setSelectedBucket('potential')}
            className={`${styles.tabBtn} ${selectedBucket === 'potential' ? styles.tabBtnActive : ''}`}
          >
            <span>Potential</span>
            <span className={styles.tabCount}>{counts.potential}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedBucket === 'converted'}
            onClick={() => setSelectedBucket('converted')}
            className={`${styles.tabBtn} ${selectedBucket === 'converted' ? styles.tabBtnActive : ''}`}
          >
            <span>Converted</span>
            <span className={styles.tabCount}>{counts.converted}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedBucket === 'lost'}
            onClick={() => setSelectedBucket('lost')}
            className={`${styles.tabBtn} ${selectedBucket === 'lost' ? styles.tabBtnActive : ''}`}
          >
            <span>Lost</span>
            <span className={styles.tabCount}>{counts.lost}</span>
          </button>
        </div>

        <div className={styles.searchBox}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deals, company, or rep..."
            className={styles.searchInput}
            aria-label="Filter deals"
          />
        </div>
      </div>

      {/* Leads Data Table */}
      <div className={styles.tableWrapper}>
        {filteredLeads.length === 0 ? (
          <div className={styles.emptyState}>
            <span>No prospective deals matching the current filter criteria.</span>
          </div>
        ) : (
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th>Deal ID</th>
                <th>Client & Company</th>
                <th>Service</th>
                <th>Stage</th>
                <th>Valuation</th>
                <th>Assigned Rep</th>
                <th>Next Touchpoint</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                const repInitials = lead.assigned_to_name
                  ? lead.assigned_to_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()
                  : 'UN';

                const followUpText = lead.next_follow_up
                  ? new Date(lead.next_follow_up).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—';

                return (
                  <tr key={lead.id} className={styles.tableRow}>
                    <td>
                      <span className={styles.leadIdToken}>{lead.lead_id}</span>
                    </td>
                    <td>
                      <div className={styles.clientMeta}>
                        <span className={styles.clientName}>{lead.name}</span>
                        <span className={styles.companyTitle}>
                          {lead.company || 'Private Client'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>
                        {lead.service_category}
                      </span>
                    </td>
                    <td>
                      <span
                        className={styles.statusPill}
                        style={{
                          background: `${lead.status_color || '#ff6100'}18`,
                          border: `1px solid ${lead.status_color || '#ff6100'}35`,
                          color: lead.status_color || '#ff6100',
                        }}
                      >
                        ● {lead.status_name}
                      </span>
                    </td>
                    <td>
                      <span className={styles.dealValue}>
                        {formatCurrency(lead.expected_value)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.repBadge}>
                        <div className={styles.repAvatar}>{repInitials}</div>
                        <span>{lead.assigned_to_name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: '#a1a1aa', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {followUpText}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
