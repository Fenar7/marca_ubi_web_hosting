/**
 * @file chatpod-persistence.test.ts
 * @description Proves the two promises the pod makes about a visitor's words: they come back on this
 *              device, and they never leave it.
 *
 *              `persistence.ts` is the only place the pod remembers anything, and every branch of it
 *              is a decision about someone's data: what is trustworthy enough to repaint, how long a
 *              brief is kept, and what happens on the browsers that refuse storage rather than
 *              returning null. Those are all silent failures: a visitor sees a panel that simply
 *              forgot, and the only trace is a console line, so they are asserted here instead of
 *              inferred from the happy path.
 *
 *              `window` is replaced per test rather than once for the file, because the interesting
 *              cases are the ones where accessing it throws.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  CONSENT_KEY,
  DRAFT_KEY,
  DRAFT_MESSAGE_LIMIT,
  NUDGE_KEY,
  clearDraft,
  hasBeenNudged,
  hasGrantedConsent,
  isExpired,
  markNudged,
  readDraft,
  recordConsent,
  writeDraft,
} from '@/app/chat-pod/persistence';
import { DRAFT_RETENTION_DAYS } from '@/app/chat-pod/knowledge/corpus';
import type { PodDraft } from '@/app/chat-pod/persistence';
import type { SlotId, TranscriptMessage } from '@/app/chat-pod/types';

const DAY_MS = 24 * 60 * 60 * 1000;

interface StoreStub {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  readonly keys: () => string[];
}

function memoryStore(): StoreStub {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
    keys: () => [...data.keys()],
  };
}

interface Fixture {
  local: StoreStub;
  session: StoreStub;
  /** Raw access to the stored text, for entries the writer would never produce. */
  put(key: string, value: string): void;
}

/**
 * The three ways a browser can decline to remember, each of which the module survives differently:
 *
 * - `no-store`: Safari private browsing and a cookies-blocked Chrome, where reading
 *   `window.localStorage` throws before any method is reached.
 * - `method-fails`: the store object exists and every call on it throws, which is what the guarded
 *   `readKey`/`removeKey`/`writeFlag` helpers are for.
 * - `write-fails`: a working browser whose disk is full. Reads succeed, one write is refused.
 */
type BrowserMode = 'working' | 'no-store' | 'method-fails' | 'write-fails';

function installWindow(mode: BrowserMode = 'working'): Fixture {
  const local = memoryStore();
  const session = memoryStore();
  const deny = (message: string) => {
    throw new Error(message);
  };
  const grate = (store: StoreStub): StoreStub => ({
    getItem: (key) => (mode === 'method-fails' ? deny('SecurityError: read denied') : store.getItem(key)),
    setItem: (key, value) => {
      if (mode === 'method-fails') deny('SecurityError: write denied');
      if (mode === 'write-fails') deny('QuotaExceededError');
      store.setItem(key, value);
    },
    removeItem: (key) => (mode === 'method-fails' ? deny('SecurityError: delete denied') : store.removeItem(key)),
    keys: store.keys,
  });
  const localGrate = grate(local);
  const sessionGrate = grate(session);

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      get localStorage() {
        return mode === 'no-store' ? deny('SecurityError: storage access is denied') : localGrate;
      },
      get sessionStorage() {
        return mode === 'no-store' ? deny('SecurityError: storage access is denied') : sessionGrate;
      },
    },
  });
  return { local: localGrate, session: sessionGrate, put: (key, value) => local.setItem(key, value) };
}

function uninstallWindow(): void {
  Reflect.deleteProperty(globalThis, 'window');
}

/**
 * Runs a call with `console.warn` captured. Every data-losing branch in the module is invisible in
 * the UI, so the log line is the whole audit trail and has to be part of the assertion, not an
 * accident of the implementation.
 */
function withWarnings<T>(run: () => T): { value: T; notes: string[] } {
  const notes: string[] = [];
  const original = console.warn;
  console.warn = (message?: unknown): void => void notes.push(String(message));
  try {
    return { value: run(), notes };
  } finally {
    console.warn = original;
  }
}

function turn(id: string, speaker: 'assistant' | 'visitor' = 'assistant'): TranscriptMessage {
  return { id, speaker, blocks: [{ t: 'p', text: 'A sentence.' }], time: '14:02', timeFull: '2 Nov 2026, 14:02' };
}

function draft(overrides: Partial<Omit<PodDraft, 'version' | 'savedAt'>> = {}): Omit<PodDraft, 'version' | 'savedAt'> {
  return {
    messages: [turn('t1'), turn('t2', 'visitor')],
    slots: { name: 'Asha Menon', categories: ['Logo & identity'] } as Partial<Record<SlotId, string | string[] | null>>,
    fallbackCount: 1,
    ...overrides,
  };
}

/** Writes an entry exactly as stored, bypassing the writer so a hostile shape can be tested. */
function putRaw(store: Fixture, payload: unknown): void {
  store.put(DRAFT_KEY, typeof payload === 'string' ? payload : JSON.stringify(payload));
}

function draftShape(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    messages: [turn('t1')],
    slots: { name: 'Asha Menon' },
    fallbackCount: 0,
    ...overrides,
  };
}

describe('Chat Pod persistence', () => {
  describe('the retention window', () => {
    const now = Date.parse('2026-11-02T09:00:00.000Z');

    it('keeps a brief saved inside the window it promises', () => {
      assert.equal(isExpired(new Date(now - (DRAFT_RETENTION_DAYS - 1) * DAY_MS).toISOString(), now), false);
    });

    it('discards one saved past it', () => {
      assert.equal(isExpired(new Date(now - DRAFT_RETENTION_DAYS * DAY_MS - 60_000).toISOString(), now), true);
    });

    it('reads an unparseable timestamp as expired, not as fresh', () => {
      assert.equal(isExpired('tomorrow-ish', now), true);
      assert.equal(isExpired('', now), true);
    });

    it('is the same number the pod says out loud', () => {
      assert.equal(DRAFT_RETENTION_DAYS, 14);
    });
  });

  describe('a working browser', () => {
    it('round-trips additive service interest and company slots without rewriting legacy values', () => {
      installWindow();
      try {
        const slots = { serviceInterest: ['account-based-marketing'], company: 'Acme Ltd', projectName: 'Launch', services: ['Postcard, flyer or print'] };
        assert.equal(writeDraft(draft({ slots })), true);
        assert.deepEqual(readDraft()?.slots, slots);
      } finally {
        uninstallWindow();
      }
    });

    it('brings back the answers exactly as they were given', () => {
      installWindow();
      try {
        const { value: written } = withWarnings(() => writeDraft(draft()));
        assert.equal(written, true);
        const { value: read } = withWarnings(() => readDraft());
        assert.ok(read);
        assert.deepEqual(read.slots, draft().slots);
        assert.deepEqual(read.messages.map((message) => message.id), ['t1', 't2']);
        assert.equal(read.fallbackCount, 1);
        assert.equal(read.version, 1);
      } finally {
        uninstallWindow();
      }
    });

    it('keeps the tail of the conversation and drops the oldest rows', () => {
      installWindow();
      try {
        const long = Array.from({ length: DRAFT_MESSAGE_LIMIT + 5 }, (_, index) => turn(`t${index + 1}`));
        assert.equal(writeDraft(draft({ messages: long })), true);
        const read = readDraft();
        assert.equal(read?.messages.length, DRAFT_MESSAGE_LIMIT);
        assert.equal(read?.messages[0].id, 't6', 'the first restored row is the oldest one still inside the cap');
        assert.equal(read?.messages.at(-1)?.id, `t${DRAFT_MESSAGE_LIMIT + 5}`);
      } finally {
        uninstallWindow();
      }
    });

    it('forgets the brief without touching the consent answer', () => {
      const store = installWindow();
      try {
        recordConsent(true);
        writeDraft(draft());
        clearDraft();
        assert.equal(readDraft(), null);
        assert.equal(store.local.getItem(DRAFT_KEY), null);
        assert.equal(hasGrantedConsent(), true, 'declining to remember is not a reason to forget the visitor said no');
      } finally {
        uninstallWindow();
      }
    });

    it('discards an expired entry and deletes it rather than re-reading it every visit', () => {
      const store = installWindow();
      try {
        putRaw(store, draftShape({ savedAt: new Date(Date.now() - (DRAFT_RETENTION_DAYS + 1) * DAY_MS).toISOString() }));
        const { value, notes } = withWarnings(() => readDraft());
        assert.equal(value, null);
        assert.equal(store.local.getItem(DRAFT_KEY), null);
        assert.match(notes.join('\n'), /older than the 14-day window/);
      } finally {
        uninstallWindow();
      }
    });
  });

  describe('a draft that cannot be painted is never restored', () => {
    const CASES: { label: string; payload: unknown }[] = [
      { label: 'not JSON', payload: '{name:' },
      { label: 'JSON that is not an object', payload: '"a conversation"' },
      { label: 'another version', payload: draftShape({ version: 2 }) },
      { label: 'no messages array', payload: draftShape({ messages: { t1: 'hi' } }) },
      { label: 'a message with no id', payload: draftShape({ messages: [{ speaker: 'assistant', blocks: [] }] }) },
      { label: 'a speaker the pod never uses', payload: draftShape({ messages: [{ ...turn('t1'), speaker: 'crm' }] }) },
      { label: 'an answer value that is an object', payload: draftShape({ slots: { name: { first: 'Asha' } } }) },
      { label: 'an answer value that is a list of numbers', payload: draftShape({ slots: { categories: [1, 2] } }) },
      { label: 'a prose block with no text', payload: draftShape({ messages: [{ ...turn('t1'), blocks: [{ t: 'p' }] }] }) },
      { label: 'a block type that does not exist', payload: draftShape({ messages: [{ ...turn('t1'), blocks: [{ t: 'html', text: '<b>' }] }] }) },
      {
        label: 'a link with no href',
        payload: draftShape({ messages: [{ ...turn('t1'), blocks: [{ t: 'links', items: [{ label: 'Blog' }] }] }] }),
      },
      {
        label: 'a review row whose value is an object',
        payload: draftShape({ messages: [{ ...turn('t1'), kind: 'review', reviewRows: [{ slot: 'name', label: 'Name', value: {} }] }] }),
      },
    ];

    for (const { label, payload } of CASES) {
      it(`drops a stored draft that is ${label}`, () => {
        const store = installWindow();
        try {
          putRaw(store, payload);
          const { value, notes } = withWarnings(() => readDraft());
          assert.equal(value, null, `${label} must not reach the transcript`);
          assert.equal(store.local.getItem(DRAFT_KEY), null, 'the unreadable entry is deleted, not merely ignored');
          assert.ok(notes.length > 0, `${label} was discarded silently`);
        } finally {
          uninstallWindow();
        }
      });
    }

    it('keeps a list of links that carries both halves of each entry', () => {
      const store = installWindow();
      try {
        const withLinks = turn('t1');
        withLinks.blocks = [{ t: 'links', items: [{ label: 'Journal', href: '/blog', sub: 'Writing' }] }];
        putRaw(store, draftShape({ messages: [withLinks] }));
        assert.ok(readDraft(), 'a real link block is renderable and must survive');
      } finally {
        uninstallWindow();
      }
    });

    it('treats a missing review-rows key as no rows rather than a corrupt message', () => {
      const store = installWindow();
      try {
        putRaw(store, draftShape({ messages: [{ ...turn('t1'), reviewRows: undefined }] }));
        assert.ok(readDraft());
      } finally {
        uninstallWindow();
      }
    });
  });

  describe('a browser that refuses storage', () => {
    it('remembers nothing, says so once and never throws', () => {
      installWindow('no-store');
      try {
        const { value, notes } = withWarnings(() => ({
          read: readDraft(),
          wrote: writeDraft(draft()),
          nudged: hasBeenNudged(),
          consent: hasGrantedConsent(),
          clear: clearDraft(),
          mark: markNudged(),
          record: recordConsent(true),
        }));
        assert.equal(value.read, null);
        assert.equal(value.wrote, false, 'a failed write is reported to the caller, which then keeps the conversation in memory');
        assert.equal(value.nudged, false);
        assert.equal(value.consent, null, 'a browser with no storage cannot have been asked yet');

        const availability = notes.filter((line) => line.includes('unavailable'));
        assert.ok(availability.length >= 1, 'the loss of memory must be visible in the log');
        assert.equal(availability.length, 1, `one failing store is reported once, not on every call (saw ${availability.length})`);
      } finally {
        uninstallWindow();
      }
    });

    it('survives a store whose every method throws, not only one that is absent', () => {
      installWindow('method-fails');
      try {
        const { value, notes } = withWarnings(() => ({
          read: readDraft(),
          wrote: writeDraft(draft()),
          nudged: hasBeenNudged(),
          clear: clearDraft(),
        }));
        assert.equal(value.read, null);
        assert.equal(value.wrote, false);
        assert.equal(value.nudged, false);
        assert.equal(value.clear, undefined);
        assert.match(notes.join('\n'), new RegExp(`${DRAFT_KEY} could not be read`));
        assert.match(notes.join('\n'), new RegExp(`${DRAFT_KEY} could not be removed`));
      } finally {
        uninstallWindow();
      }
    });

    it('keeps the conversation when the disk is full', () => {
      installWindow('write-fails');
      try {
        const { value, notes } = withWarnings(() => writeDraft(draft()));
        assert.equal(value, false);
        assert.match(notes.join('\n'), /stays in memory only/);
        assert.equal(readDraft(), null);
      } finally {
        uninstallWindow();
      }
    });

    it('survives a flag write that the browser refuses', () => {
      installWindow('write-fails');
      try {
        const { notes } = withWarnings(() => {
          markNudged();
          recordConsent(true);
        });
        assert.match(notes.join('\n'), /mubi\.pod\.nudged flag could not be written/);
        assert.match(notes.join('\n'), /mubi\.pod\.consent flag could not be written/);
      } finally {
        uninstallWindow();
      }
    });
  });

  describe('the two flags', () => {
    it('keeps the nudge marker in the session, so next week is allowed a cue', () => {
      const store = installWindow();
      try {
        assert.equal(hasBeenNudged(), false);
        markNudged();
        assert.equal(hasBeenNudged(), true);
        assert.equal(store.session.getItem(NUDGE_KEY), '1');
        assert.equal(store.local.keys().includes(NUDGE_KEY), false, 'a per-session marker that outlives the tab is a per-device cue');
      } finally {
        uninstallWindow();
      }
    });

    it('answers consent with three states, because "no" and "never asked" are different', () => {
      const store = installWindow();
      try {
        assert.equal(hasGrantedConsent(), null);
        recordConsent(true);
        assert.equal(hasGrantedConsent(), true);
        recordConsent(false);
        assert.equal(hasGrantedConsent(), false);
        assert.equal(store.local.getItem(CONSENT_KEY), 'false');
      } finally {
        uninstallWindow();
      }
    });

    it('does not invent consent out of a value that is neither', () => {
      const store = installWindow();
      try {
        store.put(CONSENT_KEY, 'maybe');
        assert.equal(hasGrantedConsent(), null);
      } finally {
        uninstallWindow();
      }
    });
  });
});
