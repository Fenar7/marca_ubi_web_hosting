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
  CHAT_ABBREVIATIONS,
  editDistance,
  editSimilarity,
  isScaffold,
  looksLikeQuestion,
  normalise,
  residue,
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

  describe('isScaffold', () => {
    const known = new Set(['town', 'art', 'work', 'services', 'servic', 'pricing']);

    it('recognises an authored stop word and its chat abbreviation', () => {
      assert.equal(isScaffold('what', known), true);
      assert.equal(isScaffold('abt', known), true);
      assert.equal(isScaffold('th', known), true);
    });

    it('forgives one keystroke in a piece of grammar', () => {
      assert.equal(isScaffold('plese', known), true);
      assert.equal(isScaffold('woudl', known), true);
      assert.equal(isScaffold('thier', known), true);
    });

    it('refuses to forgive inside a short word', () => {
      // Four characters is where a one-edit guess stops being a miss and starts being another word, so
      // "wtih" is charged to the visitor as a topic rather than deleted as grammar. The cost is one
      // lower score for a typo in a four-letter word; the alternative is every short subject noun
      // ("art", "work", "team") competing with the grammar it is one edit from.
      assert.equal(isScaffold('wtih', known), false);
      assert.equal(isScaffold('thsi', known), false);
    });

    it('never reads a word the corpus uses as a typo of grammar', () => {
      // "town" is one edit from the stop word "down". Without the `known` guard a published subject
      // noun would be deleted from the denominator, which is how an intent stops being findable.
      assert.equal(isScaffold('town', known), false);
      assert.equal(isScaffold('art', known), false);
    });

    it('leaves a short word alone, because a three-letter miss is not resolvable', () => {
      assert.equal(isScaffold('ser', known), false);
    });
  });

  describe('residue', () => {
    const known = new Set(['services', 'servic', 'work', 'pricing', 'calicut']);

    it('reduces a polite sentence to the word the visitor is asking about', () => {
      assert.deepEqual(residue('ok can you plese tell me abt th services', known), ['servic']);
    });

    it('keeps a word the corpus has never published, because it is evidence of no coverage', () => {
      // The measure that made "what is the weather in calicut" a location answer charged nothing for
      // "weather". An unseen word has to stay in the denominator and in the spelling guard.
      assert.deepEqual(residue('what is the weather in calicut', known), ['weather', 'calicut']);
    });

    it('falls back to the whole message when every word is grammar', () => {
      // "what is it" has no subject, and an empty vector would match nothing at all rather than
      // scoring badly; the corpus side of the arithmetic needs something to compare against.
      assert.deepEqual(residue('what is it', known), ['what', 'is', 'it']);
    });

    it('is empty only for an empty message', () => {
      assert.deepEqual(residue('', known), []);
    });

    it('folds every abbreviation to the word the scaffolding set stores', () => {
      // The map and the stop word set must agree, or an abbreviation folds to a token the scaffolding
      // test does not know and the sentence carries a phantom topic word.
      for (const [abbreviation, word] of Object.entries(CHAT_ABBREVIATIONS)) {
        assert.deepEqual(residue(`tell me ${abbreviation} the`, new Set()), residue(`tell me ${word} the`, new Set()));
      }
    });
  });

  describe('looksLikeQuestion', () => {
    // The brief uses this to decide whether a mid-form message is a detour or the visitor's own words.
    // It reads the shape the sentence arrives in and never a score, so the exclusions matter as much as
    // the inclusions: an answer that legitimately opens on one of the omitted words must stay an answer.
    it('recognises an interrogative opening', () => {
      for (const text of [
        'who are you',
        'what do you do',
        'how much does a rebrand cost',
        'can you build an app',
        'do you work with b2b companies',
        'tell me about the studio',
        'where are you based',
      ]) {
        assert.equal(looksLikeQuestion(text), true, `"${text}" is a question`);
      }
    });

    it('honours a mark the visitor put there themselves', () => {
      // "still interested?" carries no interrogative word at all, and the question mark is the visitor
      // telling us how to read the sentence.
      assert.equal(looksLikeQuestion('still interested?'), true);
      assert.equal(looksLikeQuestion('  rates?  '), true);
    });

    it('leaves an answer that is plainly an answer alone', () => {
      for (const text of [
        'Arjun Patel',
        'asha@studio.example',
        'Kerala, for the temple project',
        'need a logo and a website',
        'no particular deadline',
        'anything you can suggest',
      ]) {
        assert.equal(looksLikeQuestion(text), false, `"${text}" is somebody filling in a blank`);
      }
    });

    it('is empty-safe', () => {
      assert.equal(looksLikeQuestion(''), false);
      assert.equal(looksLikeQuestion('   '), false);
    });
  });
});
