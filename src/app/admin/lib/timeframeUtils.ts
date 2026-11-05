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
  priorEnd: Date;
  intervalType: 'daily' | 'weekly' | 'monthly';
}

export interface DynamicRevenueSplinePoint {
  month: string;
  fullPeriod: string;
  cashVal: number;
  cashFormatted: string;
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
  if (clean === '7d' || clean.includes('7')) return '7d';
  if (clean === '90d' || clean.includes('90')) return '90d';
  if (clean === 'quarter' || clean.includes('quarter') || clean === 'qtr') return 'quarter';
  if (clean === 'year' || clean.includes('year') || clean === 'ytd' || clean === '12m') return 'year';
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
      currentStart = new Date(currentEnd.getTime() - days * 86400000);
      priorEnd = new Date(currentStart);
      priorStart = new Date(priorEnd.getTime() - days * 86400000);
      intervalType = slug === '7d' ? 'daily' : slug === '30d' ? 'weekly' : 'monthly';
      break;
    }
    case 'quarter': {
      const month = Math.floor(currentEnd.getUTCMonth() / 3) * 3;
      currentStart = new Date(Date.UTC(currentEnd.getUTCFullYear(), month, 1));
      priorStart = new Date(Date.UTC(currentEnd.getUTCFullYear(), month - 3, 1));
      priorEnd = new Date(currentStart.getTime() - 1);
      intervalType = 'monthly';
      break;
    }
    case 'year': {
      currentStart = new Date(Date.UTC(currentEnd.getUTCFullYear(), 0, 1));
      priorStart = new Date(Date.UTC(currentEnd.getUTCFullYear() - 1, 0, 1));
      priorEnd = new Date(currentStart.getTime() - 1);
      intervalType = 'monthly';
      break;
    }
  }
  return { slug, label: TIMEFRAME_SLUG_LABELS[slug].label, cadenceLabel: TIMEFRAME_SLUG_LABELS[slug].cadence, currentStart, currentEnd, priorStart, priorEnd, intervalType };
}

/** A zero prior baseline has no meaningful percentage change and remains unavailable. */
export function calculateMetricDelta(current: number, prior: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(prior) || prior <= 0) return null;
  return Math.round((((current - prior) / prior) * 100) * 10) / 10;
}

/** Buckets converted contract values into display intervals; no payment or quota is inferred. */
export function aggregateTimeframeRevenue(slug: TimeframeSlug, bounds: Pick<TimeframeBounds, 'currentStart' | 'currentEnd'>, events: RevenueEvent[]): DynamicRevenueSplinePoint[] {
  const start = bounds.currentStart.getTime();
  const end = bounds.currentEnd.getTime();
  const span = end - start;
  if (!Number.isFinite(start) || !Number.isFinite(end) || span <= 0) return [];
  const intervals = getRevenueIntervals(slug, bounds.currentStart, bounds.currentEnd);
  const totals = intervals.map(() => 0);
  for (const event of events) {
    const timestamp = Date.parse(event.convertedAt);
    if (!Number.isFinite(timestamp) || timestamp < start || timestamp > end || !Number.isFinite(event.amount)) continue;
    const index = Math.min(intervals.length - 1, Math.floor(((timestamp - start) / span) * intervals.length));
    totals[index] += event.amount;
  }
  const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
  return intervals.map((interval, index) => {
    const amount = Math.round(totals[index] * 100) / 100;
    return { month: interval.label, fullPeriod: interval.fullLabel, cashVal: amount, cashFormatted: currency.format(amount) };
  });
}

function getRevenueIntervals(slug: TimeframeSlug, start: Date, end: Date): { label: string; fullLabel: string }[] {
  const count = slug === '7d' ? 7 : slug === '30d' ? 5 : slug === 'year' ? 12 : 3;
  const startMs = start.getTime();
  const span = end.getTime() - startMs;
  const format = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return Array.from({ length: count }, (_, index) => {
    const intervalStart = new Date(startMs + (span * index) / count);
    const intervalEnd = new Date(startMs + (span * (index + 1)) / count);
    return { label: slug === '7d' ? format.format(intervalStart) : 'P' + (index + 1), fullLabel: format.format(intervalStart) + ' - ' + format.format(intervalEnd) };
  });
}
