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
  // Who the studio is. This family had no owner at all until `identity.studio`: "what do you do" was
  // authored under `services.overview`, whose first line asks the visitor who they sell to, so the
  // company question came back as a sales qualification question.
  ['what do you do', 'identity.studio'],
  ['what do you actually do', 'identity.studio'],
  ['what do you guys do', 'identity.studio'],
  ['what does marka ubi do', 'identity.studio'],
  ['who are you', 'identity.studio'],
  ['who are you guys', 'identity.studio'],
  ['who is behind this', 'identity.studio'],
  ['about you', 'identity.studio'],
  ['what is marka ubi', 'identity.studio'],
  ['are you an agency', 'identity.studio'],
  ['are you a creative agency', 'identity.studio'],
  ['is this an agency', 'identity.studio'],
  ['what kind of company are you', 'identity.studio'],
  ['tell me about yourself', 'identity.studio'],
  ['tell me about your studio', 'identity.studio'],
  ['tell me about the company', 'identity.studio'],
  ['about the studio', 'identity.studio'],
  // Services
  ['what are your services', 'services.overview'],
  ['what are the services', 'services.overview'],
  ['what is the services', 'services.overview'],
  ['what are the services available', 'services.overview'],
  ['what services are available', 'services.overview'],
  ['what services do you have', 'services.overview'],
  ['what services you provide', 'services.overview'],
  ['services available', 'services.overview'],
  ['available services', 'services.overview'],
  ['list of services', 'services.overview'],
  ['full list of services', 'services.overview'],
  ['tell me about your services', 'services.overview'],
  ['service list', 'services.overview'],
  ['your services', 'services.overview'],
  ['services', 'services.overview'],
  ['what do you offer', 'services.overview'],
  ['what do you sell', 'services.overview'],
  ['what can you do for me', 'services.overview'],
  ['help me with marketing', 'services.overview'],
  ['b2b', 'services.b2b'],
  ['business to business services', 'services.b2b'],
  ['business facing services', 'services.b2b'],
  ['b2c', 'services.b2c'],
  ['business to consumer services', 'services.b2c'],
  ['consumer facing services', 'services.b2c'],
  ['which service is right for me', 'services.whichone'],
  // The alias runs to "pick" rather than ending at "service" on purpose: stripped of its scaffolding the
  // old form reduced to the single word "service", which `services.overview` also owns, and a contested
  // residue is a question the pod asks back instead of the answer it gives. The table is where that
  // authoring fact is pinned, so a future edit that shortens this phrase back fails here.
  ['i do not know which service to pick', 'services.whichone'],
  // Pricing
  ['how much do you charge', 'pricing'],
  ['what does a project cost', 'pricing'],
  ['how much does a rebrand cost', 'pricing'],
  ['how much does a website cost', 'pricing'],
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
  // A build request the catalogue has no page for still has to reach the brief. These four lines are
  // the whole reason they are authored rather than scored: nothing in the corpus contains "website"
  // next to "want", so the arithmetic had no route and a lead arrived as a fallback.
  ['i want a website', 'intake.trigger'],
  ['build me a website', 'intake.trigger'],
  ['can you build an app', 'intake.trigger'],
  ['do you build apps', 'intake.trigger'],
  ['i would like a proposal', 'intake.trigger'],
  ['cancel that', 'intake.exit'],
  ['stop asking questions', 'intake.exit'],
  // Published service lines, every alias on every slug. Titles are aliases too now that Tier 1 is
  // multi-owner, so a line's own name is a route to it rather than a keyword accident. The two decks
  // titled "Public Relations (PR)" are not here: a contested name disambiguates, and that is asserted
  // by its own test below.
  ['Demand Generation', 'services.detail.demand-generation'],
  ['Integrated Marketing', 'services.detail.integrated-marketing'],
  ['Corporate Communications', 'services.detail.corporate-communications'],
  ['Social & Influencer Marketing', 'services.detail.social-influencer-marketing'],
  ['Content & Scale', 'services.detail.content-and-scale'],
  ['Customer Marketing', 'services.detail.customer-marketing'],
  ['Account-Based Marketing (ABM)', 'services.detail.account-based-marketing'],
  ['Integrated Creativity', 'services.detail.integrated-creativity'],
  ['Social & Influencer', 'services.detail.social-influencer'],
  ['Digital Performance', 'services.detail.digital-performance'],
  ['Sports Marketing', 'services.detail.sports-marketing'],
  ['CRM & Loyalty', 'services.detail.crm-and-loyalty'],
  ['Live Experiences', 'services.detail.live-experiences'],
  ['Retail Activation', 'services.detail.retail-activation'],
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
  ['branding', 'services.detail.integrated-creativity'],
  ['branding services', 'services.detail.integrated-creativity'],
  ['do you offer branding', 'services.detail.integrated-creativity'],
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

  it('carries the subject of the previous turn into a message it could not resolve alone', () => {
    // The resolver is a pure function of one message, which is right for a first question and wrong for
    // a second one. "explain each service" reaches 0.775 cold and comes back as three chips; after a
    // turn that was already about services the same message is a continuation, and `CONTINUITY_PRIOR`
    // is what says so. The three assertions below are the three ways this could be a lie: it must fire
    // on the right family, stay silent on the wrong one, and never outvote an answer already reached.
    const cold = resolve(index, 'explain each service', { locked: false });
    assert.equal(cold.kind, 'disambiguate', 'the cold pass must not answer this on its own');

    const continued = resolve(index, 'explain each service', { locked: false, prior: 'services.b2b' });
    assert.equal(continued.kind, 'answer', 'the same message after a services turn must be answered');
    assert.equal(
      continued.kind === 'answer' ? continued.intent.id : '',
      'services.overview',
      'continuity lifts the leader, it does not choose a different subject',
    );

    const offTopic = resolve(index, 'explain each service', { locked: false, prior: 'contact' });
    assert.equal(offTopic.kind, 'disambiguate', 'a turn about a different family must not drag this one');

    const alreadyAnswered = resolve(index, 'what do you do', { locked: false, prior: 'process.team' });
    assert.equal(
      alreadyAnswered.kind === 'answer' ? alreadyAnswered.intent.id : '',
      'identity.studio',
      'the previous turn never overrules an intent the message reaches by itself',
    );
  });

  it('routes service questions to the services intents', () => {
    assert.equal(answered('what services do you offer'), 'services.overview');
    assert.equal(answered('b2b services'), 'services.b2b');
    assert.equal(answered('consumer brands'), 'services.b2c');
    assert.equal(answered('which service do i need'), 'services.whichone');
  });

  it('answers the company question about the company, not with a sales qualification', () => {
    // The defect this authoring closes: `services.overview` owned "what do you do" and its reply opens
    // by asking who the visitor sells to, so the first question a new visitor asks got the answer to a
    // different question. Ownership moved to `identity.studio`; the services intent keeps every
    // phrasing that names the offer, and this test is what stops the two drifting back onto each other.
    assert.equal(answered('what do you do'), 'identity.studio');
    assert.equal(answered('who are you'), 'identity.studio');
    assert.equal(answered('what is marka ubi'), 'identity.studio');
    assert.notEqual(answered('what do you offer'), 'identity.studio');
  });

  it('forgives a mistyped company name without losing the company question', () => {
    // "whta is marka ubi" is a transposition in the brand's own name, which the corpus spells but no
    // author lists every way a visitor can misspell. The neighbour lookup reaches it; the assertion
    // exists because a fold this loose is only safe while it still answers the right intent.
    assert.equal(answered('whta is marka ubi'), 'identity.studio');
  });

  it('reaches individual service pages from what people call them', () => {
    assert.equal(answered('demand gen'), 'services.detail.demand-generation');
    assert.equal(answered('abm'), 'services.detail.account-based-marketing');
    assert.equal(answered('loyalty programme'), 'services.detail.crm-and-loyalty');
    assert.equal(answered('account based marketing'), 'services.detail.account-based-marketing');
  });

  it('asks instead of guessing when a phrase belongs to two published lines', () => {
    // Sanctioned collisions: the name is published under more than one intent, so Tier 1 returns every
    // owner at score 1 and the margin rule turns that into chips. The list is a contract with the
    // catalogue, not a workaround; `chatpod-knowledge-coverage` asserts no other phrase collides.
    const contested: [string, string[]][] = [
      ['public relations', ['services.detail.public-relations-pr', 'services.detail.public-relations']],
      ['Public Relations (PR)', ['services.detail.public-relations-pr', 'services.detail.public-relations']],
      ['social media marketing', ['services.detail.social-influencer-marketing', 'services.detail.social-influencer']],
    ];

    for (const [phrase, ids] of contested) {
      const result = outcome(phrase);
      assert.equal(result.kind, 'disambiguate', `"${phrase}" must offer both pages, not pick one`);
      const offered = result.kind === 'disambiguate' ? result.candidates.map((entry) => entry.intent.id) : [];
      for (const id of ids) assert.ok(offered.includes(id), `"${phrase}" dropped the owner ${id}`);
    }
  });

  it('does not answer a question about a service with the studio social links', () => {
    // The complaint this authoring answers: "explain social media marketing" used to return the
    // Instagram and LinkedIn rail, because "social" was a keyword on that intent. It is a question about
    // what the studio sells, so the two social service lines are offered and the rail is not the answer.
    const result = outcome('explain social media marketing');
    assert.notEqual(
      result.kind === 'answer' ? result.intent.id : '',
      'contact.socials',
      'a service question was answered by the publishing rail',
    );
    assert.equal(result.kind, 'disambiguate');
    const offered = result.kind === 'disambiguate' ? result.candidates.map((entry) => entry.intent.id) : [];
    assert.ok(offered.includes('services.detail.social-influencer-marketing'));
    assert.ok(offered.includes('services.detail.social-influencer'));

    // The rail still answers the phrases that actually ask for it.
    assert.equal(answered('social channels'), 'contact.socials');
    assert.equal(answered('where do you publish'), 'contact.socials');
    assert.equal(answered('social media'), 'contact.socials');
  });

  it('offers the service and the journal category for a subject the studio both sells and writes about', () => {
    // "Brand Strategy" is a published journal category and a published deliverable label of the
    // creative deck. The decision is to show the visitor both rather than silently answering with blog
    // posts: the deck authors the shared name, so the exact phrase contests at Tier 1, and the
    // `work.journal.topic.` discount keeps the journal second on the longer question.
    for (const phrase of ['brand strategy', 'what is brand strategy']) {
      const result = outcome(phrase);
      assert.equal(result.kind, 'disambiguate', `"${phrase}" resolved as ${result.kind}`);
      const offered = result.kind === 'disambiguate' ? result.candidates.map((entry) => entry.intent.id) : [];
      assert.ok(offered.includes('services.detail.integrated-creativity'), `"${phrase}" hid the service line`);
      assert.ok(offered.includes('work.journal.topic.Brand Strategy'), `"${phrase}" hid the journal category`);
    }
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
