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
 *              Four invariants get their own tests because they are the ones a future edit could break
 *              quietly: a required slot is never advanced past, the idempotency key survives retries and
 *              is only replaced after the third failed round, email-OR-phone mirrors the `.refine()` in
 *              `ingestLeadSchema`, and editing from the review card returns to the card.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_SUBMIT_ATTEMPTS,
  OPTIONAL_TAIL_START,
  canSubmit,
  currentSlot,
  initialIntakeState,
  isRequired,
  transition,
} from '@/app/chat-pod/intake/useIntakeFlow';
import { SLOTS, SLOT_ORDER } from '@/app/chat-pod/intake/slots';
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

/** Walk the machine with the visitor: answer every slot in ask order. */
function fill(overrides: Partial<Record<SlotId, SlotValue>> = {}): IntakeState {
  let state = transition(initialIntakeState(), { t: 'START_INTAKE' });
  for (const slot of SLOT_ORDER) {
    const value = overrides[slot] !== undefined ? overrides[slot] : VALID[slot];
    state = transition(state, { t: 'ANSWER', slot, value });
  }
  return state;
}

/** Stop on the given slot with every earlier question answered. */
function toSlot(slot: SlotId, overrides: Partial<Record<SlotId, SlotValue>> = {}): IntakeState {
  let state = transition(initialIntakeState(), { t: 'START_INTAKE' });
  for (const entry of SLOT_ORDER.slice(0, SLOT_ORDER.indexOf(slot)) as SlotId[]) {
    const value = overrides[entry] !== undefined ? overrides[entry] : VALID[entry];
    state = transition(state, { t: 'ANSWER', slot: entry, value });
  }
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
      state = transition(state, { t: 'ANSWER', slot: 'categories', value: [CATEGORY] });
      state = transition(state, { t: 'EXIT_TO_CHAT' });
      assert.equal(state.mode, 'CHAT');
      assert.deepEqual(state.slots.categories, [CATEGORY], 'answers are kept when the questions stop');

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
      for (const slot of ['categories', 'services', 'timeline', 'name'] as SlotId[]) {
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
      for (const slot of ['categories', 'services', 'timeline', 'name'] as SlotId[]) {
        state = transition(state, { t: 'ANSWER', slot, value: VALID[slot] });
      }
      state = transition(state, { t: 'SKIP', slot: 'email' });
      const refused = transition(state, { t: 'SKIP', slot: 'phone' });
      assert.equal(refused.mode, 'INTAKE_FORM');
      assert.match(refused.error?.message ?? '', /I need this one/);
    });

    it('will not send a brief with no contact channel at all', () => {
      const state = fill({ email: '', phone: '' });
      assert.equal(canSubmit(state), false);
      const blocked = transition(state, { t: 'SUBMIT', idempotencyKey: 'k1' });
      assert.equal(blocked.mode, 'REVIEW');
      assert.match(blocked.error?.message ?? '', /still missing/);
    });

    it('sends when either channel is present', () => {
      assert.equal(canSubmit(fill({ email: '' })), true);
      assert.equal(canSubmit(fill({ phone: '' })), true);
    });
  });

  describe('skipping', () => {
    it('refuses to skip a required slot and stays on the question', () => {
      const state = transition(initialIntakeState(), { t: 'START_INTAKE' });
      const refused = transition(state, { t: 'SKIP', slot: 'categories' });
      assert.equal(refused.mode, 'INTAKE_FORM');
      assert.equal(currentSlot(refused), 'categories');
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

  describe('walking back and forth', () => {
    it('moves back one question and keeps the answers', () => {
      let state = fill({ name: 'Second thought' });
      state = transition(state, { t: 'BACK' });
      assert.equal(state.mode, 'INTAKE_FORM');
      assert.equal(state.slots.name, 'Second thought');
    });

    it('will not walk forward into an unanswered required slot', () => {
      let state = transition(initialIntakeState(), { t: 'START_INTAKE' });
      state = transition(state, { t: 'ANSWER', slot: 'categories', value: [CATEGORY] });
      const stuck = transition(state, { t: 'NEXT' });
      assert.equal(stuck, state, 'NEXT onto the blank services slot is a no-op, not a skip');
    });

    it('allows forward movement over a slot that is already answered', () => {
      let state = transition(fill(), { t: 'BACK' });
      assert.equal(currentSlot(state), 'showcasePermission');
      state = transition(state, { t: 'NEXT' });
      assert.equal(currentSlot(state), 'extraNotes');
    });
  });

  describe('editing from the review card', () => {
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

    it('refuses an edit outside the review card', () => {
      const state = transition(initialIntakeState(), { t: 'START_INTAKE' });
      assert.deepEqual(transition(state, { t: 'EDIT_SLOT', slot: 'name' }), state);
    });
  });

  describe('the optional tail', () => {
    it('reaches the tail only after every required answer', () => {
      let state = transition(initialIntakeState(), { t: 'START_INTAKE' });
      const required = SLOT_ORDER.slice(0, OPTIONAL_TAIL_START) as SlotId[];
      for (const slot of required) state = transition(state, { t: 'ANSWER', slot, value: VALID[slot] });
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

    it('mints a fresh key only after the third failed round', () => {
      let state = transition(fill(), { t: 'SUBMIT', idempotencyKey: 'key-one' });
      for (let round = 1; round <= MAX_SUBMIT_ATTEMPTS; round += 1) {
        state = transition(state, { t: 'SUBMIT_FAIL', status: 503, message: 'Unavailable' });
        assert.equal(state.attempt, round);
        if (round < MAX_SUBMIT_ATTEMPTS) state = transition(state, { t: 'RETRY', idempotencyKey: `key-${round}` });
        assert.equal(state.idempotencyKey, 'key-one');
      }

      const refreshed = transition(state, { t: 'RETRY', idempotencyKey: 'key-fresh' });
      assert.equal(refreshed.idempotencyKey, 'key-fresh', 'the old key may already be recorded server-side');
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

    it('clears the answers on a successful send and marks it done', () => {
      const submitting = transition(fill(), { t: 'SUBMIT', idempotencyKey: 'key-one' });
      const done = transition(submitting, { t: 'SUBMIT_OK' });
      assert.equal(done.mode, 'DONE');
      assert.equal(done.slots.name, '');
      assert.equal(done.idempotencyKey, null, 'the next brief is a new submission intent');
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

  describe('handoff', () => {
    it('enters the handoff state and can return to the brief', () => {
      const handed = transition(fill(), { t: 'HANDOFF' });
      assert.equal(handed.mode, 'HANDOFF');
      const back = transition(handed, { t: 'START_INTAKE' });
      assert.equal(back.mode, 'INTAKE_FORM');
      assert.equal(back.slots.name, VALID.name);
    });
  });
});
