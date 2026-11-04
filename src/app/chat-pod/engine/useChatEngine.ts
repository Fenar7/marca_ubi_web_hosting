/**
 * @file useChatEngine.ts
 * @description The resolver, wrapped once. It owns three pieces of state that are not React's business:
 *              the compiled index (built per corpus, never per message), the fallback counter (which
 *              decides when the pod stops guessing), and the previous turn (which is what makes "tell
 *              me more" and "the second one" mean anything). Everything else is a pure call into
 *              `match.ts`, `context.ts` and `intents.ts`.
 *
 *              The counter lives here rather than in the component so the lock rule has exactly one
 *              implementation, and so the two-strike behaviour cannot drift between surfaces. The turn
 *              lives here for the same reason: only the resolver knows what an answer was about, and a
 *              component that re-creates itself on every keystroke is the wrong place to remember it.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { useMemo, useRef } from "react";

import { FALLBACK_REPLIES, buildIntentTable, openingReply } from "../knowledge/intents";
import type { Chip, KnowledgeBase, Reply } from "../types";
import { exhausted, followUp, handOver, record, type TurnState } from "./context";
import { FALLBACK_LIMIT, buildIndex, isAuthoredName, resolve } from "./match";

/**
 * One resolved message. `offer` is the shape a reference to the screen produces: the visitor named or
 * numbered something that is a control rather than a subject, a page or the brief, so there is no
 * intent behind it and nothing to answer with. The panel renders its reply the same way as any other.
 */
export type Turn =
  | { kind: "answer"; intentId: string; reply: Reply }
  | { kind: "disambiguate"; reply: Reply }
  | { kind: "offer"; reply: Reply }
  | { kind: "fallback"; reply: Reply };

export interface ChatEngine {
  /** The first assistant turn. Never the result of a match, so disclosure cannot be skipped. */
  opening: Reply;
  /** Resolve one free-text message under the published thresholds. */
  ask: (text: string) => Turn;
  /** Answer an intent directly, which is what a chip tap does. */
  byId: (id: string) => Reply | null;
  /**
   * What `ask` would answer for this text, without the conversation hearing about it.
   *
   * The one caller is the brief, which would rather interrupt itself than file a question as somebody's
   * name. The asymmetry decides the bar: a detour that turns out to be wrong costs a re-read of the
   * question the visitor is already looking at, and their words stay in the transcript; a question filed
   * as an answer goes into the CRM as a lead the studio reads wrongly. So it takes the same confident
   * answer `ask` would give — past the accept threshold, clear of its runner-up — and nothing that would
   * only produce a disambiguation. Consumes no fallback and records no turn, because a detour is not
   * what the conversation is about; the question the visitor is answering still is.
   */
  lookup: (text: string) => { intentId: string; reply: Reply } | null;
  /** After a successful send, so a new conversation starts with all three guesses available. */
  reset: () => void;
  /** Read live: the panel persists it, and a stale copy would unlock the matcher on return. */
  fallbackCount: () => number;
  /**
   * Re-apply a persisted count on the way in. Restoring the transcript without the counter would hand a
   * returning visitor three fresh guesses on the question that already exhausted them.
   */
  seedFallbacks: (count: number) => void;
  /**
   * Adopt controls the resolver did not produce. The panel calls it on the resume path, where a restored
   * draft leaves the persistent menu on screen while this engine still remembers the opening: without it,
   * a returning visitor who says "the second one" is answered from a chip list they are not looking at.
   * What was on screen survives a reload; what it was an answer *about* does not, so a depth request on
   * the next turn is refused honestly while selection still works.
   */
  seedTurn: (chips: Chip[]) => void;
}

/**
 * The state a conversation starts from, and the state it returns to after a send. The menu the pod
 * leads with is genuinely on screen in both cases, so a visitor answering their first message with
 * "the second one" is pointing at something real, and making them re-ask would be the pedantry this
 * layer exists to remove.
 */
function openingTurn(): TurnState {
  return record(null, openingReply());
}

export function useChatEngine(knowledge: KnowledgeBase): ChatEngine {
  const table = useMemo(() => buildIntentTable(knowledge), [knowledge]);
  const index = useMemo(() => buildIndex(table).index, [table]);
  const byIdMap = useMemo(() => new Map(table.map((entry) => [entry.id, entry])), [table]);

  // Refs, not state: both are consumed while building the reply for the very next render, and as state
  // they would either double-render or push the mutation into the component's message handler.
  const fallbacks = useRef(0);
  const last = useRef<TurnState>(openingTurn());

  return useMemo<ChatEngine>(() => {
    /**
     * Hand one reference back to the previous turn, or decline to.
     *
     * Returns null only when the state has gone stale under the message: an intent id that is no longer
     * in the table, because the corpus was recompiled between the two turns. The caller then runs the
     * ordinary matcher on the same words: a follow-up the engine cannot honour is treated as a question,
     * never as an error.
     *
     * Declared inside the memo rather than beside the refs, so the closure has no identity of its own to
     * chase: it is rebuilt exactly when the index and the corpus are, and the dependency list stays the
     * truth instead of a suppression.
     */
    const honour = (text: string): Turn | null => {
      const state = last.current;
      const reference = followUp(text, state);
      if (!reference) return null;

      if (reference.kind === "refused") {
        // Honest, and it does not spend a guess: the pod understood the sentence perfectly well, the
        // conversation simply had nothing in it for that sentence to refer back to.
        return { kind: "offer", reply: reference.reply };
      }

      if (reference.kind === "chip") {
        const action = reference.chip.action;
        if (action.kind !== "intent") return { kind: "offer", reply: handOver(reference.chip) };
        const intent = byIdMap.get(action.id);
        if (!intent) return null;
        const reply = intent.respond(knowledge);
        last.current = record(intent.id, reply);
        return { kind: "answer", intentId: intent.id, reply };
      }

      const intent = byIdMap.get(reference.intentId);
      if (!intent) return null;
      const expanded = intent.respond(knowledge, reference.ctx);

      // The depth branch is authored per intent, so an intent with no deeper answer hands back exactly
      // the text the visitor has already read. Rendering it twice would look like the pod had stopped
      // listening, which is the one failure this layer exists to prevent; say what has run out instead.
      const shown = JSON.stringify(expanded.blocks) === state.fingerprint ? exhausted(state.chips) : expanded;
      last.current = record(intent.id, shown);
      return { kind: "answer", intentId: intent.id, reply: shown };
    };

    return {
      opening: openingReply(),
      ask(text: string): Turn {
        const trimmed = text.trim();

        // Authoring outranks idiom. "more roles" is a question somebody wrote an answer for, so nothing
        // an intent publishes under that exact phrase is ever read as a reference to an earlier turn.
        if (!isAuthoredName(index, trimmed)) {
          const referenced = honour(trimmed);
          if (referenced) return referenced;
        }

        const outcome = resolve(index, trimmed, {
          locked: fallbacks.current >= FALLBACK_LIMIT,
          prior: last.current.intentId,
        });

        if (outcome.kind === "answer") {
          const reply = outcome.intent.respond(knowledge);
          last.current = record(outcome.intent.id, reply);
          return { kind: "answer", intentId: outcome.intent.id, reply };
        }

        // Disambiguation is not a failure: the pod found real candidates and is asking which one, so it
        // does not spend one of the three guesses. The candidates are recorded, because "the second one"
        // is a reply to exactly this turn.
        if (outcome.kind === "disambiguate") {
          const reply = FALLBACK_REPLIES.soft(outcome.candidates.map((candidate) => candidate.intent));
          last.current = record(null, reply);
          return { kind: "disambiguate", reply };
        }

        const reply =
          fallbacks.current >= FALLBACK_LIMIT ? FALLBACK_REPLIES.capped(knowledge) : FALLBACK_REPLIES.hard();
        fallbacks.current += 1;
        // The refusal clears the subject, so a following "tell me more" has nothing to attach to. The
        // chips the pod just offered are still on screen and still pickable.
        last.current = record(null, reply);
        return { kind: "fallback", reply };
      },
      byId(id: string) {
        const entry = byIdMap.get(id);
        if (!entry) return null;
        const reply = entry.respond(knowledge);
        // A tapped chip is the most recent thing the pod said about a subject, so it is what "tell me
        // more" must expand. Recording it here is what lets a chip-driven conversation keep going.
        last.current = record(id, reply);
        return reply;
      },
      lookup(text: string) {
        const trimmed = text.trim();
        if (trimmed.length === 0) return null;
        // No `prior`: a question asked in the middle of a brief is the visitor changing the subject, and
        // pulling it back toward the slot they are answering is how a form starts guessing.
        const outcome = resolve(index, trimmed, { locked: false });
        if (outcome.kind !== "answer") return null;
        return { intentId: outcome.intent.id, reply: outcome.intent.respond(knowledge) };
      },
      reset() {
        fallbacks.current = 0;
        last.current = openingTurn();
      },
      fallbackCount() {
        return fallbacks.current;
      },
      seedFallbacks(count: number) {
        // Clamped, because the number came off disk. Anything at the ceiling is the same state to the
        // matcher, and a negative or NaN copy must not unlock it again.
        fallbacks.current = Number.isFinite(count) ? Math.max(0, Math.min(FALLBACK_LIMIT, Math.trunc(count))) : FALLBACK_LIMIT;
      },
      seedTurn(chips: Chip[]) {
        if (chips.length === 0) return;
        // The fingerprint is empty by construction: an expanded answer can never be compared against a
        // summary this engine did not render, so a depth request after a reload is refused on `intentId`
        // rather than silently re-showing text the visitor read in a previous session.
        last.current = { intentId: null, chips: [...chips], fingerprint: "" };
      },
    };
  }, [index, knowledge, byIdMap]);
}
