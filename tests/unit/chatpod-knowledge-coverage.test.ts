/**
 * @file chatpod-knowledge-coverage.test.ts
 * @description Build-time provenance and coverage gate for the Chat Pod. This is the file that
 *              makes "every answer comes from published content" a checked claim instead of a
 *              sentence in a document: an intent without a source, a chip pointing at a route that
 *              does not exist, an answer that quotes a service deck inaccurately, or authored copy
 *              that drifts from the surface it transcribes all fail here.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { B2B_SERVICES, B2C_SERVICES } from '@/app/components/Sections/ServicesAccordion/types';
import { INTAKE_TIMELINE_OPTIONS } from '@/app/lib/intake/intakeOptions';
import { ALWAYS_RESOLVABLE, buildIndex, decide, rank } from '@/app/chat-pod/engine/match';
import { normalise } from '@/app/chat-pod/engine/normalise';
import { compileKnowledgeBase, JOURNAL_LIMIT, type KnowledgeSources } from '@/app/chat-pod/knowledge/compile';
import { ALL_SERVICES_HREF, BANNED_TERMS, PROCESS_PRINCIPLES, PERSISTENT_MENU, STUDIO } from '@/app/chat-pod/knowledge/corpus';
import { buildIntentTable, FALLBACK_REPLIES, openingReply } from '@/app/chat-pod/knowledge/intents';
import type { Chip, Intent, KnowledgeBase, Reply } from '@/app/chat-pod/types';
import { FALLBACK_FAQS } from '@/sanity/lib/faq-queries';
import { SERVICE_DETAILS } from '@/app/services/content';
import type { Category, PostSummary } from '@/sanity/types/blog';

const repoFile = (relative: string) => readFileSync(new URL(relative, new URL('../../', import.meta.url)), 'utf8');

const posts: PostSummary[] = [
  {
    _id: 'p1',
    title: 'How a brand reads before it speaks',
    slug: 'brand-reads-first',
    publishedAt: '2026-10-31T09:00:00.000Z',
    excerpt: 'Excerpt one.',
    category: { _id: 'c1', title: 'Brand Strategy', slug: 'brand-strategy' },
  },
  {
    _id: 'p2',
    title: 'Type systems for teams',
    slug: 'type-systems-for-teams',
    publishedAt: '2026-09-08T09:00:00.000Z',
    excerpt: 'Excerpt two.',
    category: { _id: 'c2', title: 'Design Systems', slug: 'design-systems' },
  },
] as unknown as PostSummary[];

const categories: Category[] = [
  { _id: 'c1', title: 'Brand Strategy', slug: 'brand-strategy' },
  { _id: 'c2', title: 'Design Systems', slug: 'design-systems' },
  { _id: 'c3', title: 'Engineering', slug: 'engineering' },
];

/**
 * The published fallback roles. Transcribed, not imported: `career-queries.ts` pulls the Sanity
 * client at module load and a unit run has no CMS environment, so the values are read as text and
 * diffed against that file in the provenance test below.
 */
const publishedRoles = [
  { slug: 'brand-account-manager', title: 'Brand & Account Manager', location: 'Chennai / Calicut' },
  { slug: 'copywriter-strategist', title: 'Copywriter & Strategist', location: 'Calicut' },
  { slug: 'ui-ux-designer', title: 'UI/UX Designer', location: 'Calicut' },
];

function fixtureSources(overrides: Partial<KnowledgeSources> = {}): KnowledgeSources {
  return {
    posts,
    categories,
    faqs: FALLBACK_FAQS.map((faq) => ({ question: faq.question ?? '', answer: faq.answer })),
    careers: publishedRoles,
    ...overrides,
  };
}

const kb: KnowledgeBase = compileKnowledgeBase(fixtureSources());
const intents = buildIntentTable(kb);
const byId = new Map<string, Intent>(intents.map((entry) => [entry.id, entry]));

/** Every string leaf in the compiled corpus: the only text the pod is allowed to quote verbatim. */
function corpusStrings(value: unknown, into: string[] = []): string[] {
  if (typeof value === 'string') {
    into.push(value);
  } else if (Array.isArray(value)) {
    for (const entry of value) corpusStrings(entry, into);
  } else if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) corpusStrings(entry, into);
  }
  return into;
}

const corpusLeaves = corpusStrings(kb).filter((text) => text.length > 3).sort((a, b) => b.length - a.length);

/** Removes quoted published text so the voice audit only judges copy the pod itself wrote. */
function authoredResidue(text: string): string {
  let residue = text;
  for (const leaf of corpusLeaves) residue = residue.split(leaf).join(' ');
  return residue;
}

/** Flattens one intent's answer to text plus its chips, the two things every assertion needs. */
function blocksOf(id: string): { text: string; chips: Chip[] } {
  const entry = byId.get(id);
  assert.ok(entry, `intent "${id}" is missing from the table`);
  const reply = entry!.respond(kb);
  return { text: blocksOfText(reply.blocks), chips: reply.chips };
}

function blocksOfText(blocks: Reply['blocks']): string {
  return blocks
    .map((block) => (block.t === 'p' ? block.text : block.items.map((item) => `${item.label} ${item.sub ?? ''}`).join(' ')))
    .join('\n');
}

/** The labels of every `list` block in a reply, for depth assertions that must not read prose. */
function listLabels(reply: Reply): string[] {
  return reply.blocks.flatMap((block) => (block.t === 'list' ? block.items.map((item) => item.label) : []));
}

/**
 * Tier 1 names that more than one intent publishes under, and every intent that does.
 *
 * These are sanctioned, not tolerated. The catalogue really does have two lines called
 * "Public Relations (PR)", one per split, and "brand strategy" is simultaneously a published journal
 * category and a published deliverable label of the creative deck. A shared name is a fact about the
 * content, and the multi-owner dictionary turns it into a choice offered to the visitor. This list
 * exists so a *new* collision still fails the run: an accidental shared name would silently convert a
 * question the pod used to answer into a disambiguation, and only an intentional one earns a row here.
 */
const SHARED_AUTHORED_NAMES: { key: string; owners: string[] }[] = [
  {
    key: 'public relations pr',
    owners: ['services.detail.public-relations-pr', 'services.detail.public-relations'],
  },
  {
    key: 'public relations',
    owners: ['services.detail.public-relations-pr', 'services.detail.public-relations'],
  },
  {
    key: 'social media marketing',
    owners: ['services.detail.social-influencer-marketing', 'services.detail.social-influencer'],
  },
  {
    key: 'brand strategy',
    owners: ['services.detail.integrated-creativity', 'work.journal.topic.Brand Strategy'],
  },
];

/** Internal hrefs the pod is allowed to navigate to, checked against the real route tree. */
function routeResolves(href: string): boolean {
  const [pathBeforeHash] = href.split('#');
  const [path] = pathBeforeHash.split('?');
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return true;
  const candidates = [
    `src/app/${segments.join('/')}/page.tsx`,
    `src/app/${segments.slice(0, -1).concat('[slug]').join('/')}/page.tsx`,
  ];
  return candidates.some((candidate) => {
    try {
      repoFile(candidate);
      return true;
    } catch {
      return false;
    }
  });
}

describe('Chat Pod knowledge coverage and provenance', () => {
  it('gives every intent a source that names a file, a query or the authored script', () => {
    const unsource = intents.filter((entry) => !/^(src\/|docs\/|authored:)/.test(entry.source));
    assert.deepEqual(unsource.map((entry) => entry.id), []);
  });

  it('shares a Tier 1 name only where every owner is sanctioned, and answers it with a choice', () => {
    const { duplicates, index } = buildIndex(intents);
    const sharedKeys = [...new Set(duplicates.map((entry) => entry.slice(0, entry.indexOf(' ('))))].sort();
    assert.deepEqual(
      sharedKeys,
      SHARED_AUTHORED_NAMES.map((entry) => entry.key).sort(),
      'an unsanctioned phrase is now claimed by two intents, or a sanctioned pair stopped colliding',
    );

    for (const { key, owners } of SHARED_AUTHORED_NAMES) {
      const authors = intents
        .filter((entry) => entry.utterances.some((utterance) => normalise(utterance) === key))
        .map((entry) => entry.id)
        .sort();
      assert.deepEqual(authors, [...owners].sort(), `"${key}" is not authored by exactly its sanctioned owners`);

      // The point of authoring the collision rather than avoiding it: the visitor gets every owner as
      // a chip, so the pod never picks a page by declaration order or by keyword arithmetic.
      const outcome = decide(rank(index, key));
      assert.equal(outcome.kind, 'disambiguate', `"${key}" resolved as ${outcome.kind} instead of asking`);
      const offered = outcome.kind === 'disambiguate' ? outcome.candidates.map((entry) => entry.intent.id).sort() : [];
      assert.deepEqual(offered, [...owners].sort(), `"${key}" did not offer every owner`);
    }
  });

  it('goes deeper on the second ask about a service line', () => {
    // Asserted against the authored branch directly. `types.ts` widens `respond` with `AnswerContext`,
    // and `context.ts` produces the `{ kind: "depth", ctx: { expanded: true } }` follow-up, but
    // `useChatEngine` still calls `respond(knowledge)` with no context on either the typed or the
    // chip path, so nothing at runtime can reach this branch yet. The wiring is a separate workstream;
    // this pins that the depth answer exists and is strictly fuller than the first one.
    for (const deck of SERVICE_DETAILS) {
      const entry = byId.get(`services.detail.${deck.slug}`);
      assert.ok(entry, `no intent for service "${deck.slug}"`);
      const shallow = entry!.respond(kb);
      const deep = entry!.respond(kb, { expanded: true });
      const service = kb.services.find((line) => line.slug === deck.slug)!;

      assert.deepEqual(listLabels(shallow), service.covers.slice(0, 3), `${deck.slug}: the first answer is not the short cut`);
      assert.deepEqual(listLabels(deep), service.covers, `${deck.slug}: the expanded answer is not the full published list`);
      assert.notEqual(blocksOfText(shallow.blocks), blocksOfText(deep.blocks), `${deck.slug}: expanding changes nothing`);

      const siblings = kb.services.filter((line) => line.split === service.split && line.slug !== service.slug);
      assert.ok(
        siblings.some((line) => blocksOfText(deep.blocks).includes(line.title)),
        `${deck.slug}: the expanded answer never names another line in the same split`,
      );
    }
  });

  it('holds one intent per published service slug, across both accordion tiers', () => {
    const slugs = [...B2B_SERVICES, ...B2C_SERVICES].map((item) => item.slug);
    assert.equal(slugs.length, 16);
    const missing = slugs.filter((slug) => !byId.has(`services.detail.${slug}`));
    assert.deepEqual(missing, []);
  });

  it('quotes each service deck summary verbatim rather than paraphrasing it', () => {
    for (const deck of SERVICE_DETAILS) {
      const answer = blocksOf(`services.detail.${deck.slug}`).text;
      assert.ok(answer.includes(deck.shortDescription), `${deck.slug} does not quote its published summary`);
    }
  });

  it('lists only published sub-service labels under "what it covers"', () => {
    for (const deck of SERVICE_DETAILS) {
      const answer = blocksOf(`services.detail.${deck.slug}`).text;
      for (const sub of deck.subServices.slice(0, 3)) {
        assert.ok(answer.includes(sub.label), `${deck.slug} omits published label "${sub.label}"`);
      }
    }
  });

  it('gives every compiled FAQ an intent that answers with the published text', () => {
    assert.equal(byId.has('faq.1'), true);
    kb.faqs.forEach((faq, index) => {
      const entry = byId.get(`faq.${index + 1}`);
      assert.ok(entry, `no intent for FAQ ${index + 1}: "${faq.question}"`);
      assert.equal(entry!.respond(kb).blocks[0].t === 'p' ? (entry!.respond(kb).blocks[0] as { text: string }).text : '', faq.answer);
      assert.ok(entry!.utterances.includes(faq.question), `FAQ intent does not author its own question as an alias`);
    });
  });

  it('gives every published journal category a topic intent', () => {
    const missing = kb.journalCategories.filter((title) => !byId.has(`work.journal.topic.${title}`));
    assert.deepEqual(missing, []);
  });

  it('derives every quotable number from the arrays it describes', () => {
    assert.equal(kb.counts.servicePages, kb.services.length);
    assert.equal(kb.counts.servicesB2B + kb.counts.servicesB2C, kb.services.length);
    assert.equal(kb.counts.journalPosts, kb.journal.length);
    assert.equal(kb.counts.faqs, kb.faqs.length);
    assert.equal(kb.counts.openRoles, kb.careers.length);
  });

  it('never prints a number in authored copy that is not a compiled count', () => {
    const quotable = new Set(Object.values(kb.counts).map(String));
    const offenders: string[] = [];
    for (const id of ['services.overview', 'work.journal', 'careers.list', 'location', 'contact', 'process.timeline']) {
      const residue = authoredResidue(blocksOf(id).text);
      for (const match of residue.matchAll(/\b\d+\b/g)) {
        if (!quotable.has(match[0])) offenders.push(`${id} prints "${match[0]}"`);
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('caps the journal at the published limit', () => {
    const many = Array.from({ length: JOURNAL_LIMIT + 6 }, (_, index) => ({
      ...posts[0],
      _id: `bulk-${index}`,
      slug: `bulk-${index}`,
    })) as unknown as PostSummary[];
    const wide = compileKnowledgeBase(fixtureSources({ posts: many }));
    assert.equal(wide.journal.length, JOURNAL_LIMIT);
    assert.equal(wide.counts.journalPosts, JOURNAL_LIMIT);
  });

  it('formats journal dates the way the journal itself prints them', () => {
    const listing = repoFile('src/app/blog/BlogListingClient.tsx');
    assert.ok(listing.includes('en-GB'), 'the journal listing locale changed; the pod must follow it');
    assert.ok(listing.includes('month: "short"'), 'the journal listing month style changed; the pod must follow it');
    const expected = (iso: string) =>
      new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    assert.equal(kb.journal[0].date, expected('2026-10-31T09:00:00.000Z'));
    assert.equal(kb.journal[1].date, expected('2026-09-08T09:00:00.000Z'));
    assert.match(kb.journal[0].date, /^\d{2} \w+ \d{4}$/);
  });

  it('keeps the corpus half optional without breaking the serializable contract', () => {
    const empty = compileKnowledgeBase(fixtureSources({ posts: null, categories: null }));
    assert.equal(empty.journal.length, 0);
    assert.equal(empty.counts.journalPosts, 0);

    const degraded = buildIntentTable(empty);
    const journal = degraded.find((entry) => entry.id === 'work.journal');
    assert.ok(journal, 'the journal intent must exist even with no posts compiled');
    const text = blocksOfText(journal!.respond(empty).blocks);
    assert.ok(text.includes('/blog'), 'with nothing compiled the pod must send the visitor to the index');
    buildIntentTable(kb);
  });

  it('is plain JSON across the props boundary', () => {
    assert.deepEqual(JSON.parse(JSON.stringify(kb)), kb);
  });

  it('points every intent chip at an intent that exists', () => {
    const dangling: string[] = [];
    for (const entry of intents) {
      for (const chip of entry.respond(kb).chips) {
        if (chip.action.kind === 'intent' && !byId.has(chip.action.id)) dangling.push(`${entry.id} → ${chip.action.id}`);
      }
    }
    assert.deepEqual(dangling, []);
  });

  it('links only routes that exist on this site', () => {
    const allChips: Chip[] = [
      ...intents.flatMap((entry) => entry.respond(kb).chips),
      ...FALLBACK_REPLIES.soft(intents.slice(0, 3)).chips,
      ...FALLBACK_REPLIES.hard().chips,
      ...FALLBACK_REPLIES.capped(kb).chips,
      ...openingReply().chips,
    ];
    const dead = allChips
      .filter((chip) => chip.action.kind === 'route' && !routeResolves(chip.action.href))
      .map((chip) => chip.label);
    assert.deepEqual(dead, []);
  });

  it('anchors the all-services chip at the section that actually lists them', () => {
    assert.equal(ALL_SERVICES_HREF, '/#services');
    const accordion = repoFile('src/app/components/Sections/ServicesAccordion/ServicesAccordion.tsx');
    assert.ok(accordion.includes('id="services"'), 'the homepage services anchor moved, so the pod link is dead');
  });

  it('uses real schemes for external actions', () => {
    for (const entry of intents) {
      for (const chip of entry.respond(kb).chips) {
        if (chip.action.kind === 'external') {
          assert.match(chip.action.href, /^(tel:|mailto:|https:)/, `${entry.id} external chip "${chip.label}" has href "${chip.action.href}"`);
        }
      }
    }
  });

  it('keeps the escape hatch reachable from the table', () => {
    const missing = [...ALWAYS_RESOLVABLE].filter((id) => !byId.has(id));
    assert.deepEqual(missing, []);
  });

  it('answers the bot question with the published identity sentence', () => {
    const answer = blocksOf('smalltalk.areyouhuman').text;
    assert.ok(answer.startsWith('I am a bot.'), 'the identity answer must open with the plain admission');
    assert.ok(answer.includes(kb.studio.phone) && answer.includes(kb.studio.email));
  });

  it('never invents a price', () => {
    const pricing = blocksOf('pricing');
    assert.doesNotMatch(pricing.text, /₹|Rs\.|INR|\$|USD|lakh|crore/i);
    assert.ok(pricing.chips.some((chip) => chip.action.kind === 'intake'));
  });

  it('keeps the persistent menu at five entries', () => {
    assert.ok(PERSISTENT_MENU.length <= 5);
    assert.deepEqual(PERSISTENT_MENU.map((chip) => chip.label), [
      'Services',
      'Work',
      'How we work',
      'Talk to a person',
      'Start a project',
    ]);
  });

  it('transcribes the studio facts from the components that publish them', () => {
    const footer = repoFile('src/app/components/Sections/MonumentalFooter.tsx');
    const connect = repoFile('src/app/components/Sections/ConnectCutout.tsx');
    assert.ok(footer.includes(STUDIO.phone), 'phone no longer matches the footer');
    assert.ok(footer.includes('tel:+917012052472'), 'tel href no longer matches the footer');
    assert.ok(footer.includes(STUDIO.email) && footer.includes(STUDIO.careersEmail));
    for (const address of STUDIO.locations) assert.ok(footer.includes(address.split(',')[0]), `"${address}" is not in the footer`);
    assert.ok(connect.includes(STUDIO.pressEmail));
    for (const social of STUDIO.socials) {
      assert.ok(connect.includes(social.href), `social "${social.label}" is not published in ConnectCutout`);
    }
    assert.deepEqual(
      STUDIO.socials.map((social) => social.label),
      ['Instagram', 'LinkedIn', 'Twitter (X)', 'Vimeo', 'Substack'],
    );
  });

  it('transcribes the open roles from the dataset that publishes them', () => {
    const careers = repoFile('src/sanity/lib/career-queries.ts');
    for (const role of publishedRoles) {
      assert.ok(careers.includes(`"${role.slug}"`), `role slug "${role.slug}" is not in the fallback dataset`);
      assert.ok(careers.includes(role.title), `role "${role.title}" is not in the fallback dataset`);
    }
  });

  it('transcribes the four principles from the section that shows them', () => {
    const source = repoFile('src/app/components/HowWeWorkSection/HowWeWork.tsx');
    assert.equal(PROCESS_PRINCIPLES.length, 4);
    for (const principle of PROCESS_PRINCIPLES) {
      assert.ok(source.includes(principle.title), `"${principle.title}" is not in HowWeWork`);
      assert.ok(source.includes(principle.body), `"${principle.title}" body text drifted from HowWeWork`);
    }
  });

  it('offers only the timelines the brief form actually publishes', () => {
    assert.deepEqual(kb.timelines, INTAKE_TIMELINE_OPTIONS.map((option) => option.chipLabel));
    const text = blocksOf('process.timeline').text;
    for (const label of kb.timelines) {
      assert.ok(text.includes(label), `the timeline answer dropped the published option "${label}"`);
    }
    // The answer must not improvise a duration the form does not offer.
    const residue = authoredResidue(text);
    for (const match of residue.matchAll(/\b\d+\s*(day|days|week|weeks|month|months)\b/gi)) {
      assert.fail(`the timeline answer invents the duration "${match[0]}"`);
    }
  });

  it('keeps authored copy to the published voice: no banned vocabulary, no exclamations, no em dashes', () => {
    const offenders: string[] = [];
    const texts: [string, string][] = [
      ['session.open', blocksOfText(openingReply().blocks)],
      ...Object.entries({ soft: FALLBACK_REPLIES.soft(intents.slice(0, 3)), hard: FALLBACK_REPLIES.hard(), capped: FALLBACK_REPLIES.capped(kb) }).map(
        ([key, reply]) => [`fallback.${key}`, blocksOfText(reply.blocks)] as [string, string],
      ),
      ...intents.map((entry) => [entry.id, blocksOfText(entry.respond(kb).blocks)] as [string, string]),
    ];

    for (const [id, text] of texts) {
      const residue = authoredResidue(text);
      for (const term of BANNED_TERMS) {
        if (residue.toLowerCase().includes(term)) offenders.push(`${id}: banned term "${term}"`);
      }
      if (/!/.test(residue)) offenders.push(`${id}: exclamation mark in authored copy`);
      if (/—/.test(residue)) offenders.push(`${id}: em dash in authored copy`);
    }
    assert.deepEqual(offenders, []);
  });
});
