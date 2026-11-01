/**
 * @file match.ts
 * @description Three-tier deterministic resolver. No model, no network, no fuzzy library: exact
 *              alias lookup, then weighted whole-word keywords, then token/trigram scoring with
 *              edit distance reserved for single-token typos. Every threshold is exported as a
 *              named constant because the acceptance criteria cite them and the unit tests must
 *              cover each boundary.
 *
 *              The margin requirement is the load-bearing part. Without it a near-tie between
 *              "greeting" and "services.overview" silently returns whichever the array happened
 *              to iterate first, which is the failure mode that makes rule-based assistants feel
 *              arbitrary rather than honest.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import type { Intent } from "../types";
import {
  editSimilarity,
  normalise,
  tokenOverlap,
  tokens,
  trigramSimilarity,
} from "./normalise";

/** Best score still treated as a confident answer. */
export const ACCEPT_THRESHOLD = 0.8;
/** How far the leader must clear the runner-up before it is answered without asking. */
export const ACCEPT_MARGIN = 0.15;
/** Below this the pod does not guess at all; it says so. */
export const FLOOR_THRESHOLD = 0.55;
/** How many candidates are offered when the leader is ambiguous. */
export const DISAMBIGUATION_WIDTH = 3;
/** Fallbacks tolerated in one session before ordinary matching is switched off. */
export const FALLBACK_LIMIT = 2;

/**
 * Intents that survive the fallback lock. `contact` and `intake.trigger` are the escape hatch:
 * a visitor who has already failed to be understood twice must never find the way out also
 * locked. `greeting`, `thanks` and `goodbye` stay live because suppressing politeness reads as
 * broken rather than as strict.
 */
export const ALWAYS_RESOLVABLE: ReadonlySet<string> = new Set([
  "greeting",
  "thanks",
  "goodbye",
  "contact",
  "intake.trigger",
  "smalltalk.areyouhuman",
]);

export interface Candidate {
  intent: Intent;
  score: number;
  tier: 1 | 2 | 3;
}

export type MatchOutcome =
  | { kind: "answer"; intent: Intent; score: number }
  | { kind: "disambiguate"; candidates: Candidate[] }
  | { kind: "fallback"; candidates: Candidate[] };

/** Compiled index of Tier 1 aliases, keyed by normalised utterance. */
export interface IntentIndex {
  exact: Map<string, Intent>;
  intents: Intent[];
  /** Pre-tokenised keywords so scoring does not re-split the corpus on every keystroke. */
  keywordSets: Map<string, { token: string; weight: number }[]>;
}

/**
 * Builds the lookup structures once per bundle, not per message.
 *
 * Collision policy: two intents claiming the same normalised utterance is a corpus bug, and the
 * first author wins silently. That is exactly the kind of quiet ambiguity this module exists to
 * prevent, so duplicates are surfaced through `duplicates` and asserted against by the coverage
 * test rather than resolved at runtime.
 */
export function buildIndex(intents: Intent[]): { index: IntentIndex; duplicates: string[] } {
  const exact = new Map<string, Intent>();
  const keywordSets = new Map<string, { token: string; weight: number }[]>();
  const duplicates: string[] = [];

  for (const intent of intents) {
    const weighted = intent.keywords.map((keyword, position) => ({
      token: normalise(keyword),
      // The leading keyword is the topic noun, the rest are support. Equal weighting turns every
      // generic mention into a confident match, which is the disambiguation failure in reverse.
      weight: position === 0 ? 1 : 0.6,
    }));
    keywordSets.set(intent.id, weighted);

    for (const utterance of intent.utterances) {
      const key = normalise(utterance);
      const existing = exact.get(key);
      if (existing && existing.id !== intent.id) {
        duplicates.push(`${key} (${existing.id} | ${intent.id})`);
        continue;
      }
      exact.set(key, intent);
    }
  }

  return { index: { exact, intents, keywordSets }, duplicates };
}

/**
 * Tier 2. Whole-word only: a keyword that merely appears inside a longer word does not count,
 * otherwise "art" would match "start" and every project enquiry would resolve to illustration.
 */
function keywordScore(query: string, entries: { token: string; weight: number }[]): number {
  if (entries.length === 0) return 0;
  let matched = 0;
  let total = 0;
  for (const entry of entries) {
    total += entry.weight;
    if (containsWholeWord(query, entry.token)) matched += entry.weight;
  }
  return total === 0 ? 0 : matched / total;
}

/** Word-boundary test over the normalised string, with the keyword itself escaped. */
function containsWholeWord(haystack: string, needle: string): boolean {
  if (needle.length === 0) return false;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s)${escaped}($|\\s)`).test(haystack);
}

/**
 * Tier 3. Blends containment against the corpus phrase with character similarity, then takes the
 * best single utterance for that intent. Edit distance participates only when the query is one
 * word, because it is meaningless across a phrase and would reward length.
 */
function fuzzyScore(query: string, queryTokens: string[], intent: Intent): number {
  let best = 0;
  const singleToken = queryTokens.length === 1;

  for (const utterance of intent.utterances) {
    const normalisedUtterance = normalise(utterance);
    const utteranceTokens = tokens(normalisedUtterance);

    const overlap = tokenOverlap(queryTokens, utteranceTokens);
    const trigram = trigramSimilarity(query, normalisedUtterance);
    const blended = 0.55 * overlap + 0.45 * trigram;

    let candidate = blended;
    if (singleToken && utteranceTokens.length === 1) {
      candidate = Math.max(candidate, editSimilarity(query, utteranceTokens[0]));
    }
    if (candidate > best) best = candidate;
  }
  return best;
}

/**
 * Ranks every intent for one query. Tier 1 short-circuits: an authored alias is a decision
 * someone made, and it must not be outvoted by scoring heuristics.
 */
export function rank(index: IntentIndex, rawInput: string): Candidate[] {
  const query = normalise(rawInput);
  if (query.length === 0) return [];

  const exactHit = index.exact.get(query);
  if (exactHit) return [{ intent: exactHit, score: 1, tier: 1 }];

  const queryTokensList = tokens(query);
  const scored: Candidate[] = [];

  for (const intent of index.intents) {
    const keyword = keywordScore(query, index.keywordSets.get(intent.id) ?? []);
    const fuzzy = fuzzyScore(query, queryTokensList, intent);
    const score = Math.max(keyword, fuzzy);
    if (score > 0) {
      scored.push({ intent, score, tier: keyword >= fuzzy ? 2 : 3 });
    }
  }

  // Score first, then id: without the tiebreaker the order depends on Array.sort internals and
  // two equally scored intents could swap between builds, making the pod non-deterministic.
  scored.sort((a, b) => (b.score - a.score) || a.intent.id.localeCompare(b.intent.id));
  return scored;
}

/**
 * Applies the published thresholds to an already-ranked candidate list. Separated from `resolve`
 * so the policy can be tested at its exact boundaries (0.80, 0.55, margin 0.15) without having to
 * reverse-engineer utterances and keyword sets that happen to produce those scores.
 */
export function decide(candidates: Candidate[]): MatchOutcome {
  if (candidates.length === 0) return { kind: "fallback", candidates: [] };

  const leader = candidates[0];
  const runnerUp = candidates[1];
  const margin = runnerUp ? leader.score - runnerUp.score : 1;

  if (leader.score >= ACCEPT_THRESHOLD && margin >= ACCEPT_MARGIN) {
    return { kind: "answer", intent: leader.intent, score: leader.score };
  }
  if (leader.score >= FLOOR_THRESHOLD) {
    return { kind: "disambiguate", candidates: candidates.slice(0, DISAMBIGUATION_WIDTH) };
  }
  return { kind: "fallback", candidates: candidates.slice(0, DISAMBIGUATION_WIDTH) };
}

/**
 * Resolves one visitor message. `locked` is the post-cap state: ordinary candidates are ignored and
 * only the escape-hatch intents still resolve, because a visitor who has already failed to be
 * understood twice must not also find the way out locked.
 */
export function resolve(
  index: IntentIndex,
  rawInput: string,
  options: { locked: boolean },
): MatchOutcome {
  if (options.locked) {
    const query = normalise(rawInput);
    const permitted = rank(index, rawInput).filter((candidate) =>
      ALWAYS_RESOLVABLE.has(candidate.intent.id),
    );
    const exactPermitted = index.exact.get(query);
    if (exactPermitted && ALWAYS_RESOLVABLE.has(exactPermitted.id)) {
      return { kind: "answer", intent: exactPermitted, score: 1 };
    }
    if (permitted.length > 0 && permitted[0].score >= ACCEPT_THRESHOLD) {
      return { kind: "answer", intent: permitted[0].intent, score: permitted[0].score };
    }
    return { kind: "fallback", candidates: [] };
  }

  return decide(rank(index, rawInput));
}
