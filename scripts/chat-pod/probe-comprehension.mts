import { buildIndex, rank, resolve } from '@/app/chat-pod/engine/match';
import { compileKnowledgeBase } from '@/app/chat-pod/knowledge/compile';
import { buildIntentTable } from '@/app/chat-pod/knowledge/intents';
import { FALLBACK_FAQS } from '@/sanity/lib/faq-queries';
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

const { index, duplicates } = buildIndex(buildIntentTable(compileKnowledgeBase(sources)));

const DEFAULT_CASES = [
  'ok can you plese tell me abt th services',
  'what do you do',
  'tell me about the services',
  'what services do you offer',
  'can you plese help with pricing',
  'how much does a rebrand cost',
  'what is the weather in calicut',
  'i want a website',
  'do you do seo',
  'servces',
  'whta is marka ubi',
  'who are you',
  'can i see the work',
  'are you an agency',
  'start a project',
  'tell me about your team',
  'where are you based',
  'hello',
];

const cases = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_CASES;

console.log(`contested aliases: ${duplicates.length}`);
const collisions = [...index.residueOwners.entries()].filter(([, owners]) => owners.length > 1);
console.log(`residue collisions: ${collisions.length}`);
for (const [key, owners] of collisions) {
  console.log(`  [${key}] -> ${owners.map((o) => o.id).join(" | ")}`);
}

for (const input of cases.filter((entry) => !entry.includes(' >> '))) {
  const outcome = resolve(index, input, { locked: false });
  const top = rank(index, input)
    .slice(0, 3)
    .map((c) => `${c.intent.id}@${c.score.toFixed(3)}`)
    .join('  ');
  const verdict =
    outcome.kind === 'answer'
      ? `ANSWER ${outcome.intent.id} (${outcome.score.toFixed(3)})`
      : outcome.kind === 'disambiguate'
        ? 'DISAMBIGUATE'
        : 'FALLBACK';
  console.log(`${input.padEnd(40)} ${verdict.padEnd(34)} ${top}`);
}

// A conversation, resolved the way the engine resolves it: each turn is ranked cold first, and only a
// turn the cold pass could not answer is re-ranked against what the previous turn answered.
const SEQUENCES = [
  ['what do you do', 'tell me about the services', 'explain each service'],
  ['services', 'b2b', 'explain each service'],
  ['what do you do', 'how much does a rebrand cost', 'what is the process', 'and the timeline'],
  ['hello', 'can you build an app', 'tell me about that'],
  ['what do you do', 'what is the weather in calicut'],
];

console.log('\nsequences');
for (const turns of SEQUENCES) {
  let prior: string | null = null;
  console.log(`  ${turns.length} turns`);
  for (const turn of turns) {
    const outcome = resolve(index, turn, { locked: false, prior });
    prior = outcome.kind === 'answer' ? outcome.intent.id : null;
    const verdict = outcome.kind === 'answer' ? `ANSWER ${outcome.intent.id}` : outcome.kind.toUpperCase();
    console.log(`    ${turn.padEnd(36)} ${verdict}`);
  }
}
