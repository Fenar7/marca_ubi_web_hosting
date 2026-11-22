/**
 * @file timeframeUtils.ts
 * @description Resolves dashboard date windows and groups persisted conversion events.
 * @module admin/lib/timeframeUtils
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

export type TimeframeSlug = '7d' | '30d' | '90d' | 'quarter' | 'year';
export type CadenceLabel = 'WoW' | 'MoM' | 'QoQ' | 'YoY';

export interface TimeframeBounds {
  slug: TimeframeSlug;
  label: string;
  cadenceLabel: CadenceLabel;
  currentStart: Date;
  currentEnd: Date;
  priorStart: Date;
  /** Exclusive upper boundary for the previous comparison window. */
  priorEnd: Date;
  intervalType: 'daily' | 'weekly' | 'monthly';
}

export interface DynamicRevenueSplinePoint {
  month: string;
  fullPeriod: string;
  cashVal: number;
  cashFormatted: string;
  intakeVal?: number;
}

export interface IntakeEvent {
  createdAt: string;
  amount: number;
}

export interface RevenueEvent {
  convertedAt: string;
  amount: number;
}

export const TIMEFRAME_SLUG_LABELS: Record<TimeframeSlug, { label: string; cadence: CadenceLabel }> = {
  '7d': { label: 'Last 7 Days', cadence: 'WoW' },
  '30d': { label: 'Last 30 Days', cadence: 'MoM' },
  '90d': { label: 'Last 90 Days', cadence: 'QoQ' },
  quarter: { label: 'This Quarter', cadence: 'QoQ' },
  year: { label: 'This Year', cadence: 'YoY' },
};

/** Normalizes supported user input to a canonical timeframe slug. */
export function timeframeToSlug(input?: string | null): TimeframeSlug {
  if (!input) return '30d';
  const clean = input.trim().toLowerCase();
  if (clean === '7d' || clean === 'last 7 days') return '7d';
  if (clean === '90d' || clean === 'last 90 days') return '90d';
  if (['quarter', 'this quarter', 'qtr'].includes(clean)) return 'quarter';
  if (['year', 'this year', 'ytd', '12m'].includes(clean)) return 'year';
  return '30d';
}

export function slugToTimeframeLabel(input?: string | null): string {
  return TIMEFRAME_SLUG_LABELS[timeframeToSlug(input)].label;
}

/** Resolves rolling periods and UTC calendar periods for stable cross-region cohort boundaries. */
export function resolveTimeframeBounds(inputSlug?: string | null, referenceDate: Date = new Date()): TimeframeBounds {
  const slug = timeframeToSlug(inputSlug);
  const currentEnd = new Date(referenceDate);
  let currentStart: Date;
  let priorStart: Date;
  let priorEnd: Date;
  let intervalType: TimeframeBounds['intervalType'];
  switch (slug) {
    case '7d':
    case '30d':
    case '90d': {
      const days = slug === '7d' ? 7 : slug === '30d' ? 30 : 90;
      currentStart = new Date(Date.UTC(currentEnd.getUTCFullYear(), currentEnd.getUTCMonth(), currentEnd.getUTCDate() - days + 1));
      priorStart = new Date(currentStart.getTime() - days * 86400000);
      priorEnd = comparisonEnd(priorStart, currentStart, currentEnd);
      intervalType = slug === '7d' ? 'daily' : slug === '30d' ? 'weekly' : 'monthly';
      break;
    }
    case 'quarter': {
      const month = Math.floor(currentEnd.getUTCMonth() / 3) * 3;
      currentStart = new Date(Date.UTC(currentEnd.getUTCFullYear(), month, 1));
      priorStart = new Date(Date.UTC(currentEnd.getUTCFullYear(), month - 3, 1));
      priorEnd = comparisonEnd(priorStart, currentStart, currentEnd);
      intervalType = 'monthly';
      break;
    }
    case 'year': {
      currentStart = new Date(Date.UTC(currentEnd.getUTCFullYear(), 0, 1));
      priorStart = new Date(Date.UTC(currentEnd.getUTCFullYear() - 1, 0, 1));
      priorEnd = comparisonEnd(priorStart, currentStart, currentEnd);
      intervalType = 'monthly';
      break;
    }
  }
  return { slug, label: TIMEFRAME_SLUG_LABELS[slug].label, cadenceLabel: TIMEFRAME_SLUG_LABELS[slug].cadence, currentStart, currentEnd, priorStart, priorEnd, intervalType };
}

/** Compare the elapsed part of a calendar period and cap shorter previous quarters/years at their boundary. */
function comparisonEnd(previous: Date, start: Date, asOf: Date): Date {
  const elapsed = asOf.getTime() - start.getTime();
  return new Date(Math.min(start.getTime(), previous.getTime() + elapsed + 1));
}

/** A zero prior baseline has no meaningful percentage change and remains unavailable. */
export function calculateMetricDelta(current: number, prior: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(prior) || prior <= 0) return null;
  return Math.round((((current - prior) / prior) * 100) * 10) / 10;
}

/** Buckets converted contract values and lead intake into display intervals; no payment or quota is inferred. */
export function aggregateTimeframeRevenue(
  slug: TimeframeSlug,
  bounds: Pick<TimeframeBounds, 'currentStart' | 'currentEnd'>,
  events: RevenueEvent[],
  intakeEvents?: IntakeEvent[]
): DynamicRevenueSplinePoint[] {
  const start = bounds.currentStart.getTime();
  const end = bounds.currentEnd.getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];
  const intervals = getRevenueIntervals(slug, bounds.currentStart, bounds.currentEnd);
  const totals = intervals.map(() => 0);
  const intakeTotals = intervals.map(() => 0);

  for (const event of events) {
    const timestamp = Date.parse(event.convertedAt);
    if (!Number.isFinite(timestamp) || timestamp < start || timestamp > end || !Number.isFinite(event.amount)) continue;
    const index = intervals.findIndex(interval => timestamp < interval.endExclusive);
    totals[index] += Math.round(event.amount * 100);
  }

  if (intakeEvents && intakeEvents.length > 0) {
    for (const event of intakeEvents) {
      const timestamp = Date.parse(event.createdAt);
      if (!Number.isFinite(timestamp) || timestamp < start || timestamp > end || !Number.isFinite(event.amount)) continue;
      const index = intervals.findIndex(interval => timestamp < interval.endExclusive);
      intakeTotals[index] += Math.round(event.amount * 100);
    }
  }

  const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
  return intervals.map((interval, index) => {
    const amount = totals[index] / 100;
    const intakeAmount = intakeTotals[index] / 100;
    return {
      month: interval.label,
      fullPeriod: interval.fullLabel,
      cashVal: amount,
      cashFormatted: currency.format(amount),
      intakeVal: intakeAmount,
    };
  });
}

/** End partial periods at the snapshot instant so tooltip dates and underlying events agree. */
function getRevenueIntervals(slug: TimeframeSlug, start: Date, end: Date) {
  const intervals = [];
  const format = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  for (let cursor = start.getTime(); cursor <= end.getTime();) {
    const date = new Date(cursor);
    const boundary = slug === '7d' || slug === '30d'
      ? Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + (slug === '7d' ? 1 : 7))
      : Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
    const endExclusive = Math.min(boundary, end.getTime() + 1);
    const label = format.format(cursor);
    const last = format.format(endExclusive - 1);
    intervals.push({ label, fullLabel: label === last ? label : label + ' – ' + last, endExclusive });
    cursor = endExclusive;
  }
  return intervals;
}
