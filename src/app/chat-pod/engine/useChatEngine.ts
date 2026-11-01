/**
 * @file useChatEngine.ts
 * @description The resolver, wrapped once. It owns two pieces of state that are not React's business:
 *              the compiled index (built per corpus, never per message) and the fallback counter
 *              (which decides when the pod stops guessing). Everything else is a pure call into
 *              `match.ts` and `intents.ts`.
 *
 *              The counter lives here rather than in the component so the lock rule has exactly one
 *              implementation, and so the two-strike behaviour cannot drift between surfaces.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { useMemo, useRef } from "react";

import { FALLBACK_REPLIES, buildIntentTable, openingReply } from "../knowledge/intents";
import { buildIndex, resolve } from "./match";
import type { KnowledgeBase, Reply } from "../types";

export type Turn =
  | { kind: "answer"; intentId: string; reply: Reply }
  | { kind: "disambiguate"; reply: Reply }
  | { kind: "fallback"; reply: Reply };

export interface ChatEngine {
  /** The first assistant turn. Never the result of a match, so disclosure cannot be skipped. */
  opening: Reply;
  /** Resolve one free-text message under the published thresholds. */
  ask: (text: string) => Turn;
  /** Answer an intent directly, which is what a chip tap does. */
  byId: (id: string) => Reply | null;
  /** After a successful send, so a new conversation starts with all three guesses available. */
  reset: () => void;
  /** Read live: the panel persists it, and a stale copy would unlock the matcher on return. */
  fallbackCount: () => number;
}

/** Ordinary matching is switched off after this many misses. See `FALLBACK_LIMIT` in `match.ts`. */
const LOCK_AFTER = 2;

export function useChatEngine(knowledge: KnowledgeBase): ChatEngine {
  const table = useMemo(() => buildIntentTable(knowledge), [knowledge]);
  const index = useMemo(() => buildIndex(table).index, [table]);
  const byIdMap = useMemo(() => new Map(table.map((entry) => [entry.id, entry])), [table]);

  // A ref, not state: the count is consumed while building the reply for the very next render, and
  // as state it would either double-render or push the increment into the component's handler.
  const fallbacks = useRef(0);

  return useMemo<ChatEngine>(
    () => ({
      opening: openingReply(),
      ask(text: string): Turn {
        const outcome = resolve(index, text, { locked: fallbacks.current >= LOCK_AFTER });

        if (outcome.kind === "answer") {
          return { kind: "answer", intentId: outcome.intent.id, reply: outcome.intent.respond(knowledge) };
        }

        // Disambiguation is not a failure: the pod found real candidates and is asking which one,
        // so it does not spend one of the three guesses.
        if (outcome.kind === "disambiguate") {
          return {
            kind: "disambiguate",
            reply: FALLBACK_REPLIES.soft(outcome.candidates.map((candidate) => candidate.intent)),
          };
        }

        const reply =
          fallbacks.current >= LOCK_AFTER ? FALLBACK_REPLIES.capped(knowledge) : FALLBACK_REPLIES.hard();
        fallbacks.current += 1;
        return { kind: "fallback", reply };
      },
      byId(id: string) {
        return byIdMap.get(id)?.respond(knowledge) ?? null;
      },
      reset() {
        fallbacks.current = 0;
      },
      fallbackCount() {
        return fallbacks.current;
      },
    }),
    [index, knowledge, byIdMap],
  );
}
