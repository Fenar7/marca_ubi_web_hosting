'use client';

/**
 * @file RawBriefAccordion.tsx
 * @description Accessible accordion component rendering original /start-project questionnaire responses.
 *              Transforms structured brief payloads into formatted, human-readable commercial intelligence.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState } from 'react';
import {
  formatBriefLabel,
  formatBriefValue,
  extractBriefEntries,
} from './dossierUtils';
import styles from './DossierDrawer.module.scss';

export interface RawBriefAccordionProps {
  briefPayload: Record<string, unknown> | null;
  className?: string;
}

export function RawBriefAccordion({
  briefPayload,
  className,
}: RawBriefAccordionProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const entries = extractBriefEntries(briefPayload);
  const fieldCount = entries.length;

  return (
    <div className={`${styles.briefAccordion} ${className || ''}`}>
      <button
        id="brief-accordion-trigger"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="brief-accordion-region"
        className={`${styles.accordionTrigger} ${isOpen ? styles.open : ''}`}
      >
        <span>
          Project Brief Responses {fieldCount > 0 ? `(${fieldCount})` : ''}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          id="brief-accordion-region"
          className={styles.accordionContent}
          role="region"
          aria-labelledby="brief-accordion-trigger"
        >
          {fieldCount === 0 ? (
            <p className={styles.emptyBrief}>
              No website questionnaire answers recorded for this inquiry.
            </p>
          ) : (
            entries.map(([key, value]) => (
              <div key={key} className={styles.briefEntry}>
                <span className={styles.briefKey}>{formatBriefLabel(key)}</span>
                <span className={styles.briefVal}>{formatBriefValue(value)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
