import { compileKnowledgeBase } from '@/app/chat-pod/knowledge/compile';
import { FALLBACK_FAQS } from '@/sanity/lib/faq-queries';
import type { KnowledgeSources } from '@/app/chat-pod/knowledge/compile';

const sources: KnowledgeSources = {
  posts: [] as never,
  categories: [],
  faqs: FALLBACK_FAQS.map((faq) => ({ question: faq.question ?? '', answer: faq.answer })),
  careers: [],
};

const kb = compileKnowledgeBase(sources);
for (const service of kb.services) console.log(`${service.slug} | ${service.split} | ${service.title}`);
