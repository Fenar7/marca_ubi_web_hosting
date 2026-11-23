import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { getCrmDirectoryList } from '@/app/admin/lib/crmDirectory';
import { ROLE_DEFAULT_TABS, type CrmUserRole } from '@/types/crm';
import { IngestionWorkspaceClient } from './components/IngestionWorkspaceClient';
import {
  canAssignInquiryOwner,
  inboxHref,
  inquiryCursor,
  readInboxFilters,
  type InboxQuery,
  type InquiryDetail,
  type InquiryRow,
} from './inquiryView';

export const metadata: Metadata = {
  title: 'Inquiries | Marca Ubi CRM',
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 25;
const ROW_FIELDS =
  'id,inquiry_ref,origin,received_at,name,company,service_category,state,assigned_to,is_historical';
const DETAIL_FIELDS =
  'id,inquiry_ref,origin,received_at,name,company,service_category,state,assigned_to,is_historical,original_channel,email,phone,summary,lead_id,updated_at,close_reason,timeline:brief->>timeline,budget:brief->>budget';

export interface InquiryHistory {
  id: string;
  event_type: 'received' | 'linked' | 'triaged' | 'backfilled';
  created_at: string;
}

interface InboxPageProps {
  searchParams: Promise<InboxQuery>;
}

/** All reads use the authenticated client; RLS scopes both the result rows and exact counts. */
export default async function AdminIngestionPage({
  searchParams,
}: InboxPageProps) {
  const [supabase, query] = await Promise.all([createClient(), searchParams]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login?next=%2Fadmin%2Fingestion');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role,status,allowed_tabs')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[inquiries] Profile lookup failed', profileError.code);
    throw new Error('Inquiry access could not be verified.');
  }
  if (!profile || profile.status !== 'active')
    redirect('/admin/login?error=account_suspended');

  const role = profile.role as CrmUserRole;
  const tabs = profile.allowed_tabs as string[] | null;
  const hasTab = (tab: 'ingestion' | 'leads') =>
    role === 'admin' ||
    (tabs?.length
      ? tabs.includes(tab)
      : Boolean(ROLE_DEFAULT_TABS[role]?.[tab]));

  if (!hasTab('ingestion')) redirect('/admin?error=unauthorized_role_access');

  const canWrite = role === 'admin' || role === 'sales_manager';
  const filters = readInboxFilters(query);
  const sourceOrigins = filters.origin
    ? [filters.origin]
    : filters.channel === 'website'
      ? ['contact', 'start_project', 'chat_pod', 'website']
      : filters.channel === 'manual'
        ? ['manual']
        : null;
  const now = new Date();
  const windowStart = new Date(now.getTime() - 86_400_000).toISOString();
  const countInquiries = () => {
    const count = supabase
      .from('inquiries')
      .select('id', { count: 'exact', head: true });
    return sourceOrigins ? count.in('origin', sourceOrigins) : count;
  };

  let list = supabase.from('inquiries').select(ROW_FIELDS);
  if (sourceOrigins) list = list.in('origin', sourceOrigins);
  if (filters.state === 'open') list = list.neq('state', 'closed');
  else if (filters.state) list = list.eq('state', filters.state);
  if (filters.owner === 'unassigned') list = list.is('assigned_to', null);
  else if (filters.owner) list = list.eq('assigned_to', filters.owner);
  if (filters.from) list = list.gte('received_at', filters.from + 'T00:00:00Z');
  if (filters.to) {
    const nextDay = new Date(Date.parse(filters.to) + 86_400_000).toISOString();
    list = list.lt('received_at', nextDay);
  }
  if (filters.window)
    list = list
      .gte('received_at', windowStart)
      .lte('received_at', now.toISOString())
      .eq('is_historical', false);
  if (filters.q) {
    const term = '%' + filters.q + '%';
    list = list.or(
      ['name', 'company', 'inquiry_ref', 'email', 'phone']
        .map((field) => field + '.ilike.' + term)
        .join(','),
    );
  }
  const ascending = filters.sort === 'oldest';
  const backwards = Boolean(filters.before);
  const cursor = filters.before ?? filters.after;
  if (cursor) {
    const comparison = ascending !== backwards ? 'gt' : 'lt';
    list = list.or(
      'received_at.' +
        comparison +
        '.' +
        cursor.stamp +
        ',and(received_at.eq.' +
        cursor.stamp +
        ',id.' +
        comparison +
        '.' +
        cursor.id +
        ')',
    );
  }

  const [
    rowsResult,
    needsReview,
    unassigned,
    received,
    directory,
    ownerEligibility,
    detailResult,
    historyResult,
  ] = await Promise.all([
    list
      .order('received_at', { ascending: ascending !== backwards })
      .order('id', { ascending: ascending !== backwards })
      .limit(PAGE_SIZE + 1),
    countInquiries().eq('state', 'new'),
    countInquiries().is('assigned_to', null).neq('state', 'closed'),
    countInquiries()
      .eq('is_historical', false)
      .gte('received_at', windowStart)
      .lte('received_at', now.toISOString()),
    getCrmDirectoryList(supabase, [
      'admin',
      'sales_manager',
      'sales_executive',
    ]),
    canWrite
      ? supabase
          .from('profiles')
          .select('id,role,allowed_tabs')
          .eq('status', 'active')
          .in('role', ['admin', 'sales_manager', 'sales_executive'])
      : null,
    filters.inquiry
      ? supabase
          .from('inquiries')
          .select(DETAIL_FIELDS)
          .eq('id', filters.inquiry)
          .maybeSingle()
      : null,
    filters.inquiry
      ? supabase
          .from('inquiry_activity')
          .select('id,event_type,created_at')
          .eq('inquiry_id', filters.inquiry)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(15)
      : null,
  ]);

  for (const [area, error] of [
    ['queue', rowsResult.error],
    ['needs review', needsReview.error],
    ['unassigned', unassigned.error],
    ['received', received.error],
    ['detail', detailResult?.error],
    ['history', historyResult?.error],
    ['assignment eligibility', ownerEligibility?.error],
  ] as const) {
    if (error)
      console.error('[inquiries] Query failed', { area, code: error.code });
  }

  const pageRows = ((rowsResult.data ?? []) as InquiryRow[]).slice(
    0,
    PAGE_SIZE,
  );
  const more = (rowsResult.data?.length ?? 0) > PAGE_SIZE;
  const rows = backwards ? pageRows.reverse() : pageRows;
  const first = rows[0];
  const last = rows.at(-1);
  const previous =
    first && (backwards ? more : filters.after)
      ? inboxHref(filters, {
          inquiry: null,
          before: inquiryCursor(first),
          after: null,
        })
      : null;
  const next =
    last && (backwards ? filters.before : more)
      ? inboxHref(filters, {
          inquiry: null,
          after: inquiryCursor(last),
          before: null,
        })
      : null;
  const detail = (detailResult?.data ?? null) as InquiryDetail | null;
  const owners = directory.map(({ id, full_name }) => ({
    id,
    name: full_name,
  }));
  const eligibleOwnerRoles = new Map(
    (ownerEligibility?.data ?? [])
      .filter(({ role, allowed_tabs }) =>
        canAssignInquiryOwner(role, allowed_tabs),
      )
      .map(({ id, role }) => [id, role]),
  );

  let leadLink: { id: string; ref: string } | null = null;
  let linkedLeadOwner: string | null = null;
  if (detail?.lead_id && hasTab('leads')) {
    const { data: lead, error } = await supabase
      .from('leads')
      .select('id,lead_id,assigned_to')
      .eq('id', detail.lead_id)
      .maybeSingle();
    if (error)
      console.error('[inquiries] Linked lead lookup failed', error.code);
    if (lead) {
      leadLink = { id: lead.id, ref: lead.lead_id };
      linkedLeadOwner = lead.assigned_to;
    }
  }

  return (
    <IngestionWorkspaceClient
      canWrite={canWrite}
      canResolve={canWrite && hasTab('leads')}
      filters={filters}
      rows={rows}
      listUnavailable={Boolean(rowsResult.error) || rowsResult.data === null}
      metrics={{
        needsReview: needsReview.error ? null : needsReview.count,
        unassigned: unassigned.error ? null : unassigned.count,
        received: received.error ? null : received.count,
      }}
      owners={owners}
      assignmentOwners={owners.filter(({ id }) => eligibleOwnerRoles.has(id))}
      triageOwners={owners.filter(({ id }) => {
        const ownerRole = eligibleOwnerRoles.get(id);
        return (
          ownerRole &&
          (!detail?.lead_id ||
            ownerRole !== 'sales_executive' ||
            id === linkedLeadOwner)
        );
      })}
      selected={
        detail
          ? {
              ...detail,
              has_link: Boolean(detail.lead_id),
              lead_id: leadLink?.id ?? null,
            }
          : null
      }
      linkedLead={leadLink}
      selectionUnavailable={Boolean(detailResult?.error)}
      history={(historyResult?.data ?? []) as InquiryHistory[]}
      historyUnavailable={Boolean(historyResult?.error)}
      previous={previous}
      next={next}
    />
  );
}
