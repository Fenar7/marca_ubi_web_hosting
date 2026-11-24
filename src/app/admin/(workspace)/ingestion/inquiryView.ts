export const INQUIRY_PATH = '/admin/ingestion';

export const ORIGIN_LABELS = {
  contact: 'Contact form',
  start_project: 'Start Project',
  chat_pod: 'Chat Pod',
  manual: 'Manual',
  website: 'Website form',
} as const;

export const CHANNEL_LABELS = {
  email: 'Email',
  phone: 'Phone',
  referral: 'Referral',
  in_person: 'In person',
  other: 'Other',
} as const;

export const STATE_LABELS = {
  new: 'Needs review',
  reviewed: 'Reviewed',
  closed: 'Closed',
} as const;

export type InquiryOrigin = keyof typeof ORIGIN_LABELS;
export type InquiryState = keyof typeof STATE_LABELS;
export type ChannelScope = 'all' | 'website' | 'manual';

export interface InquiryRow {
  id: string;
  inquiry_ref: string;
  origin: InquiryOrigin;
  received_at: string;
  name: string;
  company: string | null;
  service_category: string | null;
  state: InquiryState;
  assigned_to: string | null;
  is_historical: boolean;
  test_batch?: string | null;
  summary?: string | null;
}

export interface InquiryDetail extends InquiryRow {
  original_channel: string | null;
  email: string | null;
  phone: string | null;
  summary: string | null;
  lead_id: string | null;
  has_link: boolean;
  updated_at: string;
  timeline: string | null;
  budget: string | null;
  close_reason: string | null;
}

export interface OwnerOption {
  id: string;
  name: string;
}

/** Mirror inquiry_staff_role for the picker; the database authorizes every assignment. */
export function canAssignInquiryOwner(
  role: string,
  allowedTabs: unknown,
): boolean {
  if (role === 'admin') return true;
  if (role !== 'sales_manager' && role !== 'sales_executive') return false;
  return Array.isArray(allowedTabs) && allowedTabs.length > 0
    ? allowedTabs.includes('ingestion')
    : role === 'sales_manager';
}

export interface LeadMatch {
  id: string;
  lead_ref: string;
  name: string;
  company: string | null;
}

export type InboxQuery = Record<string, string | string[] | undefined>;

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_STAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;

const filterKeys = [
  'channel',
  'origin',
  'state',
  'owner',
  'q',
  'from',
  'to',
  'window',
  'live',
  'sort',
  'before',
  'after',
  'inquiry',
] as const;
type FilterKey = (typeof filterKeys)[number];

export interface InquiryCursor {
  stamp: string;
  id: string;
}

export function isInquiryId(value: string): boolean {
  return UUID.test(value);
}

function isCalendarDay(value: string): boolean {
  return (
    ISO_DATE.test(value) &&
    value.slice(0, 4) !== '0000' &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

/** Keep Postgres timestamp precision in both cursor predicates to avoid skipping sub-millisecond ties. */
export function parseCursor(value: string): InquiryCursor | null {
  if (value.length > 80) return null;
  const [stamp, id, extra] = value.split('~');
  if (
    extra !== undefined ||
    !stamp ||
    !id ||
    !UUID.test(id) ||
    !ISO_STAMP.test(stamp) ||
    !isCalendarDay(stamp.slice(0, 10)) ||
    !Number.isFinite(Date.parse(stamp))
  )
    return null;
  return { stamp, id };
}

export function inquiryCursor(row: InquiryRow): string {
  return row.received_at + '~' + row.id;
}

const getValue = (query: InboxQuery, key: FilterKey): string => {
  const value = query[key];
  return typeof value === 'string' ? value : '';
};

/** URL filters are allowlisted before they cross the PostgREST grammar boundary. */
export function readInboxFilters(query: InboxQuery) {
  const channelValue = getValue(query, 'channel');
  const channel: ChannelScope =
    channelValue === 'website' || channelValue === 'manual'
      ? channelValue
      : 'all';
  const originValue = getValue(query, 'origin');
  const origin =
    Object.hasOwn(ORIGIN_LABELS, originValue) &&
    (channel === 'all' || (channel === 'manual') === (originValue === 'manual'))
      ? (originValue as InquiryOrigin)
      : '';
  const stateValue = getValue(query, 'state');
  const state =
    Object.hasOwn(STATE_LABELS, stateValue) || stateValue === 'open'
      ? (stateValue as InquiryState | 'open')
      : '';
  const ownerValue = getValue(query, 'owner');
  const owner =
    ownerValue === 'unassigned' || isInquiryId(ownerValue) ? ownerValue : '';
  const q = getValue(query, 'q')
    .slice(0, 100)
    .trim()
    .replace(/[^\p{L}\p{M}\p{N}@+.\-\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const fromValue = getValue(query, 'from');
  const toValue = getValue(query, 'to');
  const from = isCalendarDay(fromValue) ? fromValue : '';
  const to = isCalendarDay(toValue) && toValue !== '9999-12-31' ? toValue : '';
  const window = getValue(query, 'window') === 'day' ? 'day' : '';
  const sort = getValue(query, 'sort') === 'oldest' ? 'oldest' : 'newest';
  const inquiry = getValue(query, 'inquiry');
  return {
    channel,
    origin,
    state,
    owner,
    q,
    from,
    to,
    window,
    live: getValue(query, 'live') === '1' ? '1' : '',
    sort,
    before: parseCursor(getValue(query, 'before')),
    after: parseCursor(getValue(query, 'after')),
    inquiry: isInquiryId(inquiry) ? inquiry : '',
  } as const;
}

export type InboxFilters = ReturnType<typeof readInboxFilters>;

/** One canonical URL preserves filters between detail and list, while filter changes discard cursors. */
export function inboxHref(
  filters: InboxFilters,
  overrides: Partial<Record<FilterKey, string | null>> = {},
): string {
  const parameters = new URLSearchParams();
  for (const key of filterKeys) {
    if (key in overrides) {
      const value = overrides[key];
      if (value) parameters.set(key, value);
    } else if (key === 'before' || key === 'after') {
      const cursor = filters[key];
      if (cursor) parameters.set(key, cursor.stamp + '~' + cursor.id);
    } else {
      const value = filters[key];
      if (value && value !== 'all' && value !== 'newest')
        parameters.set(key, value);
    }
  }
  const search = parameters.toString();
  return search ? INQUIRY_PATH + '?' + search : INQUIRY_PATH;
}

export function ownerLabel(id: string | null, owners: OwnerOption[]): string {
  if (!id) return 'Unassigned';
  return owners.find((owner) => owner.id === id)?.name ?? 'Assigned';
}

const receivedFormat = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
});

export function receivedLabel(stamp: string): string {
  const date = new Date(stamp);
  return Number.isFinite(date.getTime())
    ? receivedFormat.format(date) + ' UTC'
    : 'Time unavailable';
}
