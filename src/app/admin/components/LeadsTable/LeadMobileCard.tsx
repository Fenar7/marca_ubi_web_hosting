'use client';

/**
 * @file LeadMobileCard.tsx
 * @description Responsive fluid mobile card component for the Deals & Inquiries Data Grid (< 768px).
 *              Integrates inline status and priority modifiers, Deal ID clipboard copy, and native
 *              Click-to-Call (`tel:`) and Click-to-WhatsApp (`https://wa.me/`) omnichannel action triggers.
 * @module app/admin/components/LeadsTable/LeadMobileCard
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState } from 'react';
import type { HydratedLeadItem } from '@/app/admin/(workspace)/leads/LeadsWorkspaceClient';
import { InlineStatusSelect, type InlineStatusOption } from './InlineStatusSelect';
import { InlinePrioritySelect } from './InlinePrioritySelect';
import type { LeadPriority } from '@/types/crm';
import styles from './LeadMobileCard.module.scss';

export interface LeadMobileCardProps {
  /** Commercial lead record payload */
  lead: HydratedLeadItem;
  /** Available stages for inline status selection */
  availableStatuses: InlineStatusOption[];
  /** Callback fired upon inline status modification */
  onStatusChange?: (leadId: string, newStatus: InlineStatusOption) => void;
  /** Callback fired upon inline priority modification */
  onPriorityChange?: (leadId: string, newPriority: LeadPriority) => void;
  /** Custom class name */
  className?: string;
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

export function LeadMobileCard({
  lead,
  availableStatuses,
  onStatusChange,
  onPriorityChange,
  className,
}: LeadMobileCardProps): React.ReactElement {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyDealId = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(lead.lead_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCardClick = (): void => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-lead-drawer', { detail: { leadId: lead.id } })
      );
    }
  };

  const repInitials = (lead.assigned_to_name || 'Unassigned')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Sanitize digits for WhatsApp international link
  const digitsOnly = (lead.phone || '').replace(/[^0-9]/g, '');
  const hasValidPhone = Boolean(digitsOnly && digitsOnly.length >= 7);
  const whatsAppUrl = hasValidPhone ? `https://wa.me/${digitsOnly}` : null;
  const telUrl = lead.phone ? `tel:${lead.phone.trim()}` : null;

  const currentStatusOption: InlineStatusOption = {
    id: lead.status_id,
    name: lead.status_name,
    bucket: lead.bucket,
    color_code: lead.status_color || '#ff6100',
  };

  return (
    <article
      className={`${styles.cardWrapper} ${className || ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`Deal ${lead.lead_id}: ${lead.name} from ${lead.company || 'Private Client'}`}
    >
      {/* 1. Header: Deal ID, Timestamp, and Expected Valuation */}
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <button
            type="button"
            onClick={handleCopyDealId}
            className={styles.leadIdToken}
            title="Click to copy Deal ID"
            aria-label={`Copy Deal ID ${lead.lead_id}`}
          >
            <span>{copied ? '✓ Copied' : lead.lead_id}</span>
          </button>
          <span className={styles.timeTag}>
            {new Date(lead.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <span className={styles.dealValue}>{formatCurrency(lead.expected_value)}</span>
      </div>

      {/* 2. Client & Organization Narrative */}
      <div className={styles.clientSection}>
        <div className={styles.clientName}>{lead.name}</div>
        <div className={styles.companyTitle}>{lead.company || 'Private Client'}</div>
      </div>

      {/* 3. Category & Acquisition Source Tags */}
      <div className={styles.metaTagsRow}>
        <span className={styles.serviceTag}>{lead.service_category}</span>
        {lead.lead_source_name && (
          <span className={styles.sourceTag}>
            {lead.lead_source_name}
          </span>
        )}
      </div>

      {/* 4. Interactive Inline Modifiers Row */}
      <div className={styles.inlineSelectorsRow} onClick={(e) => e.stopPropagation()}>
        <InlineStatusSelect
          leadId={lead.id}
          currentStatus={currentStatusOption}
          availableStatuses={availableStatuses}
          onStatusChange={onStatusChange}
        />

        <InlinePrioritySelect
          leadId={lead.id}
          currentPriority={lead.priority}
          onPriorityChange={onPriorityChange}
        />

        <div className={styles.repInfo} title={`Assigned to ${lead.assigned_to_name}`}>
          <div className={styles.repAvatar}>{repInitials}</div>
        </div>
      </div>

      {/* 5. Quick Omnichannel Action Bar */}
      <div className={styles.actionBar} onClick={(e) => e.stopPropagation()}>
        {telUrl ? (
          <a
            href={telUrl}
            className={`${styles.actionBtn} ${styles.callBtn}`}
            title={`Call ${lead.name}`}
            aria-label={`Call ${lead.name} at ${lead.phone}`}
          >
            <span>📞 Call</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className={`${styles.actionBtn} ${styles.callBtn}`}
            aria-disabled="true"
          >
            <span>📞 Call</span>
          </button>
        )}

        {whatsAppUrl ? (
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.actionBtn} ${styles.whatsappBtn}`}
            title={`Message on WhatsApp`}
            aria-label={`Send WhatsApp message to ${lead.name}`}
          >
            <span>💬 WhatsApp</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className={`${styles.actionBtn} ${styles.whatsappBtn}`}
            aria-disabled="true"
          >
            <span>💬 WhatsApp</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleCardClick}
          className={`${styles.actionBtn} ${styles.drawerBtn}`}
          aria-label="Open 360-degree client dossier"
        >
          <span>Dossier →</span>
        </button>
      </div>
    </article>
  );
}
