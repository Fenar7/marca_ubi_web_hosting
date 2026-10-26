'use client';

/**
 * @file ExecutiveActivityRail.tsx
 * @description Executive Intelligence & Activity Rail for the Executive Overview Dashboard.
 *              Directly benchmarked against Logip's right column (original-f0a51857256dd5802cfc7a47a6f070a2.webp).
 *              Houses User Profile Spotlight, live chronological activity feed, attachments, and quick-note composer.
 * @module app/admin/components/Dashboard/ExecutiveActivityRail
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState } from 'react';
import type { CurrentUserSession } from '../layout/UserProfileDropdown';
import styles from './ExecutiveActivityRail.module.scss';

export interface ActivityFeedItem {
  id: string;
  type: string;
  actor: string;
  description: string;
  timeAgo: string;
  comment?: string;
  attachment?: {
    name: string;
    size: string;
    url: string;
  };
}

interface ExecutiveActivityRailProps {
  currentUser: CurrentUserSession;
  activities?: ActivityFeedItem[];
}

export const ExecutiveActivityRail: React.FC<ExecutiveActivityRailProps> = ({
  currentUser,
  activities: initialActivities,
}) => {
  const [noteText, setNoteText] = useState<string>('');
  const [localActivities, setLocalActivities] = useState<ActivityFeedItem[]>(
    initialActivities && initialActivities.length > 0 ? initialActivities : [
      {
        id: 'act-1',
        type: 'comment',
        actor: 'Floyd Miles',
        description: 'Commented on Stark Project',
        timeAgo: '10:15 AM',
        comment: "Hi! Next week we'll start a new project. I'll share all the details later.",
      },
      {
        id: 'act-2',
        type: 'attachment',
        actor: 'Guy Hawkins',
        description: 'Added proposal document to Acme Project',
        timeAgo: '09:40 AM',
        attachment: {
          name: 'Acme_Brand_Scope_v2.pdf',
          size: '13.4 MB',
          url: '#',
        },
      },
      {
        id: 'act-3',
        type: 'status',
        actor: 'Kristin Watson',
        description: 'Advanced Horizon AI to Contract Review',
        timeAgo: 'Yesterday',
      },
    ]
  );

  const handlePostNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    const newAct: ActivityFeedItem = {
      id: `note-${Date.now()}`,
      type: 'comment',
      actor: currentUser.name || 'You',
      description: 'Logged an executive commercial note',
      timeAgo: 'Just now',
      comment: noteText.trim(),
    };

    setLocalActivities([newAct, ...localActivities]);
    setNoteText('');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('crm-toast', {
          detail: {
            type: 'success',
            title: 'Note Logged',
            description: 'Commercial note has been recorded to the activity ledger.',
          },
        })
      );
    }
  };

  const formattedRole = currentUser.role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const initials = currentUser.name
    ? currentUser.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'MU';

  return (
    <div className={styles.railContainer} aria-label="Executive Intelligence & Activity Rail">
      {/* 1. Profile Spotlight Card (Logip Matching) */}
      <div className={styles.profileCard}>
        <div className={styles.avatarContainer}>
          {currentUser.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt={currentUser.name || 'User'} className={styles.avatarImage} />
          ) : (
            <div className={styles.avatarFallback}>{initials}</div>
          )}
          <span className={styles.onlineBadge} title="Active Session" />
        </div>
        <h3 className={styles.userName}>{currentUser.name || 'Marca Ubi Principal'}</h3>
        <span className={styles.userHandle}>@{currentUser.email.split('@')[0]} • {formattedRole}</span>

        <div className={styles.quickActionsRow}>
          <button
            type="button"
            className={styles.actionIconBtn}
            title="Initiate phone touchpoint"
            onClick={() => window.dispatchEvent(new CustomEvent('open-new-lead-drawer'))}
            aria-label="Quick contact call"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.actionIconBtn}
            title="Schedule executive conference"
            onClick={() => window.dispatchEvent(new CustomEvent('open-new-lead-drawer'))}
            aria-label="Quick video meet"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.actionIconBtn}
            title="Open command menu (⌘K)"
            onClick={() => window.dispatchEvent(new CustomEvent('open-omni-search'))}
            aria-label="Open command palette"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. Real-Time Activity Feed (Logip Matching) */}
      <div className={styles.activityCard}>
        <div className={styles.activityHeader}>
          <h3 className={styles.activityTitle}>Activity</h3>
          <span className={styles.liveBadge}>
            <span className={styles.liveDot} />
            Live Stream
          </span>
        </div>

        <div className={styles.activityList}>
          {localActivities.map((act) => (
            <div key={act.id} className={styles.activityItem}>
              <div className={styles.actorAvatar}>
                {act.actor.charAt(0).toUpperCase()}
              </div>
              <div className={styles.itemBody}>
                <div className={styles.itemMeta}>
                  <span className={styles.actorName}>{act.actor}</span>
                  <span className={styles.itemTime}>{act.timeAgo}</span>
                </div>
                <span className={styles.itemAction}>{act.description}</span>

                {act.comment && (
                  <div className={styles.messageBubble}>
                    {act.comment}
                  </div>
                )}

                {act.attachment && (
                  <a href={act.attachment.url} className={styles.attachmentCard} onClick={(e) => e.preventDefault()}>
                    <div className={styles.attachmentInfo}>
                      <span className={styles.attachmentIcon}>PDF</span>
                      <div className={styles.attachmentText}>
                        <span className={styles.attachmentName}>{act.attachment.name}</span>
                        <span className={styles.attachmentSize}>{act.attachment.size}</span>
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 3. Quick Note Composer with Signature Lemon Yellow Button */}
        <form onSubmit={handlePostNote} className={styles.composerBox}>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write a commercial note..."
            rows={2}
            className={styles.composerInput}
          />
          <div className={styles.composerFooter}>
            <div className={styles.composerTools}>
              <button type="button" className={styles.composerToolBtn} title="Attach file" aria-label="Attach file">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              <button type="button" className={styles.composerToolBtn} title="Emoji reaction" aria-label="Insert emoji">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </button>
            </div>
            <button
              type="submit"
              disabled={!noteText.trim()}
              className={styles.postNoteBtn}
            >
              Post Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
