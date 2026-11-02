/**
 * @file persistence.ts
 * @description The pod's only storage. A visitor who closes the panel mid-conversation should find
 *              it again on the same device, and a visitor who never comes back should not leave a
 *              record behind. Both halves are this file's job, and neither half touches a server:
 *              everything here stays in `localStorage`, which is what lets the privacy line in the
 *              header be true rather than aspirational.
 *
 *              Deliberately not a hook and deliberately pure-ish: the read and write are separated
 *              from the scheduling so `ChatPod.tsx` owns when storage happens, and so the expiry
 *              arithmetic can be asserted without a browser.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import type { SlotId, SlotValue, TranscriptMessage } from "./types";
import { DRAFT_RETENTION_DAYS } from "./knowledge/corpus";

/**
 * Bumped whenever the stored shape changes in a way an old draft cannot be read safely. The version
 * lives here rather than beside the data because the reader needs it before it needs anything else.
 */
export const DRAFT_KEY = "mubi.pod.draft.v1";

/**
 * The nudge flag is per session, not per device: D5 and §05 §1.6 allow one cue per session, so a
 * returning visitor next week is allowed to be asked once again. Deliberately separate from
 * `DRAFT_KEY`, which is the only thing here that holds anything the visitor typed.
 */
export const NUDGE_KEY = "mubi.pod.nudged";

/**
 * Consent to keep a draft on this device. Stored apart from the draft itself because a visitor who
 * withdraws it has to have the deletion happen here rather than in whichever component noticed.
 */
export const CONSENT_KEY = "mubi.pod.consent";

/**
 * Cap on restored rows. The transcript is conversation, not an archive: past this the visitor is
 * reading history they can already see on screen, and the JSON is doing nothing but costing quota.
 */
export const DRAFT_MESSAGE_LIMIT = 40;

export interface PodDraft {
  version: 1;
  savedAt: string;
  messages: TranscriptMessage[];
  slots: Partial<Record<SlotId, SlotValue>>;
  /** Persisted so a returning visitor's third failed question is still their third failed question. */
  fallbackCount: number;
}

/**
 * True when a draft older than the retention window is still sitting in storage. Written as a pure
 * function over the timestamp so the retention rule is assertable without a clock in the test.
 */
export function isExpired(savedAt: string, now: number): boolean {
  const stored = Date.parse(savedAt);
  if (Number.isNaN(stored)) return true;
  return now - stored > DRAFT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
}

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch (error) {
    // Private browsing on Safari and a blocked-cookies browser both throw on access rather than
    // returning null. The pod works without memory; it cannot work if this escapes to React.
    noteUnavailable("localStorage", error);
    return null;
  }
}

/** Session storage is the nudge's own scope, and it fails the same way `storage()` does. */
function session(): Storage | null {
  try {
    return window.sessionStorage;
  } catch (error) {
    noteUnavailable("sessionStorage", error);
    return null;
  }
}

/**
 * Every path in this file that loses data says so. A draft disappearing on a corrupt entry, a quota
 * refusal or an unavailable store is invisible in the UI, so without a console line there is no trace
 * left for anyone debugging a "it forgot my answers" report. The one-shot flag covers the store-level
 * cases, which repeat on every read and every write once they fail.
 */
let unavailableNoted = false;

function noteUnavailable(kind: string, error: unknown): void {
  if (unavailableNoted) return;
  unavailableNoted = true;
  console.warn(`[chat-pod] ${kind} is unavailable, so the pod keeps no draft on this device`, error);
}

function noteDiscardedDraft(reason: string): void {
  console.warn(`[chat-pod] discarded the stored draft: ${reason}`);
}

/**
 * A flag write has the same failure modes as a draft write, and the same remedy: say so and carry on.
 * An unguarded `setItem` throws inside the click handler on a quota-full or blocked-storage browser,
 * and losing the nudge marker is not worth a broken panel.
 */
function writeFlag(store: Storage | null, key: string, value: string): void {
  if (!store) return;
  try {
    store.setItem(key, value);
  } catch (error) {
    console.warn(`[chat-pod] the ${key} flag could not be written, so this session keeps no marker`, error);
  }
}

/**
 * Reading and deleting fail the same way writing does once cookies are blocked: the `Storage` object
 * exists and the method throws. Both are wrapped so a locked-down browser costs the visitor their
 * memory of the conversation and nothing else.
 */
function readKey(store: Storage | null, key: string): string | null {
  if (!store) return null;
  try {
    return store.getItem(key);
  } catch (error) {
    console.warn(`[chat-pod] ${key} could not be read, so this view starts without it`, error);
    return null;
  }
}

function removeKey(store: Storage | null, key: string): void {
  if (!store) return;
  try {
    store.removeItem(key);
  } catch (error) {
    console.warn(`[chat-pod] ${key} could not be removed`, error);
  }
}

/**
 * True when every entry is a string or a list of strings, which is the only thing the draft writer ever
 * stores for an answer. Which keys are legal is the intake machine's business; this boundary only
 * guarantees the values cannot be an object that reaches the CRM as `[object Object]`.
 */
function isSlotMap(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value as Record<string, unknown>).every(
    (entry) => typeof entry === "string" || (Array.isArray(entry) && entry.every((item) => typeof item === "string")),
  );
}

/**
 * The rendered contract of a message, checked before it is painted. `Block` reads `block.text`,
 * `item.href.startsWith()` and `item.label` straight off this data, so one hand-edited entry would
 * throw during render rather than be dropped here.
 */
function isBlocks(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return value.every((raw) => {
    if (typeof raw !== "object" || raw === null) return false;
    const block = raw as { t?: unknown; text?: unknown; items?: unknown };
    if (block.t === "p") return typeof block.text === "string";
    if (block.t !== "list" && block.t !== "links") return false;
    if (!Array.isArray(block.items)) return false;
    return block.items.every((item) => {
      if (typeof item !== "object" || item === null) return false;
      const entry = item as { label?: unknown; href?: unknown };
      if (typeof entry.label !== "string") return false;
      return block.t === "links" ? typeof entry.href === "string" : true;
    });
  });
}

/** Review rows print a label and a value as text, so anything but a string pair is dropped. */
function isReviewRows(value: unknown): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value)) return false;
  return value.every((raw) => {
    if (typeof raw !== "object" || raw === null) return false;
    const row = raw as { label?: unknown; value?: unknown };
    return typeof row.label === "string" && typeof row.value === "string";
  });
}

export function readDraft(): PodDraft | null {
  const store = storage();
  if (!store) return null;

  const raw = readKey(store, DRAFT_KEY);
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    noteDiscardedDraft("it is not valid JSON");
    removeKey(store, DRAFT_KEY);
    return null;
  }

  if (!isDraft(parsed)) {
    noteDiscardedDraft("its shape is not a readable draft");
    removeKey(store, DRAFT_KEY);
    return null;
  }
  if (isExpired(parsed.savedAt, Date.now())) {
    noteDiscardedDraft(`it is older than the ${DRAFT_RETENTION_DAYS}-day window`);
    removeKey(store, DRAFT_KEY);
    return null;
  }
  return parsed;
}

/**
 * Structural validation rather than trust: the value comes back off disk with no guarantees, and a
 * hand-edited entry would otherwise be rendered as a message. Anything that is not exactly what the
 * writer writes is dropped.
 */
function isDraft(value: unknown): value is PodDraft {
  if (typeof value !== "object" || value === null) return false;
  const draft = value as Partial<PodDraft>;
  return (
    draft.version === 1 &&
    typeof draft.savedAt === "string" &&
    Array.isArray(draft.messages) &&
    typeof draft.fallbackCount === "number" &&
    isSlotMap(draft.slots) &&
    draft.messages.every(isMessage)
  );
}

function isMessage(value: unknown): value is TranscriptMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Partial<TranscriptMessage>;
  return (
    typeof message.id === "string" &&
    (message.speaker === "assistant" || message.speaker === "visitor") &&
    isBlocks(message.blocks) &&
    isReviewRows(message.reviewRows) &&
    typeof message.time === "string" &&
    typeof message.timeFull === "string"
  );
}

/**
 * Writes the tail of the conversation. Quota failures and serialisation errors are both "storage is
 * unavailable today", not "the conversation is broken", so the caller is told which happened and the
 * panel keeps working from memory.
 */
export function writeDraft(draft: Omit<PodDraft, "version" | "savedAt">): boolean {
  const store = storage();
  if (!store) return false;

  const payload: PodDraft = {
    version: 1,
    savedAt: new Date().toISOString(),
    messages: draft.messages.slice(-DRAFT_MESSAGE_LIMIT),
    slots: draft.slots,
    fallbackCount: draft.fallbackCount,
  };

  try {
    store.setItem(DRAFT_KEY, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.warn("[chat-pod] the draft could not be written, so this conversation stays in memory only", error);
    return false;
  }
}

export function clearDraft(): void {
  removeKey(storage(), DRAFT_KEY);
}

/** Whether this session has already been nudged once. Resets when the tab closes, by design. */
export function hasBeenNudged(): boolean {
  return readKey(session(), NUDGE_KEY) === "1";
}

export function markNudged(): void {
  writeFlag(session(), NUDGE_KEY, "1");
}

/**
 * Three states, not two. `null` means the visitor has never been asked, which is the only condition
 * under which the panel is allowed to show the consent block; a flat boolean would either nag someone
 * who already said no or silently save for someone who never answered.
 */
export function hasGrantedConsent(): boolean | null {
  const stored = readKey(storage(), CONSENT_KEY);
  if (stored === "true") return true;
  if (stored === "false") return false;
  return null;
}

export function recordConsent(allowed: boolean): void {
  writeFlag(storage(), CONSENT_KEY, allowed ? "true" : "false");
}
