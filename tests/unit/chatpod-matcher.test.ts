/**
 * @file chatpod-matcher.test.ts
 * @description Boundary and policy tests for the three-tier resolver. The `decide` cases pin every
 *              published threshold exactly (0.80 accept, 0.15 margin, 0.55 floor) because the
 *              acceptance criteria quote those numbers, and a drift of a few points is invisible in
 *              manual testing but changes whether the pod guesses or asks.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type { Intent, Reply } from '@/app/chat-pod/types';
import {
  ACCEPT_MARGIN,
  ACCEPT_THRESHOLD,
  ALWAYS_RESOLVABLE,
  DISAMBIGUATION_WIDTH,
  FLOOR_THRESHOLD,
  buildIndex,
  decide,
  rank,
  resolve,
  type Candidate,
} from '@/app/chat-pod/engine/match';

const EMPTY_REPLY: Reply = { blocks: [], chips: [] };

function intent(id: string, utterances: string[] = [], keywords: string[] = []): Intent {
  return { id, label: id, source: 'test-fixture', utterances, keywords, respond: () => EMPTY_REPLY };
}

function candidate(id: string, score: number): Candidate {
  return { intent: intent(id), score, tier: 2 };
}

describe('Chat Pod resolver policy (decide)', () => {
  it('publishes the thresholds the acceptance criteria name', () => {
    assert.equal(ACCEPT_THRESHOLD, 0.8);
    assert.equal(ACCEPT_MARGIN, 0.15);
    assert.equal(FLOOR_THRESHOLD, 0.55);
    assert.equal(DISAMBIGUATION_WIDTH, 3);
  });

  it('falls back with no candidates at all', () => {
    assert.deepEqual(decide([]), { kind: 'fallback', candidates: [] });
  });

  it('answers an uncontested leader at the accept threshold', () => {
    const outcome = decide([candidate('only', ACCEPT_THRESHOLD)]);
    assert.equal(outcome.kind, 'answer');
  });

  it('answers at exactly the required margin', () => {
    const outcome = decide([candidate('lead', 0.8), candidate('second', 0.8 - ACCEPT_MARGIN)]);
    assert.equal(outcome.kind, 'answer');
    assert.equal(outcome.kind === 'answer' ? outcome.intent.id : '', 'lead');
  });

  it('refuses to answer when the margin is one point short', () => {
    const outcome = decide([candidate('lead', 0.8), candidate('second', 0.79)]);
    assert.equal(outcome.kind, 'disambiguate');
  });

  it('refuses to answer a perfect leader that is crowded by a 0.86 runner-up', () => {
    const outcome = decide([candidate('lead', 1), candidate('second', 0.86)]);
    assert.equal(outcome.kind, 'disambiguate');
  });

  it('disambiguates a sub-threshold leader that is still above the floor', () => {
    const outcome = decide([candidate('lead', 0.79), candidate('second', 0.1)]);
    assert.equal(outcome.kind, 'disambiguate');
  });

  it('disambiguates exactly at the floor', () => {
    const outcome = decide([candidate('lead', FLOOR_THRESHOLD)]);
    assert.equal(outcome.kind, 'disambiguate');
  });

  it('falls back one thousandth below the floor', () => {
    const outcome = decide([candidate('lead', 0.549)]);
    assert.equal(outcome.kind, 'fallback');
  });

  it('offers at most three candidates when disambiguating', () => {
    const five = [0.7, 0.68, 0.66, 0.64, 0.62].map((score, index) => candidate(`i${index}`, score));
    const outcome = decide(five);
    assert.equal(outcome.kind === 'disambiguate' ? outcome.candidates.length : 0, DISAMBIGUATION_WIDTH);
  });

  it('carries the top candidates through a fallback so the menu can still name them', () => {
    const weak = [candidate('a', 0.4), candidate('b', 0.3), candidate('c', 0.2), candidate('d', 0.1)];
    const outcome = decide(weak);
    assert.equal(outcome.kind, 'fallback');
    assert.equal(outcome.kind === 'fallback' ? outcome.candidates.length : 0, DISAMBIGUATION_WIDTH);
  });
});

describe('Chat Pod tier behaviour (rank)', () => {
  it('short-circuits on an authored alias with score 1 and tier 1, whatever else could match', () => {
    const { index } = buildIndex([
      intent('alpha', ['hello there'], ['hello']),
      intent('beta', ['general greeting words here'], ['hello', 'there']),
    ]);
    const ranked = rank(index, 'Hello   THERE');
    assert.equal(ranked.length, 1);
    assert.equal(ranked[0].intent.id, 'alpha');
    assert.equal(ranked[0].score, 1);
    assert.equal(ranked[0].tier, 1);
  });

  it('weights the first keyword at 1.0 and the rest at 0.6', () => {
    const { index } = buildIndex([intent('pricing', ['nothing to do with this'], ['pricing', 'cost', 'rates'])]);
    // total weight = 1 + 0.6 + 0.6 = 2.2
    const both = rank(index, 'pricing cost')[0].score;
    assert.ok(Math.abs(both - 1.6 / 2.2) < 1e-9, `expected 1.6/2.2, got ${both}`);
    const all = rank(index, 'pricing cost rates')[0].score;
    assert.ok(Math.abs(all - 1) < 1e-9, `expected 1, got ${all}`);
  });

  it('matches keywords on whole words only, so "art" cannot be found inside "start"', () => {
    const { index } = buildIndex([intent('illustration', ['draw something'], ['art'])]);
    assert.equal(rank(index, 'i want to start a project').length, 0);
  });

  it('returns nothing for an empty or punctuation-only message', () => {
    const { index } = buildIndex([intent('alpha', ['hello'], ['hello'])]);
    assert.deepEqual(rank(index, '   '), []);
    assert.deepEqual(rank(index, '???'), []);
  });

  it('breaks score ties by intent id so the ordering is stable across builds', () => {
    const { index } = buildIndex([intent('zeta', ['same phrase'], ['shared']), intent('alpha', ['same phrase'], ['shared'])]);
    const first = rank(index, 'shared')[0];
    assert.equal(first.intent.id, 'alpha');
    const again = rank(index, 'shared')[0];
    assert.equal(again.intent.id, 'alpha');
  });

  it('surfaces a cross-intent alias collision instead of resolving it by first write', () => {
    const { duplicates } = buildIndex([intent('alpha', ['services'], ['a']), intent('beta', ['services'], ['b'])]);
    assert.deepEqual(duplicates, ['services (alpha | beta)']);
  });

  it('does not treat a repeated alias inside one intent as a collision', () => {
    const { duplicates } = buildIndex([intent('alpha', ['hello', 'HELLO'], ['a'])]);
    assert.deepEqual(duplicates, []);
  });

  it('uses edit distance for a single-word typo against a single-word alias', () => {
    const { index } = buildIndex([intent('pricing', ['pricing'], ['fee'])]);
    const typo = rank(index, 'pricingg')[0];
    assert.equal(typo.intent.id, 'pricing');
    assert.ok(typo.score >= FLOOR_THRESHOLD, `typo scored ${typo.score}`);
  });

  it('keeps a two-word query from beating a long utterance it merely sits inside', () => {
    const { index } = buildIndex([
      intent('greeting', ['hi'], ['hi']),
      intent('services', ['what services do you offer to new clients this quarter'], ['services']),
    ]);
    const ranked = rank(index, 'hi');
    const services = ranked.find((entry) => entry.intent.id === 'services');
    assert.ok(!services || services.score < FLOOR_THRESHOLD, `services scored ${services?.score}`);
  });
});

describe('Chat Pod fallback lock', () => {
  const fixture = [
    intent('greeting', ['hi'], ['hi']),
    intent('contact', ['talk to a person'], ['contact']),
    intent('intake.trigger', ['start a project'], ['project']),
    intent('thanks', ['thanks'], ['thanks']),
    intent('goodbye', ['bye'], ['bye']),
    intent('smalltalk.areyouhuman', ['are you a bot'], ['bot']),
    intent('services.overview', ['what do you do'], ['services']),
    intent('careers.list', ['jobs'], ['jobs']),
  ];
  const { index } = buildIndex(fixture);

  it('names the escape hatch and the politeness intents as always resolvable', () => {
    assert.deepEqual(
      [...ALWAYS_RESOLVABLE].sort(),
      ['contact', 'goodbye', 'greeting', 'intake.trigger', 'smalltalk.areyouhuman', 'thanks'],
    );
  });

  it('still answers contact once locked', () => {
    const outcome = resolve(index, 'talk to a person', { locked: true });
    assert.equal(outcome.kind, 'answer');
    assert.equal(outcome.kind === 'answer' ? outcome.intent.id : '', 'contact');
  });

  it('still answers the intake trigger once locked', () => {
    const outcome = resolve(index, 'start a project', { locked: true });
    assert.equal(outcome.kind, 'answer');
    assert.equal(outcome.kind === 'answer' ? outcome.intent.id : '', 'intake.trigger');
  });

  it('still answers an exact greeting once locked', () => {
    const outcome = resolve(index, 'hi', { locked: true });
    assert.equal(outcome.kind, 'answer');
    assert.equal(outcome.kind === 'answer' ? outcome.intent.id : '', 'greeting');
  });

  it('suppresses ordinary intents once locked rather than guessing', () => {
    const outcome = resolve(index, 'what do you do', { locked: true });
    assert.equal(outcome.kind, 'fallback');
  });

  it('never lets the lock answer with a non-permitted intent', () => {
    for (const phrase of ['jobs', 'careers', 'hiring', 'pricing', 'portfolio']) {
      const outcome = resolve(index, phrase, { locked: true });
      const id = outcome.kind === 'answer' ? outcome.intent.id : null;
      assert.ok(id === null || ALWAYS_RESOLVABLE.has(id), `locked mode answered "${phrase}" with ${id}`);
    }
  });

  it('answers normally before the lock is set', () => {
    const outcome = resolve(index, 'what do you do', { locked: false });
    assert.equal(outcome.kind, 'answer');
    assert.equal(outcome.kind === 'answer' ? outcome.intent.id : '', 'services.overview');
  });
});
