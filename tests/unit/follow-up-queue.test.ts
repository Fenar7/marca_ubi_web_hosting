import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getUtcDayWindow, isFollowUpInQueue, parseFollowUpPage, parseFollowUpQueue } from '../../src/app/admin/lib/followUpQueue';
import { getPageSummary } from '../../src/app/admin/lib/pagination';

describe('follow-up queue boundaries', () => {
  const window = getUtcDayWindow(new Date('2026-11-06T12:00:00.000Z'));

  it('uses inclusive UTC day boundaries and adjacent queues', () => {
    assert.equal(window.start, '2026-11-06T00:00:00.000Z');
    assert.equal(window.end, '2026-11-06T23:59:59.999Z');
    assert.equal(isFollowUpInQueue('overdue', '2026-11-05T23:59:59.999Z', window), true);
    assert.equal(isFollowUpInQueue('today', window.start, window), true);
    assert.equal(isFollowUpInQueue('today', window.end, window), true);
    assert.equal(isFollowUpInQueue('upcoming', '2026-11-07T00:00:00.000Z', window), true);
  });

  it('does not classify invalid or missing timestamps as scheduled work', () => {
    assert.equal(isFollowUpInQueue('overdue', null, window), false);
    assert.equal(isFollowUpInQueue('today', 'invalid', window), false);
    assert.equal(isFollowUpInQueue('unassigned', null, window, false), false);
    assert.equal(isFollowUpInQueue('unassigned', null, window, true), true);
  });

  it('normalizes untrusted queue and pagination parameters', () => {
    assert.equal(parseFollowUpQueue('today'), 'today');
    assert.equal(parseFollowUpQueue('surprise'), 'overdue');
    assert.equal(parseFollowUpPage('4'), 4);
    assert.equal(parseFollowUpPage('1.5'), 1);
    assert.equal(parseFollowUpPage('-2'), 1);
    assert.equal(parseFollowUpPage('101', 100), 1);
  });
});

describe('CRM result pagination', () => {
  it('retains forward navigation when rows load without an exact count', () => {
    assert.deepEqual(getPageSummary(2, 50, 50, null), {
      firstRecord: 51,
      lastRecord: 100,
      lastPage: null,
      hasPrevious: true,
      hasNext: true,
    });
    assert.equal(getPageSummary(2, 50, 7, null).hasNext, false);
  });

  it('respects exact totals and empty ranges', () => {
    assert.equal(getPageSummary(2, 50, 7, 57).hasNext, false);
    assert.equal(getPageSummary(1, 50, 0, 0).firstRecord, 0);
    assert.equal(getPageSummary(1, 50, 0, 0).lastPage, 1);
  });
});
