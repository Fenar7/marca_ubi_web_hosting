'use client';

/**
 * @file RapidTouchpointComposer.tsx
 * @description Sticky Omnichannel Rapid Interaction Composer for the Client 360° Workspace.
 *              Enforces sub-15-second logging for phone calls, WhatsApp exchanges, executive meetings,
 *              and strategic deal notes. Features single-line duration buttons with exactly 5 equal columns
 *              and synchronous button locking to prevent duplicate submissions.
 * @module components/DossierWorkspace/RapidTouchpointComposer
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useRef, useTransition } from 'react';
import { logLeadActivityAction } from '@/app/actions/leadActivityActions';
import type { LeadActivityWithActor, LeadActivityType } from '@/types/crm';
import styles from './LeadDossierWorkspace.module.scss';

export type TouchpointTab = 'call' | 'whatsapp' | 'meeting' | 'note';

export interface RapidTouchpointComposerProps {
  /** Database primary key UUID of the commercial lead */
  leadId: string;
  /** Callback to append the newly persisted interaction to the activity ledger */
  onActivityLogged: (activity: LeadActivityWithActor) => void;
  /** Optional custom class name */
  className?: string;
}

const CALL_OUTCOMES = [
  'Connected',
  'Busy / No Answer',
  'Left Voicemail',
  'Meeting Scheduled',
] as const;

const WHATSAPP_TYPES = [
  'Discovery',
  'Follow-up',
  'Proposal Link Dispatched',
  'Client Inbound',
] as const;

const MEETING_TYPES = [
  'Executive Discovery',
  'Technical Scoping',
  'Contract Review',
  'Commercial Closing',
] as const;

const DURATION_PRESETS = [
  { label: '5m', seconds: 300 },
  { label: '15m', seconds: 900 },
  { label: '30m', seconds: 1800 },
  { label: '45m', seconds: 2700 },
  { label: '60m', seconds: 3600 },
];

const NOTE_TAGS = ['#urgent', '#high-margin', '#retainer', '#follow-up'];

export function RapidTouchpointComposer({
  leadId,
  onActivityLogged,
  className,
}: RapidTouchpointComposerProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TouchpointTab>('call');
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const submittingLockRef = useRef<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Call state
  const [callDurationSeconds, setCallDurationSeconds] = useState<number>(900); // 15m default
  const [callOutcome, setCallOutcome] = useState<typeof CALL_OUTCOMES[number]>('Connected');
  const [callNotes, setCallNotes] = useState<string>('');

  // WhatsApp state
  const [whatsAppType, setWhatsAppType] = useState<typeof WHATSAPP_TYPES[number]>('Follow-up');
  const [whatsAppNotes, setWhatsAppNotes] = useState<string>('');

  // Meeting state
  const [meetingType, setMeetingType] = useState<typeof MEETING_TYPES[number]>('Executive Discovery');
  const [meetingAttendees, setMeetingAttendees] = useState<string>('');
  const [meetingNotes, setMeetingNotes] = useState<string>('');

  // Note state
  const [internalNote, setInternalNote] = useState<string>('');

  const currentText =
    activeTab === 'call'
      ? callNotes
      : activeTab === 'whatsapp'
      ? whatsAppNotes
      : activeTab === 'meeting'
      ? meetingNotes
      : internalNote;

  const isTextValid = currentText.trim().length >= 3;
  const isActionDisabled = !isTextValid || isSubmitting || isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingLockRef.current || isActionDisabled) return;

    submittingLockRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    let activityType: LeadActivityType = 'note_added';
    let description = '';
    const metadata: Record<string, unknown> = {
      client_timestamp: new Date().toISOString(),
    };

    if (activeTab === 'call') {
      activityType = 'call_logged';
      description = callNotes.trim();
      metadata.outcome = callOutcome;
      metadata.duration_seconds = callDurationSeconds;
    } else if (activeTab === 'whatsapp') {
      activityType = 'whatsapp_sent';
      description = whatsAppNotes.trim();
      metadata.message_category = whatsAppType;
    } else if (activeTab === 'meeting') {
      activityType = 'meeting_notes';
      description = meetingNotes.trim();
      metadata.meeting_type = meetingType;
      if (meetingAttendees.trim()) {
        metadata.attendees = meetingAttendees.trim();
      }
    } else {
      activityType = 'note_added';
      description = internalNote.trim();
    }

    startTransition(async () => {
      try {
        const result = await logLeadActivityAction({
          leadId,
          activityType,
          description,
          metadata,
        });

        if (result.success && result.data) {
          onActivityLogged(result.data);
          // Clear active form field
          if (activeTab === 'call') setCallNotes('');
          else if (activeTab === 'whatsapp') setWhatsAppNotes('');
          else if (activeTab === 'meeting') {
            setMeetingNotes('');
            setMeetingAttendees('');
          } else {
            setInternalNote('');
          }
        } else {
          setErrorMessage(result.error || 'Failed to persist interaction. Please retry.');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setErrorMessage(`Network error logging touchpoint: ${message}`);
      } finally {
        submittingLockRef.current = false;
        setIsSubmitting(false);
      }
    });
  };

  const handleAppendTag = (tag: string) => {
    setInternalNote((prev) => (prev ? `${prev} ${tag}` : tag));
  };

  return (
    <div className={`${styles.stickyComposerContainer} ${className || ''}`}>
      <div className={styles.sectionHeader} style={{ marginBottom: 16 }}>
        <h2 className={styles.sectionTitle}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span>Rapid Touchpoint Composer.</span>
        </h2>
      </div>

      {/* 1. Omnichannel Tabs */}
      <div className={styles.composerTabsRow} role="tablist" aria-label="Touchpoint logging channels">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'call'}
          className={`${styles.composerTabBtn} ${activeTab === 'call' ? styles.activeTab : ''}`}
          onClick={() => {
            setActiveTab('call');
            setErrorMessage(null);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span>Call</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'whatsapp'}
          className={`${styles.composerTabBtn} ${activeTab === 'whatsapp' ? styles.activeTab : ''}`}
          onClick={() => {
            setActiveTab('whatsapp');
            setErrorMessage(null);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <span>WhatsApp</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'meeting'}
          className={`${styles.composerTabBtn} ${activeTab === 'meeting' ? styles.activeTab : ''}`}
          onClick={() => {
            setActiveTab('meeting');
            setErrorMessage(null);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Meeting</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'note'}
          className={`${styles.composerTabBtn} ${activeTab === 'note' ? styles.activeTab : ''}`}
          onClick={() => {
            setActiveTab('note');
            setErrorMessage(null);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span>Note</span>
        </button>
      </div>

      {/* 2. Composer Body Form */}
      <form onSubmit={handleSubmit} className={styles.composerForm}>
        {/* Tab 1: Call Fields */}
        {activeTab === 'call' && (
          <>
            <div className={styles.composerField}>
              <label className={styles.fieldLabel}>Call Outcome</label>
              <select
                value={callOutcome}
                onChange={(e) => setCallOutcome(e.target.value as typeof CALL_OUTCOMES[number])}
                className={styles.composerSelect}
              >
                {CALL_OUTCOMES.map((outcome) => (
                  <option key={outcome} value={outcome}>
                    {outcome}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.composerField}>
              <div className={styles.durationHeaderRow}>
                <label className={styles.fieldLabel}>Call Duration</label>
                <span className={styles.durationActiveBadge}>
                  {Math.round(callDurationSeconds / 60)} min
                </span>
              </div>
              {/* Single-line duration buttons with grid-template-columns: repeat(5, 1fr) */}
              <div className={styles.presetGroup}>
                {DURATION_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setCallDurationSeconds(p.seconds)}
                    className={`${styles.presetBtn} ${
                      callDurationSeconds === p.seconds ? styles.activePreset : ''
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.composerField}>
              <label className={styles.fieldLabel}>Discussion Summary</label>
              <textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Log executive discussion notes, client commitments, next steps..."
                className={styles.composerTextarea}
                rows={3}
              />
            </div>
          </>
        )}

        {/* Tab 2: WhatsApp Fields */}
        {activeTab === 'whatsapp' && (
          <>
            <div className={styles.composerField}>
              <label className={styles.fieldLabel}>Message Classification</label>
              <select
                value={whatsAppType}
                onChange={(e) => setWhatsAppType(e.target.value as typeof WHATSAPP_TYPES[number])}
                className={styles.composerSelect}
              >
                {WHATSAPP_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.composerField}>
              <label className={styles.fieldLabel}>Message Summary</label>
              <textarea
                value={whatsAppNotes}
                onChange={(e) => setWhatsAppNotes(e.target.value)}
                placeholder="Dispatched proposal link, received design feedback via WhatsApp..."
                className={styles.composerTextarea}
                rows={3}
              />
            </div>
          </>
        )}

        {/* Tab 3: Meeting Fields */}
        {activeTab === 'meeting' && (
          <>
            <div className={styles.composerField}>
              <label className={styles.fieldLabel}>Meeting Type</label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as typeof MEETING_TYPES[number])}
                className={styles.composerSelect}
              >
                {MEETING_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.composerField}>
              <label className={styles.fieldLabel}>Attendees</label>
              <input
                type="text"
                value={meetingAttendees}
                onChange={(e) => setMeetingAttendees(e.target.value)}
                placeholder="e.g. CEO, Creative Director, Marketing Lead"
                className={styles.composerSelect}
              />
            </div>

            <div className={styles.composerField}>
              <label className={styles.fieldLabel}>Meeting Minutes & Action Items</label>
              <textarea
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder="Document key meeting agreements, deliverable timelines, scope consensus..."
                className={styles.composerTextarea}
                rows={3}
              />
            </div>
          </>
        )}

        {/* Tab 4: Internal Note Fields */}
        {activeTab === 'note' && (
          <>
            <div className={styles.composerField}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                {NOTE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAppendTag(tag)}
                    className={styles.badgePill}
                    style={{ cursor: 'pointer', background: '#1c1c22' }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Add confidential internal team note, tag teammates with @name, tag topics with #tag..."
                className={styles.composerTextarea}
                rows={4}
              />
            </div>
          </>
        )}

        {/* Error Feedback */}
        {errorMessage && <div className={styles.composerErrorBanner}>{errorMessage}</div>}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isActionDisabled}
          className={styles.composerSubmitBtn}
        >
          {isSubmitting ? (
            <span>Recording Interaction...</span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ width: 14, height: 14 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Log {activeTab === 'call' ? 'Call' : activeTab === 'whatsapp' ? 'WhatsApp' : activeTab === 'meeting' ? 'Meeting' : 'Note'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
