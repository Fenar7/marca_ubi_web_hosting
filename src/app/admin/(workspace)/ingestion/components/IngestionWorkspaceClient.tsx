'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  INQUIRY_PATH,
  ORIGIN_LABELS,
  STATE_LABELS,
  inboxHref,
  ownerLabel,
  receivedLabel,
  type InboxFilters,
  type InquiryRow,
  type OwnerOption,
} from '../inquiryView';
import { AddInquiry } from './InquiryActions';
import styles from './IngestionWorkspaceClient.module.scss';

interface InboxProps {
  canWrite: boolean;
  canResolve: boolean;
  filters: InboxFilters;
  rows: InquiryRow[];
  listUnavailable: boolean;
  metrics: {
    needsReview: number | null;
    unassigned: number | null;
    received: number | null;
  };
  owners: OwnerOption[];
  assignmentOwners: OwnerOption[];
  previous: string | null;
  next: string | null;
}

const CHANNELS = [
  ['all', 'All inquiries'],
  ['website', 'Website'],
  ['manual', 'Manual'],
] as const;
function RowStatus({ state }: { state: InquiryRow['state'] }) {
  return (
    <span className={styles.stateBadge} data-state={state}>
      {STATE_LABELS[state]}
    </span>
  );
}

/** List changes are URL-owned so sorting, paging, search, and the selected inquiry survive navigation. */
export function IngestionWorkspaceClient({
  canWrite,
  canResolve,
  filters,
  rows,
  listUnavailable,
  metrics,
  owners,
  assignmentOwners,
  previous,
  next,
}: InboxProps) {
  const router = useRouter();
  const [notice, setNotice] = useState('');
  const resetHref = inboxHref(filters, {
    live: null,
    sort: null,
    state: null,
    owner: null,
    q: null,
    origin: null,
    from: null,
    to: null,
    window: null,
    inquiry: null,
    before: null,
    after: null,
  });
  const activeFilters = Boolean(
    filters.origin ||
    filters.state ||
    filters.owner ||
    filters.q ||
    filters.from ||
    filters.to ||
    filters.window || filters.live || filters.sort === 'oldest',
  );
  const scopeLabel =
    CHANNELS.find(([value]) => value === filters.channel)?.[1] ??
    'All inquiries';
  const appliedLabels = [
    filters.q && 'Search: ' + filters.q,
    filters.origin && ORIGIN_LABELS[filters.origin],
    filters.state === 'open' ? 'Open' : filters.state && STATE_LABELS[filters.state],
    filters.owner === 'unassigned'
      ? 'Unassigned'
      : filters.owner && ownerLabel(filters.owner, owners),
    filters.from && 'From ' + filters.from,
    filters.to && 'To ' + filters.to,
    filters.window && 'Last 24 hours',
    filters.live && 'Live records',
    filters.sort === 'oldest' && 'Oldest first',
  ].filter(Boolean);
  const createHref = (id: string) =>
    INQUIRY_PATH +
    '/' +
    encodeURIComponent(id) +
    '?returnTo=' +
    encodeURIComponent(inboxHref(filters, { inquiry: null }));

  const filterHref = (
    state: string | null,
    owner: string | null,
    window: string | null,
  ) =>
    inboxHref(filters, {
      live: '1',
      state,
      owner,
      window,
      from: null,
      to: null,
      q: null,
      inquiry: null,
      before: null,
      after: null,
    });

  return (
    <div className={styles.workspace}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Inquiries</h1>
          <p>Review website submissions and inquiries logged by your team.</p>
        </div>
        {canWrite && (
          <AddInquiry
            owners={assignmentOwners}
            canResolve={canResolve}
            onSaved={(id) => {
              setNotice('Inquiry saved.');
              router.push(createHref(id));
            }}
          />
        )}
      </header>

      <div className={styles.notice} role="status">
        {notice}
      </div>
      <section className={styles.overview} aria-label="Inquiry workload">
        <p className={styles.scope}>
          {scopeLabel}
          {filters.origin && <> · {ORIGIN_LABELS[filters.origin]}</>}
        </p>
        <ul className={styles.metrics}>
          {[
            [
              'Needs review',
              metrics.needsReview,
              filterHref('new', null, null),
            ],
            [
              'Unassigned',
              metrics.unassigned,
              filterHref('open', 'unassigned', null),
            ],
            [
              'Received in the last 24 hours',
              metrics.received,
              filterHref(null, null, 'day'),
            ],
          ].map(([label, number, href]) => (
            <li key={String(label)}>
              <Link href={String(href)}>
                <strong>{number === null ? 'Unavailable' : number}</strong>
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.inboxLayout}>
        <section className={styles.queue} aria-labelledby="inquiry-queue">
          <header className={styles.queueHeader}>
            <h2 id="inquiry-queue" tabIndex={-1}>
              Inbox
            </h2>
            <nav className={styles.channels} aria-label="Inquiry channels">
              {CHANNELS.map(([value, label]) => (
                <Link
                  href={inboxHref(filters, {
                    channel: value === 'all' ? null : value,
                    origin: null,
                    inquiry: null,
                    before: null,
                    after: null,
                  })}
                  aria-current={filters.channel === value ? 'page' : undefined}
                  key={value}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </header>
          <form
            key={
              resetHref +
              JSON.stringify([
                filters.q,
                filters.origin,
                filters.state,
                filters.owner,
                filters.sort,
                filters.from,
                filters.to,
              ])
            }
            action={INQUIRY_PATH}
            className={styles.filters}
            role="search"
            aria-label="Filter inquiries"
          >
            {filters.channel !== 'all' && (
              <input type="hidden" name="channel" value={filters.channel} />
            )}
            {filters.live && <input type="hidden" name="live" value={filters.live} />}
            {filters.window && (
              <input type="hidden" name="window" value={filters.window} />
            )}
            <label className={styles.searchLabel}>
              Search
              <input
                type="search"
                name="q"
                defaultValue={filters.q}
                maxLength={100}
                placeholder="Name, company, or reference"
              />
            </label>
            <button type="submit" className={styles.secondary}>
              Search
            </button>
            <details className={styles.advancedFilters}>
              <summary>Filters</summary>
              <div className={styles.filterPanel}>
                <label>
                  Source
                  <select name="origin" defaultValue={filters.origin}>
                    <option value="">Any source</option>
                    {Object.entries(ORIGIN_LABELS)
                      .filter(
                        ([origin]) =>
                          filters.channel === 'all' ||
                          (filters.channel === 'manual') ===
                            (origin === 'manual'),
                      )
                      .map(([value, label]) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Status
                  <select name="state" defaultValue={filters.state}>
                    <option value="">Any status</option>
                    <option value="open">Open</option>
                    {Object.entries(STATE_LABELS).map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Owner
                  <select name="owner" defaultValue={filters.owner}>
                    <option value="">Any owner</option>
                    <option value="unassigned">Unassigned</option>
                    {filters.owner &&
                      filters.owner !== 'unassigned' &&
                      !owners.some(({ id }) => id === filters.owner) && (
                        <option value={filters.owner}>Selected owner</option>
                      )}
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Order
                  <select name="sort" defaultValue={filters.sort}>
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </label>
                <label>
                  From <small>UTC</small>
                  <input type="date" name="from" defaultValue={filters.from} />
                </label>
                <label>
                  To <small>UTC</small>
                  <input type="date" name="to" defaultValue={filters.to} />
                </label>
                <button type="submit" className={styles.secondary}>
                  Apply filters
                </button>
              </div>
            </details>
          </form>
          {(activeFilters || (!listUnavailable && rows.length > 0)) && (
            <div className={styles.listSummary}>
              {listUnavailable ? (
                <span>Results unavailable</span>
              ) : (
                <span>
                  {rows.length} {rows.length === 1 ? 'inquiry' : 'inquiries'} on
                  this page{filters.window && ' · Last 24 hours'}
                </span>
              )}
              {activeFilters && (
                <div className={styles.activeChips} aria-label="Applied filters">
                  {appliedLabels.map((label, index) => (
                    <span key={index}>{label}</span>
                  ))}
                  <Link href={resetHref}>Clear filters</Link>
                </div>
              )}
            </div>
          )}

          {listUnavailable ? (
            <div className={styles.empty} role="status">
              <h3>Could not load the inbox</h3>
              <p>Retry to fetch the current results.</p>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => router.refresh()}
              >
                Retry
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className={styles.empty}>
              <h3>
                {activeFilters
                  ? 'No matching inquiries'
                  : 'No inquiries in this view'}
              </h3>
              <p>
                {activeFilters
                  ? 'Clear the filters to check for other inquiries.'
                  : 'New submissions appear after they are saved.'}
              </p>
              {activeFilters && <Link href={resetHref}>Clear filters</Link>}
              {(filters.before || filters.after) && (
                <Link href={inboxHref(filters, { before: null, after: null })}>
                  Return to first page
                </Link>
              )}
            </div>
          ) : (
            <>
              <table className={styles.table} role="table">
                <thead role="rowgroup">
                  <tr role="row">
                    <th role="columnheader" scope="col">
                      Inquiry
                    </th>
                    <th role="columnheader" scope="col">
                      Source
                    </th>
                    <th
                      role="columnheader"
                      scope="col"
                      aria-sort={
                        filters.sort === 'oldest' ? 'ascending' : 'descending'
                      }
                    >
                      Received
                    </th>
                    <th role="columnheader" scope="col">
                      Status
                    </th>
                    <th role="columnheader" scope="col">
                      Owner
                    </th>
                  </tr>
                </thead>
                <tbody role="rowgroup">
                  {rows.map((row) => (
                    <tr role="row" key={row.id}>
                      <th role="rowheader" scope="row">
                        <Link
                          href={createHref(row.id)}
                          id={'inquiry-open-' + row.id}
                        >
                          <strong>
                            {row.name}
                            {row.test_batch && (
                              <small className={styles.testBadge}>Test</small>
                            )}
                          </strong>
                          {row.summary && (
                            <span className={styles.rowPreview}>
                              {row.summary}
                            </span>
                          )}
                          <small>
                            {[
                              row.inquiry_ref,
                              row.company,
                              row.service_category,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </small>
                        </Link>
                      </th>
                      <td role="cell" data-col="Source">
                        {ORIGIN_LABELS[row.origin]}
                      </td>
                      <td role="cell" data-col="Received">
                        <time dateTime={row.received_at}>
                          {receivedLabel(row.received_at)}
                        </time>
                      </td>
                      <td role="cell" data-col="Status">
                        <RowStatus state={row.state} />
                      </td>
                      <td role="cell" data-col="Owner">
                        {ownerLabel(row.assigned_to, owners)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(previous || next) && (
                <nav className={styles.paging} aria-label="Inbox pages">
                  {previous && <Link href={previous}>Previous page</Link>}
                  {next && <Link href={next}>Next page</Link>}
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
