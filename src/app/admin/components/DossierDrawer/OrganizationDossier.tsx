'use client';

/**
 * @file OrganizationDossier.tsx
 * @description Left Column Organization & Brand Dossier component for the Client 360° slide-over drawer.
 *              Surfaces company intelligence, decision-maker coordinates, native RFC 3966 deep links,
 *              commercial valuation, and expandable website project brief responses.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { LeadDossierData } from './ClientDossierDrawer';
import { RawBriefAccordion } from './RawBriefAccordion';
import {
  formatDossierCurrency,
  sanitizeTelUri,
  createWhatsAppUri,
} from './dossierUtils';
import styles from './DossierDrawer.module.scss';

export { formatDossierCurrency, sanitizeTelUri, createWhatsAppUri };

export interface OrganizationDossierProps {
  lead: LeadDossierData;
  className?: string;
}

export function OrganizationDossier({
  lead,
  className,
}: OrganizationDossierProps): React.ReactElement {
  const telUri = sanitizeTelUri(lead.phone);
  const whatsAppUri = createWhatsAppUri(lead.phone, lead.lead_id, lead.name);

  // Normalize company website URL to ensure https protocol
  const trimmedWebsite = lead.company_website?.trim() || null;
  const websiteUrl = trimmedWebsite
    ? trimmedWebsite.startsWith('http://') || trimmedWebsite.startsWith('https://')
      ? trimmedWebsite
      : `https://${trimmedWebsite}`
    : null;

  return (
    <div className={`${styles.dossierColumn} ${className || ''}`}>
      {/* 1. Organization & Market Intelligence */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <path d="M9 22v-4h6v4" />
            <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
          </svg>
          <span>Organization & Market</span>
        </div>

        <div className={styles.keyValueList}>
          <div className={styles.keyValuePair}>
            <span className={styles.fieldLabel}>Company Name</span>
            <span className={styles.fieldValue}>{lead.company || 'Private Client'}</span>
          </div>

          <div className={styles.keyValuePair}>
            <span className={styles.fieldLabel}>Verified Domain</span>
            {websiteUrl ? (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.externalLink}
                title={`Visit ${websiteUrl}`}
              >
                <span>{lead.company_website}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            ) : (
              <span className={styles.fieldValue}>Not Provided</span>
            )}
          </div>

          <div className={styles.keyValuePair}>
            <span className={styles.fieldLabel}>Industry</span>
            <span className={styles.fieldValue}>{lead.industry || 'Commercial / Luxury'}</span>
          </div>
        </div>
      </div>

      {/* 2. Primary Decision Maker & Direct Action Triggers */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Primary Decision Maker</span>
        </div>

        <div className={styles.keyValueList}>
          <div className={styles.keyValuePair}>
            <span className={styles.fieldLabel}>Full Name</span>
            <span className={styles.fieldValue}>{lead.name}</span>
          </div>

          <div className={styles.keyValuePair}>
            <span className={styles.fieldLabel}>Direct Phone</span>
            <span className={`${styles.fieldValue} ${styles.mono}`}>{lead.phone || 'Not Provided'}</span>
          </div>

          <div className={styles.keyValuePair}>
            <span className={styles.fieldLabel}>Business Email</span>
            {lead.email ? (
              <a href={`mailto:${lead.email}`} className={styles.externalLink}>
                <span>{lead.email}</span>
              </a>
            ) : (
              <span className={styles.fieldValue}>Not Provided</span>
            )}
          </div>

          <div className={styles.keyValuePair}>
            <span className={styles.fieldLabel}>Preferred Channel</span>
            <span className={styles.fieldValue}>{lead.preferred_channel}</span>
          </div>
        </div>

        {/* Native Deep-Link Communication Triggers */}
        <div className={styles.actionsGrid}>
          <a
            href={telUri || '#'}
            className={`${styles.actionButton} ${styles.callBtn} ${!telUri ? styles.disabled : ''}`}
            aria-disabled={!telUri}
            title={telUri ? `Call ${lead.name} at ${lead.phone}` : 'No phone coordinate available'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>Click-to-Call</span>
          </a>

          <a
            href={whatsAppUri || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.actionButton} ${styles.waBtn} ${!whatsAppUri ? styles.disabled : ''}`}
            aria-disabled={!whatsAppUri}
            title={whatsAppUri ? `Open WhatsApp chat with ${lead.name}` : 'No phone coordinate available'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* 3. Engagement Scope & Commercial Valuation */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span>Commercial Engagement Scope</span>
        </div>

        <div className={styles.keyValueList}>
          <div className={styles.keyValuePair}>
            <span className={styles.fieldLabel}>Service Category</span>
            <div className={styles.tagsWrapper}>
              <span className={styles.serviceTag}>{lead.service_category}</span>
            </div>
          </div>

          <div className={styles.keyValuePair}>
            <span className={styles.fieldLabel}>Expected Valuation</span>
            <span className={styles.valuationBadge}>{formatDossierCurrency(lead.expected_value)}</span>
          </div>

          <div className={styles.keyValuePair}>
            <span className={styles.fieldLabel}>Budget Bracket</span>
            <span className={styles.fieldValue}>{lead.budget_bracket || 'Custom Retainer'}</span>
          </div>

          <div className={styles.keyValuePair}>
            <span className={styles.fieldLabel}>Commercial Priority</span>
            <span className={styles.fieldValue}>{lead.priority}</span>
          </div>

          <div className={styles.keyValuePair}>
            <span className={styles.fieldLabel}>Assigned Representative</span>
            <span className={styles.fieldValue}>{lead.assigned_to_name || 'Unassigned'}</span>
          </div>
        </div>
      </div>

      {/* 4. Original Website Project Brief Payload */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span>Original Brief Questionnaire</span>
        </div>

        <RawBriefAccordion briefPayload={lead.brief_payload} />
      </div>
    </div>
  );
}
