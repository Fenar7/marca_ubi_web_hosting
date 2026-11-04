/**
 * @file chatpod-conversation-state.test.ts
 * @description The reference layer: what a follow-up may point at, and what it must never steal. The
 *              matcher tests prove a first question is scored correctly; these prove the second one is
 *              read correctly, which is the half of "intelligent" a stateless resolver cannot have.
 *              The narrow acceptance set matters more than the wide one: a false positive here answers
 *              an unrelated question by tapping whatever chip happened to be on screen, so every case
 *              that must return `null` is pinned beside the ones that must resolve.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { BANNED_TERMS } from '@/app/chat-pod/knowledge/corpus';
import { exhausted, followUp, handOver, record } from '@/app/chat-pod/engine/context';
import type { Chip, Reply } from '@/app/chat-pod/types';

const INTENT_CHIP: Chip = { label: 'Brand identity', action: { kind: 'intent', id: 'services.detail.integrated-creativity' } };
const ROUTE_CHIP: Chip = { label: 'Public Relations (PR)', action: { kind: 'route', href: '/services/public-relations-pr' } };
const INTAKE_CHIP: Chip = { label: 'Start a project', action: { kind: 'intake' } };

function stateFor(chips: Chip[], intentId: string | null = null) {
  return record(intentId, { blocks: [{ t: 'p', text: 'An answer.' }], chips });
}

function prose(reply: Reply): string {
  return reply.blocks
    .map((block) => (block.t === 'p' ? block.text : ''))
    .join(' ');
}

/** Every string this layer can put in a bubble, so the house rules can be asserted over all of them. */
function allTurnCopy(): string[] {
  const asked = stateFor([INTENT_CHIP, ROUTE_CHIP], null);
  const answered = stateFor([INTENT_CHIP, ROUTE_CHIP], 'services.overview');
  const empty = record(null, { blocks: [], chips: [] });
  const refusals: [ReturnType<typeof stateFor>, string][] = [
    [asked, 'tell me more'],
    [answered, 'tell me more'],
    [empty, 'the second one'],
    [asked, 'the ninth one'],
  ];
  const said = refusals
    .map(([state, phrase]) => followUp(phrase, state))
    .filter((result): result is { kind: 'refused'; reply: Reply } => result?.kind === 'refused')
    .map((result) => prose(result.reply));
  // The `answered` case above expands rather than refuses, so it belongs in the list by right of the
  // depth contract, and asserting its count is what keeps this helper from silently testing nothing.
  assert.equal(said.length, 3, 'a refusal stopped refusing, so the banned-term sweep lost a sample');
  return [...said, prose(exhausted(answered.chips)), prose(handOver(ROUTE_CHIP))];
}

describe('Chat Pod follow-up resolution (context)', () => {
  it('expands the subject of the last answer when asked to go further', () => {
    const state = stateFor([INTENT_CHIP, ROUTE_CHIP], 'services.overview');
    for (const phrase of ['tell me more', 'more', 'go on', 'elaborate', 'details', 'deep dive']) {
      const result = followUp(phrase, state);
      assert.ok(result, `"${phrase}" was not read as a follow-up`);
      assert.equal(result!.kind, 'depth', `"${phrase}" did not request the deeper answer`);
      assert.equal(result!.kind === 'depth' ? result!.ctx.expanded : false, true);
      assert.equal(result!.kind === 'depth' ? result!.intentId : '', 'services.overview');
    }
  });

  it('refuses to expand a turn that answered nothing', () => {
    // A disambiguation put candidates on screen but claimed no subject, so "tell me more" has no
    // answer of the pod's to take further. It must say so instead of re-ranking the corpus.
    const state = record(null, { blocks: [{ t: 'p', text: 'Which one?' }], chips: [INTENT_CHIP, ROUTE_CHIP] });
    const result = followUp('tell me more', state);
    assert.equal(result!.kind, 'refused');
  });

  it('counts chips in the order the visitor reads them', () => {
    const state = stateFor([INTENT_CHIP, ROUTE_CHIP, INTAKE_CHIP], 'services.overview');
    const picks: [string, Chip][] = [
      ['the first one', INTENT_CHIP],
      ['second', ROUTE_CHIP],
      ['the third one', INTAKE_CHIP],
      ['3', INTAKE_CHIP],
      ['option 2', ROUTE_CHIP],
      ['i pick the second', ROUTE_CHIP],
      ['1st', INTENT_CHIP],
      ['the 2nd', ROUTE_CHIP],
      // A visitor counting chips on a phone types the suffix, and "2nd" alongside the pronoun "one" used
      // to score as two numerals, which is not a selection: the message fell through to the matcher and
      // came back as an unrecognised question rather than a chip.
      ['the 2nd one', ROUTE_CHIP],
      ['pick 3rd', INTAKE_CHIP],
    ];
    for (const [phrase, expected] of picks) {
      const result = followUp(phrase, state);
      assert.equal(result!.kind, 'chip', `"${phrase}" did not select a chip`);
      assert.deepEqual(result!.kind === 'chip' ? result!.chip : null, expected, `"${phrase}" picked the wrong chip`);
    }
  });

  it('counts past the end honestly, and hands the same list back', () => {
    const state = stateFor([INTENT_CHIP, ROUTE_CHIP], 'services.overview');
    // Both spellings of the same mistake: the ceiling is ten options, so 9 and "ninth" are inside the
    // vocabulary and simply off the end of the list the visitor is looking at.
    for (const phrase of ['the ninth one', 'the 9th one']) {
      const result = followUp(phrase, state);
      assert.equal(result!.kind, 'refused', `"${phrase}" must be the size of the list, not a guess`);
      if (result!.kind !== 'refused') return;
      assert.equal(result!.reply.chips.length, 2, 'the correction must re-offer what is on screen');
    }
  });

  it('names a chip instead of counting it, brackets and case aside', () => {
    const state = stateFor([INTENT_CHIP, ROUTE_CHIP], 'services.overview');
    for (const phrase of ['brand identity', 'Brand Identity', 'public relations (pr)', 'PUBLIC RELATIONS PR']) {
      const result = followUp(phrase, state);
      assert.equal(result!.kind, 'chip', `"${phrase}" did not match the chip on screen`);
    }
  });

  it('treats a numeral inside a sentence as a quantity, not a selection', () => {
    const state = stateFor([INTENT_CHIP, ROUTE_CHIP, INTAKE_CHIP], 'services.overview');
    // Each of these contains a number, and none of them is choosing from the list. Answering them by
    // tapping a chip would be the pod putting words in the visitor's mouth.
    for (const phrase of ['can we do one thing', 'i need 3 pages', 'how much for two campaigns', 'what is the weather']) {
      assert.equal(followUp(phrase, state), null, `"${phrase}" must go to the matcher`);
    }
  });

  it('leaves authored phrases alone, so an idiom cannot eat a topic', () => {
    const state = stateFor([INTENT_CHIP, ROUTE_CHIP], 'services.overview');
    // "more roles" and "more about services" are real questions the corpus answers. The engine asks this
    // layer only after the dictionary has declined the phrase, and these are the phrases that prove the
    // set is closed rather than a prefix test on the word "more".
    for (const phrase of ['more roles', 'more about services', 'tell me about your services', 'contact us']) {
      assert.equal(followUp(phrase, state), null, `"${phrase}" must stay a question`);
    }
  });

  it('returns nothing for a turn with no chips, rather than inventing a choice', () => {
    const empty = record(null, { blocks: [], chips: [] });
    assert.equal(followUp('brand identity', empty), null);
    assert.equal(followUp('the second one', empty)!.kind, 'refused');
    assert.equal(followUp('tell me more', empty)!.kind, 'refused');
    assert.equal(followUp('', empty), null);
    assert.equal(followUp('   ', empty), null);
  });

  it('does not read a whole sentence as a chip label', () => {
    const state = stateFor([INTENT_CHIP, ROUTE_CHIP], 'services.overview');
    const long = 'brand identity for a company that sells coffee in kerala';
    assert.equal(followUp(long, state), null, 'a long message is a question, not a tap');
    assert.equal(followUp('ok', state), null, 'two characters is not a name');
  });

  it('re-offers the control when the selection is a page or the brief', () => {
    const state = stateFor([INTENT_CHIP, ROUTE_CHIP], 'services.overview');
    const result = followUp('the second one', state);
    assert.equal(result!.kind, 'chip');
    if (result!.kind !== 'chip') return;
    const reply = handOver(result!.chip);
    assert.equal(reply.chips.length, 1);
    assert.deepEqual(reply.chips[0].action, ROUTE_CHIP.action);
    assert.ok(prose(reply).length > 0, 'the hand-off has to say what it is handing over');
  });

  it('re-attaches the live chips when an answer has run out of detail', () => {
    const state = stateFor([INTENT_CHIP, ROUTE_CHIP], 'services.overview');
    const reply = exhausted(state.chips);
    assert.equal(reply.chips.length, 2, 'the deeper version is still the chip the visitor can use');
    assert.match(prose(reply), /publish/i);
  });

  it('keeps its own copy to the house rules', () => {
    for (const text of allTurnCopy()) {
      assert.ok(text.length > 0, 'a turn of state must say something to the visitor');
      assert.ok(!/—/.test(text), 'shipped copy uses no em dash');
      assert.ok(!/[a-z]ize[a-z ]/.test(text), 'the house spells in -ise');
      for (const banned of BANNED_TERMS) {
        assert.ok(!text.toLowerCase().includes(banned.toLowerCase()), `banned term "${banned}" in turn copy`);
      }
    }
  });

  it('records the fingerprint of what was rendered, not of what was configured', () => {
    const reply: Reply = { blocks: [{ t: 'p', text: 'Six lines of work.' }], chips: [INTENT_CHIP] };
    const state = record('services.overview', reply);
    assert.equal(state.intentId, 'services.overview');
    assert.equal(state.fingerprint, JSON.stringify(reply.blocks));
    assert.notEqual(state.fingerprint, JSON.stringify([{ t: 'p', text: 'Six lines of work' }]));
  });
});
