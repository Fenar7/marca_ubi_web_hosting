/**
 * @file chatpod-normalise.test.ts
 * @description Contract tests for the Chat Pod's text primitives: idempotence, the deliberate
 *              folding of separators to spaces (so Tier 2 whole-word matching still sees both halves
 *              of "account-based"), retention of the straight apostrophe (so contraction-bearing
 *              authored aliases stay reachable at Tier 1), and the asymmetry of token overlap.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  editDistance,
  editSimilarity,
  normalise,
  tokenOverlap,
  tokens,
  trigramSimilarity,
  trigrams,
} from '@/app/chat-pod/engine/normalise';

describe('Chat Pod text primitives', () => {
  describe('normalise', () => {
    it('lowercases and collapses whitespace', () => {
      assert.equal(normalise('  What   DO you   Do  '), 'what do you do');
    });

    it('is idempotent, which the intent index relies on when it re-keys authored aliases', () => {
      const once = normalise('Logo & identity — T-shirt design!');
      assert.equal(normalise(once), once);
    });

    it('folds separators to spaces rather than deleting them', () => {
      assert.equal(normalise('account-based/marketing'), 'account based marketing');
      assert.equal(normalise('Logo & identity'), 'logo identity');
    });

    it('keeps the straight apostrophe so contraction aliases resolve at Tier 1', () => {
      assert.equal(normalise("that's all"), "that's all");
      assert.equal(normalise("I'd like to chat"), "i'd like to chat");
    });

    it('folds curly and modifier apostrophes to the authored straight form', () => {
      assert.equal(normalise('let\u2019s talk'), "let's talk");
      assert.equal(normalise('that\u2019s all'), "that's all");
    });

    it('strips sentence punctuation but leaves the words intact', () => {
      assert.equal(normalise('How much does it cost?'), 'how much does it cost');
    });

    it('turns an empty or punctuation-only input into an empty string', () => {
      assert.equal(normalise(''), '');
      assert.equal(normalise('?!.'), '');
    });
  });

  describe('tokens', () => {
    it('splits an already-normalised string', () => {
      assert.deepEqual(tokens('talk to a person'), ['talk', 'to', 'a', 'person']);
    });

    it('returns nothing for an empty string', () => {
      assert.deepEqual(tokens(''), []);
    });
  });

  describe('trigrams', () => {
    it('produces grams for two-character inputs, which is why greetings score at Tier 3 at all', () => {
      assert.ok(trigrams('hi').length > 0);
    });

    it('is symmetric for identical inputs', () => {
      assert.equal(trigramSimilarity('hello', 'hello'), 1);
    });

    it('is symmetric between two different inputs', () => {
      assert.equal(trigramSimilarity('pricing', 'cost'), trigramSimilarity('cost', 'pricing'));
    });

    it('is zero when the strings share no three-character context', () => {
      assert.equal(trigramSimilarity('aaaa', 'zzzz'), 0);
    });

    it('scores closer strings higher than distant ones', () => {
      assert.ok(trigramSimilarity('logo design', 'logo designs') > trigramSimilarity('logo design', 'crm'));
    });
  });

  describe('editDistance and editSimilarity', () => {
    it('matches the published Levenshtein values', () => {
      assert.equal(editDistance('', ''), 0);
      assert.equal(editDistance('kitten', 'sitting'), 3);
      assert.equal(editDistance('flaw', 'lawn'), 2);
      assert.equal(editDistance('hi', 'hi'), 0);
    });

    it('handles empty operands as pure insertion cost', () => {
      assert.equal(editDistance('', 'abc'), 3);
      assert.equal(editDistance('abc', ''), 3);
    });

    it('returns 1 only for identical strings and 0 for maximal divergence', () => {
      assert.equal(editSimilarity('crm', 'crm'), 1);
      assert.equal(editSimilarity('crm', 'zzz'), 0);
    });

    it('defines two empty strings as identical', () => {
      assert.equal(editSimilarity('', ''), 1);
    });

    it('reads a single-character typo as a near match', () => {
      assert.ok(editSimilarity('pricing', 'pricingg') > 0.8);
    });
  });

  describe('tokenOverlap', () => {
    it('measures against the utterance, so a short query cannot win a long phrase', () => {
      const short = tokens('hi');
      const long = tokens('what do you offer in the way of services');
      assert.equal(tokenOverlap(short, long), 0);
    });

    it('rewards a query that covers the utterance', () => {
      assert.equal(tokenOverlap(tokens('talk to a person'), tokens('talk to a person')), 1);
    });

    it('is zero against an empty utterance', () => {
      assert.equal(tokenOverlap(tokens('hello'), tokens('')), 0);
    });
  });
});
