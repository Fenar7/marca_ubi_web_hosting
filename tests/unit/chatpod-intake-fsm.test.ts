/**
 * @file chatpod-intake-fsm.test.ts
 * @description Every transition of the intake machine, legal and illegal, asserted without a DOM.
 *
 *              The illegal half matters more than the legal half. A chat surface cannot stop a visitor
 *              from tapping a superseded chip, pressing send twice, or typing "skip" at a question that
 *              the ingest schema needs an answer for, so the machine has to refuse those itself. Each
 *              refusal below is the reason the panel can stay thin: the reducer, not the click handler,
 *              decides what is allowed.
 *
 *              Five invariants get their own tests because they are the ones a future edit could break
 *              quietly: a required slot is never advanced past, one idempotency key carries the whole
 *              submission intent including every retry, email-OR-phone mirrors the `.refine()` in
 *              `ingestLeadSchema`, editing from the review card returns to the card, and nothing but the
 *              response itself can move the machine out of `SUBMITTING`.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_SUBMIT_ATTEMPTS,
  OPTIONAL_TAIL_START,
  blockingSlot,
  canSubmit,
  currentSlot,
  initialIntakeState,
  isRequired,
  transition,
} from '@/app/chat-pod/intake/useIntakeFlow';
import { SLOTS, SLOT_ORDER, polarityMatch, slotOptions } from '@/app/chat-pod/intake/slots';
import {
  INTAKE_AGENCY_STATUS_OPTIONS,
  INTAKE_CATEGORIES,
  INTAKE_INDUSTRIES,
  INTAKE_LANGUAGES,
  INTAKE_REFERRAL_SOURCES,
  INTAKE_SHOWCASE_CHOICES,
  INTAKE_TIMELINE_OPTIONS,
  SERVICES_BY_CATEGORY,
} from '@/app/lib/intake/intakeOptions';
import type { IntakeState } from '@/app/chat-pod/intake/useIntakeFlow';
import type { SlotId, SlotValue } from '@/app/chat-pod/types';

const CATEGORY = INTAKE_CATEGORIES[0];
const SERVICE = SERVICES_BY_CATEGORY[CATEGORY][0];

/** One valid answer per slot, using the shared closed sets so a re-label cannot pass silently. */
const VALID: Record<SlotId, SlotValue> = {
  serviceInterest: ['integrated-creativity'],
  company: 'Desert Bloom Ltd',
  categories: [CATEGORY],
  services: [SERVICE],
  timeline: INTAKE_TIMELINE_OPTIONS[1].value,
  name: 'Asha Menon',
  email: 'asha@studio.example',
  phone: '+91 7012 052 472',
  projectName: 'Desert Bloom',
  industry: INTAKE_INDUSTRIES[0],
  projectDescription: 'A brand system and a digital flagship for a beverage label.',
  website: 'https://example.com',
  instagram: '@example',
  language: INTAKE_LANGUAGES[0],
  agencyStatus: INTAKE_AGENCY_STATUS_OPTIONS[0],
  referral: INTAKE_REFERRAL_SOURCES[0],
  inspirationLinks: ['https://example.com/work'],
  showcasePermission: INTAKE_SHOWCASE_CHOICES[0],
  extraNotes: 'The launch window is the end of the year.',
};

/**
 * A brief with nothing in it. The closed sets under test here are static — none of them is scoped to an
 * earlier answer — so an empty brief is enough to read them the way the panel does.
 */
const EMPTY: Record<SlotId, SlotValue> = Object.fromEntries(
  SLOT_ORDER.map((slot) => [slot, Array.isArray(VALID[slot]) ? [] : '']),
) as Record<SlotId, SlotValue>;

/** Walk the machine with the visitor: answer every slot in ask order. */
function fill(overrides: Partial<Record<SlotId, SlotValue>> = {}): IntakeState {
  let state = transition(initialIntakeState(), { t: 'START_INTAKE' });
  for (const slot of SLOT_ORDER) {
    if (state.mode === 'REVIEW') state = transition(state, { t: 'ADD_DETAILS' });
    if (currentSlot(state) !== slot) continue;
    const value = overrides[slot] !== undefined ? overrides[slot] : VALID[slot];
    state = transition(state, { t: 'ANSWER', slot, value });
  }
  return state;
}

/** Stop on the given slot with every earlier question answered. */
function toSlot(slot: SlotId, overrides: Partial<Record<SlotId, SlotValue>> = {}): IntakeState {
  let state = transition(initialIntakeState(), { t: 'START_INTAKE' });
  const values = slot === 'phone' && overrides.email === undefined ? { ...overrides, email: '' } : overrides;
  for (const entry of SLOT_ORDER.slice(0, SLOT_ORDER.indexOf(slot)) as SlotId[]) {
    if (state.mode === 'REVIEW') state = transition(state, { t: 'ADD_DETAILS' });
    if (currentSlot(state) !== entry) continue;
    const value = values[entry] !== undefined ? values[entry] : VALID[entry];
    state = transition(state, { t: 'ANSWER', slot: entry, value });
  }
  if (state.mode === 'REVIEW') state = transition(state, { t: 'ADD_DETAILS' });
  assert.equal(currentSlot(state), slot, 'the walk must stop on the slot under test');
  return state;
}

/** One turn: stand on a slot and give it the answer the test is about. */
function answerSlot(slot: SlotId, value: SlotValue, overrides: Partial<Record<SlotId, SlotValue>> = {}): IntakeState {
  return transition(toSlot(slot, overrides), { t: 'ANSWER', slot, value });
}

describe('Chat Pod intake machine', () => {
  describe('starting and stopping', () => {
    it('enters the form on the first slot', () => {
      const state = transition(initialIntakeState(), { t: 'START_INTAKE' });
      assert.equal(state.mode, 'INTAKE_FORM');
      assert.equal(currentSlot(state), SLOT_ORDER[0]);
    });

    it('refuses to restart while a brief is in progress', () => {
      const mid = transition(initialIntakeState(), { t: 'START_INTAKE' });
      const answered = transition(mid, { t: 'ANSWER', slot: 'categories', value: [CATEGORY] });
      // A stray chip must not throw away the answer already given.
      assert.deepEqual(transition(answered, { t: 'START_INTAKE' }), answered);
    });

    it('refuses to restart while submitting', () => {
      const submitting = transition(fill(), { t: 'SUBMIT', idempotencyKey: 'k1' });
      assert.equal(submitting.mode, 'SUBMITTING');
      assert.deepEqual(transition(submitting, { t: 'START_INTAKE' }), submitting);
    });

    it('resumes where the visitor stopped after an exit', () => {
      let state = transition(initialIntakeState(), { t: 'START_INTAKE' });
      state = transition(state, { t: 'ANSWER', slot: 'serviceInterest', value: VALID.serviceInterest });
      state = transition(state, { t: 'EXIT_TO_CHAT' });
      assert.equal(state.mode, 'CHAT');
      assert.deepEqual(state.slots.serviceInterest, VALID.serviceInterest, 'answers are kept when the questions stop');

      state = transition(state, { t: 'START_INTAKE' });
      assert.equal(state.slotIndex, 1, 'resumes on the next unanswered slot');
    });

    it('clears everything on reset', () => {
      const reset = transition(fill(), { t: 'RESET' });
      assert.equal(reset.mode, 'CHAT');
      assert.equal(reset.slots.name, '');
      assert.deepEqual(reset.touched, []);
      assert.equal(reset.idempotencyKey, null);
    });
  });

  describe('answering', () => {
    it('walks the whole ask order to the review card', () => {
      const state = fill();
      assert.equal(state.mode, 'REVIEW');
      assert.equal(state.slotIndex, SLOT_ORDER.length - 1);
      assert.equal(canSubmit(state), true);
    });

    it('ignores an answer aimed at a slot that is no longer being asked', () => {
      const state = transition(initialIntakeState(), { t: 'START_INTAKE' });
      const answered = transition(state, { t: 'ANSWER', slot: 'categories', value: [CATEGORY] });
      // The timeline chip from a stale turn must not file itself against the slot now on screen.
      const ignored = transition(answered, { t: 'ANSWER', slot: 'timeline', value: INTAKE_TIMELINE_OPTIONS[0].value });
      assert.equal(ignored.slots.timeline, '');
      assert.equal(ignored.mode, 'INTAKE_FORM');
    });

    it('refuses to answer outside the form', () => {
      const reviewed = fill();
      assert.deepEqual(transition(reviewed, { t: 'ANSWER', slot: 'name', value: 'Nobody' }), reviewed);
    });

    it('rejects a category that is not in the published set', () => {
      const state = answerSlot('categories', ['Something we invented']);
      assert.equal(state.mode, 'INTAKE_FORM');
      assert.equal(state.error?.slot, 'categories');
      assert.match(state.error?.message ?? '', /options I showed you/);
    });

    it('rejects a service outside the chosen categories', () => {
      const foreign = INTAKE_CATEGORIES.slice(1).flatMap((entry) => SERVICES_BY_CATEGORY[entry])[0];
      const state = answerSlot('services', [foreign]);
      assert.match(state.error?.message ?? '', /category you did not pick/);
      const stored = state.slots.services;
      assert.ok(Array.isArray(stored), 'a service slot holds a list, not a string');
      assert.equal(stored.length, 0);
    });

    it('rejects a closed-set value by membership, not by length', () => {
      const state = answerSlot('industry', 'Technology and Retail');
      assert.equal(state.slots.industry, '');
      assert.ok(state.error, 'a compound answer is not a member');
    });

    it('rejects a malformed email but accepts a blank one', () => {
      const bad = answerSlot('email', 'asha@');
      assert.match(bad.error?.message ?? '', /did not look right/);
      assert.equal(bad.slots.email, '');

      const blank = answerSlot('email', '');
      assert.equal(blank.mode, 'INTAKE_FORM');
      assert.equal(blank.error, null);
    });

    it('rejects an over-cap free-text answer rather than silently truncating', () => {
      const long = 'x'.repeat(101);
      const state = answerSlot('name', long);
      assert.match(state.error?.message ?? '', /I can pass on 100/);
    });

    it('rejects a sixth inspiration link', () => {
      const six = Array.from({ length: 6 }, (_, index) => `https://example.com/${index}`);
      const state = answerSlot('inspirationLinks', six);
      assert.match(state.error?.message ?? '', /5 links at most/);
    });
  });

  describe('the email-or-phone rule', () => {
    it('promotes the phone to required when the email is skipped without a number', () => {
      let state = transition(initialIntakeState(), { t: 'START_INTAKE' });
      for (const slot of ['serviceInterest', 'projectDescription', 'name'] as SlotId[]) {
        state = transition(state, { t: 'ANSWER', slot, value: VALID[slot] });
      }
      assert.equal(isRequired('phone', state), false, 'the number is optional while an email exists');

      state = transition(state, { t: 'SKIP', slot: 'email' });
      assert.equal(state.phoneRequired, true);
      assert.equal(isRequired('phone', state), true);
      assert.equal(currentSlot(state), 'phone');
    });

    it('leaves the phone optional when an email was given', () => {
      const state = fill({ phone: '' });
      assert.equal(state.phoneRequired, false);
      assert.equal(isRequired('phone', state), false);
      assert.equal(canSubmit(state), true);
    });

    it('refuses to skip the phone when there is no email either way', () => {
      let state = transition(initialIntakeState(), { t: 'START_INTAKE' });
      for (const slot of ['serviceInterest', 'projectDescription', 'name'] as SlotId[]) {
        state = transition(state, { t: 'ANSWER', slot, value: VALID[slot] });
      }
      state = transition(state, { t: 'SKIP', slot: 'email' });
      const refused = transition(state, { t: 'SKIP', slot: 'phone' });
      assert.equal(refused.mode, 'INTAKE_FORM');
      assert.match(refused.error?.message ?? '', /I need this one/);
    });

    it('sends a brief with no contact channel back to the question that can fix it', () => {
      const base = fill();
      const state = { ...base, phoneRequired: true, slots: { ...base.slots, email: '', phone: '' } };
      assert.equal(canSubmit(state), false);
      assert.equal(blockingSlot(state), 'phone', 'skipping the email promoted the number, so that is the hole');

      const blocked = transition(state, { t: 'SUBMIT', idempotencyKey: 'k1' });
      assert.equal(blocked.mode, 'INTAKE_FORM', 'the card cannot show a reason the visitor can act on; the question can');
      assert.equal(currentSlot(blocked), 'phone');
      assert.match(blocked.error?.message ?? '', /still need phone/);
      assert.equal(blocked.editing, true, 'the filled answer returns to the card rather than walking the tail');

      const answered = transition(blocked, { t: 'ANSWER', slot: 'phone', value: VALID.phone });
      assert.equal(answered.mode, 'REVIEW');
      assert.equal(canSubmit(answered), true);
    });

    it('names the first unanswered required slot as the blocker', () => {
      const state = transition(initialIntakeState(), { t: 'START_INTAKE' });
      assert.equal(blockingSlot(state), 'serviceInterest');
      assert.equal(blockingSlot(fill()), null);
    });

    it('sends when either channel is present', () => {
      assert.equal(canSubmit(fill({ email: '' })), true);
      assert.equal(canSubmit(fill({ phone: '' })), true);
    });
  });

  describe('skipping', () => {
    it('refuses to skip a required slot and stays on the question', () => {
      const state = transition(initialIntakeState(), { t: 'START_INTAKE' });
      const refused = transition(state, { t: 'SKIP', slot: 'serviceInterest' });
      assert.equal(refused.mode, 'INTAKE_FORM');
      assert.equal(currentSlot(refused), 'serviceInterest');
      assert.ok(refused.error);
    });

    it('records an empty value for a skipped optional slot', () => {
      const state = answerSlot('projectName', '');
      assert.equal(state.mode, 'INTAKE_FORM');
      assert.equal(state.error, null);
    });

    it('refuses to skip outside the form', () => {
      const reviewed = fill();
      assert.deepEqual(transition(reviewed, { t: 'SKIP', slot: 'extraNotes' }), reviewed);
    });
  });

  describe('reading a bare yes or no', () => {
    // The exact matcher cannot see these. "Are you an agency?" offers `No, I'm not an agency`, and a
    // visitor who types `no` has answered the question, not declined it.
    it('files the denial the visitor actually made', () => {
      const matched = polarityMatch('no', slotOptions(SLOTS.agencyStatus, EMPTY));
      assert.deepEqual(matched, { kind: 'match', value: INTAKE_AGENCY_STATUS_OPTIONS[2] });
    });

    it('is case and punctuation indifferent, because a phone keyboard is', () => {
      assert.deepEqual(polarityMatch('NO', slotOptions(SLOTS.agencyStatus, EMPTY)), {
        kind: 'match',
        value: INTAKE_AGENCY_STATUS_OPTIONS[2],
      });
    });

    it('refuses to choose between two yeses it cannot tell apart', () => {
      // Both members begin with "Yes"; picking one would file a preference about agency services that
      // the visitor never stated, which is the mistake the closed set exists to prevent.
      const ambiguous = polarityMatch('yes', slotOptions(SLOTS.agencyStatus, EMPTY));
      assert.equal(ambiguous?.kind, 'ambiguous');
      assert.equal(ambiguous?.kind === 'ambiguous' ? ambiguous.values.length : 0, 2);
    });

    it('declines to invent a yes or no where the set has neither', () => {
      // A bare "no" against a set that does not mean it is the visitor declining the question, which is
      // what the skip path already does. Returning a value here would file nonsense in the CRM.
      assert.equal(polarityMatch('no', slotOptions(SLOTS.language, EMPTY)), null);
      assert.equal(polarityMatch('maybe', slotOptions(SLOTS.agencyStatus, EMPTY)), null);
    });

    it('agrees with the exact match where the option is the bare word', () => {
      // The showcase set literally is ["Yes", "No"], so the existing exact path already files it. This
      // pins that the polarity reading reaches the same value rather than a third one, so the two rules
      // cannot disagree about what "no" means on a question that offers yes and no.
      assert.deepEqual(polarityMatch('no', slotOptions(SLOTS.showcasePermission, EMPTY)), {
        kind: 'match',
        value: INTAKE_SHOWCASE_CHOICES[1],
      });
    });
  });

  describe('editing an answer already given', () => {
    it('jumps to the named slot and returns to the card after one answer', () => {
      const reviewed = fill();
      const editing = transition(reviewed, { t: 'EDIT_SLOT', slot: 'name' });
      assert.equal(editing.mode, 'INTAKE_FORM');
      assert.equal(editing.editing, true);
      assert.equal(currentSlot(editing), 'name');

      const done = transition(editing, { t: 'ANSWER', slot: 'name', value: 'Asha Menon-Khan' });
      assert.equal(done.mode, 'REVIEW', 'one edit must not restart the tail');
      assert.equal(done.slots.name, 'Asha Menon-Khan');
      assert.equal(done.editing, false);
    });

    it('ignores an edit for a slot the pod does not collect', () => {
      const reviewed = fill();
      const bogus = transition(reviewed, { t: 'EDIT_SLOT', slot: 'budget' as SlotId });
      assert.deepEqual(bogus, reviewed, 'a stray slot name must not move the card');
    });

    it('refuses an edit for the question that is already on screen', () => {
      const mid = toSlot('name');
      assert.deepEqual(transition(mid, { t: 'EDIT_SLOT', slot: 'name' }), mid, 're-asking the live question must not start an edit');
    });

    it('walks back to the question it interrupted rather than to the card', () => {
      // The whole point of allowing an edit mid-form: a visitor who spots a wrong answer two questions
      // back must land on the question they were answering, not on a review card for a brief that is
      // half empty. Returning to the card there is the defect, not the remedy.
      const mid = toSlot('projectName');
      assert.equal(mid.mode, 'INTAKE_FORM');
      const editing = transition(mid, { t: 'EDIT_SLOT', slot: 'timeline' });
      assert.equal(editing.mode, 'INTAKE_FORM');
      assert.equal(editing.editing, true);
      assert.equal(currentSlot(editing), 'timeline');
      assert.equal(editing.editReturn, SLOT_ORDER.indexOf('projectName'));

      const answered = transition(editing, { t: 'ANSWER', slot: 'timeline', value: INTAKE_TIMELINE_OPTIONS[2].value });
      assert.equal(answered.mode, 'INTAKE_FORM', 'a mid-form edit must not open the review card');
      assert.equal(currentSlot(answered), 'projectName', 'and must return to the question that was interrupted');
      assert.equal(answered.editing, false);
      assert.equal(answered.editReturn, null);
      assert.equal(answered.slots.timeline, INTAKE_TIMELINE_OPTIONS[2].value);
    });

    it('keeps the return point across the categories detour', () => {
      // Editing the disciplines invalidates the services underneath them, so the machine routes through
      // `services` before honouring the edit. The return point has to survive that hop.
      const mid = toSlot('name');
      const editing = transition(mid, { t: 'EDIT_SLOT', slot: 'categories' });
      assert.equal(currentSlot(editing), 'categories');
      assert.equal(editing.editReturn, SLOT_ORDER.indexOf('name'));

      const repicked = transition(editing, { t: 'ANSWER', slot: 'categories', value: [CATEGORY] });
      assert.equal(currentSlot(repicked), 'services', 'the disciplines changed, so the services under them are asked again');
      assert.equal(repicked.editReturn, SLOT_ORDER.indexOf('name'), 'still owing the visitor the question they left');

      const reservices = transition(repicked, { t: 'ANSWER', slot: 'services', value: [SERVICE] });
      assert.equal(currentSlot(reservices), 'name');
      assert.equal(reservices.mode, 'INTAKE_FORM');
    });
  });

  describe('the optional tail', () => {
    it('offers review before optional details and enters them only on request', () => {
      let state = transition(initialIntakeState(), { t: 'START_INTAKE' });
      const required = SLOT_ORDER.slice(0, OPTIONAL_TAIL_START) as SlotId[];
      for (const slot of required) state = transition(state, { t: 'ANSWER', slot, value: VALID[slot] });
      assert.equal(state.mode, 'REVIEW');
      state = transition(state, { t: 'ADD_DETAILS' });
      assert.equal(state.slotIndex, OPTIONAL_TAIL_START);
      assert.equal(SLOTS[currentSlot(state)].required, false);
    });

    it('completes with only the required answers', () => {
      let state = transition(initialIntakeState(), { t: 'START_INTAKE' });
      for (const slot of SLOT_ORDER) {
        state = SLOTS[slot].required || slot === 'email'
          ? transition(state, { t: 'ANSWER', slot, value: VALID[slot] })
          : transition(state, { t: 'SKIP', slot });
      }
      assert.equal(state.mode, 'REVIEW');
      assert.equal(canSubmit(state), true);
    });
  });

  describe('submitting', () => {
    it('keeps one idempotency key across a retry after a transport failure', () => {
      const submitting = transition(fill(), { t: 'SUBMIT', idempotencyKey: 'key-one' });
      assert.equal(submitting.idempotencyKey, 'key-one');

      const failed = transition(submitting, { t: 'SUBMIT_FAIL', status: 500, message: 'Try again' });
      assert.equal(failed.mode, 'ERROR');
      assert.equal(failed.attempt, 1);

      const retried = transition(failed, { t: 'RETRY', idempotencyKey: 'key-two' });
      assert.equal(retried.idempotencyKey, 'key-one', 'a retry under a new key would fork the lead');
      assert.equal(retried.mode, 'SUBMITTING');
    });

    it('keeps the one key through every retry and stops after the third failure', () => {
      let state = transition(fill(), { t: 'SUBMIT', idempotencyKey: 'key-one' });
      for (let round = 1; round <= MAX_SUBMIT_ATTEMPTS; round += 1) {
        state = transition(state, { t: 'SUBMIT_FAIL', status: 503, message: 'Unavailable' });
        assert.equal(state.attempt, round);
        if (round < MAX_SUBMIT_ATTEMPTS) state = transition(state, { t: 'RETRY', idempotencyKey: 'key-offer' });
        assert.equal(state.idempotencyKey, 'key-one', 'a second key for one brief forks it into two CRM rows');
      }

      const refused = transition(state, { t: 'RETRY', idempotencyKey: 'key-offer' });
      assert.equal(refused, state, 'the machine refuses a fourth send, not only the chip row');
      assert.equal(transition(state, { t: 'SUBMIT', idempotencyKey: 'key-offer' }), state);
    });

    it('refuses a second send while one is in flight', () => {
      const submitting = transition(fill(), { t: 'SUBMIT', idempotencyKey: 'key-one' });
      const again = transition(submitting, { t: 'SUBMIT', idempotencyKey: 'key-two' });
      assert.equal(again, submitting);
    });

    it('refuses to send from the questions or from chat', () => {
      const asking = transition(initialIntakeState(), { t: 'START_INTAKE' });
      assert.deepEqual(transition(asking, { t: 'SUBMIT', idempotencyKey: 'k' }), asking);
      assert.deepEqual(transition(initialIntakeState(), { t: 'SUBMIT', idempotencyKey: 'k' }), initialIntakeState());
    });

    it('refuses to retry outside the error state', () => {
      const reviewed = fill();
      assert.deepEqual(transition(reviewed, { t: 'RETRY', idempotencyKey: 'k' }), reviewed);
    });

    it('clears the answers on a successful send and keeps where the reply goes', () => {
      const submitting = transition(fill(), { t: 'SUBMIT', idempotencyKey: 'key-one' });
      const done = transition(submitting, { t: 'SUBMIT_OK' });
      assert.equal(done.mode, 'DONE');
      assert.equal(done.slots.name, '');
      assert.equal(done.idempotencyKey, null, 'the next brief is a new submission intent');
      // The success line is the visitor's receipt for the send, so the channel has to be captured on
      // the turn that clears the answers it came from, not read back afterwards.
      assert.equal(done.sentTo, VALID.email);
    });

    it('reports the number as the channel when the email was declined', () => {
      const submitting = transition(fill({ email: '' }), { t: 'SUBMIT', idempotencyKey: 'k' });
      assert.equal(transition(submitting, { t: 'SUBMIT_OK' }).sentTo, VALID.phone);
    });

    it('refuses to leave intake while a request is in flight', () => {
      const submitting = transition(fill(), { t: 'SUBMIT', idempotencyKey: 'k' });
      // The request is owned by an effect keyed on the mode: changing it mid-flight drops the response
      // and leaves the visitor holding a lead the studio may already have.
      assert.deepEqual(transition(submitting, { t: 'EXIT_TO_CHAT' }), submitting);
      assert.deepEqual(transition(submitting, { t: 'RESET' }), submitting);
    });

    it('keeps the answers when the questions stop and drops them only on reset', () => {
      const stopped = transition(fill(), { t: 'EXIT_TO_CHAT' });
      assert.equal(stopped.mode, 'CHAT');
      assert.equal(stopped.slots.name, VALID.name, '"stop asking" is not "throw my answers away"');
      assert.equal(transition(stopped, { t: 'RESET' }).slots.name, '');
    });
  });

  describe('restoring a draft', () => {
    const partial = { name: 'Asha Menon', email: 'asha@studio.example', projectName: 'Desert Bloom' };

    it('resumes on the first question that has no answer', () => {
      const restored = transition(initialIntakeState(), { t: 'RESTORE_DRAFT', slots: partial });
      assert.equal(restored.mode, 'CHAT', 'a restored brief waits for the visitor to ask for it');
      assert.equal(restored.slots.name, 'Asha Menon');
      // The walk restarts at the disciplines, not at the tail: three answers recovered from storage are
      // still missing the two that route the lead, and a gap before them would go unfilled forever.
      assert.equal(restored.slotIndex, 0);
      assert.deepEqual(restored.touched, ['name', 'email', 'projectName']);
      assert.equal(restored.phoneRequired, false, 'an email on file keeps the number optional');
    });

    it('promotes the number when the stored brief has no email', () => {
      const restored = transition(initialIntakeState(), { t: 'RESTORE_DRAFT', slots: { name: 'Asha Menon' } });
      assert.equal(restored.phoneRequired, true);
      assert.equal(restored.slotIndex, 0);
    });

    it('starts asking at the gap and opens the card when there is none', () => {
      const resumed = transition(transition(initialIntakeState(), { t: 'RESTORE_DRAFT', slots: partial }), { t: 'START_INTAKE' });
      assert.equal(resumed.mode, 'INTAKE_FORM');
      assert.equal(currentSlot(resumed), 'serviceInterest');

      const complete = transition(transition(initialIntakeState(), { t: 'RESTORE_DRAFT', slots: VALID }), { t: 'START_INTAKE' });
      assert.equal(complete.mode, 'REVIEW', 'a brief with every answer is not re-asked from the last gap');
    });

    it('drops keys and values it does not collect', () => {
      const restored = transition(initialIntakeState(), {
        t: 'RESTORE_DRAFT',
        slots: { name: { first: 'Asha' }, categories: ['Logo & identity', 7, null], budget: '40k', services: null } as never,
      });
      assert.equal(restored.slots.name, '', 'an object is not an answer, and String() would file a shape');
      assert.deepEqual(restored.slots.categories, ['Logo & identity']);
      assert.deepEqual(restored.slots.services, [], 'a null list slot stays the empty list the slot began as');
      assert.equal('budget' in restored.slots, false);
    });

    it('refuses a restore once the visitor is already talking', () => {
      const asking = transition(initialIntakeState(), { t: 'START_INTAKE' });
      assert.deepEqual(transition(asking, { t: 'RESTORE_DRAFT', slots: partial }), asking);
    });
  });

  describe('failure routing', () => {
    it('sends a validation refusal back to the one question that failed', () => {
      const submitting = transition(fill(), { t: 'SUBMIT', idempotencyKey: 'k' });
      const failed = transition(submitting, { t: 'SUBMIT_FAIL', status: 422, message: 'That email did not work.', slot: 'email' });
      assert.equal(failed.mode, 'INTAKE_FORM');
      assert.equal(currentSlot(failed), 'email');
      assert.equal(failed.error?.message, 'That email did not work.');
      assert.equal(failed.editing, true, 'the corrected answer returns to the card');
    });

    it('keeps the visit on the error state for a transport failure with no named field', () => {
      const submitting = transition(fill(), { t: 'SUBMIT', idempotencyKey: 'k' });
      const failed = transition(submitting, { t: 'SUBMIT_FAIL', status: 429, message: 'Slow down' });
      assert.equal(failed.mode, 'ERROR');
      assert.equal(failed.slots.name, VALID.name, 'a rate limit must not cost the visitor their answers');
    });

    it('re-asks the current question when a field name is not one the pod collects', () => {
      const submitting = transition(fill(), { t: 'SUBMIT', idempotencyKey: 'k' });
      const failed = transition(submitting, { t: 'SUBMIT_FAIL', status: 422, message: 'Odd', slot: 'budget' as SlotId });
      assert.equal(failed.mode, 'INTAKE_FORM');
      assert.equal(failed.error?.message, 'Odd');
      assert.equal(failed.slotIndex, SLOT_ORDER.length - 1, 'stays on the slot it was on rather than jumping');
    });

    it('uses the error state when a refusal names no field at all', () => {
      const submitting = transition(fill(), { t: 'SUBMIT', idempotencyKey: 'k' });
      const failed = transition(submitting, { t: 'SUBMIT_FAIL', status: 422, message: 'The brief was not accepted' });
      assert.equal(failed.mode, 'ERROR');
    });
  });
});
