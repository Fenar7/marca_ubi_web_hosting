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

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
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
