/**
 * @file badgeUtils.ts
 * @description Pure mathematical and date-time utilities for calculating tiered overdue states,
 *              elapsed duration strings, and alert suppression rules.
 *              Isolated from React and SCSS for zero-overhead unit testability under Node.js.
 * @module admin/components/Badges/badgeUtils
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

export type OverdueTier = 'none' | 'amber' | 'orange' | 'red_pulse';

export interface OverdueCalculationOptions {
  /** Lifecycle macro-bucket (e.g. 'open', 'potential', 'converted', 'lost') */
  bucket?: string | null;
  /** Specific funnel stage name */
  statusName?: string | null;
  /** Mandatory future revisit date for On Hold deals (YYYY-MM-DD) */
  revisitDate?: string | null;
  /** Deterministic baseline timestamp for testing (defaults to Date.now()) */
  nowMs?: number;
}

export interface OverdueCalculationResult {
  isOverdue: boolean;
  tier: OverdueTier;
  elapsedMs: number;
  label: string;
  shortLabel: string;
}

/**
 * Evaluates whether a lead has an overdue follow-up timestamp and calculates its urgency tier.
 * In accordance with PRD §14.2 & §14.3:
 * - Leads in terminal stages ('converted', 'lost') are never overdue.
 * - Leads in 'On Hold' status are suppressed while CURRENT_DATE < revisit_date.
 * - Tiers:
 *   - < 24 Hours: 'amber' (#f59e0b) -> "Overdue: Due Xh ago"
 *   - 24 to 72 Hours: 'orange' (#ff6100) -> "Urgent: Due Xd ago"
 *   - > 72 Hours: 'red_pulse' (#ef4444) -> "Critical: Xd Overdue"
 *
 * @param {string | null | undefined} nextFollowUp - Scheduled follow-up ISO string.
 * @param {OverdueCalculationOptions} [options] - Optional lifecycle and temporal parameters.
 * @returns {OverdueCalculationResult} Complete calculation result.
 */
export function calculateOverdueTier(
  nextFollowUp: string | null | undefined,
  options: OverdueCalculationOptions = {}
): OverdueCalculationResult {
  const noneResult: OverdueCalculationResult = {
    isOverdue: false,
    tier: 'none',
    elapsedMs: 0,
    label: '',
    shortLabel: '',
  };

  if (!nextFollowUp) {
    return noneResult;
  }

  const { bucket, statusName, revisitDate, nowMs } = options;

  // 1. Terminal stages are never overdue
  if (bucket) {
    const normalizedBucket = bucket.toLowerCase();
    if (normalizedBucket === 'converted' || normalizedBucket === 'lost') {
      return noneResult;
    }
  }

  const currentClock = typeof nowMs === 'number' ? nowMs : Date.now();
  const todayStr = new Date(currentClock).toISOString().split('T')[0];

  // 2. Alert suppression for 'On Hold' deals with future revisit date (PRD §14.2)
  if (statusName && statusName.toLowerCase() === 'on hold' && revisitDate) {
    if (revisitDate > todayStr) {
      return noneResult;
    }
  }

  const scheduledMs = new Date(nextFollowUp).getTime();
  if (isNaN(scheduledMs)) {
    return noneResult;
  }

  const elapsedMs = currentClock - scheduledMs;

  // If follow-up timestamp is in the future, it is not overdue
  if (elapsedMs <= 0) {
    return noneResult;
  }

  const oneHourMs = 3600 * 1000;
  const elapsedHours = Math.floor(elapsedMs / oneHourMs);
  const elapsedDays = Math.floor(elapsedHours / 24);

  // 3. Urgency Tier Calculation
  if (elapsedHours < 24) {
    const hourText = elapsedHours === 0 ? '<1h' : `${elapsedHours}h`;
    return {
      isOverdue: true,
      tier: 'amber',
      elapsedMs,
      label: `Overdue: Due ${hourText} ago`,
      shortLabel: `Due ${hourText} ago`,
    };
  }

  if (elapsedHours < 72) {
    const dayText = elapsedDays === 1 ? '1d' : `${elapsedDays}d`;
    return {
      isOverdue: true,
      tier: 'orange',
      elapsedMs,
      label: `Urgent: Due ${dayText} ago`,
      shortLabel: `Due ${dayText} ago`,
    };
  }

  // >= 72 hours overdue: Critical red pulse
  const criticalDayText = elapsedDays === 1 ? '1d' : `${elapsedDays}d`;
  return {
    isOverdue: true,
    tier: 'red_pulse',
    elapsedMs,
    label: `Critical: ${criticalDayText} Overdue`,
    shortLabel: `${criticalDayText} Overdue`,
  };
}

/**
 * Returns the semantic color code and token class representation for an overdue tier.
 *
 * @param {OverdueTier} tier - Evaluated tier.
 * @returns {{ colorCode: string; bgCode: string }} Color definitions.
 */
export function getOverdueBadgeTheme(tier: OverdueTier): {
  colorCode: string;
  bgCode: string;
  borderColor: string;
} {
  switch (tier) {
    case 'amber':
      return {
        colorCode: '#f59e0b',
        bgCode: 'rgba(245, 158, 11, 0.12)',
        borderColor: 'rgba(245, 158, 11, 0.28)',
      };
    case 'orange':
      return {
        colorCode: '#ff6100',
        bgCode: 'rgba(255, 97, 0, 0.14)',
        borderColor: 'rgba(255, 97, 0, 0.35)',
      };
    case 'red_pulse':
      return {
        colorCode: '#ef4444',
        bgCode: 'rgba(239, 68, 68, 0.16)',
        borderColor: 'rgba(239, 68, 68, 0.45)',
      };
    case 'none':
    default:
      return {
        colorCode: '#71717a',
        bgCode: 'rgba(113, 113, 122, 0.1)',
        borderColor: 'rgba(113, 113, 122, 0.2)',
      };
  }
}
