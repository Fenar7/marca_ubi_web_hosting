import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPodPayload, reviewRows } from '@/app/chat-pod/intake/review';
import { SERVICE_INTEREST_OPTIONS, SERVICE_INTEREST_ROUTING, validateServiceInterests } from '@/app/chat-pod/intake/serviceInterest';
import { canSubmit, currentSlot, initialIntakeState, transition } from '@/app/chat-pod/intake/useIntakeFlow';
import { ingestLeadSchema } from '@/app/lib/validations/ingest';
import { B2B_SERVICES, B2C_SERVICES } from '@/app/components/Sections/ServicesAccordion/types';
import type { IntakeState } from '@/app/chat-pod/intake/useIntakeFlow';
import type { SlotId, SlotValue } from '@/app/chat-pod/types';

/** Actual short-path transitions rather than a hand-authored review state. */
function shortBrief(email = 'owner@example.com'): IntakeState {
  let state = transition(initialIntakeState(), { t: 'START_INTAKE' });
  const answers: [SlotId, SlotValue][] = [
    ['serviceInterest', ['account-based-marketing']],
    ['projectDescription', 'We need a campaign for target accounts.'],
    ['name', 'Asha Menon'],
    ['email', email],
  ];
  for (const [slot, value] of answers) state = transition(state, { t: 'ANSWER', slot, value });
  if (!email) state = transition(state, { t: 'ANSWER', slot: 'phone', value: '+91 7012 052 472' });
  return state;
}

describe('short project enquiry contract', () => {
  it('has an explicit routing policy for every published service and no unpublished IDs', () => {
    const published = [...B2B_SERVICES, ...B2C_SERVICES].map((service) => service.slug).sort();
    assert.deepEqual(Object.keys(SERVICE_INTEREST_ROUTING).sort(), published);
    assert.deepEqual(SERVICE_INTEREST_OPTIONS.map((option) => option.value).sort(), published);
  });

  it('rejects unknown interests and a mixed undecided selection', () => {
    assert.equal(validateServiceInterests(['fabricated-service']), null);
    assert.equal(validateServiceInterests(['undecided', 'demand-generation']), null);
    assert.deepEqual(validateServiceInterests(['demand-generation', 'demand-generation']), ['demand-generation']);
  });

  it('carries a selected service but still asks for confirmation', () => {
    const carried = transition(initialIntakeState(), { t: 'START_INTAKE', serviceSlug: 'demand-generation' });
    assert.equal(currentSlot(carried), 'serviceInterest');
    assert.deepEqual(carried.slots.serviceInterest, ['demand-generation']);
    const stopped = transition(carried, { t: 'EXIT_TO_CHAT' });
    const resumed = transition(stopped, { t: 'START_INTAKE', serviceSlug: 'retail-activation' });
    assert.deepEqual(resumed.slots.serviceInterest, ['demand-generation'], 'a draft takes precedence over inferred context');
  });

  it('does not prefill an unknown service', () => {
    const state = transition(initialIntakeState(), { t: 'START_INTAKE', serviceSlug: 'unknown' });
    assert.deepEqual(state.slots.serviceInterest, []);
  });

  it('skips the second reply channel when email is present and reviews after optional timing', () => {
    let state = shortBrief();
    assert.equal(currentSlot(state), 'timeline');
    assert.equal(state.slots.phone, '');
    state = transition(state, { t: 'SKIP', slot: 'timeline' });
    assert.equal(state.mode, 'REVIEW');
    assert.equal(canSubmit(state), true);
    assert.deepEqual(state.slots.categories, []);
    assert.deepEqual(state.slots.services, []);
  });

  it('allows review before timing without walking optional enrichment', () => {
    const reviewed = transition(shortBrief(), { t: 'REVIEW_NOW' });
    assert.equal(reviewed.mode, 'REVIEW');
    assert.equal(reviewed.slots.timeline, '');
    assert.equal(reviewed.enriching, false);
    const details = transition(reviewed, { t: 'ADD_DETAILS' });
    assert.equal(details.mode, 'INTAKE_FORM');
    assert.equal(currentSlot(details), 'categories');
    assert.equal(details.enriching, true);
    assert.equal(transition(details, { t: 'REVIEW_NOW' }).mode, 'REVIEW');
  });

  it('accepts a phone-only reply channel without requiring email', () => {
    const reviewed = transition(shortBrief(''), { t: 'REVIEW_NOW' });
    assert.equal(canSubmit(reviewed), true);
    const payload = buildPodPayload(reviewed.slots, 'one-intent');
    assert.equal(payload.email, undefined);
    assert.equal(payload.phone, '+91 7012 052 472');
    assert.doesNotThrow(() => ingestLeadSchema.parse(payload));
  });

  it('cannot advance a required phone with an empty answer', () => {
    const beforePhone = transition(transition(transition(transition(initialIntakeState(), { t: 'START_INTAKE' }),
      { t: 'ANSWER', slot: 'serviceInterest', value: ['undecided'] }),
      { t: 'ANSWER', slot: 'projectDescription', value: 'Help us choose a service.' }),
      { t: 'ANSWER', slot: 'name', value: 'Asha' });
    const phone = transition(beforePhone, { t: 'SKIP', slot: 'email' });
    const refused = transition(phone, { t: 'ANSWER', slot: 'phone', value: '' });
    assert.equal(currentSlot(refused), 'phone');
    assert.equal(refused.mode, 'INTAKE_FORM');
    assert.ok(refused.error);
  });

  it('routes incomplete review requests to the missing required field', () => {
    const asking = transition(initialIntakeState(), { t: 'START_INTAKE' });
    const blocked = transition(asking, { t: 'REVIEW_NOW' });
    assert.equal(blocked.mode, 'INTAKE_FORM');
    assert.equal(blocked.error?.slot, 'serviceInterest');
  });

  it('requires a replacement reply channel when editing clears the only email', () => {
    const reviewed = transition(shortBrief(), { t: 'REVIEW_NOW' });
    const edit = transition(reviewed, { t: 'EDIT_SLOT', slot: 'email' });
    const cleared = transition(edit, { t: 'ANSWER', slot: 'email', value: '' });
    assert.equal(currentSlot(cleared), 'phone');
    assert.equal(cleared.mode, 'INTAKE_FORM');
    assert.equal(canSubmit(cleared), false);
    const replaced = transition(cleared, { t: 'ANSWER', slot: 'phone', value: '+91 7012 052 472' });
    assert.equal(replaced.mode, 'REVIEW');
    assert.equal(canSubmit(replaced), true);
  });

  it('keeps new company, project title, timing and public IDs distinct in the payload', () => {
    const state = shortBrief();
    const slots = { ...state.slots, company: 'Acme Ltd', projectName: 'Pipeline launch', timeline: '1 week' };
    const payload = buildPodPayload(slots, 'one-intent');
    assert.equal(payload.company, 'Acme Ltd');
    assert.equal(payload.budget_bracket, undefined);
    assert.equal(payload.service_category, 'Full-Suite Advisory');
    assert.deepEqual(payload.brief_payload.services, []);
    const envelope = payload.brief_payload.chatPod as { version: number; projectName: string; timing: string; serviceInterests: { id: string }[] };
    assert.equal(envelope.version, 2);
    assert.equal(envelope.projectName, 'Pipeline launch');
    assert.equal(envelope.timing, '1 week');
    assert.equal(envelope.serviceInterests[0].id, 'account-based-marketing');
    assert.doesNotThrow(() => ingestLeadSchema.parse(payload));
    assert.match(reviewRows(slots).find((row) => row.slot === 'serviceInterest')?.value ?? '', /Account-Based Marketing/);
  });

  it('never files a project title as a company in the new enquiry path', () => {
    const payload = buildPodPayload({ ...shortBrief().slots, projectName: 'Pipeline launch' }, 'one-intent');
    assert.equal(payload.company, undefined);
    assert.equal(payload.brief_payload.projectName, 'Pipeline launch');
  });

  it('retains exact optional deliverables whose canonical label contains commas', () => {
    const slots = { ...shortBrief().slots, categories: ['Business & advertising'], services: ['Postcard, flyer or print', 'Poster'] };
    const payload = buildPodPayload(slots, 'one-intent');
    assert.deepEqual(payload.brief_payload.services, ['Postcard, flyer or print', 'Poster']);
    assert.match(payload.notes ?? '', /• Postcard, flyer or print\n• Poster/);
  });

  it('restores old draft fields without fabricating service interests', () => {
    const restored = transition(initialIntakeState(), { t: 'RESTORE_DRAFT', slots: { categories: ['Logo & identity'], services: ['Logo design'], projectName: 'Old title', name: 'Asha' } });
    assert.deepEqual(restored.slots.services, ['Logo design']);
    assert.deepEqual(restored.slots.serviceInterest, []);
    assert.equal(currentSlot(restored), 'serviceInterest');
  });

  it('revalidates restored fields before allowing submission', () => {
    const slots = { ...shortBrief().slots, serviceInterest: ['unknown'], email: 'invalid-email' };
    const restored = transition(initialIntakeState(), { t: 'RESTORE_DRAFT', slots });
    assert.equal(canSubmit(restored), false);
    const attempted = transition({ ...restored, mode: 'REVIEW' }, { t: 'SUBMIT', idempotencyKey: 'one-intent' });
    assert.equal(attempted.mode, 'INTAKE_FORM');
    assert.equal(currentSlot(attempted), 'serviceInterest');
  });

  it('ignores stale submission callbacks outside an active request', () => {
    const reviewed = transition(shortBrief(), { t: 'REVIEW_NOW' });
    assert.equal(transition(reviewed, { t: 'SUBMIT_OK' }), reviewed);
    assert.equal(transition(reviewed, { t: 'SUBMIT_FAIL', status: 503, message: 'Late callback' }), reviewed);
  });
});
