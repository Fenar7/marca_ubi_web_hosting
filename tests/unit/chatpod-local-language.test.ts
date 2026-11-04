import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildIndex, resolve } from '@/app/chat-pod/engine/match';
import { interpretRequest, looksLikeQuestion } from '@/app/chat-pod/engine/normalise';
import { compileKnowledgeBase } from '@/app/chat-pod/knowledge/compile';
import { buildIntentTable, openingReply } from '@/app/chat-pod/knowledge/intents';
import { FALLBACK_FAQS } from '@/sanity/lib/faq-queries';

const kb = compileKnowledgeBase({ posts: [], categories: [], careers: [], faqs: FALLBACK_FAQS.map((faq) => ({ question: faq.question ?? '', answer: faq.answer })) });
const table = buildIntentTable(kb);
const { index } = buildIndex(table);

describe('local request and answer contract', () => {
  it('answers broad service requests independently of courtesy wording', () => {
    for (const phrase of ['let me know about your services', 'please let me know about your services', 'let me knw abt ur services', 'i need information about your services', 'what are the services you do', 'can you explain your services']) {
      const result = resolve(index, phrase, { locked: false });
      assert.equal(result.kind === 'answer' ? result.intent.id : result.kind, 'services.overview', phrase);
      assert.equal(looksLikeQuestion(phrase), true, `${phrase} must also detour during intake`);
    }
  });

  it('keeps unknown subjects and field values intact', () => {
    assert.deepEqual(interpretRequest('let me know about printer repairs'), { query: 'printer repairs', wrapper: 'let me know' });
    for (const name of ['Brand & Co', 'The Marketing Club', 'Arjun Mehta', 'Let It Be']) assert.equal(interpretRequest(name).wrapper, null);
    for (const phrase of ['let me know about printer repairs', 'let me know about services for visa letters']) {
      assert.notEqual(resolve(index, phrase, { locked: false }).kind, 'answer', phrase);
    }
  });

  it('explains the work before offering optional audience choices', () => {
    const reply = table.find((intent) => intent.id === 'services.overview')!.respond(kb);
    assert.ok(reply.blocks[0].t === 'p' && reply.blocks[0].text.includes('marketing campaigns'));
    assert.ok(!JSON.stringify(reply.blocks).includes('Who do you sell to'));
    assert.ok(reply.chips.some((chip) => chip.action.kind === 'intent' && chip.action.id === 'services.catalogue'));
    const overview = openingReply().chips.find((chip) => chip.label === 'Explore services');
    assert.deepEqual(overview?.action, { kind: 'intent', id: 'services.overview' });
    const wrappedIdentity = resolve(index, 'can yu tell me what u do', { locked: false });
    assert.equal(wrappedIdentity.kind === 'answer' ? wrappedIdentity.intent.id : wrappedIdentity.kind, 'identity.studio');
  });

  it('distinguishes catalogue requests, capability questions, and consent to start a brief', () => {
    for (const phrase of ['all services', 'explain each service', 'b2b and b2c']) {
      const result = resolve(index, phrase, { locked: false });
      assert.equal(result.kind === 'answer' ? result.intent.id : result.kind, 'services.catalogue', phrase);
    }
    for (const phrase of ['can you build a website', 'can you build an app', 'do you do ui ux']) {
      const result = resolve(index, phrase, { locked: false });
      assert.equal(result.kind === 'answer' ? result.intent.id : result.kind, 'capabilities.digital', phrase);
    }
    assert.equal(resolve(index, 'start a project', { locked: false }).kind, 'answer');
  });

  it('never silently performs a negated request or discards one of two topics', () => {
    for (const phrase of ['i do not want to start a project', 'not branding i need pr', 'services and pricing']) {
      assert.notEqual(resolve(index, phrase, { locked: false }).kind, 'answer', phrase);
    }
  });

  it('retains exact supported information after repeated misses', () => {
    for (const phrase of ['services', 'pricing', 'contact']) {
      assert.equal(resolve(index, phrase, { locked: true }).kind, 'answer', phrase);
    }
    assert.notEqual(resolve(index, 'printer repair for my office', { locked: true }).kind, 'answer');
  });
});
