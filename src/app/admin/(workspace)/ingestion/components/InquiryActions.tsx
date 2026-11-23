'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  addInquiryAction,
  findInquiryMatchesAction,
  linkInquiryAction,
  updateInquiryAction,
} from '@/app/actions/inquiries';
import {
  CHANNEL_LABELS,
  STATE_LABELS,
  type InquiryDetail,
  type InquiryState,
  type LeadMatch,
  type OwnerOption,
} from '../inquiryView';
import styles from './IngestionWorkspaceClient.module.scss';

type LinkMode = 'review' | 'link' | 'create';
type Lookup = {
  busy: boolean;
  matches: LeadMatch[] | null;
  error: string;
  leadId: string;
};

const initialLookup: Lookup = {
  busy: false,
  matches: null,
  error: '',
  leadId: '',
};

/** Match choices are tied to the current contact input. Changing the identity invalidates old choices. */
function useLeadMatches() {
  const [lookup, setLookup] = useState<Lookup>(initialLookup);
  const generation = useRef(0);

  function reset() {
    generation.current += 1;
    setLookup(initialLookup);
  }

  async function find(email: string, phone: string) {
    const request = ++generation.current;
    setLookup({ ...initialLookup, busy: true });
    try {
      const result = await findInquiryMatchesAction({ email, phone });
      if (request !== generation.current) return;
      setLookup(
        result.success
          ? { ...initialLookup, matches: result.data }
          : { ...initialLookup, error: result.error },
      );
    } catch (error) {
      console.error(
        '[inquiries] Lead lookup could not complete',
        error instanceof Error ? error.name : 'Unknown',
      );
      if (request === generation.current)
        setLookup({
          ...initialLookup,
          error: 'Could not load matches. Try again.',
        });
    }
  }

  function select(leadId: string) {
    setLookup((previous) => ({ ...previous, leadId }));
  }

  return { lookup, find, select, reset };
}

interface MatchPickerProps {
  email: string;
  phone: string;
  disabled?: boolean;
  lookup: ReturnType<typeof useLeadMatches>;
}

/** Keep record selection explicit so a duplicate check never changes the inquiry by itself. */
function MatchPicker({
  email,
  phone,
  disabled,
  lookup: selection,
}: MatchPickerProps) {
  const groupId = useId();
  const { lookup, find, select } = selection;
  return (
    <section className={styles.matchSection} aria-label="Matching leads">
      <button
        type="button"
        className={styles.secondary}
        disabled={disabled || lookup.busy || (!email.trim() && !phone.trim())}
        onClick={() => void find(email, phone)}
      >
        {lookup.busy ? 'Checking for matches…' : 'Check for matching leads'}
      </button>
      {lookup.error && (
        <p className={styles.error} role="alert">
          {lookup.error}
        </p>
      )}
      {lookup.matches?.length === 0 && (
        <p role="status">No matching leads are available.</p>
      )}
      {lookup.matches && lookup.matches.length > 0 && (
        <fieldset className={styles.matches}>
          <legend>Choose a lead to link</legend>
          {lookup.matches.map((lead) => (
            <label key={lead.id}>
              <input
                type="radio"
                name={groupId}
                value={lead.id}
                checked={lookup.leadId === lead.id}
                disabled={disabled}
                onChange={() => select(lead.id)}
              />
              <span>
                <strong>{lead.name}</strong>
                <small>
                  {lead.lead_ref}
                  {lead.company ? ' · ' + lead.company : ''}
                </small>
              </span>
            </label>
          ))}
        </fieldset>
      )}
    </section>
  );
}

interface AddInquiryProps {
  owners: OwnerOption[];
  canResolve: boolean;
  onSaved: (id: string) => void;
}

/** Native dialog provides modal focus containment and returns focus to the invoking button when it closes. */
export function AddInquiry({ owners, canResolve, onSaved }: AddInquiryProps) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <>
      <button
        type="button"
        className={styles.primary}
        onClick={() => {
          setOpen(true);
          dialog.current?.showModal();
          requestAnimationFrame(() =>
            dialog.current?.querySelector('input')?.focus(),
          );
        }}
      >
        Add inquiry
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={id}
        className={styles.dialog}
        onClose={() => {
          setOpen(false);
          setPending(false);
        }}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <header className={styles.dialogHeader}>
          <h2 id={id}>Add inquiry</h2>
          <button
            type="button"
            className={styles.close}
            disabled={pending}
            onClick={() => dialog.current?.close()}
            aria-label="Close form"
          >
            ×
          </button>
        </header>
        {open && (
          <div className={styles.dialogBody}>
            <AddInquiryForm
              owners={owners}
              canResolve={canResolve}
              onSaved={onSaved}
              onClose={() => dialog.current?.close()}
              onPending={setPending}
            />
          </div>
        )}
      </dialog>
    </>
  );
}

/** An idempotency key belongs to the draft intent and stays unchanged when staff retry a failed save. */
function AddInquiryForm({
  owners,
  canResolve,
  onSaved,
  onClose,
  onPending,
}: AddInquiryProps & {
  onClose: () => void;
  onPending: (pending: boolean) => void;
}) {
  const selection = useLeadMatches();
  const idempotencyKey = useRef<string | null>(null);
  const inFlight = useRef(false);
  const [linkMode, setLinkMode] = useState<LinkMode>('review');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    if (!email.trim() && !phone.trim()) {
      setError('Enter an email or phone number.');
      return;
    }
    if (linkMode === 'link' && !selection.lookup.leadId) {
      setError('Select a matching lead before saving.');
      return;
    }
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? '').trim();
    const received = value('receivedAt');
    const receivedAt = received ? new Date(received) : null;
    if (receivedAt && !Number.isFinite(receivedAt.valueOf())) {
      setError('Enter a valid received date and time.');
      return;
    }

    inFlight.current = true;
    onPending(true);
    setPending(true);
    setError('');
    try {
      idempotencyKey.current ??= crypto.randomUUID();
      const result = await addInquiryAction({
        idempotencyKey: idempotencyKey.current,
        name: value('name'),
        email: email.trim(),
        phone: phone.trim(),
        company: value('company'),
        serviceCategory: value('serviceCategory'),
        summary: value('summary'),
        originalChannel: value('originalChannel'),
        receivedAt: receivedAt?.toISOString(),
        ownerId: value('ownerId') || null,
        linkMode,
        leadId: linkMode === 'link' ? selection.lookup.leadId : undefined,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      onClose();
      onSaved(result.data.id);
    } catch (error) {
      console.error(
        '[inquiries] Add request could not complete',
        error instanceof Error ? error.name : 'Unknown',
      );
      setError(
        'Could not confirm the save. Retry this draft to check its result.',
      );
    } finally {
      inFlight.current = false;
      onPending(false);
      setPending(false);
    }
  }

  return (
    <form
      className={styles.entryForm}
      onSubmit={(event) => void save(event)}
      aria-busy={pending}
    >
      <fieldset disabled={pending}>
        <div className={styles.formGrid}>
          <label>
            Name
            <input name="name" autoComplete="name" required maxLength={160} />
          </label>
          <label>
            Company
            <input name="company" autoComplete="organization" maxLength={200} />
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                selection.reset();
              }}
            />
          </label>
          <label>
            Phone
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              maxLength={40}
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                selection.reset();
              }}
            />
          </label>
          <label>
            Received via
            <select name="originalChannel" required defaultValue="">
              <option value="" disabled>
                Select a channel
              </option>
              {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Received at <small>Optional, defaults to now</small>
            <input type="datetime-local" name="receivedAt" />
          </label>
          <label>
            Service
            <select name="serviceCategory" defaultValue="">
              <option value="">Not specified</option>
              {[
                'Branding',
                'Web & Digital',
                'Mobile Apps',
                'UI/UX Design',
                'Full-Suite Advisory',
                'Other',
              ].map((service) => (
                <option key={service}>{service}</option>
              ))}
            </select>
          </label>
          <label>
            Owner
            <select name="ownerId" defaultValue="">
              <option value="">Unassigned</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.wide}>
            Inquiry summary
            <textarea name="summary" rows={4} required maxLength={4000} />
          </label>
          {canResolve && (
            <label className={styles.wide}>
              Lead handling
              <select
                value={linkMode}
                onChange={(event) =>
                  setLinkMode(event.target.value as LinkMode)
                }
              >
                <option value="review">Save for review</option>
                <option value="link">Link to an existing lead</option>
                <option value="create">Create a lead</option>
              </select>
            </label>
          )}
        </div>
        {linkMode !== 'review' && (
          <MatchPicker
            email={email}
            phone={phone}
            disabled={pending}
            lookup={selection}
          />
        )}
      </fieldset>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <footer className={styles.dialogFooter}>
        <button
          type="button"
          className={styles.secondary}
          onClick={onClose}
          disabled={pending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.primary}
          disabled={
            pending || (linkMode === 'link' && !selection.lookup.leadId)
          }
        >
          {pending ? 'Saving…' : 'Save inquiry'}
        </button>
      </footer>
    </form>
  );
}

interface TriageProps {
  detail: InquiryDetail;
  owners: OwnerOption[];
}

export function InquiryTriage({ detail, owners }: TriageProps) {
  const [state, setState] = useState<InquiryState>(detail.state);
  const router = useRouter();
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [resultText, setResultText] = useState('');
  const [error, setError] = useState('');

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const data = new FormData(event.currentTarget);
    lock.current = true;
    setPending(true);
    setError('');
    setResultText('');
    try {
      const response = await updateInquiryAction({
        inquiryId: detail.id,
        expectedUpdatedAt: detail.updated_at,
        ownerId: String(data.get('ownerId') ?? '') || null,
        state,
        closeReason:
          state === 'closed'
            ? String(data.get('closeReason') ?? '').trim()
            : null,
      });
      if (response.success) {
        setResultText('Inquiry updated.');
        router.refresh();
      } else setError(response.error);
    } catch (error) {
      console.error(
        '[inquiries] Triage request could not complete',
        error instanceof Error ? error.name : 'Unknown',
      );
      setError('Could not confirm the update. Refresh and try again.');
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  const hasOwnerOption = owners.some(
    (owner) => owner.id === detail.assigned_to,
  );

  return (
    <form
      onSubmit={(event) => void save(event)}
      className={styles.triageForm}
      aria-busy={pending}
    >
      <fieldset disabled={pending}>
        <legend>Triage</legend>
        <label>
          Owner
          <select name="ownerId" defaultValue={detail.assigned_to ?? ''}>
            <option value="">Unassigned</option>
            {detail.assigned_to && !hasOwnerOption && (
              <option value={detail.assigned_to}>Current owner</option>
            )}
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={state}
            onChange={(event) => setState(event.target.value as InquiryState)}
          >
            {Object.entries(STATE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {state === 'closed' && (
          <label>
            Reason for closing
            <input
              name="closeReason"
              required
              maxLength={500}
              defaultValue={detail.close_reason ?? ''}
            />
          </label>
        )}
      </fieldset>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {resultText && <p role="status">{resultText}</p>}
      <button type="submit" className={styles.secondary} disabled={pending}>
        {pending ? 'Saving…' : 'Save triage'}
      </button>
    </form>
  );
}

export function ResolveInquiry({ detail }: { detail: InquiryDetail }) {
  const selection = useLeadMatches();
  const router = useRouter();
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function resolve(linkMode: 'link' | 'create') {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setError('');
    try {
      const result = await linkInquiryAction({
        inquiryId: detail.id,
        expectedUpdatedAt: detail.updated_at,
        linkMode,
        leadId: linkMode === 'link' ? selection.lookup.leadId : undefined,
      });
      if (result.success) router.refresh();
      else setError(result.error);
    } catch (error) {
      console.error(
        '[inquiries] Link request could not complete',
        error instanceof Error ? error.name : 'Unknown',
      );
      setError('Could not confirm the link. Refresh and try again.');
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  return (
    <section
      className={styles.resolve}
      aria-label="Link a lead"
      aria-busy={pending}
    >
      <h3>Lead record</h3>
      <MatchPicker
        email={detail.email ?? ''}
        phone={detail.phone ?? ''}
        disabled={pending}
        lookup={selection}
      />
      <div className={styles.inlineActions}>
        {selection.lookup.leadId && (
          <button
            type="button"
            className={styles.secondary}
            disabled={pending}
            onClick={() => void resolve('link')}
          >
            Link selected lead
          </button>
        )}
        <button
          type="button"
          className={styles.secondary}
          disabled={pending}
          onClick={() => void resolve('create')}
        >
          Create lead
        </button>
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </section>
  );
}
