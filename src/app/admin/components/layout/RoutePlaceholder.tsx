/**
 * @file RoutePlaceholder.tsx
 * @description Structured dark luxury preview card for planned roadmap modules.
 *              Guarantees zero 404 raw errors during exploratory navigation.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import Link from 'next/link';
import styles from './RoutePlaceholder.module.scss';

interface RoutePlaceholderProps {
  phaseNumber: string;
  moduleTitle: string;
  description: string;
  features: string[];
}

export function RoutePlaceholder({
  phaseNumber,
  moduleTitle,
  description,
  features,
}: RoutePlaceholderProps): React.ReactElement {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.badgeRow}>
          <span className={styles.phaseBadge}>{phaseNumber}</span>
          <span className={styles.statusBadge}>Engineering Delivery In Progress</span>
        </div>

        <h1 className={styles.title}>{moduleTitle}</h1>
        <p className={styles.description}>{description}</p>

        <div className={styles.featureBox}>
          <span className={styles.featureHeader}>Planned Capabilities:</span>
          <ul className={styles.featureList}>
            {features.map((feat, idx) => (
              <li key={idx} className={styles.featureItem}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ff6100"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.actionRow}>
          <Link href="/admin" className={styles.primaryLink}>
            Return to Command Center
          </Link>
          <Link href="/admin/team" className={styles.secondaryLink}>
            View Commercial Directory
          </Link>
        </div>
      </div>
    </div>
  );
}
