/**
 * @file match.ts
 * @description Three-tier deterministic resolver. No model, no network, no fuzzy library: exact
 *              alias lookup, then weighted whole-word keywords, then two-way lexical containment with
 *              character similarity reserved for spelling and edit distance for single-token typos.
 *              Ranks are then discounted by family (`INTENT_DISCOUNTS`) so small talk and published
 *              category titles cannot outvote the thing the visitor actually named. Every threshold is
 *              exported as a named constant because the acceptance criteria cite them and the unit
 *              tests must cover each boundary.
 *
 *              The margin requirement is the load-bearing part. Without it a near-tie between
 *              "greeting" and "services.overview" silently returns whichever the array happened
 *              to iterate first, which is the failure mode that makes rule-based assistants feel
 *              arbitrary rather than honest. The scoring changes were made against that rule, not
 *              around it: no published threshold moved, and a query is charged for every topic word it
 *              uses, so coverage can only reach an authored alias by the alias actually accounting for
 *              what the visitor said.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import type { Intent } from "../types";
import {
  contentTokens,
  editSimilarity,
  isScaffold,
  normalise,
  QUERY_STOPWORDS,
  residue,
  stem,
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
 * How much the subject of the previous turn is worth when this message could not be resolved alone.
 *
 * A visitor who has just been answered about services and types "explain each service" is not asking a
 * cold question, but the resolver is a pure function of one message and scores it as one: that sentence
 * reached 0.775 against a 0.8 accept, so the pod put up three chips and looked like it had forgotten
 * what the conversation was about. The boost closes the gap the arithmetic cannot see, and nothing more.
 *
 * Deliberately small. At 1.08 a candidate needs to be at least 0.741 cold to be lifted over the accept
 * line, which is a message already mostly about the last subject; a 0.6 would need this factor to be
 * 1.33. Bigger numbers make the pod sticky, and a sticky pod answers about services for the rest of the
 * session no matter what the visitor asks.
 */
export const CONTINUITY_PRIOR = 1.08;

/** The family an intent id belongs to: the first dotted segment, which is how `INTENT_DISCOUNTS` reads it too. */
function familyRoot(id: string): string {
  const dot = id.indexOf(".");
  return dot === -1 ? id : id.slice(0, dot);
}

/**
 * Ranking discounts by id prefix, applied after scoring and before the margin comparison.
 *
 * These three families are real intents with real answers, but their subject words are also ordinary
 * conversation. `smalltalk.areyouhuman` authors "what are you", so any "what are the …" sentence
 * reaches it, and before this discount a visitor asking about services was offered the chip "Are you
 * a person?". `work.journal.topic.*` takes published category titles verbatim, and two of those
 * titles are also names of things the studio sells, so a question about the offering could be answered
 * with a list of blog posts. `faq.*` quotes whole questions, which overlap everything.
 *
 * A discount, not a deletion: each still wins when its own words are the ones the visitor used.
 * Keeping this table in the matcher rather than as a field on `Intent` is the same call as the
 * thresholds above: it is policy about how ranks are compared, not a property of the corpus, and an
 * author editing `intents.ts` should not be able to change it by accident.
 */
export const INTENT_DISCOUNTS: Readonly<Record<string, number>> = {
  "smalltalk.": 0.82,
  "work.journal.topic.": 0.88,
  "faq.": 0.9,
};

/** The discount for one intent id, or 1 when its family is not discounted. Longest prefix wins. */
export function intentPrior(id: string): number {
  let prefix = "";
  let factor = 1;
  for (const [candidate, value] of Object.entries(INTENT_DISCOUNTS)) {
    if (id.startsWith(candidate) && candidate.length > prefix.length) {
      prefix = candidate;
      factor = value;
    }
  }
  return factor;
}

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

/** One pre-stemmed keyword with the weight it carries at Tier 2. */
interface KeywordEntry {
  stem: string;
  weight: number;
}

/** One authored alias, pre-split once at index time rather than once per keystroke. */
interface AliasEntry {
  /** Stemmed topic words of the alias: the words an author chose to mean something. */
  stems: string[];
  /** Every stem in the alias, scaffolding included. This is the denominator that stops a six-word
   *  sentence whose only topic word is "service" from scoring as if it were the one-word alias
   *  "service", which is the difference between answering "what are the services" and offering the
   *  visitor "Which service do you need?" as an equal option. */
  all: string[];
  /** The alias as authored and normalised. Character similarity runs against this, not against the
   *  stripped stems: this term's job is spelling tolerance, and measuring two stem-stripped strings
   *  would award the same topic match a second time. That double count is why "can i see the work"
   *  once tied three intents at a perfect score. */
  content: string;
  /** The alias's raw tokens, kept for the single-word typo rule, which must measure the word a
   *  visitor actually typed against the word an author actually wrote, not two stems. */
  raw: string[];
  /**
   * The alias's topic words, sorted and joined. Two phrasings that ask for the same thing in
   * different numbers of polite words share this key, which is what lets "the services", "services" and
   * "ok can you please tell me about the services" reach the same author instead of three different
   * scores.
   */
  residueKey: string;
}

/** Compiled index of Tier 1 aliases, keyed by normalised utterance. */
export interface IntentIndex {
  /**
   * Authored names, each mapped to every intent that claims it. A phrase two intents both publish
   * under is not a bug to be resolved by iteration order, it is a fact about this studio's catalogue:
   * both B2B and B2C lines are titled "Public Relations (PR)". So the lookup returns a list and `rank`
   * answers a contested name with a choice, never with a guess.
   */
  exact: Map<string, Intent[]>;
  intents: Intent[];
  /** Pre-stemmed keywords so scoring does not re-split the corpus on every keystroke. */
  keywordSets: Map<string, KeywordEntry[]>;
  /** Pre-split authored aliases, same reason. */
  aliases: Map<string, AliasEntry[]>;
  /** One-word authored aliases keyed by stem, so "service" reaches the authored alias "services".
   *  Also a list: a bare word two intents both authored is contested in exactly the way a whole
   *  phrase is, and gets the same treatment. */
  bare: Map<string, Intent[]>;
  /**
   * Every word form the corpus actually uses, raw and stemmed, across keywords and authored aliases.
   * This is what makes "unknown" a meaningful test rather than a guess: a token outside this set is
   * either one keystroke from a word we do use, or it names a subject we do not publish, and those two
   * cases have to be treated differently or every typed message becomes a miss.
   */
  vocabulary: Set<string>;
  /**
   * Deletion variants of every vocabulary stem, mapped to the stems that produce them. Two strings one
   * edit apart always share a deletion variant, so looking a token's own variants up here finds every
   * stem within one keystroke without a distance loop across the corpus.
   */
  stemNeighbours: Map<string, string[]>;
  /**
   * Authored aliases grouped by the topic words they ask for, ignoring how the author wrapped them.
   * A visitor whose message reduces to exactly one author's set of topic words has said a thing this
   * studio decided how to answer, which is the same class of evidence as typing the alias itself.
   */
  residueOwners: Map<string, Intent[]>;
}

/**
 * Builds the lookup structures once per bundle, not per message.
 *
 * Collision policy: a phrase claimed by two intents is recorded as contested and answered by
 * disambiguation, and it is also surfaced through `duplicates` and asserted against by the coverage
 * test. Reporting it is not the same as resolving it silently, which is what the previous first-write
 * window did: it made the winner depend on the order `buildIntentTable` happened to emit.
 */
export function buildIndex(intents: Intent[]): { index: IntentIndex; duplicates: string[] } {
  const exact = new Map<string, Intent[]>();
  const keywordSets = new Map<string, KeywordEntry[]>();
  const aliases = new Map<string, AliasEntry[]>();
  const bare = new Map<string, Intent[]>();
  const residueOwners = new Map<string, Intent[]>();
  const duplicates: string[] = [];
  const vocabulary = new Set<string>();

  for (const intent of intents) {
    // A keyword that is question scaffolding is not a topic. Leaving it in charges the intent for a
    // word no visitor can stop typing: "services, service, offer, marketing, do, help" made a perfect
    // question about the studio's offering score 0.55 on its own subject, because two thirds of the
    // denominator was grammar. Stopwords are dropped at every position, then the first survivor
    // carries the topic weight; an intent whose whole list is scaffolding keeps the raw list, because
    // an unmatchable intent is worse than a loosely weighted one.
    const candidates: string[] = [];
    for (const keyword of intent.keywords) {
      const folded = stem(normalise(keyword));
      if (folded.length > 0 && !QUERY_STOPWORDS.has(normalise(keyword))) candidates.push(folded);
    }
    const topicWords = candidates.length > 0
      ? candidates
      : intent.keywords.map((keyword) => stem(normalise(keyword))).filter((folded) => folded.length > 0);

    const entries: KeywordEntry[] = [];
    const seen = new Set<string>();
    for (const folded of topicWords) {
      if (seen.has(folded)) continue;
      seen.add(folded);
      entries.push({
        stem: folded,
        // The leading keyword is the topic noun, the rest are support. Equal weighting turns every
        // generic mention into a confident match, which is the disambiguation failure in reverse.
        weight: entries.length === 0 ? 1 : 0.6,
      });
    }

    const aliasEntries: AliasEntry[] = intent.utterances.map((utterance) => {
      const normalisedUtterance = normalise(utterance);
      const everyStem: string[] = [];
      for (const token of tokens(normalisedUtterance)) {
        const folded = stem(token);
        if (everyStem.indexOf(folded) === -1) everyStem.push(folded);
      }
      return {
        stems: contentTokens(normalisedUtterance),
        all: everyStem,
        content: normalisedUtterance,
        raw: tokens(normalisedUtterance),
        residueKey: "",
      };
    });
    for (const alias of aliasEntries) {
      alias.residueKey = alias.stems.slice().sort().join(" ");
      if (alias.residueKey.length === 0) continue;
      const owners = residueOwners.get(alias.residueKey);
      if (owners) {
        if (!owners.includes(intent)) owners.push(intent);
      } else {
        residueOwners.set(alias.residueKey, [intent]);
      }
    }

    // A one-word alias is an author stating what the bare word means. Collected here so a visitor who
    // types exactly one word can be answered by that statement instead of by arithmetic; see
    // `rank`, where an alias claimed by two intents deliberately does not short-circuit. The key is a
    // stem, which is what lets "service" reach the authored alias "services".
    for (const alias of aliasEntries) {
      if (alias.raw.length !== 1) continue;
      const folded = stem(alias.raw[0]);
      const owners = bare.get(folded);
      if (owners) {
        if (!owners.includes(intent)) owners.push(intent);
      } else {
        bare.set(folded, [intent]);
      }
    }

    keywordSets.set(intent.id, entries);
    aliases.set(intent.id, aliasEntries);
    for (const entry of entries) vocabulary.add(entry.stem);
    for (const alias of aliasEntries) {
      for (const raw of alias.raw) vocabulary.add(raw);
      for (const folded of alias.all) vocabulary.add(folded);
    }

    for (const utterance of intent.utterances) {
      const key = normalise(utterance);
      const owners = exact.get(key);
      if (!owners) {
        exact.set(key, [intent]);
        continue;
      }
      if (!owners.includes(intent)) {
        duplicates.push(`${key} (${owners.map((owner) => owner.id).join(" | ")} | ${intent.id})`);
        owners.push(intent);
      }
    }
  }

  // Only words long enough to survive a keystroke join the neighbour index. A three-letter word has so
  // few neighbours that it is within one edit of almost everything, which is how "art" reaches "start"
  // and an illustration enquiry becomes a project brief.
  const stemNeighbours = new Map<string, string[]>();
  for (const word of vocabulary) {
    if (word.length < 5) continue;
    const variants = [word];
    for (let i = 0; i < word.length; i++) variants.push(word.slice(0, i) + word.slice(i + 1));
    for (let i = 0; i < word.length - 1; i++) {
      variants.push(word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2));
    }
    for (const variant of variants) {
      const bucket = stemNeighbours.get(variant);
      if (bucket) {
        if (!bucket.includes(word)) bucket.push(word);
      } else {
        stemNeighbours.set(variant, [word]);
      }
    }
  }

  return {
    index: { exact, intents, keywordSets, aliases, bare, vocabulary, stemNeighbours, residueOwners },
    duplicates,
  };
}

/**
 * The vocabulary words a typed message misspelled, split by whether the corpus offers one answer or
 * several.
 *
 * Only tokens the corpus has never seen are tested, so this can never rewrite a real word into another
 * one: "work" stays "work" and "price" stays "price". A token with exactly one vocabulary neighbour is
 * forgiven completely, because one keystroke and no alternative reading is a typo rather than a
 * question. A token with several ("organis" reaching both "organise" and "organic") is worth half,
 * because the pod that guesses which one the visitor meant is the pod that answers about the wrong
 * thing with total confidence.
 */
function typoStems(queryRaw: string[], index: IntentIndex): { full: Set<string>; partial: Set<string> } {
  const full = new Set<string>();
  const partial = new Set<string>();
  for (const token of queryRaw) {
    if (token.length < 5 || index.vocabulary.has(token)) continue;
    const hits = new Set<string>();
    for (let i = 0; i <= token.length; i++) {
      const bucket = index.stemNeighbours.get(token.slice(0, i) + token.slice(i + 1));
      if (bucket) for (const word of bucket) hits.add(word);
    }
    if (hits.size === 0) continue;
    const target = hits.size === 1 ? full : partial;
    for (const word of hits) {
      target.add(word);
      target.add(stem(word));
    }
  }
  return { full, partial };
}

/**
 * Tier 2. Whole-word only, over stems: a keyword that merely appears inside a longer word does not
 * count, otherwise "art" would match "start" and every project enquiry would resolve to
 * illustration. Scoring a set of stems instead of testing a regular expression against the sentence
 * is the same rule with no regex compiled per keyword per keystroke, and it is what lets the word
 * "services" reach the authored keyword "service".
 *
 * The geometric blend of the two sides is what keeps an author's one-word keyword list from answering
 * a sentence about something else. With only the corpus side, an intent that authors the single keyword
 * "services" scored a perfect 1.0 on "what services and pricing do you offer for a rebrand", because
 * it had accounted for itself completely and nothing asked about the other four words it contained. The
 * query side is the discipline: the visitor's own topic words are the denominator, so a keyword that
 * explains one word in five is a hint about the subject, not the answer.
 */
function keywordScore(
  queryStems: Set<string>,
  queryTopicCount: number,
  entries: KeywordEntry[],
  typos: { full: Set<string>; partial: Set<string> },
): number {
  if (entries.length === 0 || queryTopicCount === 0) return 0;
  let matchedWeight = 0;
  let matchedCount = 0;
  let totalWeight = 0;
  for (const entry of entries) {
    totalWeight += entry.weight;
    // A misspelling the corpus can only read one way is the word; several readings is a hint.
    const credit = queryStems.has(entry.stem)
      ? 1
      : typos.full.has(entry.stem)
        ? 1
        : typos.partial.has(entry.stem)
          ? 0.5
          : 0;
    if (credit > 0) {
      matchedWeight += entry.weight * credit;
      matchedCount += credit;
    }
  }
  if (matchedCount === 0 || totalWeight === 0) return 0;
  const corpusSide = matchedWeight / totalWeight;
  const querySide = Math.min(1, matchedCount / queryTopicCount);
  return Math.sqrt(corpusSide * querySide);
}

/**
 * Tier 3. Geometric mean of the two containment directions, then character similarity fills only the
 * gap containment left: `lexical + (1 - lexical) * character`.
 *
 * Both directions are needed and neither is enough alone. Containment against the alias ("did the
 * visitor say this sentence's words") is the honest measure of an authored phrase and is what makes a
 * long sentence with one shared word lose. Containment against the query ("did this alias account for
 * every topic word the visitor used") is what makes a polite, scaffolding-wrapped question reach a
 * short alias at all, which the old fixed 55/45 blend could not do: it capped "what are the services"
 * in the 0.70s and handed a visitor asking about services three chips and a shrug. Multiplying them
 * instead of averaging means a one-sided match is never confident, and taking the square root keeps
 * the scale in [0,1] so the published thresholds still mean what the acceptance criteria say.
 *
 * The query side is charged for every topic word the visitor used, including words the corpus has
 * never seen. That is deliberate and it was measured: discounting unknown words so that "what are the
 * services available" would not be charged for "available" also made "what is the weather in calicut"
 * a perfect 1.000 match for the studio address, because the only word the corpus knew in that sentence
 * was a city name. A word we do not publish is evidence that we may not cover the subject, so it stays
 * in the denominator and the phrasings the pod must understand get authored instead of assumed.
 *
 * Two exceptions, both about typing rather than subject, and both bounded to one keystroke: a word that
 * is one edit from a piece of scaffolding ("plese", "wtih") is grammar the visitor mis-hit, and a word
 * with exactly one neighbour in the whole corpus ("servces") can only be read one way. A word with
 * several neighbours is charged half a word, because the reading is genuinely open.
 *
 * A query that shares no topic word with anything cannot win on spelling alone, because the term
 * character similarity is allowed to add is multiplied by what containment failed to reach. The
 * character term compares the whole authored phrase with the whole query, so it is a typo signal and
 * nothing more: it is the same measure that made "servces" reach "services", and it is deliberately
 * not computed on stripped stems, where two unrelated sentences reduced to one shared word would look
 * identical and score a perfect match. The scaffolding-free variant of that comparison is gated on the
 * same rule from the other side: it only runs when the alias explains every topic word in the message.
 *
 * Whole-phrase edit distance still participates only when both sides are one word, because across a
 * phrase it is meaningless and would reward length. Multi-word spelling is carried by the neighbour
 * lookup above, which is per word and capped at one keystroke.
 */
function fuzzyScore(
  queryStems: string[],
  queryStemSet: Set<string>,
  queryPhrase: string,
  queryCore: string,
  coreAllowed: boolean,
  queryRaw: string[],
  entries: AliasEntry[],
  typos: { full: Set<string>; partial: Set<string> },
): number {
  let best = 0;
  const singleToken = queryRaw.length === 1;

  for (const alias of entries) {
    let shared = 0;
    for (const folded of alias.stems) {
      if (queryStemSet.has(folded)) shared += 1;
      else if (typos.full.has(folded)) shared += 1;
      else if (typos.partial.has(folded)) shared += 0.5;
    }

    let lexical = 0;
    if (shared > 0 && alias.all.length > 0 && queryStems.length > 0) {
      const aliasSide = shared / alias.all.length;
      const covered = Math.min(1, shared / queryStems.length);
      lexical = Math.sqrt(aliasSide * covered);
    }

    // The second comparison is against the message with its scaffolding taken out. The full phrase is
    // the honest one for spelling, but a visitor who writes "ok can you please tell me about the
    // services" is not writing a less similar sentence than one who writes "the services", and the
    // trigram measure cannot see that difference on its own.
    //
    // `coreAllowed` is the guard on that: stripping the scaffolding also strips the sentence's evidence,
    // and "weather in calicut" reduces to a city name this studio publishes, which measured against the
    // bare alias starts to look like the whole question. When the message contains a word the corpus has
    // never used, that word stays visible to the spelling term as well as to the denominator.
    const character = coreAllowed
      ? Math.max(trigramSimilarity(queryPhrase, alias.content), trigramSimilarity(queryCore, alias.content))
      : trigramSimilarity(queryPhrase, alias.content);
    let candidate = lexical + (1 - lexical) * character;

    if (singleToken && alias.raw.length === 1) {
      candidate = Math.max(candidate, editSimilarity(queryRaw[0], alias.raw[0]));
    }
    if (candidate > best) best = candidate;
  }
  return best;
}

/**
 * The intents that claim this exact query as an authored name: the whole-phrase dictionary plus, for a
 * one-word query, the stem-keyed single-word aliases so "service" reaches the author who wrote
 * "services" and meant it. Empty when the visitor said something nobody authored.
 */
function namedOwners(index: IntentIndex, query: string, queryRaw: string[]): Intent[] {
  const owners = index.exact.get(query) ?? [];
  if (queryRaw.length !== 1) return owners;
  const bareOwners = index.bare.get(stem(queryRaw[0]));
  if (!bareOwners) return owners;
  const merged = [...owners];
  for (const owner of bareOwners) {
    if (!merged.includes(owner)) merged.push(owner);
  }
  return merged;
}

/**
 * True when an intent authored this message, either as its own name or as the same set of topic words
 * under different wrapping. The conversation-state layer asks this before it treats a message as a
 * follow-up: an idiom that is also somebody's authored alias ("more roles", "contact us") is a question
 * with an answer, not a reference back to the last turn, and authoring is the more specific evidence.
 * Checking the same predicates `rank` checks, rather than a second copy of the lookup, is what keeps the
 * two from disagreeing about what "authored" means.
 */
export function isAuthoredName(index: IntentIndex, rawInput: string): boolean {
  const query = normalise(rawInput);
  if (query.length === 0) return false;
  if (namedOwners(index, query, tokens(query)).length > 0) return true;
  const residueKey = residue(query, index.vocabulary).slice().sort().join(" ");
  return residueKey.length > 0 && (index.residueOwners.get(residueKey)?.length ?? 0) === 1;
}

/**
 * Ranks every intent for one query. Tier 1 short-circuits: an authored alias is a decision someone
 * made, and it must not be outvoted by scoring heuristics. A name that more than one intent published
 * under short-circuits too, but to a tie at the top of the list, which `decide` turns into chips
 * rather than into a guess about which of the studio's two identically named lines was meant.
 *
 * `prior` is the intent the previous turn answered, and `resolve` only ever supplies it after the same
 * message has failed to resolve without it. That ordering is the safety: continuity never overrides an
 * answer the pod could reach on its own, it only breaks a tie the pod could not reach at all.
 */
export function rank(index: IntentIndex, rawInput: string, prior?: string | null): Candidate[] {
  const query = normalise(rawInput);
  if (query.length === 0) return [];

  const queryStems = residue(query, index.vocabulary);
  const queryStemSet = new Set(queryStems);
  const queryRaw = tokens(query);
  const typos = typoStems(queryRaw, index);
  // The same message with its scaffolding removed, unstemmed, for the spelling term only.
  const queryCore =
    queryRaw.filter((token) => !isScaffold(token, index.vocabulary)).join(" ") || query;
  // The stripped message may only meet an alias on spelling when every topic word in it is a word this
  // corpus has used. A word nobody published is the one piece of evidence a message might be about
  // something the studio does not sell, and the denominator keeps it for exactly that reason.
  const coreAllowed = queryStems.every((folded) => index.vocabulary.has(folded));

  const named = namedOwners(index, query, queryRaw);
  if (named.length > 0) {
    return named
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((intent) => ({ intent, score: 1, tier: 1 as const }));
  }

  // The same evidence one layer of politeness down. An author who wrote "what are the services" and an
  // author who wrote "services" both stated what those topic words mean; a visitor who wraps them in
  // more courtesy is not asking a different question. Scored as an authored hit rather than re-derived
  // from containment, because containment left this at 1.000 against two runners-up at 0.883 and the
  // margin rule then sent a visitor asking about services back to three chips, which is the exact
  // behaviour the owner called unintelligent.
  //
  // Only when one intent owns that set of words. A residue several intents claim is not a decision, it
  // is a shared topic noun, and promoting it would rank the junk above the arithmetic: "can i see the
  // work" reduces to "work", which three unrelated intents happen to mention, and the pod that answers
  // those at a perfect score stops answering the work question at all. Contested residues therefore
  // fall through to scoring, and the coverage test keeps the authoring honest about them.
  const residueKey = queryStems.slice().sort().join(" ");
  const residueNamed = residueKey.length > 0 ? (index.residueOwners.get(residueKey) ?? []) : [];
  if (residueNamed.length === 1) {
    return [{ intent: residueNamed[0], score: 1, tier: 1 as const }];
  }
  // A contested residue the visitor has already been talking about is not an open question. They asked
  // about services, the pod asked which kind, and they have just said "the services" again: the two
  // owners are still both real, but the conversation says which one is being continued. Only the
  // previous turn's own intent wins here, so this can never invent an answer, only pick between phrasings
  // somebody already authored.
  if (residueNamed.length > 1 && prior && residueNamed.some((owner) => owner.id === prior)) {
    const continued = index.intents.find((intent) => intent.id === prior);
    if (continued) return [{ intent: continued, score: 1, tier: 1 as const }];
  }

  const scored: Candidate[] = [];

  for (const intent of index.intents) {
    const keyword = keywordScore(queryStemSet, queryStems.length, index.keywordSets.get(intent.id) ?? [], typos);
    const fuzzy = fuzzyScore(
      queryStems,
      queryStemSet,
      query,
      queryCore,
      coreAllowed,
      queryRaw,
      index.aliases.get(intent.id) ?? [],
      typos,
    );
    const cold = Math.max(keyword, fuzzy) * intentPrior(intent.id);
    if (cold === 0) continue;
    // Continuity lifts a candidate that was already in the conversation's range. Applying it to a 0.2
    // would turn a fallback into a question about the wrong subject, and a pod that asks after the
    // wrong thing twice has lost the visitor.
    const score =
      prior && cold >= FLOOR_THRESHOLD && familyRoot(intent.id) === familyRoot(prior)
        ? Math.min(1, cold * CONTINUITY_PRIOR)
        : cold;
    scored.push({ intent, score, tier: keyword >= fuzzy ? 2 : 3 });
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
 *
 * `prior` is the intent the previous turn answered. It is applied as a second pass, only when the
 * message did not resolve on its own, so the conversation can only ever break a tie the resolver could
 * not break alone; it cannot change an answer the pod was already confident about, and a visitor who
 * moves to a new subject moves to it cleanly.
 */
export function resolve(
  index: IntentIndex,
  rawInput: string,
  options: { locked: boolean; prior?: string | null },
): MatchOutcome {
  if (options.locked) {
    // The same published policy, applied to the survivors: filtering the candidates is not the same
    // as lowering the bar, and a locked pod that answers a 0.6 match it would otherwise question is a
    // pod that guesses after it promised to stop guessing. A contested name that clears the escape
    // hatch twice has no uncontested leader, so it falls back rather than picking.
    const permitted = rank(index, rawInput).filter((candidate) =>
      ALWAYS_RESOLVABLE.has(candidate.intent.id),
    );
    const outcome = decide(permitted);
    return outcome.kind === "answer" ? outcome : { kind: "fallback", candidates: [] };
  }

  const cold = decide(rank(index, rawInput));
  if (cold.kind === "answer" || !options.prior) return cold;
  return decide(rank(index, rawInput, options.prior));
}
