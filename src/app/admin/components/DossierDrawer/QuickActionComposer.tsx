'use client';

/**
 * @file QuickActionComposer.tsx
 * @description Rapid Omnichannel Interaction Composer component for the Client 360° Drawer.
 *              Enforces sub-15 second logging for client phone calls, WhatsApp messages,
 *              meeting outcomes, and internal strategic notes. Prevents duplicate submissions
 *              with synchronous button locking and validates 3-character minimum notes.
 * @module components/DossierDrawer/QuickActionComposer
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import React, { useState, useRef, useTransition } from 'react';
import { logLeadActivityAction } from '@/app/actions/leadActivityActions';
import type { LeadActivityWithActor, LeadActivityType } from '@/types/crm';
import styles from './DossierDrawer.module.scss';

export type ComposerTab = 'call' | 'whatsapp' | 'meeting' | 'note';

export interface QuickActionComposerProps {
  leadId: string;
  onActivityLogged: (activity: LeadActivityWithActor) => void;
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

const NOTE_TAG_PRESETS = ['#urgent', '#high-margin', '#retainer', '#follow-up'];

export function QuickActionComposer({
  leadId,
  onActivityLogged,
  className,
}: QuickActionComposerProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<ComposerTab>('call');
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const submittingLockRef = useRef<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Call Logging State
  const [callDurationSeconds, setCallDurationSeconds] = useState<number>(900); // Default 15m
  const [callOutcome, setCallOutcome] = useState<typeof CALL_OUTCOMES[number]>('Connected');
  const [callNotes, setCallNotes] = useState<string>('');

  // WhatsApp Logging State
  const [whatsAppType, setWhatsAppType] = useState<typeof WHATSAPP_TYPES[number]>('Follow-up');
  const [whatsAppNotes, setWhatsAppNotes] = useState<string>('');

  // Meeting Notes State
  const [meetingType, setMeetingType] = useState<typeof MEETING_TYPES[number]>('Executive Discovery');
  const [meetingAttendees, setMeetingAttendees] = useState<string>('');
  const [meetingNotes, setMeetingNotes] = useState<string>('');

  // Internal Note State
  const [internalNote, setInternalNote] = useState<string>('');

  // Compute current note content for character validation
  const currentNote =
    activeTab === 'call'
      ? callNotes
      : activeTab === 'whatsapp'
      ? whatsAppNotes
      : activeTab === 'meeting'
      ? meetingNotes
      : internalNote;

  const isNoteValid = currentNote.trim().length >= 3;
  const isActionDisabled = !isNoteValid || isSubmitting || isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingLockRef.current || isActionDisabled) return;

    // Synchronous submission lock to prevent double-click duplicate activity entries
    submittingLockRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    let activityType: LeadActivityType = 'note_added';
    let description = '';
    let metadata: Record<string, unknown> = {};

    if (activeTab === 'call') {
      activityType = 'call_logged';
      description = callNotes.trim();
      metadata = {
        duration_seconds: callDurationSeconds,
        outcome: callOutcome,
      };
    } else if (activeTab === 'whatsapp') {
      activityType = 'whatsapp_sent';
      description = whatsAppNotes.trim();
      metadata = {
        message_category: whatsAppType,
      };
    } else if (activeTab === 'meeting') {
      activityType = 'meeting_notes';
      description = meetingNotes.trim();
      metadata = {
        meeting_type: meetingType,
        attendees: meetingAttendees.trim() || undefined,
      };
    } else {
      activityType = 'note_added';
      description = internalNote.trim();
      metadata = {
        is_internal_only: true,
      };
    }

    startTransition(async () => {
      try {
        const result = await logLeadActivityAction({
          leadId,
          activityType,
          description,
          metadata,
        });

        if (!result.success || !result.data) {
          setErrorMessage(result.error || 'Failed to record interaction in activity ledger.');
          submittingLockRef.current = false;
          setIsSubmitting(false);
          return;
        }

        // Reset the relevant field
        if (activeTab === 'call') {
          setCallNotes('');
        } else if (activeTab === 'whatsapp') {
          setWhatsAppNotes('');
        } else if (activeTab === 'meeting') {
          setMeetingNotes('');
          setMeetingAttendees('');
        } else {
          setInternalNote('');
        }

        // Notify parent to prepend activity to timeline immediately
        onActivityLogged(result.data);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'An unexpected error occurred while saving.'
        );
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
    <div className={`${styles.composerContainer} ${className || ''}`}>
      {/* 1. Omnichannel Composer Tabs */}
      <div className={styles.composerTabs} role="tablist" aria-label="Interaction logging tabs">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'call'}
          className={`${styles.composerTab} ${activeTab === 'call' ? styles.activeTab : ''}`}
          onClick={() => {
            setActiveTab('call');
            setErrorMessage(null);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span>Log Call</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'whatsapp'}
          className={`${styles.composerTab} ${activeTab === 'whatsapp' ? styles.activeTab : ''}`}
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
          className={`${styles.composerTab} ${activeTab === 'meeting' ? styles.activeTab : ''}`}
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
          className={`${styles.composerTab} ${activeTab === 'note' ? styles.activeTab : ''}`}
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
        {/* Tab 1: Log Call Controls */}
        {activeTab === 'call' && (
          <div className={styles.composerFields}>
            <div className={styles.composerFieldGroup}>
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

            <div className={styles.composerFieldGroup}>
              <div className={styles.durationHeaderRow}>
                <label className={styles.fieldLabel}>Call Duration</label>
                <span className={styles.durationActiveBadge}>{Math.round(callDurationSeconds / 60)} min</span>
              </div>
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

            <div className={styles.composerFieldGroup}>
              <label className={styles.fieldLabel}>Discussion Summary</label>
              <textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Key objections, timeline discussions, executive appetite..."
                className={styles.composerTextarea}
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Tab 2: WhatsApp Controls */}
        {activeTab === 'whatsapp' && (
          <div className={styles.composerFields}>
            <div className={styles.composerFieldGroup}>
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

            <div className={styles.composerFieldGroup}>
              <label className={styles.fieldLabel}>WhatsApp Exchange Notes</label>
              <textarea
                value={whatsAppNotes}
                onChange={(e) => setWhatsAppNotes(e.target.value)}
                placeholder="Record client responses, proposal dispatched links, follow-up intent..."
                className={styles.composerTextarea}
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Meeting Controls */}
        {activeTab === 'meeting' && (
          <div className={styles.composerFields}>
            <div className={styles.composerRow}>
              <div className={styles.composerFieldGroup}>
                <label className={styles.fieldLabel}>Meeting Scope</label>
                <select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value as typeof MEETING_TYPES[number])}
                  className={styles.composerSelect}
                >
                  {MEETING_TYPES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.composerFieldGroup}>
                <label className={styles.fieldLabel}>Client Attendees</label>
                <input
                  type="text"
                  value={meetingAttendees}
                  onChange={(e) => setMeetingAttendees(e.target.value)}
                  placeholder="e.g. Zayd Al-Hadi (VP Strategy)"
                  className={styles.composerInput}
                />
              </div>
            </div>

            <div className={styles.composerFieldGroup}>
              <label className={styles.fieldLabel}>Meeting Outcomes & Action Items</label>
              <textarea
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder="Executive decisions, budget approvals, milestone commitments..."
                className={styles.composerTextarea}
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Tab 4: Internal Note Controls */}
        {activeTab === 'note' && (
          <div className={styles.composerFields}>
            <div className={styles.composerFieldGroup}>
              <div className={styles.fieldLabelGroup}>
                <label className={styles.fieldLabel}>Confidential Team Note</label>
                <div className={styles.tagPillContainer}>
                  {NOTE_TAG_PRESETS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAppendTag(tag)}
                      className={styles.tagPillBtn}
                      title={`Append ${tag} to note`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Internal notes, margin expectations, mention teammates (@fenar) or strategy..."
                className={styles.composerTextarea}
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Error Feedback */}
        {errorMessage && <div className={styles.composerError}>{errorMessage}</div>}

        {/* 3. Footer Submission Action Bar */}
        <div className={styles.composerFooter}>
          <div className={styles.characterHint}>
            {currentNote.trim().length < 3 ? (
              <span className={styles.hintWarning}>Min 3 characters required</span>
            ) : (
              <span className={styles.hintReady}>{currentNote.trim().length} characters</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isActionDisabled}
            className={`${styles.submitTouchpointBtn} ${
              isActionDisabled ? styles.disabled : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <div className={styles.miniSpinner} />
                <span>Saving...</span>
              </>
            ) : (
              <span>Record Touchpoint</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
