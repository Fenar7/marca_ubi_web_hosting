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
  INTENT_DISCOUNTS,
  buildIndex,
  decide,
  intentPrior,
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
    // Corpus side = (1 + 0.6) / (1 + 0.6 + 0.6); query side is 1 because the two words are the whole
    // question, and the tier score is the geometric mean of the two.
    const both = rank(index, 'pricing cost')[0].score;
    assert.ok(Math.abs(both - Math.sqrt(1.6 / 2.2)) < 1e-9, `expected sqrt(1.6/2.2), got ${both}`);
    const all = rank(index, 'pricing cost rates')[0].score;
    assert.ok(Math.abs(all - 1) < 1e-9, `expected 1, got ${all}`);
  });

  it('will not let one authored keyword answer a question that is mostly about something else', () => {
    const { index } = buildIndex([intent('services.overview', ['services'], ['services'])]);
    const score = rank(index, 'what services and pricing do you offer for a rebrand')[0].score;
    assert.ok(score < ACCEPT_THRESHOLD, `one word in five scored ${score}`);
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

/**
 * The arithmetic the owner's complaints turned on: a sentence that asks politely about a published
 * subject used to land at 0.65-0.76 and get three chips instead of an answer, and a small-talk or
 * journal intent used to outvote the thing the visitor actually named. Both are pinned here as
 * numbers, not as vibes, because the difference between answering and asking is two hundredths.
 */
describe('Chat Pod coverage and family discount', () => {
  it('publishes the family discount table the scoring is built on', () => {
    assert.deepEqual(INTENT_DISCOUNTS, {
      'faq.': 0.9,
      'smalltalk.': 0.82,
      'work.journal.topic.': 0.88,
    });
  });

  it('answers a services question that carries scaffolding and an extra word', () => {
    const { index } = buildIndex([
      intent('services.overview', ['services', 'what are your services', 'service list'], ['services', 'offer']),
      intent('services.whichone', ['which service is right for me'], ['service', 'need', 'choose']),
    ]);
    for (const phrase of ['what is the services', 'what are the services', 'tell me about your services', 'list of services']) {
      const outcome = resolve(index, phrase, { locked: false });
      assert.equal(outcome.kind, 'answer', `"${phrase}" got ${outcome.kind}`);
      assert.equal(outcome.kind === 'answer' ? outcome.intent.id : '', 'services.overview', `"${phrase}"`);
    }
  });

  it('asks rather than picks when one word is an authored alias of two intents', () => {
    const { index } = buildIndex([
      intent('services.overview', ['services'], ['services', 'offer']),
      intent('services.whichone', ['service', 'which service'], ['service', 'need']),
    ]);
    // Both intents authored the bare word, so the short-circuit is off and neither has evidence the
    // other lacks. The published margin rule sends that to chips; the fix for a tie like this is
    // authoring, not a threshold, and this is the test that says so out loud.
    assert.equal(resolve(index, 'service', { locked: false }).kind, 'disambiguate');
  });

  it('charges a query for every topic word in it, so a long question about two subjects asks', () => {
    const { index } = buildIndex([
      intent('pricing', ['how much do you charge'], ['pricing', 'cost']),
      intent('services.overview', ['services'], ['services']),
    ]);
    const ranked = rank(index, 'what services and pricing do you offer for a rebrand');
    const leader = ranked[0];
    assert.ok(leader.score < ACCEPT_THRESHOLD, `a mixed-subject sentence scored ${leader.score}`);
  });

  it('discounts the small-talk family so it cannot outvote the subject named', () => {
    const { index } = buildIndex([
      intent('smalltalk.areyouhuman', ['what are you', 'are you a person'], ['are', 'you']),
      intent('services.overview', ['what are the services'], ['services', 'service']),
    ]);
    const outcome = resolve(index, 'what are the services', { locked: false });
    assert.equal(outcome.kind === 'answer' ? outcome.intent.id : outcome.kind, 'services.overview');
  });

  it('keeps a discounted intent reachable by its own words', () => {
    const { index } = buildIndex([
      intent('smalltalk.areyouhuman', ['are you a bot'], ['bot']),
      intent('services.overview', ['services'], ['services']),
    ]);
    const outcome = resolve(index, 'are you a bot', { locked: false });
    assert.equal(outcome.kind === 'answer' ? outcome.intent.id : outcome.kind, 'smalltalk.areyouhuman');
  });

  it('applies the longest matching prefix and nothing else', () => {
    assert.equal(intentPrior('faq.3'), INTENT_DISCOUNTS['faq.']);
    assert.equal(intentPrior('work.journal.topic.Brand Strategy'), INTENT_DISCOUNTS['work.journal.topic.']);
    assert.equal(intentPrior('work.journal'), 1);
    assert.equal(intentPrior('services.detail.digital-performance'), 1);
    assert.equal(intentPrior('smalltalk.areyouhuman'), INTENT_DISCOUNTS['smalltalk.']);
  });

  it('never discounts an intent below the floor by accident, only by arithmetic', () => {
    for (const [prefix, factor] of Object.entries(INTENT_DISCOUNTS)) {
      assert.ok(factor > 0.8 && factor < 1, `${prefix} discount ${factor} is outside the designed band`);
    }
  });

  it('does not answer an out-of-domain question because one place name in it is published', () => {
    const { index } = buildIndex([intent('location', ['where are you', 'calicut'], ['office', 'address'])]);
    const outcome = resolve(index, 'what is the weather in calicut', { locked: false });
    assert.notEqual(outcome.kind, 'answer', 'a city in a question about the weather is not a location answer');
  });

  it('answers one word with the intent that authored exactly that word', () => {
    const { index } = buildIndex([
      intent('services.overview', ['services'], ['services']),
      intent('services.b2b', ['b2b services'], ['b2b']),
    ]);
    assert.equal(resolve(index, 'services', { locked: false }).kind, 'answer');
  });

  it('offers every owner of a contested name rather than the one authored first', () => {
    const { index, duplicates } = buildIndex([
      intent('services.detail.public-relations-pr', ['public relations (pr)', 'corporate pr'], ['pr']),
      intent('services.detail.public-relations', ['public relations (pr)', 'consumer pr'], ['pr']),
    ]);
    assert.deepEqual(duplicates, ['public relations pr (services.detail.public-relations-pr | services.detail.public-relations)']);
    const outcome = resolve(index, 'public relations (PR)', { locked: false });
    assert.equal(outcome.kind, 'disambiguate', 'a title two published lines share must be chosen, not assumed');
    const ids = outcome.kind === 'disambiguate' ? outcome.candidates.map((entry) => entry.intent.id).sort() : [];
    assert.deepEqual(ids, ['services.detail.public-relations', 'services.detail.public-relations-pr']);
    assert.ok(
      outcome.kind === 'disambiguate' && outcome.candidates.every((entry) => entry.tier === 1),
      'contested names are authored decisions, so they arrive on tier 1, not by scoring',
    );
  });

  it('keeps a contested one-word alias out of the short-circuit', () => {
    const { index } = buildIndex([
      intent('alpha', ['press'], ['media']),
      intent('beta', ['press'], ['journalism']),
    ]);
    const outcome = resolve(index, 'press', { locked: false });
    assert.equal(outcome.kind, 'disambiguate');
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
