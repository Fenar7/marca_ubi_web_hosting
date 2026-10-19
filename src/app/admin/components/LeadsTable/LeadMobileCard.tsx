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
import { OverdueBadge } from '@/app/admin/components/Badges';
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
  /** Optional user role for role-based authorization */
  userRole?: string;
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
  userRole,
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

  // Sanitize digits for WhatsApp international link with pre-filled deal reference
  const digitsOnly = (lead.phone || '').replace(/\D/g, '');
  const hasValidPhone = Boolean(digitsOnly && digitsOnly.length >= 7);
  const whatsAppUrl = hasValidPhone
    ? `https://wa.me/${digitsOnly}?text=${encodeURIComponent(
        `Hello ${lead.name}, this is regarding your inquiry with Marca Ubi (Ref: ${lead.lead_id}).`
      )}`
    : null;

  // Strict RFC 3966 telephone coordinate sanitization
  const cleanedPhone = (lead.phone || '').replace(/[^\d+]/g, '');
  const telUrl = cleanedPhone.length >= 7 ? `tel:${cleanedPhone}` : null;

  const currentStatusOption: InlineStatusOption = {
    id: lead.status_id,
    name: lead.status_name,
    bucket: lead.bucket,
    color_code: lead.status_color || '#1f242f',
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
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter' || e.key === ' ') {
                handleCopyDealId(e as unknown as React.MouseEvent);
              }
            }}
            className={styles.leadIdToken}
            title="Click to copy Deal ID"
            aria-label={`Copy Deal ID ${lead.lead_id}`}
          >
            {copied ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied
              </span>
            ) : (
              <span>{lead.lead_id}</span>
            )}
          </button>
          <span className={styles.timeTag}>
            {new Date(lead.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <OverdueBadge
            nextFollowUp={lead.next_follow_up}
            statusName={lead.status_name}
            revisitDate={lead.revisit_date}
            bucket={lead.bucket}
            variant="short"
          />
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
      <div
        className={styles.inlineSelectorsRow}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <InlineStatusSelect
          leadId={lead.id}
          currentStatus={currentStatusOption}
          availableStatuses={availableStatuses}
          onStatusChange={onStatusChange}
          disabled={userRole === 'viewer'}
        />

        <InlinePrioritySelect
          leadId={lead.id}
          currentPriority={lead.priority}
          onPriorityChange={onPriorityChange}
          disabled={userRole === 'viewer'}
        />

        <div className={styles.repInfo} title={`Assigned to ${lead.assigned_to_name}`}>
          <div className={styles.repAvatar}>{repInitials}</div>
        </div>
      </div>

      {/* 5. Quick Omnichannel Action Bar */}
      <div
        className={styles.actionBar}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {telUrl ? (
          <a
            href={telUrl}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className={`${styles.actionBtn} ${styles.callBtn}`}
            title={`Call ${lead.name}`}
            aria-label={`Call ${lead.name} at ${lead.phone}`}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>Call</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className={`${styles.actionBtn} ${styles.callBtn}`}
            aria-disabled="true"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>Call</span>
          </button>
        )}

        {whatsAppUrl ? (
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className={`${styles.actionBtn} ${styles.whatsappBtn}`}
            title="Message on WhatsApp"
            aria-label={`Send WhatsApp message to ${lead.name}`}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>WhatsApp</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className={`${styles.actionBtn} ${styles.whatsappBtn}`}
            aria-disabled="true"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>WhatsApp</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleCardClick}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter' || e.key === ' ') {
              handleCardClick();
            }
          }}
          className={`${styles.actionBtn} ${styles.drawerBtn}`}
          aria-label="Open 360-degree client dossier"
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span>Dossier</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </button>
      </div>
    </article>
  );
}
