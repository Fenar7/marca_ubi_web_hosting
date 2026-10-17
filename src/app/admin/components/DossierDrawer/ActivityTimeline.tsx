'use client';

/**
 * @file ActivityTimeline.tsx
 * @description Chronological Omnichannel Activity Timeline for the Client 360° Drawer.
 *              Renders immutable interaction touchpoints linked via a vertical specular hairline.
 *              Displays event glyph badges, author avatar initials, formatted @mentions/#tags,
 *              call duration/outcome pills, and human-readable relative time coordinates.
 * @module components/DossierDrawer/ActivityTimeline
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React from 'react';
import type { LeadActivityWithActor, LeadActivityType } from '@/types/crm';
import {
  formatRelativeTime,
  formatCallDuration,
  getDossierInitials,
  parseMentionsAndTags,
} from './dossierUtils';
import styles from './DossierDrawer.module.scss';

export interface ActivityTimelineProps {
  activities: LeadActivityWithActor[];
  className?: string;
}

/**
 * Maps activity types to appropriate semantic badges and glyph icons.
 */
function renderActivityGlyph(type: LeadActivityType): React.ReactElement {
  switch (type) {
    case 'call_logged':
      return (
        <span className={`${styles.timelineGlyph} ${styles.glyphCall}`} title="Phone Call">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </span>
      );
    case 'whatsapp_sent':
      return (
        <span className={`${styles.timelineGlyph} ${styles.glyphWhatsApp}`} title="WhatsApp Message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </span>
      );
    case 'meeting_notes':
    case 'meeting_held':
      return (
        <span className={`${styles.timelineGlyph} ${styles.glyphMeeting}`} title="Meeting">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
      );
    case 'status_change':
    case 'priority_change':
    case 'reassignment':
    case 'system_event':
      return (
        <span className={`${styles.timelineGlyph} ${styles.glyphSystem}`} title="System Event">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </span>
      );
    case 'note_added':
    default:
      return (
        <span className={`${styles.timelineGlyph} ${styles.glyphNote}`} title="Internal Note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </span>
      );
  }
}

/**
 * Format activity classification label for human readers.
 */
function getActivityTypeLabel(type: LeadActivityType): string {
  switch (type) {
    case 'call_logged':
      return 'Call Logged';
    case 'whatsapp_sent':
      return 'WhatsApp Sent';
    case 'meeting_notes':
    case 'meeting_held':
      return 'Meeting Held';
    case 'status_change':
      return 'Stage Transition';
    case 'priority_change':
      return 'Priority Updated';
    case 'reassignment':
      return 'Deal Reassigned';
    case 'system_event':
      return 'System Ingestion';
    case 'note_added':
    default:
      return 'Internal Note';
  }
}

export function ActivityTimeline({
  activities,
  className,
}: ActivityTimelineProps): React.ReactElement {
  if (!activities || activities.length === 0) {
    return (
      <div className={`${styles.timelineEmptyContainer} ${className || ''}`}>
        <div className={styles.emptyIconCircle}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <p className={styles.emptyTitle}>No Interaction History</p>
        <p className={styles.emptySubtitle}>
          Touchpoints recorded with the quick action composer above will appear here in chronological order.
        </p>
      </div>
    );
  }

  return (
    <div className={`${styles.timelineContainer} ${className || ''}`} role="feed" aria-label="Omnichannel Activity Timeline">
      <div className={styles.timelineTrack} />

      {activities.map((act) => {
        const metadata = (act.metadata as Record<string, unknown>) || {};
        const parsedTokens = parseMentionsAndTags(act.description);

        return (
          <article key={act.id} className={styles.timelineItem}>
            {/* 1. Event Type Glyph */}
            <div className={styles.glyphWrapper}>
              {renderActivityGlyph(act.activity_type)}
            </div>

            {/* 2. Interaction Card */}
            <div className={styles.timelineCard}>
              {/* Header */}
              <div className={styles.timelineHeader}>
                <div className={styles.authorBadge}>
                  <span className={styles.avatarInitials}>
                    {getDossierInitials(act.actor_name)}
                  </span>
                  <div className={styles.authorMeta}>
                    <span className={styles.authorName}>{act.actor_name}</span>
                    <span className={styles.activityLabel}>
                      {getActivityTypeLabel(act.activity_type)}
                    </span>
                  </div>
                </div>

                <time
                  className={styles.timestamp}
                  dateTime={act.created_at}
                  title={new Date(act.created_at).toUTCString()}
                >
                  {formatRelativeTime(act.created_at)}
                </time>
              </div>

              {/* Description Body with highlighted @mentions & #tags */}
              <div className={styles.timelineBody}>
                {parsedTokens.map((token, idx) => {
                  if (token.type === 'mention') {
                    return (
                      <span key={idx} className={styles.mentionToken}>
                        {token.value}
                      </span>
                    );
                  }
                  if (token.type === 'tag') {
                    return (
                      <span key={idx} className={styles.tagToken}>
                        {token.value}
                      </span>
                    );
                  }
                  return <React.Fragment key={idx}>{token.value}</React.Fragment>;
                })}
              </div>

              {/* Specific Metadata Badges */}
              {(Boolean(metadata.duration_seconds) ||
                Boolean(metadata.outcome) ||
                Boolean(metadata.meeting_type) ||
                Boolean(metadata.message_category) ||
                Boolean(metadata.attendees)) && (
                <div className={styles.metadataPills}>
                  {typeof metadata.duration_seconds === 'number' && (
                    <span className={styles.metaPill}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{formatCallDuration(metadata.duration_seconds)}</span>
                    </span>
                  )}
                  {typeof metadata.outcome === 'string' && (
                    <span className={`${styles.metaPill} ${styles.outcomePill}`}>
                      {metadata.outcome}
                    </span>
                  )}
                  {typeof metadata.message_category === 'string' && (
                    <span className={styles.metaPill}>
                      {metadata.message_category}
                    </span>
                  )}
                  {typeof metadata.meeting_type === 'string' && (
                    <span className={styles.metaPill}>
                      {metadata.meeting_type}
                    </span>
                  )}
                  {typeof metadata.attendees === 'string' && (
                    <span className={styles.metaPill} title={metadata.attendees}>
                      Attendees: {metadata.attendees}
                    </span>
                  )}
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
