/**
 * @file schedulerUtils.ts
 * @description Pure mathematical and date-time utilities for follow-up scheduling and calendar generation.
 *              Isolated from React and SCSS dependencies for zero-overhead unit testability.
 * @module admin/components/Scheduler/schedulerUtils
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

export type QuickPreset =
  | 'today_2h'
  | 'today_plus_2h'
  | 'tomorrow_10am'
  | 'in_3_days'
  | 'next_mon_9am'
  | 'next_monday_9am';

/**
 * Calculates an ISO 8601 string for quick-schedule interval presets relative to local time.
 * Accepts an optional baseDate for deterministic unit test calculations.
 *
 * @param {QuickPreset} preset Preset interval key.
 * @param {Date} [baseDate] Optional baseline date (defaults to current clock time).
 * @returns {string} Formatted ISO 8601 UTC date string.
 */
export function calculatePresetDate(preset: QuickPreset, baseDate?: Date): string {
  const now = baseDate ? new Date(baseDate) : new Date();

  switch (preset) {
    case 'today_2h':
    case 'today_plus_2h': {
      const target = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      return target.toISOString();
    }
    case 'tomorrow_10am': {
      const target = new Date(now);
      target.setDate(target.getDate() + 1);
      target.setHours(10, 0, 0, 0);
      return target.toISOString();
    }
    case 'in_3_days': {
      const target = new Date(now);
      target.setDate(target.getDate() + 3);
      target.setHours(10, 0, 0, 0);
      return target.toISOString();
    }
    case 'next_mon_9am':
    case 'next_monday_9am': {
      const target = new Date(now);
      const dayOfWeek = target.getDay(); // 0 is Sun, 1 is Mon
      const daysUntilNextMon = dayOfWeek === 1 ? 7 : ((1 - dayOfWeek + 7) % 7) || 7;
      target.setDate(target.getDate() + daysUntilNextMon);
      target.setHours(9, 0, 0, 0);
      return target.toISOString();
    }
  }
}

/**
 * Detects and formats the local timezone offset into standard UTC representation (e.g. UTC+05:30).
 *
 * @param {number} [offsetMinutes] Optional timezone offset in minutes (defaults to browser offset).
 * @returns {string} Formatted timezone string (e.g. 'UTC+05:30' or 'UTC-05:00').
 */
export function formatTimezoneOffset(offsetMinutes?: number): string {
  const offset = offsetMinutes !== undefined ? offsetMinutes : new Date().getTimezoneOffset();
  const sign = offset > 0 ? '-' : '+';
  const absOffset = Math.abs(offset);
  const hours = Math.floor(absOffset / 60);
  const minutes = absOffset % 60;
  return `UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Increments or decrements a 24-hour time string by a given minute step (+15, +30, +60).
 *
 * @param {string} currentTime HH:mm time string.
 * @param {number} stepMinutes Number of minutes to adjust.
 * @returns {string} Adjusted HH:mm time string.
 */
export function applyTimeStep(currentTime: string, stepMinutes: number): string {
  const [h, m] = currentTime.split(':').map(Number);
  const totalMinutes = (h * 60 + m + stepMinutes) % (24 * 60);
  const finalMinutes = totalMinutes < 0 ? totalMinutes + 24 * 60 : totalMinutes;
  const newH = Math.floor(finalMinutes / 60);
  const newM = finalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}
