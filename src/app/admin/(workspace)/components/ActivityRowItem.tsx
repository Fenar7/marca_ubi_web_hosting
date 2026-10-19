'use client';

/**
 * @file ActivityRowItem.tsx
 * @description Interactive Client Component for recent activity rows.
 *              Dispatches 'open-lead-drawer' when clicked if leadId is associated.
 * @module app/admin/(workspace)/components/ActivityRowItem
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import styles from '../page.module.scss';

export interface ActivityRowItemProps {
  id: string;
  type: string;
  badgeStyle: 'orange' | 'emerald' | 'amber' | 'neutral' | 'blue';
  description: string;
  actor: string;
  timeAgo: string;
  leadId?: string | null;
}

export function ActivityRowItem({
  type,
  badgeStyle,
  description,
  actor,
  timeAgo,
  leadId,
}: ActivityRowItemProps): React.ReactElement {
  const badgeClass =
    badgeStyle === 'emerald'
      ? styles.badgeEmerald
      : badgeStyle === 'amber'
      ? styles.badgeAmber
      : badgeStyle === 'orange'
      ? styles.badgeOrange
      : styles.badgeNeutral || styles.badgeBlue;

  const handleClick = (): void => {
    if (leadId && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-lead-drawer', { detail: { leadId } })
      );
    }
  };

  const isClickable = Boolean(leadId);

  return (
    <div
      className={`${styles.activityRow} ${isClickable ? styles.activityRowClickable : ''}`}
      onClick={isClickable ? handleClick : undefined}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter') handleClick();
            }
          : undefined
      }
      title={isClickable ? 'Click to inspect associated deal dossier' : undefined}
    >
      <div className={styles.activityLeft}>
        <span className={`${styles.activityBadge} ${badgeClass}`}>{type}</span>
        <span className={styles.activityDesc}>{description}</span>
      </div>
      <div className={styles.activityRight}>
        <span className={styles.activityActor}>{actor}</span>
        <span className={styles.activityTime}>{timeAgo}</span>
        {isClickable && (
          <span className={styles.externalIndicator} aria-hidden="true">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );
}
