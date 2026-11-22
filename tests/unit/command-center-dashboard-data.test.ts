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
    assert.equal(points[0].fullPeriod, '2 Oct – 8 Oct');
  });

  it('keeps empty windows as zero-valued periods for explicit empty states', () => {
    const points = aggregateTimeframeRevenue('7d', resolveTimeframeBounds('7d', new Date('2026-10-31T00:00:00.000Z')), []);
    assert.equal(points.length, 7);
    assert.ok(points.every((point) => point.cashVal === 0));
  });

  it('keeps the first instant of a calendar quarter and compares equal elapsed time', () => {
    const reference = new Date('2028-04-01T00:00:00.000Z');
    const bounds = resolveTimeframeBounds('quarter', reference);
    assert.equal(bounds.priorEnd.toISOString(), '2028-01-01T00:00:00.001Z');
    const points = aggregateTimeframeRevenue('quarter', bounds, [{ convertedAt: reference.toISOString(), amount: 99.75 }]);
    assert.deepEqual(points.map(point => point.cashVal), [99.75]);
  });

  it('places leap-day and month-start conversions into distinct calendar buckets', () => {
    const bounds = resolveTimeframeBounds('year', new Date('2028-03-02T12:00:00Z'));
    const points = aggregateTimeframeRevenue('year', bounds, [
      { convertedAt: '2028-02-29T23:59:59.999Z', amount: 12.25 },
      { convertedAt: '2028-03-01T00:00:00Z', amount: 3.50 },
    ]);
    assert.deepEqual(points.map(point => point.cashVal), [0, 12.25, 3.50]);
  });
});
