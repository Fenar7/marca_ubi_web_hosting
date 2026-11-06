import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateTimeframeRevenue, resolveTimeframeBounds } from '../../src/app/admin/lib/timeframeUtils';

describe('Command Center reporting intervals', () => {
  it('uses readable date ranges and includes only conversions inside the selected window', () => {
    const bounds = resolveTimeframeBounds('30d', new Date('2026-10-31T00:00:00.000Z'));
    const points = aggregateTimeframeRevenue('30d', bounds, [
      { convertedAt: bounds.currentStart.toISOString(), amount: 100 },
      { convertedAt: bounds.currentEnd.toISOString(), amount: 250 },
      { convertedAt: new Date(bounds.currentStart.getTime() - 1).toISOString(), amount: 999 },
      { convertedAt: 'invalid', amount: 999 },
    ]);

    assert.equal(points.length, 5);
    assert.equal(points.reduce((sum, point) => sum + point.cashVal, 0), 350);
    assert.ok(points.every((point) => !/^P\d+$/.test(point.month)));
    assert.ok(points.every((point) => point.fullPeriod.includes('–')));
  });

  it('keeps empty windows as zero-valued periods for explicit empty states', () => {
    const points = aggregateTimeframeRevenue('7d', resolveTimeframeBounds('7d', new Date('2026-10-31T00:00:00.000Z')), []);
    assert.equal(points.length, 7);
    assert.ok(points.every((point) => point.cashVal === 0));
  });
});
