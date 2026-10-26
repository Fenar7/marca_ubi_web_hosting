/**
 * @file scheduler-schemas.ts
 * @description Zod validation schemas, RFC 5545 iCalendar generation logic, and static constants
 *              for CRM follow-up scheduling, calendar integrations, and parking deals on hold.
 *              Separated from 'use server' modules to strictly comply with Next.js App Router
 *              Server Action boundary invariants (all Server Action exports must be async functions).
 * @module lib/scheduler-schemas
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

import { z } from 'zod';
import type { CrmUserRole } from '@/types/crm';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const ON_HOLD_STATUS_ID = 'b0000000-0000-0000-0000-000000000003';

export const FOLLOW_UP_ACTION_TYPES = [
  'call',
  'whatsapp',
  'email',
  'meeting',
  'demo',
  'proposal_review',
] as const;

export type FollowUpActionType = (typeof FOLLOW_UP_ACTION_TYPES)[number];

export const ON_HOLD_REASONS = [
  'Client Budget Cycle / Q1 Planning',
  'Key Decision Maker Away / On Leave',
  'Pending Contract / Legal Review',
  'Project Paused Temporarily',
  'Awaiting Technical Specification',
  'Other',
] as const;

export type OnHoldReason = (typeof ON_HOLD_REASONS)[number];

/**
 * Generates an RFC 5545 compliant .ics iCalendar file string for client schedule integration.
 * Pure synchronous utility decoupled from Server Action RPC boundaries.
 */
export function generateIcsCalendarInvite(params: {
  title: string;
  description: string;
  startTime: Date;
  durationMinutes?: number;
  location?: string;
}): string {
  const formatIcsDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const durationMs = (params.durationMinutes ?? 30) * 60 * 1000;
  const endTime = new Date(params.startTime.getTime() + durationMs);
  const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@marcaubi.com`;

  const cleanTitle = params.title.replace(/[\r\n]+/g, ' ').replace(/[,;\\]/g, '\\$&');
  const cleanDescription = params.description
    .replace(/\r\n|\r/g, '\n')
    .replace(/[,;\\]/g, '\\$&')
    .replace(/\n/g, '\\n');
  const cleanLocation = params.location
    ? params.location.replace(/[\r\n]+/g, ' ').replace(/[,;\\]/g, '\\$&')
    : '';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Marca Ubi//CRM Follow-up Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(params.startTime)}`,
    `DTEND:${formatIcsDate(endTime)}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDescription}`,
    cleanLocation ? `LOCATION:${cleanLocation}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

export const scheduleFollowUpSchema = z.object({
  leadId: z.string().trim().regex(UUID_REGEX, { message: 'Invalid lead UUID format.' }),
  scheduledFor: z
    .string()
    .trim()
    .min(1, { message: 'Scheduled date and time is required.' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Scheduled date must be a valid ISO 8601 date string.',
    })
    .refine((val) => new Date(val).getTime() > Date.now() - 60000, {
      message: 'Scheduled follow-up cannot be set in the past.',
    }),
  actionType: z.enum(FOLLOW_UP_ACTION_TYPES, {
    message: 'Invalid action type specified.',
  }),
  agenda: z.string().trim().max(1000).optional().nullable(),
  sendCalendarInvite: z.boolean().optional().default(false),
});

export type ScheduleFollowUpInput = z.infer<typeof scheduleFollowUpSchema>;

export const transitionToOnHoldSchema = z.object({
  leadId: z.string().trim().regex(UUID_REGEX, { message: 'Invalid lead UUID format.' }),
  revisitDate: z
    .string()
    .trim()
    .min(1, { message: 'Revisit date is required.' })
    .refine(
      (val) => {
        const parsed = Date.parse(val);
        if (isNaN(parsed)) return false;
        const parts = val.split('-');
        if (parts.length === 3) {
          const target = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          target.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return target.getTime() > today.getTime();
        }
        const target = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return target.getTime() > today.getTime();
      },
      {
        message: 'Revisit date must be strictly in the future.',
      }
    ),
  reason: z.string().trim().min(3, { message: 'Parking reason is required (minimum 3 characters).' }),
  parkingNotes: z.string().trim().max(2000).optional().nullable(),
});

export type TransitionToOnHoldInput = z.infer<typeof transitionToOnHoldSchema>;

export interface SchedulerActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  calendarIcs?: string;
}
