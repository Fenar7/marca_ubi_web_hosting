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
  opensWithChatShorthand,
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

    it('reads the chat spelling of "you" as grammar', () => {
      // "can yu pls tell me about services" is how the owner types. Unfolded, "yu" is two characters —
      // under the typo floor, so no forgiveness rule reached it — and it survived as a phantom topic
      // word that no alias owns, which pulled every services answer below the acceptance margin.
      assert.equal(isScaffold('yu', known), true);
      assert.deepEqual(residue('can yu pls tell me about services', known), ['servic']);
      // Every word of it is grammar, so the residue falls back to the whole message rather than an empty
      // vector — the same fold as the spelled-out sentence, which is the point of the abbreviation map.
      assert.deepEqual(residue('what do yu do', known), residue('what do you do', known));
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
      // The swap of a preposition is a noun: "from" one keystroke from "form", which is a thing a
      // visitor asks for. Only the interrogative openers are forgiven at this length.
      assert.equal(isScaffold('form', known), false);
    });

    it('forgives a four-character swap of a question opener', () => {
      // `looksLikeQuestion` has read "whta" as a mistyped "what" for as long as it has existed, while
      // the scorer charged the same token as an unknown topic. The two subsystems disagreeing is how
      // "whta do you do" fell below the floor that "what do you do" clears.
      assert.equal(isScaffold('whta', known), true);
      // With the opener read as grammar, what is left is the subject the visitor is asking about.
      assert.deepEqual(residue('whta is the pricing', known), ['pricing']);
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

    it('reads an auxiliary as a question only when the sentence is inverted', () => {
      // The auxiliary families need a subject after them, because a blank answer legitimately opens on
      // one: a scope answer is "will need packaging next month" and a timeline answer is "would like a
      // website", while "can you build an app" and "is there a minimum budget" are questions.
      assert.equal(looksLikeQuestion('could you show me case studies'), true);
      assert.equal(looksLikeQuestion('is there a minimum budget'), true);
      assert.equal(looksLikeQuestion("who's your team"), true);
      assert.equal(looksLikeQuestion('will need packaging next month'), false);
      assert.equal(looksLikeQuestion('would like a website'), false);
      assert.equal(looksLikeQuestion('deadline is next month'), false);
      assert.equal(looksLikeQuestion('there is no deadline yet'), false);
    });

    it('catches a mistyped opening when the rest of the sentence proves it', () => {
      // "whta is marka ubi" used to be filed into a name field. A four-character miss is too short to
      // delete from the resolver's denominator (it could be any real noun), but as the *leading* word of
      // an inverted sentence it has nowhere else to be read from.
      assert.equal(looksLikeQuestion('whta is marka ubi'), true);
      assert.equal(looksLikeQuestion('waht do you offer'), true);
      assert.equal(looksLikeQuestion('escribe the service you mean'), true);

      // The same shape test must not eat an answer whose first word merely resembles an opener.
      assert.equal(looksLikeQuestion('here is the link https://dribbble.com/shots/123'), false);
      assert.equal(looksLikeQuestion('understand packaging'), false);
    });

    it('reads a deleted letter in a short *wh*-word as the same opener', () => {
      // "wat is your price" is "what" with the finger still finding the keyboard. The deletion floor is
      // four for every other family of opener, because deleting a letter from "does" gives "des" and
      // from "tell" gives "tel" — both names somebody legitimately answers with — and a name is not a
      // mistyped question.
      assert.equal(looksLikeQuestion('wat is your price'), true);
      assert.equal(looksLikeQuestion('wha is included'), true);
      assert.equal(looksLikeQuestion('des is my manager\'s name'), false);
      assert.equal(looksLikeQuestion('tel me the number'), false);
    });

    it('reads an interrogative that closes the sentence', () => {
      // Asking for the value of something on screen puts the question word at the end, where nothing
      // written as an answer ever puts it: "the services are which", "your price is what".
      assert.equal(looksLikeQuestion('the services are which'), true);
      assert.equal(looksLikeQuestion('your price is what'), true);
      // A sentence that merely ends on an ordinary noun is still somebody filling in a blank.
      assert.equal(looksLikeQuestion('the studio in calicut'), false);
    });

    it('folds the chat register before it reads the opening', () => {
      // "can yu tell me about services" is the same sentence as "can you tell me about services", typed
      // in the register these messages actually arrive in.
      assert.equal(looksLikeQuestion('can yu pls tell me about services'), true);
      assert.equal(looksLikeQuestion('can u tell me about ur services'), true);
    });

    it('reads a request wrapped in politeness as a question, not as a name', () => {
      // "pls send info" at the name blank is the message the shape test used to miss entirely: no *wh*-
      // word, no auxiliary, therefore nothing inverted to prove. It is the verb family — the visitor is
      // asking the pod to do something — and the chat abbreviation folds to "please" before the opening
      // is ever classified, which is what makes it visible.
      assert.equal(looksLikeQuestion('pls send info'), true);
      assert.equal(looksLikeQuestion('plz share the portfolio'), true);
      assert.equal(looksLikeQuestion('please send info'), true);
    });

    it('leaves an answer that is plainly an answer alone', () => {
      for (const text of [
        'Arjun Patel',
        'asha@studio.example',
        'Kerala, for the temple project',
        'need a logo and a website',
        'no particular deadline',
        'anything you can suggest',
        // The polite opener must not become a prefix test: "please" leading an answer is the visitor
        // asking for the blank to be filled for them, which is still the content of that blank.
        'press kit please',
      ]) {
        assert.equal(looksLikeQuestion(text), false, `"${text}" is somebody filling in a blank`);
      }
    });

    it('pays for the shape test with the proper nouns that open like questions', () => {
      // Disclosed, not hidden, and pinned so it cannot drift silently. A project called
      // `Tell Me Nothing` or `Who Wants a Proposal` opens on exactly the words a question opens on,
      // and the shape test cannot tell a title from an imperative because case is folded away before
      // it reads the sentence. The pod refuses these at a verbatim blank rather than filing them,
      // which is the lesser error — a refusal is re-answerable, a stored question is a corrupt CRM
      // record. The honest fix is a re-ask at the blank ("is that the name of your project?"), not a
      // name heuristic, and it is recorded as the open item in `docs/chat_pod/23-` §8.
      for (const text of [
        'who wants a proposal',
        'what the heck studio',
        'do it forward',
        'tell me nothing',
        'how to damp the roof',
      ]) {
        assert.equal(looksLikeQuestion(text), true, `"${text}" reads as a question, and that is the known cost`);
      }
      // And the half that still works: the ordinary names the studio actually receives.
      for (const text of ['will of the people', 'can on the water', 'arjun mehta', 'the marketing club']) {
        assert.equal(looksLikeQuestion(text), false, `"${text}" is still filed as the answer it is`);
      }
    });

    it('is empty-safe', () => {
      assert.equal(looksLikeQuestion(''), false);
      assert.equal(looksLikeQuestion('   '), false);
    });
  });

  describe('opensWithChatShorthand', () => {
    it('reads a message that opens the way a text message opens', () => {
      // These have no question shape at all — no *wh*-word, no auxiliary, no mark — and the corpus
      // answers both at full confidence. The abbreviation at the head is the only evidence that the
      // visitor is asking rather than naming, and at a blank the visitor writes into it is the evidence
      // the pod needs before it takes the words out of their brief.
      assert.equal(opensWithChatShorthand('abt pricing'), true);
      assert.equal(opensWithChatShorthand('u offer web design'), true);
      assert.equal(opensWithChatShorthand('th services'), true);
    });

    it('leaves a phrase alone because the corpus has an answer for it', () => {
      // The negative half, and the reason this test exists. Every one of these is a published alias the
      // resolver answers at 1.000 and every one is a plausible name for the visitor's own project, so
      // "the engine knows something about this" cannot be the test for a question.
      for (const text of ['social media', 'brand identity', 'demand generation', 'the marketing club', 'temple project']) {
        assert.equal(opensWithChatShorthand(text), false, `"${text}" is a thing a project gets called`);
      }
    });

    it('needs a word after the abbreviation to be a question', () => {
      // A single token is the whole of what the visitor typed, so at a blank it is the answer: "abt"
      // on its own is an abbreviation for a company, not a request.
      assert.equal(opensWithChatShorthand('abt'), false);
      assert.equal(opensWithChatShorthand(''), false);
    });

    it('does not read a prototype key as an abbreviation', () => {
      // `CHAT_ABBREVIATIONS` is a plain object literal, so an inherited name is reachable through the
      // same bracket syntax the fold uses. A project called "constructor" is a real string a real
      // visitor can type, and folding it to `Object`'s constructor would put a function where every
      // downstream test expects a word.
      assert.equal(opensWithChatShorthand('constructor injection'), false);
      assert.equal(opensWithChatShorthand('toString of duties'), false);
    });
  });
});
