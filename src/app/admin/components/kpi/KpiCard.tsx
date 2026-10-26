/**
 * @file KpiCard.tsx
 * @description Individual Logip x Sypher Scorecard component for executive analytics.
 *              Features 36px circular tinted icon containers, tabular numerals,
 *              isolated secondary badge rows to prevent value truncation/collision,
 *              and tactile hover states.
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import Link from 'next/link';
import styles from './KpiRibbon.module.scss';

export interface KpiCardProps {
  id: string;
  label: string;
  value: string | number;
  subtext: React.ReactNode;
  href: string;
  icon?: React.ReactNode;
  isAlert?: boolean;
  secondaryBadge?: React.ReactNode;
  titleTooltip?: string;
  ariaLabel?: string;
}

/**
 * Individual metric card conforming to the Logip x Sypher Scorecard archetype.
 * Provides accessible navigation, specular top highlight, zero-layout-shift
 * tabular numeral presentation, and separated badge geometry.
 *
 * @param {KpiCardProps} props Properties configuring the metric card presentation.
 * @returns {React.ReactElement} Clickable, styled score card.
 */
export function KpiCard({
  id,
  label,
  value,
  subtext,
  href,
  icon,
  isAlert = false,
  secondaryBadge,
  titleTooltip,
  ariaLabel,
}: KpiCardProps): React.ReactElement {
  const cardTitle = titleTooltip || `${label}: ${value}`;
  const accessibleLabel =
    ariaLabel ||
    `${label}: ${value}${isAlert ? '. Action Required' : ''}`;

  return (
    <Link
      href={href}
      className={`${styles.kpiCard} ${isAlert ? styles.alertActive : ''}`}
      title={cardTitle}
      aria-label={accessibleLabel}
      data-testid={`kpi-card-${id}`}
      data-card-id={id}
    >
      <div className={styles.kpiHeader}>
        <span className={styles.kpiLabel}>{label}</span>
        <div className={styles.kpiHeaderMeta}>
          {icon && (
            <span className={`${styles.kpiIconWrap} ${styles.kpiIcon}`}>
              {icon}
            </span>
          )}
          <span className={styles.drilldownArrow} aria-hidden="true">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </span>
        </div>
      </div>

      <div className={styles.kpiValueWrapper}>
        <span className={styles.kpiValue} data-testid={`kpi-value-${id}`}>
          {value}
        </span>
      </div>

      {secondaryBadge && (
        <div className={styles.secondaryBadgeRow}>
          {secondaryBadge}
        </div>
      )}

      <div className={styles.kpiSubtext} data-testid={`kpi-subtext-${id}`}>
        {subtext}
      </div>
    </Link>
  );
}

export default KpiCard;
