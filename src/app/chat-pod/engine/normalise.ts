/**
 * @file normalise.ts
 * @description Text normalisation shared by every matching tier and by the intent table's
 *              authored utterances. Normalising the corpus through the same function the
 *              visitor's input goes through is what makes alias authoring reliable: an intent
 *              written as "account-based marketing" and a query typed as "Account Based
 *              Marketing" collapse to one key without duplicating the alias.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

/**
 * Separators folded to a space rather than deleted. Deleting them would weld adjacent words
 * together ("account-based" -> "accountbased") and stop Tier 2 whole-word keyword matching
 * from ever seeing "account" or "based".
 */
const SEPARATORS = /[/\\&,_\-–—]+/g;

/** Curly and modifier apostrophes folded to the straight form the corpus is authored with. */
const APOSTROPHE = /[\u2018\u2019\u02BC`]/g;

/**
 * Everything else punctuation-related is removed, but the straight apostrophe is deliberately
 * kept. The authored script contains contraction-bearing utterances ("that's all", "i'd like to
 * chat") and dropping the apostrophe here would make those Tier 1 keys unreachable.
 */
const PUNCTUATION = /[.!?:;"()\[\]{}<>#@$%^*+=~|]/g;

/**
 * Canonical form used for Tier 1 exact lookup, tokenisation, and indexing of authored aliases.
 * Idempotent: normalise(normalise(x)) === normalise(x), which the coverage test relies on when it
 * indexes the intent table.
 */
export function normalise(raw: string): string {
  return raw
    .toLowerCase()
    .replace(APOSTROPHE, "'")
    .replace(SEPARATORS, " ")
    .replace(PUNCTUATION, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Space-delimited tokens of an already-normalised string. */
export function tokens(normalised: string): string[] {
  return normalised.length === 0 ? [] : normalised.split(" ");
}

/**
 * Question scaffolding: the words a visitor wraps a topic in, not the topic itself.
 *
 * These are dropped when *scoring* and never when keying. A Tier 1 alias is still stored and
 * looked up as the full authored phrase, so "what are your services" remains exactly one alias in
 * the dictionary; only Tier 2 and Tier 3 see the residue, which is "{service}". That distinction is
 * the whole reason the set lives here instead of inside `normalise`: folding these words into the
 * canonical form would rewrite every alias key and silently orphan the ones that read like speech
 * ("that is all", "what is it you do").
 *
 * The list is closed-class plus the verbs of asking. "tell", "show", "explain" and "want" state that
 * the visitor is requesting something; they never name the thing requested, so keeping them in the
 * denominator punished every polite sentence for being polite. Words that can genuinely be the subject
 * of a question are kept: "help", "need", "cost", "charge", "work", "hire", and "availability", which
 * is what the timeline intent is actually about. Dropping those is how an intent stops being findable
 * by the one word that names its subject.
 */
export const QUERY_STOPWORDS: ReadonlySet<string> = new Set([
  "a", "an", "about", "all", "also", "and", "any", "are", "as", "at", "be", "been", "but", "by",
  "can", "could", "describe", "did", "do", "does", "down", "explain", "for", "from", "get", "give",
  "had", "has", "have", "he", "her", "him", "his", "how", "i", "if", "in", "into", "is", "it", "its",
  "just", "kind", "kinds", "know", "like", "lot", "me", "might", "many", "much", "more", "most", "my",
  "no", "nor", "not", "of", "off", "on", "once", "or", "our", "out", "own", "please", "provide",
  "provided", "provides", "really", "said", "say", "see", "she", "should", "show", "so", "some",
  "such", "tell", "than", "that", "the", "their", "them", "then", "there", "these", "they", "thing",
  "things", "this", "those", "through", "to", "too", "us", "want", "we", "were", "what", "when",
  "where", "which", "who", "whom", "why", "will", "with", "would", "you", "your",
]);

/**
 * Morphological fold used on both sides of every scored comparison, so the keyword "service" reaches
 * the word "services" and the alias "cases" reaches "case".
 *
 * Deliberately crude: plurals, then a trailing silent "e". Two rules and no library is the entire
 * budget. It is lossy on purpose ("service" and "services" both become "servic") and it must stay
 * lossy in only that direction, so the short-circuits below exist: words under four characters are
 * returned untouched (a fold of "art" would collide with nothing useful but a fold of "the" to "th"
 * makes a token unsearchable), and a stem is never allowed to eat the last vowel of a word, which is
 * why the "e" strip is gated on length rather than applied blind.
 */
export function stem(token: string): string {
  if (token.length < 4) return token;
  if (token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.endsWith("ss")) return token;
  let folded = token.endsWith("s") ? token.slice(0, -1) : token;
  if (folded.length >= 4 && folded.endsWith("e")) folded = folded.slice(0, -1);
  return folded;
}

/**
 * Topic tokens of a query: stop-word free, stemmed, in first-seen order.
 * Returns the stems of the full token list when nothing survives, so a message that is pure
 * scaffolding ("what is it") still scores against the corpus instead of producing an empty vector
 * that silently matches nothing. That fallback is the difference between "I did not understand" and
 * a crash-shaped hole in the resolver.
 */
export function contentTokens(normalised: string): string[] {
  const all: string[] = [];
  const kept: string[] = [];
  for (const token of tokens(normalised)) {
    const folded = stem(token);
    if (all.indexOf(folded) === -1) all.push(folded);
    if (!QUERY_STOPWORDS.has(token) && kept.indexOf(folded) === -1) kept.push(folded);
  }
  return kept.length > 0 ? kept : all;
}

/**
 * Character trigrams with word boundaries padded in, so "hi" yields [" hi", "hi ", " h i"]-style
 * context rather than nothing. Padding is what lets two-character and three-character inputs
 * produce a usable overlap score; unpadded, "hi" has zero trigrams and every short greeting
 * would fall through Tier 3.
 */
export function trigrams(normalised: string): string[] {
  const padded = `  ${normalised}  `;
  const out: string[] = [];
  for (let i = 0; i < padded.length - 2; i++) {
    out.push(padded.slice(i, i + 3));
  }
  return out;
}

/**
 * Levenshtein distance, hand-rolled. It is ~14 lines and runs on a single row, which is smaller
 * than any published implementation, so the matcher gains no dependency. Used only for
 * single-token queries, where trigram overlap degenerates and edit distance is the honest
 * measure of a typo.
 */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  const current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + substitutionCost);
    }
    for (let j = 0; j <= b.length; j++) previous[j] = current[j];
  }
  return previous[b.length];
}

/** Similarity in [0,1]; 1 means identical, 0 means no shared characters at all. */
export function editSimilarity(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  const longest = Math.max(a.length, b.length);
  return 1 - editDistance(a, b) / longest;
}

/** Jaccard overlap over two trigram multisets, evaluated as sets. */
export function trigramSimilarity(a: string, b: string): number {
  const left = new Set(trigrams(a));
  const right = new Set(trigrams(b));
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const gram of left) {
    if (right.has(gram)) shared++;
  }
  return shared / (left.size + right.size - shared);
}

/**
 * Fraction of the *corpus* utterance's tokens present in the query. Measured against the
 * utterance rather than the query so a short query cannot win by being a subset of a long one;
 * that is what keeps "hi" from scoring well against a sixteen-token services question.
 */
export function tokenOverlap(queryTokens: string[], utteranceTokens: string[]): number {
  if (utteranceTokens.length === 0) return 0;
  const haystack = new Set(queryTokens);
  let hits = 0;
  for (const token of utteranceTokens) {
    if (haystack.has(token)) hits++;
  }
  return hits / utteranceTokens.length;
}
