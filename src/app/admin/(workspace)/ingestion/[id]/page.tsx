import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { getCrmDirectoryList } from '@/app/admin/lib/crmDirectory';
import { ROLE_DEFAULT_TABS, type CrmUserRole } from '@/types/crm';
import {
  CHANNEL_LABELS,
  INQUIRY_PATH,
  ORIGIN_LABELS,
  STATE_LABELS,
  canAssignInquiryOwner,
  inboxHref,
  isInquiryId,
  ownerLabel,
  readInboxFilters,
  receivedLabel,
  type InquiryDetail,
} from '../inquiryView';
import { DetailManagement } from './DetailManagement';
import styles from './detail.module.scss';

const fields = 'id,inquiry_ref,origin,original_channel,received_at,name,company,email,phone,service_category,summary,state,assigned_to,is_historical,lead_id,updated_at,close_reason,test_batch,timeline:brief->>timeline,budget:brief->>budget';

type DetailRow = Omit<InquiryDetail, 'has_link'> & { test_batch: string | null };

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}

/** Regenerate the back link from the list's allowlisted filters. Never navigate to a supplied URL. */
function backHref(returnTo: string | string[] | undefined, id: string) {
  if (typeof returnTo !== 'string' || returnTo.length > 2048) return INQUIRY_PATH;
  const [path, query] = returnTo.split('#', 1)[0].split('?', 2);
  if (path !== INQUIRY_PATH) return INQUIRY_PATH;
  const filters = readInboxFilters(Object.fromEntries(new URLSearchParams(query)));
  return inboxHref(filters, { inquiry: null }) + '#inquiry-open-' + id;
}

/** Activity titles depend only on enumerated types and known triage states. */
function eventLabel(type: string, state: string | null): string {
  if (type === 'received') return 'Inquiry received';
  if (type === 'linked') return 'Lead linked';
  if (type === 'backfilled') return 'Imported from CRM';
  if (state === 'closed') return 'Inquiry closed';
  if (state === 'reviewed') return 'Marked reviewed';
  if (state === 'new') return 'Saved as needs review';
  return 'Inquiry updated';
}

/** Read detail and audit history through the caller's RLS scope. Missing and restricted IDs share a 404. */
export default async function InquiryDetailPage({ params, searchParams }: Props) {
  const [{ id }, query, supabase] = await Promise.all([params, searchParams, createClient()]);
  if (!isInquiryId(id)) notFound();
  const back = backHref(query.returnTo, id);
  const detailHref = INQUIRY_PATH + '/' + id + (typeof query.returnTo === 'string' && query.returnTo.length <= 2048
    ? '?returnTo=' + encodeURIComponent(back.split('#')[0]) : '');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login?next=' + encodeURIComponent(detailHref));

  const { data: profile, error: profileError } = await supabase.from('profiles')
    .select('role,status,allowed_tabs').eq('id', user.id).maybeSingle();
  if (profileError) throw new Error('Inquiry access could not be verified.');
  if (!profile || profile.status !== 'active') redirect('/admin/login?error=account_suspended');

  const role = profile.role as CrmUserRole;
  const tabs = profile.allowed_tabs as string[] | null;
  const hasTab = (tab: 'ingestion' | 'leads') => role === 'admin' ||
    (tabs?.length ? tabs.includes(tab) : Boolean(ROLE_DEFAULT_TABS[role]?.[tab]));
  if (!hasTab('ingestion')) redirect('/admin?error=unauthorized_role_access');
  const canWrite = role === 'admin' || role === 'sales_manager';
  const canOpenLead = hasTab('leads');
  const [record, activity, directory, eligibility] = await Promise.all([
    supabase.from('inquiries').select(fields).eq('id', id).maybeSingle(),
    supabase.from('inquiry_activity').select('id,event_type,created_at,actor_id,state:metadata->>state')
      .eq('inquiry_id', id).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(100),
    getCrmDirectoryList(supabase),
    canWrite ? supabase.from('profiles').select('id,role,allowed_tabs').eq('status', 'active') : null,
  ]);
  if (record.error) {
    console.error('[inquiries] Detail query failed', { code: record.error.code });
    return <main className={styles.detail}><Link href={back}>Back to inquiries</Link><section className={styles.surface}><h1>Inquiry unavailable</h1><p>The inquiry could not be loaded.</p><Link href={detailHref}>Try again</Link></section></main>;
  }
  if (!record.data) notFound();
  const inquiry = record.data as unknown as DetailRow;
  const wantLeadOwner = canWrite && Boolean(inquiry.lead_id);
  const linkedLead = inquiry.lead_id && (canOpenLead || wantLeadOwner)
    ? await supabase.from('leads').select('id,lead_id,assigned_to').eq('id', inquiry.lead_id).maybeSingle() : null;
  const lead = canOpenLead ? linkedLead?.data : null;
  const people = directory.map(({ id: personId, full_name }) => ({ id: personId, name: full_name }));
  const eligible = new Set((eligibility?.data ?? []).filter(({ id: ownerId, role: ownerRole, allowed_tabs }) =>
    canAssignInquiryOwner(ownerRole, allowed_tabs) &&
    (!inquiry.lead_id || ownerRole !== 'sales_executive' || ownerId === linkedLead?.data?.assigned_to))
    .map(({ id: ownerId }) => ownerId));
  const detail: InquiryDetail = { ...inquiry, lead_id: lead?.id ?? null, has_link: Boolean(inquiry.lead_id) };
  const manualChannel = inquiry.original_channel && Object.hasOwn(CHANNEL_LABELS, inquiry.original_channel)
    ? CHANNEL_LABELS[inquiry.original_channel as keyof typeof CHANNEL_LABELS] : null;

  return (
    <main className={styles.detail}>
      <Link className={styles.back} href={back}>← Back to inquiries</Link>
      <header className={styles.heading}>
        <p>{inquiry.inquiry_ref}{inquiry.test_batch && <span className={styles.badge}>Test</span>}</p>
        <h1>{inquiry.company || inquiry.name}</h1>
        <p>{ORIGIN_LABELS[inquiry.origin]}{inquiry.origin === 'manual' && manualChannel ? ' · ' + manualChannel : ''} · <time dateTime={inquiry.received_at}>{receivedLabel(inquiry.received_at)}</time></p>
      </header>
      <div className={styles.columns}>
        <div className={styles.reading}>
          <section className={styles.surface} aria-labelledby="inquiry-brief">
            <h2 id="inquiry-brief">Original inquiry</h2>
            <p className={styles.brief}>{inquiry.summary || 'No brief recorded.'}</p>
            {(inquiry.service_category || inquiry.timeline || inquiry.budget) && <dl className={styles.briefFacts}>
              {inquiry.service_category && <div><dt>Service</dt><dd>{inquiry.service_category}</dd></div>}
              {inquiry.timeline && <div><dt>Timeline</dt><dd>{inquiry.timeline}</dd></div>}
              {inquiry.budget && <div><dt>Budget</dt><dd>{inquiry.budget}</dd></div>}
            </dl>}
          </section>
          <section className={styles.surface} aria-labelledby="inquiry-activity">
            <h2 id="inquiry-activity">Activity</h2>
            {activity.error ? <p>Activity could not be loaded. <Link href={detailHref}>Try again</Link></p> :
              !activity.data?.length ? <p>No activity recorded.</p> :
              <ol className={styles.timeline}>{activity.data.map((event) => (
                <li key={event.id}>
                  <strong>{eventLabel(event.event_type, event.state)}</strong>
                  <span>{event.actor_id ? ownerLabel(event.actor_id, people) : 'System'} · <time dateTime={event.created_at}>{receivedLabel(event.created_at)}</time></span>
                </li>
              ))}</ol>}
          </section>
        </div>
        <aside className={styles.management} aria-labelledby="inquiry-management">
          <section className={styles.surface}>
            <h2 id="inquiry-management">Management</h2>
            <dl className={styles.facts}>
              <dt>Status</dt><dd><span className={styles.badge} data-state={inquiry.state}>{STATE_LABELS[inquiry.state]}</span></dd>
              <dt>Owner</dt><dd>{ownerLabel(inquiry.assigned_to, people)}</dd>
              {inquiry.state === 'closed' && inquiry.close_reason && <><dt>Closure reason</dt><dd>{inquiry.close_reason}</dd></>}
            </dl>
            {canWrite && <DetailManagement key={inquiry.updated_at} detail={detail}
              owners={people.filter(({ id: ownerId }) => eligible.has(ownerId))} canResolve={canOpenLead} />}
          </section>
          <section className={styles.surface}>
            <h2>Contact</h2>
            <dl className={styles.facts}>
              <dt>Name</dt><dd>{inquiry.name}</dd>
              {inquiry.email && <><dt>Email</dt><dd><a href={'mailto:' + encodeURIComponent(inquiry.email)}>{inquiry.email}</a></dd></>}
              {inquiry.phone && <><dt>Phone</dt><dd><a href={'tel:' + inquiry.phone.replace(/[^+\d]/g, '')}>{inquiry.phone}</a></dd></>}
            </dl>
          </section>
          <section className={styles.surface}>
            <h2>Linked lead</h2>
            {lead ? <Link href={'/admin/leads/' + lead.id}>{lead.lead_id}</Link>
              : <p>{inquiry.lead_id ? 'Linked lead unavailable.' : 'No lead linked.'}</p>}
          </section>
        </aside>
      </div>
    </main>
  );
}
