/**
 * @file timeframeUtils.ts
 * @description Master mathematical and temporal resolution engine for the Executive Dashboard.
 *              Translates URL query parameters (`?timeframe=...`), calculates precise start/end bounds
 *              for analytical RPCs and relational aggregations, evaluates period-over-period performance
 *              deltas with zero-division protection, and synthesizes time-series milestone points.
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
  quotaVal: number;
  cashVal: number;
  quotaFormatted: string;
  cashFormatted: string;
  attainmentPct: number;
}

export const TIMEFRAME_SLUG_LABELS: Record<TimeframeSlug, { label: string; cadence: CadenceLabel }> = {
  '7d': { label: 'Last 7 Days', cadence: 'WoW' },
  '30d': { label: 'Last 30 Days', cadence: 'MoM' },
  '90d': { label: 'Last 90 Days', cadence: 'QoQ' },
  quarter: { label: 'This Quarter', cadence: 'QoQ' },
  year: { label: 'This Year', cadence: 'YoY' },
};

/**
 * Normalizes any free-form string or query param into a canonical TimeframeSlug.
 * Defaults strictly to '30d' for predictable enterprise accounting baselines.
 */
export function timeframeToSlug(input?: string | null): TimeframeSlug {
  if (!input) return '30d';
  const clean = input.trim().toLowerCase();

  if (clean === '7d' || clean.includes('7')) return '7d';
  if (clean === '90d' || clean.includes('90')) return '90d';
  if (clean === 'quarter' || clean.includes('quarter') || clean === 'qtr') return 'quarter';
  if (clean === 'year' || clean.includes('year') || clean === 'ytd' || clean === '12m') return 'year';
  return '30d';
}

/**
 * Resolves the canonical user-facing label for a given timeframe slug.
 */
export function slugToTimeframeLabel(input?: string | null): string {
  const slug = timeframeToSlug(input);
  return TIMEFRAME_SLUG_LABELS[slug].label;
}

/**
 * Computes exact ISO temporal boundaries and prior comparison periods for analytics queries.
 * Handles leap years, month boundaries, and quarterly transitions deterministically.
 */
export function resolveTimeframeBounds(
  inputSlug?: string | null,
  referenceDate: Date = new Date()
): TimeframeBounds {
  const slug = timeframeToSlug(inputSlug);
  const currentEnd = new Date(referenceDate);

  let currentStart: Date;
  let priorStart: Date;
  let priorEnd: Date;
  let intervalType: 'daily' | 'weekly' | 'monthly';

  switch (slug) {
    case '7d': {
      currentStart = new Date(currentEnd.getTime() - 7 * 86400000);
      priorEnd = new Date(currentStart);
      priorStart = new Date(priorEnd.getTime() - 7 * 86400000);
      intervalType = 'daily';
      break;
    }
    case '90d': {
      currentStart = new Date(currentEnd.getTime() - 90 * 86400000);
      priorEnd = new Date(currentStart);
      priorStart = new Date(priorEnd.getTime() - 90 * 86400000);
      intervalType = 'monthly';
      break;
    }
    case 'quarter': {
      const currentMonth = currentEnd.getMonth();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      currentStart = new Date(currentEnd.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0);

      const priorQuarterStartMonth = quarterStartMonth - 3;
      priorStart = new Date(currentEnd.getFullYear(), priorQuarterStartMonth, 1, 0, 0, 0, 0);
      priorEnd = new Date(currentStart.getTime() - 1);
      intervalType = 'monthly';
      break;
    }
    case 'year': {
      currentStart = new Date(currentEnd.getFullYear(), 0, 1, 0, 0, 0, 0);
      priorStart = new Date(currentEnd.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      priorEnd = new Date(currentEnd.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      intervalType = 'monthly';
      break;
    }
    case '30d':
    default: {
      currentStart = new Date(currentEnd.getTime() - 30 * 86400000);
      priorEnd = new Date(currentStart);
      priorStart = new Date(priorEnd.getTime() - 30 * 86400000);
      intervalType = 'weekly';
      break;
    }
  }

  return {
    slug,
    label: TIMEFRAME_SLUG_LABELS[slug].label,
    cadenceLabel: TIMEFRAME_SLUG_LABELS[slug].cadence,
    currentStart,
    currentEnd,
    priorStart,
    priorEnd,
    intervalType,
  };
}

/**
 * Calculates period-over-period percentage growth velocity.
 * Implements strict zero-division protection, preventing IEEE 754 NaN or Infinity.
 * 
 * @param current Current window realized performance
 * @param prior Prior baseline performance
 * @returns Signed percentage delta rounded to 1 decimal place (e.g. +14.2 or -5.1)
 */
export function calculateMetricDelta(current: number, prior: number): number {
  if (prior <= 0) {
    if (current <= 0) return 0.0;
    return 100.0;
  }
  const delta = ((current - prior) / prior) * 100;
  return Math.round(delta * 10) / 10;
}

/**
 * Synthesizes dynamic time-series milestone points for the Fritsch-Carlson monotone spline.
 * Adapts intervals based on the active timeframe window (daily for 7d, weekly for 30d, monthly for 90d/year).
 */
export function generateTimeframeSplinePoints(
  slug: TimeframeSlug,
  totalCashRupees: number
): DynamicRevenueSplinePoint[] {
  const totalLakhs = Math.max(1, totalCashRupees / 100000);

  switch (slug) {
    case '7d': {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dailyQuota = Math.round((totalLakhs / 6) * 10) / 10;
      const ratios = [0.12, 0.15, 0.14, 0.18, 0.22, 0.10, 0.09];
      return days.map((day, idx) => {
        const cash = Math.round(totalLakhs * ratios[idx] * 10) / 10;
        const attainment = dailyQuota > 0 ? Math.round((cash / dailyQuota) * 1000) / 10 : 100;
        return {
          month: day,
          fullPeriod: `${day} Performance`,
          quotaVal: dailyQuota,
          cashVal: cash,
          quotaFormatted: `₹${(dailyQuota * 100000).toLocaleString('en-IN')}`,
          cashFormatted: `₹${(cash * 100000).toLocaleString('en-IN')}`,
          attainmentPct: attainment,
        };
      });
    }

    case '90d':
    case 'quarter': {
      const months = ['Month 1', 'Month 2', 'Month 3'];
      const monthlyQuota = Math.round((totalLakhs / 2.7) * 10) / 10;
      const ratios = [0.28, 0.34, 0.38];
      return months.map((m, idx) => {
        const cash = Math.round(totalLakhs * ratios[idx] * 10) / 10;
        const attainment = monthlyQuota > 0 ? Math.round((cash / monthlyQuota) * 1000) / 10 : 100;
        return {
          month: m,
          fullPeriod: `${m} Financials`,
          quotaVal: monthlyQuota,
          cashVal: cash,
          quotaFormatted: `₹${(monthlyQuota * 100000).toLocaleString('en-IN')}`,
          cashFormatted: `₹${(cash * 100000).toLocaleString('en-IN')}`,
          attainmentPct: attainment,
        };
      });
    }

    case 'year': {
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      const quarterQuota = Math.round((totalLakhs / 3.6) * 10) / 10;
      const ratios = [0.21, 0.24, 0.27, 0.28];
      return quarters.map((q, idx) => {
        const cash = Math.round(totalLakhs * ratios[idx] * 10) / 10;
        const attainment = quarterQuota > 0 ? Math.round((cash / quarterQuota) * 1000) / 10 : 100;
        return {
          month: q,
          fullPeriod: `${q} Fiscal Performance`,
          quotaVal: quarterQuota,
          cashVal: cash,
          quotaFormatted: `₹${(quarterQuota * 100000).toLocaleString('en-IN')}`,
          cashFormatted: `₹${(cash * 100000).toLocaleString('en-IN')}`,
          attainmentPct: attainment,
        };
      });
    }

    case '30d':
    default: {
      const weeks = ['W1', 'W2', 'W3', 'W4', 'W5'];
      const weeklyQuota = Math.round((totalLakhs / 4.5) * 10) / 10;
      const ratios = [0.18, 0.22, 0.19, 0.25, 0.16];
      return weeks.map((w, idx) => {
        const cash = Math.round(totalLakhs * ratios[idx] * 10) / 10;
        const attainment = weeklyQuota > 0 ? Math.round((cash / weeklyQuota) * 1000) / 10 : 100;
        return {
          month: w,
          fullPeriod: `Week ${idx + 1} Pipeline`,
          quotaVal: weeklyQuota,
          cashVal: cash,
          quotaFormatted: `₹${(weeklyQuota * 100000).toLocaleString('en-IN')}`,
          cashFormatted: `₹${(cash * 100000).toLocaleString('en-IN')}`,
          attainmentPct: attainment,
        };
      });
    }
  }
}
