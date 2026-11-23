'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { InquiryHistory } from '../page';
import {
  CHANNEL_LABELS,
  INQUIRY_PATH,
  ORIGIN_LABELS,
  STATE_LABELS,
  inboxHref,
  ownerLabel,
  receivedLabel,
  type InboxFilters,
  type InquiryDetail,
  type InquiryRow,
  type OwnerOption,
} from '../inquiryView';
import { AddInquiry, InquiryTriage, ResolveInquiry } from './InquiryActions';
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
  selected: InquiryDetail | null;
  linkedLead: { id: string; ref: string } | null;
  selectionUnavailable: boolean;
  history: InquiryHistory[];
  historyUnavailable: boolean;
  previous: string | null;
  next: string | null;
}

const CHANNELS = [
  ['all', 'All inquiries'],
  ['website', 'Website'],
  ['manual', 'Manual'],
] as const;
const HISTORY_LABELS: Record<InquiryHistory['event_type'], string> = {
  received: 'Inquiry received',
  linked: 'Lead linked',
  triaged: 'Triage updated',
  backfilled: 'Imported from CRM history',
};

function RowStatus({ state }: { state: InquiryRow['state'] }) {
  return (
    <span className={styles.stateBadge} data-state={state}>
      {STATE_LABELS[state]}
    </span>
  );
}

function BriefField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return children ? (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  ) : null;
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
  selected,
  linkedLead,
  selectionUnavailable,
  history,
  historyUnavailable,
  previous,
  next,
}: InboxProps) {
  const router = useRouter();
  const [notice, setNotice] = useState('');
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const queueHeading = useRef<HTMLHeadingElement>(null);
  const attemptedSelection = filters.inquiry;
  const resetHref = inboxHref(filters, {
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
    filters.window,
  );
  const scopeLabel =
    CHANNELS.find(([value]) => value === filters.channel)?.[1] ??
    'All inquiries';
  const createHref = (id: string) =>
    inboxHref(filters, { inquiry: id }) + '#inquiry-detail-heading';

  useEffect(() => {
    if (
      !attemptedSelection ||
      window.location.hash !== '#inquiry-detail-heading'
    )
      return;
    const frame = requestAnimationFrame(() =>
      detailHeading.current?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [attemptedSelection]);

  const filterHref = (
    state: string | null,
    owner: string | null,
    window: string | null,
  ) =>
    inboxHref(filters, {
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

  function closeDetail() {
    router.push(inboxHref(filters, { inquiry: null }), { scroll: false });
    requestAnimationFrame(() => {
      const row = document.getElementById('inquiry-open-' + attemptedSelection);
      (row ?? queueHeading.current)?.focus();
    });
  }

  return (
    <div className={styles.workspace}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Inquiries</h1>
          <p>Review website submissions and inquiries logged by your team.</p>
        </div>
        {canWrite && (
          <AddInquiry
            owners={owners}
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

      <div
        className={styles.inboxLayout}
        data-detail={Boolean(attemptedSelection)}
      >
        <section className={styles.queue} aria-labelledby="inquiry-queue">
          <header className={styles.queueHeader}>
            <h2 id="inquiry-queue" ref={queueHeading} tabIndex={-1}>
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
            <label>
              Source
              <select name="origin" defaultValue={filters.origin}>
                <option value="">Any source</option>
                {Object.entries(ORIGIN_LABELS)
                  .filter(
                    ([origin]) =>
                      filters.channel === 'all' ||
                      (filters.channel === 'manual') === (origin === 'manual'),
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
              {activeFilters && <Link href={resetHref}>Clear filters</Link>}
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
                    <tr
                      role="row"
                      key={row.id}
                      data-selected={row.id === attemptedSelection}
                    >
                      <th role="rowheader" scope="row">
                        <Link
                          href={createHref(row.id)}
                          id={'inquiry-open-' + row.id}
                          aria-current={
                            row.id === attemptedSelection ? 'true' : undefined
                          }
                        >
                          <strong>{row.name}</strong>
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

        {attemptedSelection && (
          <aside
            id="inquiry-detail"
            className={styles.detail}
            aria-labelledby="inquiry-detail-heading"
          >
            <header className={styles.detailHeader}>
              <div>
                {selected && (
                  <p>
                    {selected.inquiry_ref} · {ORIGIN_LABELS[selected.origin]}
                  </p>
                )}
                <h2
                  id="inquiry-detail-heading"
                  ref={detailHeading}
                  tabIndex={-1}
                >
                  {selected?.name ?? 'Inquiry detail'}
                </h2>
              </div>
              <button
                type="button"
                className={styles.close}
                aria-label="Close inquiry details"
                onClick={closeDetail}
              >
                ×
              </button>
            </header>
            {selected ? (
              <div className={styles.detailBody}>
                <RowStatus state={selected.state} />
                <dl className={styles.brief}>
                  <BriefField label="Company">{selected.company}</BriefField>
                  <BriefField label="Received">
                    <time dateTime={selected.received_at}>
                      {receivedLabel(selected.received_at)}
                    </time>
                  </BriefField>
                  <BriefField label="Owner">
                    {ownerLabel(selected.assigned_to, owners)}
                  </BriefField>
                  <BriefField label="Received via">
                    {selected.original_channel &&
                      (CHANNEL_LABELS[
                        selected.original_channel as keyof typeof CHANNEL_LABELS
                      ] ??
                        selected.original_channel)}
                  </BriefField>
                  <BriefField label="Email">{selected.email}</BriefField>
                  <BriefField label="Phone">{selected.phone}</BriefField>
                  <BriefField label="Service">
                    {selected.service_category}
                  </BriefField>
                  <BriefField label="Timeline">{selected.timeline}</BriefField>
                  <BriefField label="Budget">{selected.budget}</BriefField>
                  <BriefField label="Closure reason">
                    {selected.close_reason}
                  </BriefField>
                </dl>
                {selected.summary && (
                  <section className={styles.summary}>
                    <h3>Inquiry brief</h3>
                    <p>{selected.summary}</p>
                  </section>
                )}
                {selected.is_historical && (
                  <p className={styles.historical}>
                    Imported from CRM history. This reflects the available
                    historical record.
                  </p>
                )}
                {linkedLead ? (
                  <Link
                    className={styles.secondary}
                    href={'/admin/leads/' + encodeURIComponent(linkedLead.id)}
                  >
                    Open lead {linkedLead.ref}
                  </Link>
                ) : selected.has_link ? (
                  <p className={styles.historical}>
                    A lead is linked to this inquiry.
                  </p>
                ) : canResolve ? (
                  <ResolveInquiry
                    key={selected.id + selected.updated_at}
                    detail={selected}
                  />
                ) : null}
                {canWrite && (
                  <InquiryTriage
                    key={selected.id + selected.updated_at}
                    detail={selected}
                    owners={owners}
                  />
                )}
                <section className={styles.activity}>
                  <h3>Recent history</h3>
                  {historyUnavailable ? (
                    <p>History is unavailable.</p>
                  ) : history.length ? (
                    <ul>
                      {history.map((item) => (
                        <li key={item.id}>
                          <strong>
                            {HISTORY_LABELS[item.event_type] ??
                              'Inquiry updated'}
                          </strong>
                          <time dateTime={item.created_at}>
                            {receivedLabel(item.created_at)}
                          </time>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No history recorded.</p>
                  )}
                </section>
              </div>
            ) : (
              <div className={styles.empty} role="status">
                <p>
                  {selectionUnavailable
                    ? 'Could not load this inquiry.'
                    : 'This inquiry is unavailable.'}
                </p>
                {selectionUnavailable && (
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => router.refresh()}
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
