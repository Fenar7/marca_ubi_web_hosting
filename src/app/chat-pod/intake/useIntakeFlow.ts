/**
 * @file useIntakeFlow.ts
 * @description The intake state machine: a pure `transition` plus the one React wrapper that calls it.
 *
 *              Purity is the point. Seventeen slots, a conditional required-contact rule, an
 *              idempotency key that has to survive retries, and an edit path that has to land back on
 *              the review card are exactly the logic that becomes untestable once it is spread across
 *              event handlers. As a pure function over `(state, event)`, every legal and every illegal
 *              transition is asserted in `chatpod-intake-fsm.test.ts` without a DOM.
 *
 *              Five invariants the rest of the module depends on:
 *              1. A required slot is never advanced past, and never skipped silently.
 *              2. One key per submission intent, reused by every retry and recorded inside
 *                 `brief_payload`, so a human reading the CRM can see that three requests were one
 *                 brief. The deduplication itself is the route's: it matches an existing lead on email
 *                 or phone and merges into it (`ingest/route.ts`), and no server code reads this key,
 *                 so nothing here may claim to prevent a duplicate on its own.
 *              3. After the third failed round the pod stops offering to send, because a fourth attempt
 *                 on a route that is not answering is a waste of the visitor's time, not a fix.
 *              4. Email and phone are individually optional but jointly required, matching the
 *                 `.refine()` in `ingestLeadSchema`. Skipping one promotes the other.
 *              5. `SUBMITTING` is terminal until the request comes back. Nothing a key press can do
 *                 mid-flight may change the mode, because the effect that owns the response is cleaned
 *                 up the moment it is, and a lead the visitor never heard about is worse than a short
 *                 wait.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { useCallback, useMemo, useReducer } from "react";

import { replyChannel } from "./review";
import { SLOTS, SLOT_ORDER } from "./slots";
import type { SlotId, SlotValue } from "../types";

export type IntakeMode = "CHAT" | "INTAKE_FORM" | "REVIEW" | "SUBMITTING" | "DONE" | "ERROR";

export interface IntakeState {
  mode: IntakeMode;
  /** Index into `SLOT_ORDER`, so a resumed brief cannot land on a gap. */
  slotIndex: number;
  slots: Record<SlotId, SlotValue>;
  /** Slots the visitor actually answered. Drives which review rows are editable. */
  touched: SlotId[];
  /** Failed submission rounds, 0..`MAX_SUBMIT_ATTEMPTS`. */
  attempt: number;
  idempotencyKey: string | null;
  error: { slot?: SlotId; message: string } | null;
  /** Set once email is declined without a phone on file; promotes `phone` to required. */
  phoneRequired: boolean;
  /** Set by `EDIT_SLOT`: the next accepted answer returns to REVIEW instead of walking the tail. */
  editing: boolean;
  /**
   * Where the studio will reply, captured on the turn the send succeeded. `SUBMITTING` clears the
   * answers so a second brief starts blank, and the success line has to survive that.
   */
  sentTo: string;
}

export type IntakeEvent =
  | { t: "START_INTAKE" }
  | { t: "ANSWER"; slot: SlotId; value: SlotValue }
  | { t: "SKIP"; slot: SlotId }
  | { t: "EDIT_SLOT"; slot: SlotId }
  | { t: "SUBMIT"; idempotencyKey: string }
  | { t: "RETRY"; idempotencyKey: string }
  | { t: "SUBMIT_OK" }
  | { t: "SUBMIT_FAIL"; status: number; message: string; slot?: SlotId }
  | { t: "EXIT_TO_CHAT" }
  /**
   * Rehydrate a draft written earlier on this device. Only legal from chat, on the way in. Partial
   * because that is what storage holds: a brief abandoned at question three has no later keys at all.
   */
  | { t: "RESTORE_DRAFT"; slots: Partial<Record<SlotId, SlotValue>> }
  /** Clear the answers and return to chat. Separate from `EXIT_TO_CHAT`, which keeps them. */
  | { t: "RESET" };

/** Failed rounds after which the pod stops offering to send and points at a person instead. */
export const MAX_SUBMIT_ATTEMPTS = 3;

/** First slot of the optional tail. The panel prints its one bridge line when it enters this index. */
export const OPTIONAL_TAIL_START = SLOT_ORDER.indexOf("projectName");

const EMPTY_SLOTS: Record<SlotId, SlotValue> = {
  categories: [],
  services: [],
  timeline: "",
  name: "",
  email: "",
  phone: "",
  projectName: "",
  industry: "",
  projectDescription: "",
  website: "",
  instagram: "",
  language: "",
  agencyStatus: "",
  referral: "",
  inspirationLinks: [],
  showcasePermission: "",
  extraNotes: "",
};

export function initialIntakeState(): IntakeState {
  return {
    mode: "CHAT",
    slotIndex: 0,
    slots: { ...EMPTY_SLOTS },
    touched: [],
    attempt: 0,
    idempotencyKey: null,
    error: null,
    phoneRequired: false,
    editing: false,
    sentTo: "",
  };
}

export function currentSlot(state: IntakeState): SlotId {
  return SLOT_ORDER[Math.min(state.slotIndex, SLOT_ORDER.length - 1)];
}

function isFilled(value: SlotValue): boolean {
  return Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0;
}

/** Every question has an answer, which is the only condition under which a restored brief opens the card. */
function isComplete(slots: Record<SlotId, SlotValue>): boolean {
  return SLOT_ORDER.every((slot) => isFilled(slots[slot]));
}

/**
 * Where a resumed or restored brief starts asking: the first question with nothing in it. A brief with
 * no gap left returns the last index, and `START_INTAKE` sends that case straight to the card.
 */
function firstUnansweredIndex(slots: Record<SlotId, SlotValue>): number {
  const index = SLOT_ORDER.findIndex((slot) => !isFilled(slots[slot]));
  return index === -1 ? SLOT_ORDER.length - 1 : index;
}

/**
 * Whether this slot must be answered before the review card is reachable. `phone` is required only
 * once `email` has been declined: the ingest schema needs one contact channel, not two.
 */
export function isRequired(slot: SlotId, state: IntakeState): boolean {
  if (slot === "phone") return state.phoneRequired;
  return SLOTS[slot].required;
}

/** Every required answer present, and at least one contact channel. `SUBMIT` refuses a brief without it. */
export function canSubmit(state: IntakeState): boolean {
  const required = SLOT_ORDER.filter((slot) => isRequired(slot, state));
  if (!required.every((slot) => isFilled(state.slots[slot]))) return false;
  return isFilled(state.slots.email) || isFilled(state.slots.phone);
}

/**
 * The first question that makes this brief unsendable, in ask order, or `null` when it can go.
 *
 * `canSubmit` says only that something is missing; the panel cannot print that and leave the visitor
 * staring at a card with nothing to tap, because an emptied contact line is exactly the case where the
 * review card has no row left to edit. So the reason and the remedy come from one function.
 */
export function blockingSlot(state: IntakeState): SlotId | null {
  const missing = SLOT_ORDER.find((slot) => isRequired(slot, state) && !isFilled(state.slots[slot]));
  if (missing) return missing;
  return isFilled(state.slots.email) || isFilled(state.slots.phone) ? null : "email";
}

function withSlot(state: IntakeState, slot: SlotId, value: SlotValue): IntakeState {
  return {
    ...state,
    slots: { ...state.slots, [slot]: value },
    touched: state.touched.includes(slot) ? state.touched : [...state.touched, slot],
  };
}

/** Store the answer and move on, or open the review card once the tail is done. */
function advance(state: IntakeState, slot: SlotId, value: SlotValue): IntakeState {
  const filled = withSlot(state, slot, value);

  // Editing from the review card returns to the card, not to the next unanswered slot: the rest of the
  // tail was already offered, and walking it again would re-ask questions already answered.
  if (state.editing) return { ...filled, mode: "REVIEW", editing: false, error: null };

  const nextIndex = state.slotIndex + 1;
  if (nextIndex >= SLOT_ORDER.length) return { ...filled, mode: "REVIEW", error: null };

  return { ...filled, slotIndex: nextIndex, error: null };
}

/**
 * The machine. It never throws and never reads anything outside its arguments, so an unexpected event
 * returns the current state rather than a corrupted one: a lost answer is worse than a dead button.
 */
export function transition(state: IntakeState, event: IntakeEvent): IntakeState {
  switch (event.t) {
    case "START_INTAKE": {
      if (state.mode === "INTAKE_FORM" || state.mode === "REVIEW" || state.mode === "SUBMITTING") return state;
      // A brief that came back from storage with every answer in it opens the card rather than
      // re-asking the last question the visitor already answered.
      if (isComplete(state.slots)) return { ...state, mode: "REVIEW", error: null, editing: false, slotIndex: SLOT_ORDER.length - 1 };
      // Returning after `EXIT_TO_CHAT` resumes where the visitor stopped; the slots were kept on purpose.
      return { ...state, mode: "INTAKE_FORM", error: null, editing: false };
    }

    case "RESTORE_DRAFT": {
      if (state.mode !== "CHAT") return state;
      const merged: Record<SlotId, SlotValue> = { ...EMPTY_SLOTS };
      // Keys outside `SLOT_ORDER` are dropped and so is anything that is not a string or a list of
      // strings: this is the last stop before an answer is filed as a lead, and a stored object would
      // otherwise reach the CRM as `[object Object]` in a name field.
      for (const slot of SLOT_ORDER) {
        const value = event.slots[slot];
        if (typeof value === "string") merged[slot] = value;
        else if (Array.isArray(value)) merged[slot] = value.filter((item) => typeof item === "string");
      }
      return {
        ...state,
        slots: merged,
        touched: SLOT_ORDER.filter((slot) => isFilled(merged[slot])),
        // An empty email means the number carries the reply, exactly as it would have during the ask.
        phoneRequired: !isFilled(merged.email),
        slotIndex: firstUnansweredIndex(merged),
      };
    }

    case "ANSWER": {
      if (state.mode !== "INTAKE_FORM") return state;
      const slot = currentSlot(state);
      // A chip from a superseded turn must not answer a later slot.
      if (slot !== event.slot) return state;

      const outcome = SLOTS[slot].validate(event.value, state.slots);
      if (!outcome.ok) return { ...state, error: { slot, message: outcome.message } };

      const email = slot === "email" ? String(outcome.value ?? "") : null;
      if (email !== null && email.length === 0 && !isFilled(state.slots.phone)) {
        // Declining email is legal only while a number exists, so the number becomes the ask. The
        // reason is stated in the phone question itself rather than in a separate line.
        return advance({ ...state, phoneRequired: true }, slot, "");
      }
      return advance(state, slot, outcome.value);
    }

    case "SKIP": {
      if (state.mode !== "INTAKE_FORM") return state;
      const slot = currentSlot(state);
      if (slot !== event.slot) return state;

      if (isRequired(slot, state)) {
        return {
          ...state,
          error: { slot, message: "I need this one to send it. If you would rather not, I can stop here." },
        };
      }
      if (slot === "email" && !isFilled(state.slots.phone)) {
        return advance({ ...state, phoneRequired: true }, slot, "");
      }
      const empty: SlotValue = Array.isArray(state.slots[slot]) ? [] : "";
      return advance(state, slot, empty);
    }

    case "EDIT_SLOT": {
      if (state.mode !== "REVIEW") return state;
      const index = SLOT_ORDER.indexOf(event.slot);
      if (index === -1) return state;
      return { ...state, mode: "INTAKE_FORM", slotIndex: index, editing: true, error: null };
    }

    case "SUBMIT": {
      // A re-entrant submit is refused rather than queued: two in flight under one key is precisely
      // the duplicate the key exists to make visible.
      if (state.mode === "SUBMITTING" || state.mode === "DONE") return state;
      if (state.mode !== "REVIEW" && state.mode !== "ERROR") return state;
      // Invariant 3, enforced here as well as by the chip row: a fourth request to a route that is not
      // answering spends the visitor's time without spending anything of ours. Scoped to the failure
      // path on purpose, because a `422` also counts attempts and a brief that filled every field after
      // three of those is still a brief the visitor is entitled to send.
      if (state.mode === "ERROR" && state.attempt >= MAX_SUBMIT_ATTEMPTS) return state;

      const blocking = blockingSlot(state);
      if (blocking) {
        // Pressing send with a hole in the brief goes back to the one question that is empty, with the
        // reason above it. A card that says "something is missing" and offers nothing to tap is the
        // dead end this machine is supposed to make impossible.
        return {
          ...state,
          mode: "INTAKE_FORM",
          slotIndex: SLOT_ORDER.indexOf(blocking),
          editing: true,
          error: { slot: blocking, message: `I still need ${SLOTS[blocking].label.toLowerCase()} before I can send this.` },
        };
      }
      return { ...state, mode: "SUBMITTING", error: null, idempotencyKey: state.idempotencyKey ?? event.idempotencyKey };
    }

    case "RETRY": {
      if (state.mode !== "ERROR") return state;
      if (state.attempt >= MAX_SUBMIT_ATTEMPTS) return state;
      // One key for the whole submission intent, so the three requests a struggling network produced
      // stay recognisable as one brief in `brief_payload`.
      return { ...state, mode: "SUBMITTING", error: null, idempotencyKey: state.idempotencyKey ?? event.idempotencyKey };
    }

    case "SUBMIT_OK":
      return { ...initialIntakeState(), mode: "DONE", sentTo: replyChannel(state.slots) };

    case "SUBMIT_FAIL": {
      const attempt = state.attempt + 1;

      // A 422 names the field, so the visitor goes back to the one question that failed instead of
      // being told "something was wrong" after they already pressed send.
      if (event.status === 422 && event.slot) {
        const index = SLOT_ORDER.indexOf(event.slot);
        return {
          ...state,
          mode: "INTAKE_FORM",
          attempt,
          slotIndex: index === -1 ? state.slotIndex : index,
          editing: true,
          error: { slot: event.slot, message: event.message },
        };
      }
      return { ...state, mode: "ERROR", attempt, error: { message: event.message } };
    }

    case "EXIT_TO_CHAT":
      // Refused mid-flight. Leaving intake changes the mode, the effect that owns the in-flight request
      // is torn down with it, and the visitor is left holding a lead the studio may already have.
      // `ChatPod.tsx` keeps the control out of reach as well; this is the half that cannot be bypassed.
      if (state.mode === "SUBMITTING") return state;
      // Slots are kept deliberately: "stop asking questions" is not "throw my answers away".
      return { ...state, mode: "CHAT", error: null, editing: false };

    case "RESET":
      if (state.mode === "SUBMITTING") return state;
      return initialIntakeState();

    default: {
      const unhandled: never = event;
      return unhandled;
    }
  }
}

export interface IntakeFlow {
  state: IntakeState;
  /** The slot being asked right now, or `null` outside intake. */
  slot: SlotId | null;
  send: (event: IntakeEvent) => void;
}

/**
 * React binding for the machine. Nothing else in the pod holds intake state, which is why the review
 * card, the draft writer and the submit call all read the same `state.slots` object.
 */
export function useIntakeFlow(): IntakeFlow {
  const [state, dispatch] = useReducer(transition, undefined, initialIntakeState);
  const send = useCallback((event: IntakeEvent) => dispatch(event), []);
  const slot = state.mode === "INTAKE_FORM" ? currentSlot(state) : null;

  return useMemo<IntakeFlow>(() => ({ state, slot, send }), [state, slot, send]);
}
