'use client';

/**
 * @file IngestionBriefMatrix.tsx
 * @description Expansive questionnaire matrix displaying parsed incoming client project briefs.
 *              Surfaces structured discovery parameters with:
 *              - Domain-mapped human-friendly labels.
 *              - Zero text truncation (absolute preservation of technical coordinates and client prose).
 *              - Notion-callout aesthetics for long-form project narratives and creative inspirations.
 *              - Interactive external link chips for uploaded references or case studies.
 * @module components/DossierWorkspace/IngestionBriefMatrix
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useMemo } from 'react';
import {
  extractBriefEntries,
  formatBriefLabel,
  formatBriefValue,
} from '../DossierDrawer/dossierUtils';
import styles from './LeadDossierWorkspace.module.scss';

export interface IngestionBriefMatrixProps {
  /** Raw JSONB brief payload stored on public.leads(brief_payload) */
  payload: Record<string, unknown> | null | undefined;
  /** Primary service domain recorded during ingestion */
  serviceCategory?: string | null;
  /** Budget bracket recorded during discovery */
  budgetBracket?: string | null;
  /** Optional custom class name */
  className?: string;
}

/**
 * Checks if a string value represents a valid HTTP/HTTPS URL.
 */
function isHttpUrl(value: string): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

/**
 * Formats heterogeneous brief values into accessible React nodes.
 * Distinguishes between clickable URLs, multi-line narratives, and arrays of tags.
 */
function renderBriefNode(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Not specified</span>;
  }

  // Handle single string URL
  if (typeof value === 'string' && isHttpUrl(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.briefLinkChip}
        title={`Open ${value}`}
      >
        <span>{value}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    );
  }

  // Handle array of strings or links
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span style={{ color: '#6b7280', fontStyle: 'italic' }}>None provided</span>;
    }

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {value.map((item, index) => {
          const itemStr = String(item);
          if (isHttpUrl(itemStr)) {
            return (
              <a
                key={index}
                href={itemStr}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.briefLinkChip}
              >
                <span>{itemStr}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                </svg>
              </a>
            );
          }
          return (
            <span key={index} className={styles.badgePill}>
              {itemStr}
            </span>
          );
        })}
      </div>
    );
  }

  // Handle long-form multiline text (Notion callout)
  if (typeof value === 'string' && (value.length > 80 || value.includes('\n'))) {
    return (
      <div className={styles.notionCallout} style={{ marginTop: 0 }}>
        <p className={styles.notionCalloutQuote}>{value}</p>
      </div>
    );
  }

  // Handle nested object
  if (typeof value === 'object') {
    return (
      <pre
        style={{
          margin: 0,
          padding: '8px 12px',
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 8,
          fontSize: 12,
          fontFamily: 'var(--font-admin-code, monospace)',
          color: '#e2e8f0',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return <span className={styles.contactValueUntruncated}>{formatBriefValue(value)}</span>;
}

export function IngestionBriefMatrix({
  payload,
  serviceCategory,
  budgetBracket,
  className,
}: IngestionBriefMatrixProps): React.ReactElement {
  const entries = useMemo(() => extractBriefEntries(payload || null), [payload]);

  return (
    <div className={`${styles.sectionCard} ${className || ''}`}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span>Original Ingestion Brief Matrix.</span>
        </h2>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {serviceCategory && (
            <span className={styles.badgePill} title="Service Classification">
              {serviceCategory}
            </span>
          )}
          {budgetBracket && (
            <span className={styles.badgePill} title="Indicated Budget">
              {budgetBracket}
            </span>
          )}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className={styles.briefEmptyBanner}>
          No supplementary questionnaire brief recorded for this inquiry. Ingestion coordinates were
          captured via direct executive outreach or manual lead entry.
        </div>
      ) : (
        <div className={styles.briefMatrixGrid}>
          {entries.map(([rawKey, val]) => {
            const label = formatBriefLabel(rawKey);
            const isExpansive =
              (typeof val === 'string' && (val.length > 80 || val.includes('\n'))) ||
              (Array.isArray(val) && val.length > 2) ||
              (typeof val === 'object' && val !== null);

            return (
              <div
                key={rawKey}
                className={`${styles.briefMatrixItem} ${isExpansive ? styles.fullWidthItem : ''}`}
              >
                <div className={styles.briefItemHeader}>
                  <span className={styles.briefItemLabel}>{label}</span>
                </div>
                <div className={styles.briefItemValue}>{renderBriefNode(val)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
