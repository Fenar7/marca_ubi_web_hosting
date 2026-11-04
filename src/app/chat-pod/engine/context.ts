/**
 * @file context.ts
 * @description Conversation state: what the pod just answered and what it put on screen, so that a
 *              two-word follow-up means something. `match.ts` is a pure function of one message and
 *              that is correct for a first question; it is why "tell me more" and "the second one"
 *              used to be answered as if they were new topics. This file holds the previous turn, the
 *              only thing that makes those legible, plus the small closed vocabulary that reads a
 *              reference back to it.
 *
 *              It deliberately owns no factual copy. Every reply here is about the conversation itself
 *              ("there is nothing on screen to choose from"), because a string that states something
 *              about the studio belongs in `knowledge/intents.ts` with a source attached, and the
 *              coverage test enforces that boundary. This module is allowed to say nothing else.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { PERSISTENT_MENU } from "../knowledge/corpus";
import type { AnswerContext, Chip, Reply } from "../types";
import { normalise, tokens } from "./normalise";

/**
 * What the visitor was last shown. Held by the engine, not by React, so the resolver wrapper has one
 * place to read a reference from and the panel cannot desynchronise it from the transcript.
 */
export interface TurnState {
  /** The intent the last turn answered. Null when the last turn asked a question instead. */
  intentId: string | null;
  /** Every chip that was on screen, in the order the visitor reads them. Ordinals index into this. */
  chips: Chip[];
  /**
   * Serialised blocks of the answer that produced this state. Compared against the expanded rendering
   * of the same intent to tell "give me the deeper version" apart from "say that again", which is the
   * difference between a pod that has run out of detail and one that appears to be ignoring you.
   */
  fingerprint: string;
}

export type FollowUp =
  /** The visitor asked the last subject to go further. The engine renders it with `ctx`. */
  | { kind: "depth"; intentId: string; ctx: AnswerContext }
  /** The visitor named or numbered something that was on screen. */
  | { kind: "chip"; chip: Chip }
  /** A follow-up this surface cannot honour, answered honestly instead of by re-ranking the corpus. */
  | { kind: "refused"; reply: Reply };

/**
 * The idioms that mean "further, same subject". A closed authored set, not a classifier, for the same
 * reason the intents author their utterances: anything looser would have to be measured against the
 * whole corpus to know it was not a topic question, and the pod would spend its honesty on guessing.
 * Entries are compared against the normalised message, so they are written in normalised form.
 */
const DEPTH_PHRASES: ReadonlySet<string> = new Set([
  "more",
  "more details",
  "more detail",
  "more information",
  "more info",
  "tell me more",
  "tell me more about it",
  "tell me about it",
  "say more",
  "explain more",
  "explain that more",
  "elaborate",
  "expand",
  "expand on that",
  "go on",
  "go ahead",
  "keep going",
  "continue",
  "and then",
  "what about it",
  "details",
  "in detail",
  "deeper",
  "deep dive",
  "dig deeper",
]);

/** Ordering words, spelled out because a visitor counting chips writes "second", not "2". */
const ORDINALS: Readonly<Record<string, number>> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  sixth: 6,
  seventh: 7,
  eighth: 8,
  ninth: 9,
  tenth: 10,
};

/** Cardinal words that pick a chip when they stand alone or follow a selection word. */
const CARDINALS: Readonly<Record<string, number>> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

/**
 * A numeral carrying an ordinal suffix is a position the same way "ninth" is: a visitor counting ten
 * chips on a phone types "the 9th one", not the word.
 */
const ORDINAL_DIGIT = /^[0-9]{1,2}(?:st|nd|rd|th)$/;

/** Words that make a number a selection rather than a quantity: "the second", "option 2", "pick 3". */
const SELECTION_WORDS: ReadonlySet<string> = new Set(["the", "option", "options", "choice", "pick", "number", "choose", "select", "list"]);

/** Ceiling for a spoken index. More chips than this on screen would not be a list, it would be a page. */
const MAX_OFFERED = 10;

/**
 * Labels are compared with every non-alphanumeric character removed, on both sides. A chip labelled
 * "Public Relations (PR)" is named by "public relations pr", "public relations PR", and "publicrelations
 * (pr)"; the visitor cannot be asked to reproduce bracket placement, and the match is only ever run
 * against the handful of chips this very turn put on screen, so widening it costs no precision.
 */
function collapse(value: string): string {
  return normalise(value).replace(/[^a-z0-9]/g, "");
}

/**
 * The one-based position a message selects, or null when it does not select one.
 *
 * Two shapes are accepted and nothing between them. A bare word or digit ("second", "3") is a choice,
 * and so is a number carried by a selection word ("the second one", "option 3"). A number inside any
 * other sentence is not: "can we do one thing" and "how much for 3 pages" contain numerals that count
 * something rather than point at a chip, so requiring the whole message to be six words or fewer, with
 * exactly one numeral and that numeral adjacent to a selection word, is what stops the pod answering
 * an unrelated question by tapping whatever was on screen last.
 */
function selectedIndex(raw: string[]): number | null {
  if (raw.length > 6) return null;

  // "the first one" names a position twice if "one" is read as a count, so once an ordering word is
  // present the bare "one" is the pronoun everybody uses when they count chips, not a second number.
  // The same trap catches "the 9th one", so a suffixed numeral counts as an ordering word too.
  const ordered = raw.some((part) => part in ORDINALS || ORDINAL_DIGIT.test(part));

  const hits: { index: number; value: number }[] = [];
  for (let i = 0; i < raw.length; i++) {
    const part = raw[i];
    if (ordered && (part === "one" || part === "ones")) continue;
    const word = ORDINALS[part] ?? CARDINALS[part];
    const written = /^([0-9]{1,2})(?:st|nd|rd|th)?$/.exec(part);
    const value = word ?? (written ? Number(written[1]) : undefined);
    if (value !== undefined) hits.push({ index: i, value });
  }
  if (hits.length !== 1) return null;

  const pick = hits[0];
  if (pick.value < 1 || pick.value > MAX_OFFERED) return null;
  if (raw.length === 1) return pick.value;

  const before = raw[pick.index - 1];
  const after = raw[pick.index + 1];
  if (before === undefined || !SELECTION_WORDS.has(before)) {
    // A whole message that is one number is a choice; "2 please" is the other shape a visitor uses.
    // Anywhere else, a number is counting something in a sentence that is really a question.
    if (!(after !== undefined && SELECTION_WORDS.has(after))) return null;
  }
  return pick.value;
}

/** There was no earlier answer to expand, or the last turn asked a question rather than answering one. */
function nothingToExpand(): Reply {
  return {
    blocks: [
      {
        t: "p",
        text: "Nothing I have answered yet can be taken further. Ask me about a service, the work, or how a project runs, then say tell me more.",
      },
    ],
    chips: [...PERSISTENT_MENU],
  };
}

/**
 * The intent gave its whole published answer already, so repeating it would look like a malfunction.
 * What is still on screen is re-attached rather than described: for a service line that includes its
 * own page, which is the thing that does go further.
 */
export function exhausted(chips: Chip[]): Reply {
  return {
    blocks: [
      {
        t: "p",
        text: "That is the whole of what this site publishes on it. What is still on screen goes further than I can.",
      },
    ],
    chips: [...chips],
  };
}

/** A selection made against a turn that offered nothing. */
function nothingNumbered(): Reply {
  return {
    blocks: [
      {
        t: "p",
        text: "I have not put a list on screen for you to choose from. Ask about services or the work and I will.",
      },
    ],
    chips: [...PERSISTENT_MENU],
  };
}

/**
 * The visitor counted past the end of the list. The chips are re-attached to the answer rather than
 * reworded, because the useful correction is the same list, not a description of it.
 */
function pastTheEnd(chips: Chip[]): Reply {
  const count = Math.min(chips.length, MAX_OFFERED);
  return {
    blocks: [
      {
        t: "p",
        text: count === 1
          ? "There was only the one option on screen."
          : `I offered ${count} options, counted from the first. Pick one of those, or say the name.`,
      },
    ],
    chips: [...chips],
  };
}

/**
 * What was chosen has no answer attached: it opens a page, the brief, or the panel's own state. The
 * engine cannot perform that action, and pretending not to understand it would be worse than showing
 * it again, so the turn returns the control itself with one line telling the visitor to use it. That
 * one reply is built around a chip rather than around an intent, which is the exception this module
 * exists to keep out of everything else.
 */
export function handOver(chip: Chip): Reply {
  return {
    blocks: [{ t: "p", text: "That one is on the screen below, ready to tap." }],
    chips: [{ label: chip.label, action: chip.action }],
  };
}

/**
 * Read one message as a reference back to the turn before it.
 *
 * Returns null whenever the message could be a question of its own, which is the whole design: a false
 * negative costs the visitor one re-ask, a false positive makes the pod look like it is not listening.
 * The engine only calls this after `isAuthoredName` has established that nobody authored the phrase,
 * so an idiom that happens to also be a real topic ("more roles") never reaches here as a follow-up.
 */
export function followUp(raw: string, state: TurnState): FollowUp | null {
  const phrase = normalise(raw);
  if (phrase.length === 0) return null;
  const parts = tokens(phrase);

  if (DEPTH_PHRASES.has(phrase)) {
    if (state.intentId === null) return { kind: "refused", reply: nothingToExpand() };
    return { kind: "depth", intentId: state.intentId, ctx: { expanded: true } };
  }

  const position = selectedIndex(parts);
  if (position !== null) {
    if (state.chips.length === 0) return { kind: "refused", reply: nothingNumbered() };
    if (position > state.chips.length) return { kind: "refused", reply: pastTheEnd(state.chips) };
    return { kind: "chip", chip: state.chips[position - 1] };
  }

  if (state.chips.length === 0 || parts.length > 6) return null;
  const named = collapse(phrase);
  if (named.length < 3) return null;
  const chip = state.chips.find((entry) => collapse(entry.label) === named);
  return chip ? { kind: "chip", chip } : null;
}

/**
 * Fold one answered turn into the state the next message will be read against. Kept here so the shape
 * of "what was on screen" has exactly one writer. A turn that answered nothing leaves `intentId` null,
 * which is what makes a following "tell me more" an honest refusal instead of a reference to an answer
 * that never happened, while the chips it did put on screen stay pickable.
 */
export function record(intentId: string | null, reply: Reply): TurnState {
  return { intentId, chips: reply.chips, fingerprint: JSON.stringify(reply.blocks) };
}
