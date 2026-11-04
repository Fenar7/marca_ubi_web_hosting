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
  "no", "nor", "not", "of", "off", "on", "once", "or", "our", "out", "own", "ok", "okay", "please", "provide",
  "provided", "provides", "really", "said", "say", "see", "she", "should", "show", "so", "some",
  "such", "tell", "than", "that", "the", "their", "them", "then", "there", "these", "they", "thing",
  "things", "this", "those", "through", "to", "too", "us", "want", "we", "were", "what", "when",
  "where", "which", "who", "whom", "why", "will", "with", "would", "you", "your",
]);

/**
 * Abbreviations of the chat register, folded to the word they stand for before the scaffolding test.
 *
 * These are not typos: they are a way of writing, and they carry no more subject than the word they
 * replace. The list is deliberately short and closed-class only. "svc" or "mktg" are not here because
 * they name a subject, and a subject the corpus does not spell out must stay visible in the
 * denominator rather than be smoothed into a guess.
 */
export const CHAT_ABBREVIATIONS: Readonly<Record<string, string>> = {
  abt: "about",
  plz: "please",
  pls: "please",
  th: "the",
  u: "you",
  ur: "your",
  yu: "you",
};

/**
 * Deletion-neighbourhood index over the scaffolding vocabulary, built once at module load.
 *
 * Two strings one edit apart always share a deletion variant (delete the differing character from each
 * and the results are equal), so testing membership here answers "is this token one keystroke from a
 * scaffolding word" in linear time and exactly at distance 1. Adjacent swaps are indexed too, because
 * "whta" is the most common mistyping there is and it sits two edits from "what" under deletion while
 * being one keystroke from it under transposition. Distance 2 in the substitution sense is deliberately
 * excluded: it is where "art" starts reaching "are" and a topic word gets eaten by the grammar filter.
 */
const SCAFFOLD_NEIGHBOURS: Set<string> = (() => {
  const out = new Set<string>();
  const sources = [...QUERY_STOPWORDS, ...Object.keys(CHAT_ABBREVIATIONS)];
  for (const word of sources) {
    out.add(word);
    for (let i = 0; i < word.length; i++) out.add(word.slice(0, i) + word.slice(i + 1));
    for (let i = 0; i < word.length - 1; i++) {
      out.add(word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2));
    }
  }
  return out;
})();

/** The scaffolding word a token stands for, or the token itself. */
function folded(token: string): string {
  return Object.hasOwn(CHAT_ABBREVIATIONS, token) ? CHAT_ABBREVIATIONS[token] : token;
}

/**
 * True when a token is grammar rather than subject: an authored stop word, a chat abbreviation of one,
 * or a one-keystroke misspelling of one ("plese", "woudl", "thier").
 *
 * The `known` guard is what keeps this honest. A word the corpus actually uses is never treated as a
 * typo of a stop word, so "town" stays a subject even though it is one edit from "down", and the
 * forgiveness can only ever reach for words that carry no meaning here anyway.
 *
 * The length floor is the other half of that honesty: a four-character miss is one deletion away from
 * a real noun, so "wtih" is charged to the visitor as a topic rather than eaten as grammar. The cost
 * is one lower score for a typo in a short word — except for the one class where the cost was a wrong
 * answer instead. A transposition cannot shorten a word, and the four-character misses that matter are
 * the ones made on the first word of a question ("whta", "tihs", "ytou"), so that length is forgiven
 * against `INTERROGATIVE_SWAPS` and against nothing else. The two subsystems used to disagree here:
 * `looksLikeQuestion` already read "whta" as a mistyped opener while the scorer charged it as an
 * unknown topic, which is how "whta do you do" fell below the floor that "what do you do" clears.
 *
 * `looksLikeQuestion` spends the same forgiveness narrowly — only on the leading word, and only where
 * the rest of the sentence proves it inverted — because there the failure is a question read as an
 * answer, not a subject erased from the index.
 */
export function isScaffold(token: string, known: ReadonlySet<string>): boolean {
  const word = folded(token);
  if (QUERY_STOPWORDS.has(word)) return true;
  if (token.length < 4 || known.has(token) || known.has(word)) return false;
  if (token.length === 4) return INTERROGATIVE_SWAPS.has(token);
  return SCAFFOLD_NEIGHBOURS.has(token);
}

/**
 * Topic tokens of a query: scaffolding out, stemmed, first-seen order.
 *
 * This is `contentTokens` with the two forgiveness rules above applied, which is what a typed message
 * needs and an authored alias does not. Returns the stems of the whole message when nothing survives,
 * so a message that is pure scaffolding ("what is it") still scores against the corpus instead of
 * producing an empty vector that silently matches nothing.
 */
export function residue(normalised: string, known: ReadonlySet<string>): string[] {
  const all: string[] = [];
  const kept: string[] = [];
  for (const token of tokens(normalised)) {
    const stemOf = stem(folded(token));
    if (all.indexOf(stemOf) === -1) all.push(stemOf);
    if (!isScaffold(token, known) && kept.indexOf(stemOf) === -1) kept.push(stemOf);
  }
  return kept.length > 0 ? kept : all;
}

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

/**
 * The three families that open an English question, kept apart because they carry different evidence.
 *
 * A *wh*-word announces a question by itself, and so does a verb of asking ("tell me", "show me
 * examples") or the politeness marker a request is wrapped in ("pls send info", which folds to
 * "please send info" before it is ever read). An auxiliary announces one only when the sentence is
 * inverted — "is there a deadline" is a question and "is" in "will need packaging next month" is
 * somebody filling in a blank. Splitting the families is what lets the shape test read the inversion
 * without a parser, and it is why the auxiliary list is not simply trusted the way the *wh* list is.
 */
const WH_WORDS: ReadonlySet<string> = new Set([
  "what", "whats", "when", "where", "which", "who", "whom", "whose", "why", "how",
]);

const AUXILIARY_WORDS: ReadonlySet<string> = new Set([
  "is", "are", "was", "were", "do", "does", "did", "can", "could", "will", "would", "should", "may",
  "might",
]);

const REQUEST_WORDS: ReadonlySet<string> = new Set(["tell", "explain", "describe", "show", "please"]);

/**
 * What an inverted question puts after its auxiliary: the subject, or the article that introduces it.
 *
 * This is the inversion evidence, and it is deliberately narrower than "any word". A blank answer that
 * happens to open on an auxiliary usually continues with the thing being described ("will need
 * packaging", "would like a website", "can start immediately"), and a noun is not a subject pronoun —
 * so the answer stays an answer.
 */
const SUBJECT_WORDS: ReadonlySet<string> = new Set([
  "i", "me", "my", "you", "your", "yours", "we", "our", "us", "he", "she", "it", "its", "they",
  "their", "this", "that", "these", "those", "there", "here", "one", "someone", "anyone", "nobody",
  "everybody", "a", "an", "the",
]);

/** Every word that can open a question, for the neighbourhood index below. */
const QUESTION_LEAD_WORDS: ReadonlySet<string> = new Set([
  ...WH_WORDS,
  ...AUXILIARY_WORDS,
  ...REQUEST_WORDS,
]);

/**
 * Adjacent transpositions of the interrogative openers, four characters and up.
 *
 * This is the short list `isScaffold` is allowed to consult at four characters. It is built from the
 * openers and not from the whole stop-word set because the swap of a preposition lands on a word that
 * means something here: "from" swaps to "form", and a visitor talking about a form would have their
 * subject eaten as a typo. "what" swaps to "whta", which is a subject nobody is asking about.
 */
const INTERROGATIVE_SWAPS: Set<string> = (() => {
  const out = new Set<string>();
  for (const word of QUESTION_LEAD_WORDS) {
    if (word.length < 4) continue;
    for (let i = 0; i < word.length - 1; i++) {
      out.add(word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2));
    }
  }
  return out;
})();

/**
 * One keystroke from a question-opener: deletion and adjacent-transposition variants.
 *
 * Visitors mistype the first word more than any other because it is where the fingers are still
 * finding the keyboard, and "whta is marka ubi" is exactly the message that used to be filed into a
 * name field. A transposition preserves length, so every swap is indexed. A deletion shortens the
 * word, and the floor is where the two families of opener part company: four characters for
 * auxiliaries and verbs of asking, three for the *wh*-words.
 *
 * The difference is what a shortened opener collides with. Deleting a letter from "does" gives "des",
 * from "tell" gives "tel", from "will" gives "wil" — tokens that are names and real words an answer
 * legitimately opens with. Deleting one from "what" gives "wat", "wha", "wht" and "hat", and nothing
 * that a visitor means as an answer begins with those and then proves the sentence inverted.
 */
const QUESTION_LEAD_NEIGHBOURS: Set<string> = (() => {
  const out = new Set<string>();
  for (const word of QUESTION_LEAD_WORDS) {
    const floor = WH_WORDS.has(word) ? 3 : 4;
    for (let i = 0; i < word.length; i++) {
      const deleted = word.slice(0, i) + word.slice(i + 1);
      if (deleted.length >= floor) out.add(deleted);
    }
    for (let i = 0; i < word.length - 1; i++) {
      out.add(word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2));
    }
  }
  return out;
})();

/**
 * Whether a message is built in the shape of a question.
 *
 * The brief needs this because nothing in the corpus does: at a blank the visitor types into, "who are
 * you" is a detour and "Kerala, for the temple project" is the answer, and both are words the pod has
 * seen. So the test reads the shape the message arrives in — an interrogative opening, an auxiliary
 * followed by its subject, a mistyped version of either, or a mark the visitor put there themselves —
 * and never a score, which is what keeps it out of the resolver's way.
 *
 * Abbreviations are folded before the opening is classified, because "can yu build an app" is the same
 * shape as "can you build an app" and the chat register is how these messages arrive.
 */
export function looksLikeQuestion(raw: string): boolean {
  const text = raw.trim();
  if (text.length === 0) return false;
  if (text.endsWith("?")) return true;

  const parts = tokens(normalise(text)).map(folded);
  if (parts.length === 0) return false;

  // "what's", "who's", "can't" — the contraction is part of the opener, not a second word.
  const lead = parts[0].replace(/'.*$/, "");
  const after = parts[1] ?? "";
  const inverted = SUBJECT_WORDS.has(after) || AUXILIARY_WORDS.has(after);

  if (WH_WORDS.has(lead) || REQUEST_WORDS.has(lead)) return true;
  if (AUXILIARY_WORDS.has(lead)) return inverted;

  // A *wh*-word can also arrive at the end, which is how somebody asks for the value of a thing they
  // can already see on screen: "the services are which", "your price is what". Nothing written as an
  // answer closes on an interrogative, so this needs no inversion evidence — only a sentence long
  // enough to have been built around the word.
  const tail = parts[parts.length - 1].replace(/'.*$/, "");
  if (parts.length >= 3 && WH_WORDS.has(tail)) return true;

  // A mistyped opener only counts on evidence: a second word that proves the sentence is inverted,
  // and an opening that is not itself a subject ("here is the link" is somebody pasting a URL).
  if (parts.length < 2) return false;
  if (SUBJECT_WORDS.has(lead) || QUERY_STOPWORDS.has(lead)) return false;
  return inverted && QUESTION_LEAD_NEIGHBOURS.has(lead);
}

/**
 * True when a message opens on a chat abbreviation instead of on its own subject: `abt pricing`,
 * `u offer web design`.
 *
 * A blank the visitor writes into has no sentence shape to read, and the resolver's opinion is not
 * evidence that a phrase is a question. Measured against this corpus, `social media`, `brand identity`
 * and `demand generation` are each answered at full confidence — and each is the kind of thing a
 * visitor names their project — so "the engine has an answer for it" cannot be the test for whether
 * something typed at a blank was meant as a question. An abbreviation can be: nobody spells their own
 * proper noun the way they text a friend. A leading `abt`, `th`, `u`, `ur`, `pls` or `plz` followed by
 * more words is the one multi-word signal at a verbatim blank that means "I am asking you something"
 * rather than "store this".
 */
export function opensWithChatShorthand(raw: string): boolean {
  const parts = tokens(normalise(raw.trim()));
  return parts.length > 1 && Object.hasOwn(CHAT_ABBREVIATIONS, parts[0]);
}
