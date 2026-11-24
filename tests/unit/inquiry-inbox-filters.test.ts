import { strict as assert } from 'node:assert';
import { describe, it, test } from 'node:test';
import {
  canAssignInquiryOwner,
  inboxHref,
  parseCursor,
  readInboxFilters,
} from '../../src/app/admin/(workspace)/ingestion/inquiryView';

test('assignee choices mirror active inquiry role and tab rules', () => {
  assert.equal(canAssignInquiryOwner('admin', ['leads']), true);
  assert.equal(canAssignInquiryOwner('sales_manager', []), true);
  assert.equal(canAssignInquiryOwner('sales_manager', ['leads']), false);
  assert.equal(canAssignInquiryOwner('sales_executive', []), false);
  assert.equal(canAssignInquiryOwner('sales_executive', ['ingestion']), true);
  assert.equal(canAssignInquiryOwner('viewer', ['ingestion']), false);
});

describe('Inquiry inbox URL contracts', () => {
  it('normalizes filters before they reach PostgREST', () => {
    const result = readInboxFilters({
      channel: 'website',
      origin: 'manual',
      state: 'new,closed',
      q: ' Léa%,1){() ',
      owner: ['unassigned', 'other'],
      from: '2026-02-30',
      to: '2026-11-23',
      sort: 'oldest',
    });

    assert.equal(result.channel, 'website');
    assert.equal(result.origin, '');
    assert.equal(result.state, '');
    assert.equal(result.q, 'Léa 1');
    assert.equal(result.owner, '');
    assert.equal(result.from, '');
    assert.equal(result.to, '2026-11-23');
    assert.equal(result.sort, 'oldest');
  });

  it('retains Postgres timestamp precision through cursor URLs', () => {
    const stamp = '2026-11-23T13:45:07.123456+00:00';
    const id = '10000000-0000-0000-0000-000000000001';
    const cursor = stamp + '~' + id;
    const filters = readInboxFilters({ channel: 'manual', after: cursor });
    const url = new URL(inboxHref(filters), 'http://127.0.0.1');

    assert.deepEqual(parseCursor(cursor), { stamp, id });
    assert.equal(url.searchParams.get('after'), cursor);
    assert.equal(url.searchParams.get('channel'), 'manual');
    assert.equal(parseCursor(cursor + '~trailing'), null);
    assert.equal(parseCursor(stamp + '~id,received_at.eq.other'), null);
  });

  it('keeps source scope while resetting pagination on a filter change', () => {
    const stamp = '2026-11-23T13:45:07Z';
    const id = '10000000-0000-0000-0000-000000000001';
    const filters = readInboxFilters({
      channel: 'website',
      origin: 'chat_pod',
      owner: 'unassigned',
      inquiry: id,
      before: stamp + '~' + id,
    });
    const url = new URL(
      inboxHref(filters, {
        state: 'new',
        before: null,
        after: null,
        inquiry: null,
      }),
      'http://127.0.0.1',
    );

    assert.deepEqual(Object.fromEntries(url.searchParams), {
      channel: 'website',
      origin: 'chat_pod',
      state: 'new',
      owner: 'unassigned',
    });
  });
});
