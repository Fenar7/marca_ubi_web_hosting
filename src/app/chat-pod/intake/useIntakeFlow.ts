/**
 * @file useIntakeFlow.ts
 * @description The intake state machine: a pure `transition` plus the one React wrapper that calls it.
 *
 *              Purity is the point. Seventeen slots, a conditional required-contact rule, an
 *              idempotency key that must survive three retries, and an edit path that has to land back
 *              on the review card are exactly the logic that becomes untestable once it is spread
 *              across event handlers. As a pure function over `(state, event)`, every legal and every
 *              illegal transition is asserted in `chatpod-intake-fsm.test.ts` without a DOM.
 *
 *              Four invariants the rest of the module depends on:
 *              1. A required slot is never advanced past, and never skipped silently.
 *              2. The idempotency key is minted once per submission intent and reused by every retry,
 *                 because a retry under a new key creates a second lead.
 *              3. After the third failed submission round the next attempt mints a **new** key: the
 *                 old one may already be recorded server-side, and replaying it would return a cached
 *                 verdict for a request that never landed.
 *              4. Email and phone are individually optional but jointly required, matching the
 *                 `.refine()` in `ingestLeadSchema`. Skipping one promotes the other.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { useCallback, useMemo, useReducer } from "react";

import { SLOTS, SLOT_ORDER } from "./slots";
import type { SlotId, SlotValue } from "../types";

export type IntakeMode = "CHAT" | "INTAKE_FORM" | "REVIEW" | "SUBMITTING" | "HANDOFF" | "DONE" | "ERROR";

export interface IntakeState {
  mode: IntakeMode;
  /** Index into `SLOT_ORDER`, so `BACK` and `NEXT` can never land on a gap. */
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
}

export type IntakeEvent =
  | { t: "START_INTAKE" }
  | { t: "ANSWER"; slot: SlotId; value: SlotValue }
  | { t: "SKIP"; slot: SlotId }
  | { t: "NEXT" }
  | { t: "BACK" }
  | { t: "EDIT_SLOT"; slot: SlotId }
  | { t: "SUBMIT"; idempotencyKey: string }
  | { t: "RETRY"; idempotencyKey: string }
  | { t: "SUBMIT_OK" }
  | { t: "SUBMIT_FAIL"; status: number; message: string; slot?: SlotId }
  | { t: "EXIT_TO_CHAT" }
  | { t: "HANDOFF" }
  /** Clear the answers and return to chat. Separate from `EXIT_TO_CHAT`, which keeps them. */
  | { t: "RESET" };

/** Submission rounds after which the copy stops offering the same key back. */
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
  };
}

export function currentSlot(state: IntakeState): SlotId {
  return SLOT_ORDER[Math.min(state.slotIndex, SLOT_ORDER.length - 1)];
}

function isFilled(value: SlotValue): boolean {
  return Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0;
}

/**
 * Whether this slot must be answered before the review card is reachable. `phone` is required only
 * once `email` has been declined: the ingest schema needs one contact channel, not two.
 */
export function isRequired(slot: SlotId, state: IntakeState): boolean {
  if (slot === "phone") return state.phoneRequired;
  return SLOTS[slot].required;
}

/** Every required answer present, and at least one contact channel. Blocks `SUBMIT` otherwise. */
export function canSubmit(state: IntakeState): boolean {
  const required = SLOT_ORDER.filter((slot) => isRequired(slot, state));
  if (!required.every((slot) => isFilled(state.slots[slot]))) return false;
  return isFilled(state.slots.email) || isFilled(state.slots.phone);
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
      // Returning after `EXIT_TO_CHAT` resumes where the visitor stopped; the slots were kept on purpose.
      return { ...state, mode: "INTAKE_FORM", error: null, editing: false };
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

    case "NEXT": {
      if (state.mode !== "INTAKE_FORM") return state;
      const nextIndex = Math.min(state.slotIndex + 1, SLOT_ORDER.length - 1);
      const next = SLOT_ORDER[nextIndex];
      // Walking forward past a required question is not the same as skipping it.
      if (isRequired(next, state) && !state.editing && !isFilled(state.slots[next])) return state;
      return { ...state, slotIndex: nextIndex, error: null };
    }

    case "BACK": {
      if (state.mode !== "INTAKE_FORM" && state.mode !== "REVIEW") return state;
      return {
        ...state,
        mode: "INTAKE_FORM",
        slotIndex: Math.max(state.slotIndex - 1, 0),
        editing: false,
        error: null,
      };
    }

    case "SUBMIT": {
      // A re-entrant submit is refused rather than queued: two in flight under one key is precisely
      // the duplicate the key exists to prevent.
      if (state.mode === "SUBMITTING" || state.mode === "DONE") return state;
      if (state.mode !== "REVIEW" && state.mode !== "ERROR") return state;
      if (!canSubmit(state)) return { ...state, mode: "REVIEW", error: { message: "A couple of answers are still missing." } };
      return { ...state, mode: "SUBMITTING", error: null, idempotencyKey: state.idempotencyKey ?? event.idempotencyKey };
    }

    case "RETRY": {
      if (state.mode !== "ERROR") return state;
      // The round counter is deliberately not reset here: "after the third failed round, use a new
      // key" is only reachable if the rounds accumulate. Resetting it would retry the same dead key
      // forever and print the stop-after-three copy that never arrives.
      const key = state.attempt >= MAX_SUBMIT_ATTEMPTS ? event.idempotencyKey : (state.idempotencyKey ?? event.idempotencyKey);
      return { ...state, mode: "SUBMITTING", error: null, idempotencyKey: key };
    }

    case "SUBMIT_OK":
      return { ...initialIntakeState(), mode: "DONE" };

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

    case "HANDOFF":
      return { ...state, mode: "HANDOFF", error: null };

    case "EXIT_TO_CHAT":
      // Slots are kept deliberately: "stop asking questions" is not "throw my answers away".
      return { ...state, mode: "CHAT", error: null, editing: false };

    case "RESET":
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
