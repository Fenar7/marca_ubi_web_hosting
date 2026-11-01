/**
 * @file chatpod-intent-resolution.test.ts
 * @description End-to-end resolution over the real published table: the phrases a visitor actually
 *              types, matched against the real intents, the real service titles and the real FAQs.
 *              The tier tests in `chatpod-matcher.test.ts` prove the arithmetic; this file proves the
 *              authored aliases are the ones people use, which is the only way a bad utterance list
 *              shows up before the pod ships.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { ALWAYS_RESOLVABLE, buildIndex, resolve } from '@/app/chat-pod/engine/match';
import { compileKnowledgeBase } from '@/app/chat-pod/knowledge/compile';
import { buildIntentTable } from '@/app/chat-pod/knowledge/intents';
import { FALLBACK_FAQS } from '@/sanity/lib/faq-queries';
import type { MatchOutcome } from '@/app/chat-pod/engine/match';
import type { KnowledgeSources } from '@/app/chat-pod/knowledge/compile';

const sources: KnowledgeSources = {
  posts: [
    {
      _id: 'p1',
      title: 'How a brand reads before it speaks',
      slug: 'brand-reads-first',
      publishedAt: '2026-10-31T09:00:00.000Z',
      excerpt: 'Excerpt.',
      category: { _id: 'c1', title: 'Brand Strategy', slug: 'brand-strategy' },
    },
  ] as never,
  categories: [{ _id: 'c1', title: 'Brand Strategy', slug: 'brand-strategy' }],
  faqs: FALLBACK_FAQS.map((faq) => ({ question: faq.question ?? '', answer: faq.answer })),
  careers: [{ slug: 'ui-ux-designer', title: 'UI/UX Designer', location: 'Calicut' }],
};

const kb = compileKnowledgeBase(sources);
const { index } = buildIndex(buildIntentTable(kb));

function outcome(input: string): MatchOutcome {
  return resolve(index, input, { locked: false });
}

function answered(input: string): string {
  const result = outcome(input);
  assert.equal(result.kind, 'answer', `"${input}" resolved as ${result.kind}, not answered`);
  return result.kind === 'answer' ? result.intent.id : '';
}

/**
 * Every alias the table authors, exercised as a typed message. This is the authoring contract: a
 * phrase added to `utterances` must actually reach its intent, and a phrase that stops reaching it
 * (because another intent now claims the same words) fails here rather than in front of a visitor.
 */
const TYPED: [string, string][] = [
  // Greetings and politeness
  ['hey there', 'greeting'],
  ['hello there', 'greeting'],
  ['good evening', 'greeting'],
  ['namaste', 'greeting'],
  ['how are you doing', 'smalltalk.howareyou'],
  ['are you a robot', 'smalltalk.areyouhuman'],
  ['am i talking to a bot', 'smalltalk.areyouhuman'],
  ['what are you', 'smalltalk.areyouhuman'],
  ['thank you so much', 'thanks'],
  ['many thanks', 'thanks'],
  ['see you later', 'goodbye'],
  // Services
  ['what are your services', 'services.overview'],
  ['service list', 'services.overview'],
  ['b2b', 'services.b2b'],
  ['business to business services', 'services.b2b'],
  ['b2c', 'services.b2c'],
  ['business to consumer services', 'services.b2c'],
  ['which service is right for me', 'services.whichone'],
  ['i do not know which service', 'services.whichone'],
  // Pricing
  ['how much do you charge', 'pricing'],
  ['what does a project cost', 'pricing'],
  ['rate card', 'pricing'],
  ['fees', 'pricing'],
  ['what are your fees', 'pricing'],
  ['expensive', 'pricing'],
  // Work
  ['show me the work', 'work.overview'],
  ['case study', 'work.overview'],
  ['who are your clients', 'work.clients'],
  ['client list', 'work.clients'],
  ['do you have a blog', 'work.journal'],
  ['journal entries', 'work.journal'],
  ['recent articles', 'work.journal'],
  // Process
  ['how we work', 'process.overview'],
  ['how does the process work', 'process.overview'],
  ['your process', 'process.overview'],
  ['how long does a project take', 'process.timeline'],
  ['how quickly can you deliver', 'process.timeline'],
  ['tell me about the team', 'process.team'],
  // Contact, careers, location
  ['phone number', 'contact'],
  ['how do i contact you', 'contact'],
  ['get in touch', 'contact'],
  ['i want to talk to someone', 'contact'],
  ['press enquiries', 'contact.press'],
  ['social channels', 'contact.socials'],
  ['where do you publish', 'contact.socials'],
  ['are you hiring', 'careers.list'],
  ['open roles', 'careers.list'],
  ['career opportunities', 'careers.list'],
  ['where are you located', 'location'],
  ['where is your studio', 'location'],
  ['which city are you in', 'location'],
  // Intake
  ['i want to start a project', 'intake.trigger'],
  ['send a brief', 'intake.trigger'],
  ['submit a brief', 'intake.trigger'],
  ['can we work together', 'intake.trigger'],
  ['i would like a proposal', 'intake.trigger'],
  ['cancel that', 'intake.exit'],
  ['stop asking questions', 'intake.exit'],
  // Published service lines, every alias on every slug
  ['demand gen', 'services.detail.demand-generation'],
  ['lead generation', 'services.detail.demand-generation'],
  ['pipeline generation', 'services.detail.demand-generation'],
  ['integrated campaigns', 'services.detail.integrated-marketing'],
  ['channel orchestration', 'services.detail.integrated-marketing'],
  ['internal comms', 'services.detail.corporate-communications'],
  ['stakeholder messaging', 'services.detail.corporate-communications'],
  ['executive communications', 'services.detail.corporate-communications'],
  ['influencer partnerships', 'services.detail.social-influencer-marketing'],
  ['creator collaborations', 'services.detail.social-influencer-marketing'],
  ['b2b social', 'services.detail.social-influencer-marketing'],
  ['content production', 'services.detail.content-and-scale'],
  ['content operations', 'services.detail.content-and-scale'],
  ['b2b public relations', 'services.detail.public-relations-pr'],
  ['corporate pr', 'services.detail.public-relations-pr'],
  ['press relations', 'services.detail.public-relations-pr'],
  ['media relations', 'services.detail.public-relations-pr'],
  ['customer retention marketing', 'services.detail.customer-marketing'],
  ['lifecycle marketing', 'services.detail.customer-marketing'],
  ['abm', 'services.detail.account-based-marketing'],
  ['account based marketing', 'services.detail.account-based-marketing'],
  ['enterprise account campaigns', 'services.detail.account-based-marketing'],
  ['brand identity', 'services.detail.integrated-creativity'],
  ['creative campaign', 'services.detail.integrated-creativity'],
  ['art direction', 'services.detail.integrated-creativity'],
  ['consumer influencer', 'services.detail.social-influencer'],
  ['b2c social', 'services.detail.social-influencer'],
  ['community building', 'services.detail.social-influencer'],
  ['performance marketing', 'services.detail.digital-performance'],
  ['seo', 'services.detail.digital-performance'],
  ['search engine optimisation', 'services.detail.digital-performance'],
  ['paid media', 'services.detail.digital-performance'],
  ['media buying', 'services.detail.digital-performance'],
  ['sports sponsorship', 'services.detail.sports-marketing'],
  ['team marketing', 'services.detail.sports-marketing'],
  ['athlete partnerships', 'services.detail.sports-marketing'],
  ['loyalty programme', 'services.detail.crm-and-loyalty'],
  ['crm', 'services.detail.crm-and-loyalty'],
  ['retention programme', 'services.detail.crm-and-loyalty'],
  ['membership scheme', 'services.detail.crm-and-loyalty'],
  ['consumer pr', 'services.detail.public-relations'],
  ['brand publicity', 'services.detail.public-relations'],
  ['product launches press', 'services.detail.public-relations'],
  ['events', 'services.detail.live-experiences'],
  ['brand activations', 'services.detail.live-experiences'],
  ['experiential', 'services.detail.live-experiences'],
  ['in-store activation', 'services.detail.retail-activation'],
  ['retail merchandising', 'services.detail.retail-activation'],
  ['trade marketing', 'services.detail.retail-activation'],
];

describe('Chat Pod resolution over the published table', () => {
  it('answers every authored alias with the intent that authored it', () => {
    const ids = new Set(buildIntentTable(kb).map((intent) => intent.id));
    assert.ok(TYPED.length >= 100, `the typed table shrank to ${TYPED.length} phrases`);
    for (const [phrase, id] of TYPED) {
      assert.ok(ids.has(id), `"${phrase}" is pinned to the non-existent intent "${id}"`);
      assert.equal(answered(phrase), id, `"${phrase}" did not reach "${id}"`);
    }
  });

  it('refuses to answer what the studio does not publish', () => {
    for (const phrase of [
      'do you write academic dissertations',
      'can you repair my printer',
      'what is the weather in calicut',
      'i need a visa reference letter',
    ]) {
      const result = outcome(phrase);
      assert.notEqual(result.kind, 'answer', `"${phrase}" must not be answered`);
    }
  });

  it('gives every intent a label and at least one authored phrase', () => {
    const table = buildIntentTable(kb);
    assert.ok(table.length >= 40, `the table collapsed to ${table.length} intents`);
    const anonymous = table.filter((intent) => intent.label.trim().length === 0).map((intent) => intent.id);
    assert.deepEqual(anonymous, [], 'an intent without a label cannot be offered as a disambiguation chip');
    const silent = table.filter((intent) => intent.utterances.length === 0).map((intent) => intent.id);
    assert.deepEqual(silent, [], 'an intent with no utterance can only be reached by a chip tap');
    const keyless = table.filter((intent) => intent.keywords.length === 0).map((intent) => intent.id);
    assert.deepEqual(keyless, [], 'an intent with no keywords has no Tier 2 route to it');
    const duplicateIds = table.map((intent) => intent.id).filter((id, i, all) => all.indexOf(id) !== i);
    assert.deepEqual(duplicateIds, []);
  });

  it('answers the greetings a visitor actually types', () => {
    for (const phrase of ['hi', 'hello', 'hey there', 'good morning', 'namaste']) {
      assert.equal(answered(phrase), 'greeting', `"${phrase}" did not reach the greeting`);
    }
  });

  it('answers politeness without over-reaching', () => {
    assert.equal(answered('thanks'), 'thanks');
    assert.equal(answered('thank you'), 'thanks');
    assert.equal(answered("that's all"), 'goodbye');
    assert.equal(answered('how are you'), 'smalltalk.howareyou');
  });

  it('never lets an identity question be outvoted', () => {
    for (const phrase of ['are you a bot', 'are you human', 'is this a robot', 'are you real']) {
      assert.equal(answered(phrase), 'smalltalk.areyouhuman');
    }
  });

  it('routes service questions to the services intents', () => {
    assert.equal(answered('what do you do'), 'services.overview');
    assert.equal(answered('what services do you offer'), 'services.overview');
    assert.equal(answered('b2b services'), 'services.b2b');
    assert.equal(answered('consumer brands'), 'services.b2c');
    assert.equal(answered('which service do i need'), 'services.whichone');
  });

  it('reaches individual service pages from what people call them', () => {
    assert.equal(answered('demand gen'), 'services.detail.demand-generation');
    assert.equal(answered('abm'), 'services.detail.account-based-marketing');
    assert.equal(answered('loyalty programme'), 'services.detail.crm-and-loyalty');
    assert.equal(answered('account based marketing'), 'services.detail.account-based-marketing');
  });

  it('asks instead of guessing when a phrase belongs to two published lines', () => {
    const result = outcome('public relations');
    assert.equal(result.kind, 'disambiguate', 'a shared PR title must offer both pages, not pick one');
    const ids = result.kind === 'disambiguate' ? result.candidates.map((entry) => entry.intent.id) : [];
    assert.ok(ids.includes('services.detail.public-relations-pr'));
    assert.ok(ids.includes('services.detail.public-relations'));
  });

  it('treats a pricing question as unanswerable rather than inventing a range', () => {
    assert.equal(answered('how much does it cost'), 'pricing');
    assert.equal(answered('what are your rates'), 'pricing');
    assert.equal(answered('pricing'), 'pricing');
  });

  it('answers process, contact, careers and location questions', () => {
    assert.equal(answered('how do you work'), 'process.overview');
    assert.equal(answered('what is your process'), 'process.overview');
    assert.equal(answered('talk to a person'), 'contact');
    assert.equal(answered('phone number'), 'contact');
    assert.equal(answered('where are you located'), 'location');
    assert.equal(answered('are you hiring'), 'careers.list');
  });

  it('answers a published FAQ from its own question text', () => {
    const question = FALLBACK_FAQS[4].question;
    assert.equal(answered(question), 'faq.5');
  });

  it('opens the intake on the phrases that mean it', () => {
    for (const phrase of ['start a project', 'i have a project', 'i want to hire you', 'send a brief']) {
      assert.equal(answered(phrase), 'intake.trigger', `"${phrase}" did not open the intake`);
    }
  });

  it('says it does not know rather than stretching a match', () => {
    const result = outcome('do you write academic dissertations');
    assert.ok(result.kind === 'fallback' || result.kind === 'disambiguate', `unexpected ${result.kind}`);
  });

  it('keeps the escape hatch answering after the fallback lock', () => {
    for (const phrase of ['talk to a person', 'start a project', 'hi']) {
      const result = resolve(index, phrase, { locked: true });
      assert.equal(result.kind, 'answer', `"${phrase}" must still answer while locked`);
      const id = result.kind === 'answer' ? result.intent.id : '';
      assert.ok(ALWAYS_RESOLVABLE.has(id), `"${phrase}" answered with the non-permitted intent ${id}`);
    }
  });

  it('answers every published FAQ question with its own intent', () => {
    kb.faqs.forEach((faq, index) => {
      assert.equal(answered(faq.question), `faq.${index + 1}`);
    });
  });
});
