/**
 * Offline, dictionary-backed spelling checks for the markdown editor — the
 * fallback used whenever the online professional dictionary is unreachable
 * (see online-spellcheck.ts) and the source of suggestions/squiggles for
 * documents larger than the online limit.
 *
 * English (words.ts) and French (words-fr.ts) are checked offline: each
 * dictionary covers short common words plus a curated church/ministry +
 * app-vocabulary addendum; inflection rules recover most plurals/verb forms
 * of longer roots, and contraction/elision sets keep everyday prose clean.
 * Browser-native spellcheck remains the primary "squiggle" renderer; this
 * module powers the editor's Spelling report, suggestions, and the "Ignore"
 * feature.
 */

import { WORDS } from './words'
import { FR_WORDS } from './words-fr'

export type SpellLanguage = 'EN' | 'FR'

const WORD_SET: ReadonlySet<string> = new Set(WORDS)
const FR_WORD_SET: ReadonlySet<string> = new Set(FR_WORDS)

/** Common contractions that the base list (no apostrophes) cannot express. */
const CONTRACTIONS: ReadonlySet<string> = new Set([
  "don't", "doesn't", "didn't", "can't", "cannot", "won't", "wouldn't", "couldn't",
  "shouldn't", "isn't", "aren't", "wasn't", "weren't", "hasn't", "haven't", "hadn't",
  "it's", "that's", "there's", "here's", "where's", "how's", "he's", "she's", "what's",
  "who's", "let's", "i'm", "i've", "i'll", "i'd", "you're", "you've", "you'll",
  "they're", "they've", "we're", "we've", "o'clock", "ain't", "ma'am", "c'mon",
])

const COMMON_ROMAN_NUMERALS: ReadonlySet<string> = new Set([
  'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii',
  'xiii', 'xiv', 'xv', 'xx', 'xxi', 'xxx', 'xl', 'l', 'li', 'lx', 'xc', 'c',
  'ci', 'cxi', 'cci', 'ccxi', 'd', 'dc', 'm', 'mc', 'mcm', 'md', 'mm', 'mmx',
  'mmxix', 'mmxx', 'mmxxi', 'mmxxii', 'mmxxiii', 'mmxxiv',
])

/** French words the base list expresses awkwardly — elisions and compounds. */
const FR_CONTRACTIONS: ReadonlySet<string> = new Set([
  "aujourd'hui", "quelqu'un", "quelqu'une", "presqu'île", "presqu'ile",
  "jusqu'au", "jusqu'à", "jusqu'ici", "jusqu'alors", "afin qu'il",
  "lorsqu'il", "puisqu'il", "quoiqu'il", "quoiqu'elle",
])

export interface SpellIssue {
  /** The token exactly as typed in the document. */
  word: string
  /** Start offset in the scanned (marker-free) document string. */
  start: number
  /** End offset in the scanned document string. */
  end: number
  /** Corrections suggested by the online dictionary when the scan came from the remote source. */
  suggestions?: string[]
}

/**
 * Builds the ranges of markdown that should never be spellchecked: fenced
 * code blocks, inline code spans, image/link destinations (the `(url …)`
 * part), autolinks, HTML tags, and HTML comments.
 */
export function markdownSkipRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = []

  // Fenced code blocks (``` or ~~~), closing fence at the same nesting.
  const lines = text.split('\n')
  let offset = 0
  let fence: string | null = null
  let fenceStart = 0
  for (const line of lines) {
    const trimmed = line.trim()
    if (fence) {
      if (trimmed.startsWith(fence)) {
        ranges.push([fenceStart, offset + line.length])
        fence = null
      }
    } else if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      fence = trimmed.startsWith('```') ? '```' : '~~~'
      fenceStart = offset
    }
    offset += line.length + 1
  }
  if (fence) ranges.push([fenceStart, text.length])

  // Inline code spans, image/link destinations+title, HTML tags and comments, autolinks.
  const patterns = [
    /`{1,}[^`\n]{0,}`{1,}/g,
    /!?\[[^\]]*\]\(\s*[^\s)]+(?:\s+(["'])[\s\S]*?\1)?\s*\)/g,
    /<[^>]+>/g,
    /<!--[\s\S]*?-->/g,
  ]
  for (const re of patterns) {
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) {
      let from = m.index
      let to = m.index + m[0].length
      // For image/link destinations, only skip the parenthesised part so the
      // link text keeps being checked.
      const paren = m[0].indexOf('(')
      if (paren >= 0 && m[0][0] !== '<') {
        from = m.index + paren
        to = m.index + m[0].length - 1
      }
      ranges.push([from, to])
    }
  }

  ranges.sort((a, b) => a[0] - b[0])
  return ranges
}

/** Returns all word-token positions that fall outside every skip range. */
export function scannableWords(text: string, skipRanges: Array<[number, number]>): Array<{ word: string; start: number; end: number }> {
  const out: Array<{ word: string; start: number; end: number }> = []
  const re = /[\p{L}][\p{L}\u0027\u2019-]*/gu
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const word = m[0]
    const start = m.index
    const end = start + word.length
    if (start !== end && skipRanges.some(([a, b]) => start >= a && end <= b)) continue
    out.push({ word, start, end })
  }
  return out
}

export function normalizeWord(word: string): string {
  // Strip surrounding punctuation and force lowercase as the dictionary key.
  return word.toLowerCase().replace(/^[\u0027\u2019\-\p{P}]+|[\u0027\u2019\-\p{P}]+$/gu, '').trim()
}

/** Inflected/contracted forms of a word are accepted if their stem is known. */
export function inflectionCandidates(lower: string): string[] {
  const candidates: string[] = []
  const push = (s: string) => {
    if (s.length >= 3) candidates.push(s)
  }

  if (lower.endsWith("'s")) push(lower.slice(0, -2))
  if (lower.endsWith('’s')) push(lower.slice(0, -2))
  if (lower.endsWith("n't") && lower.length > 4) push(lower.slice(0, -3))
  if (lower.endsWith('n’t') && lower.length > 4) push(lower.slice(0, -3))

  if (lower.endsWith('ies') && lower.length > 4) push(`${lower.slice(0, -3)}y`)
  if (lower.endsWith('ves') && lower.length > 4) {
    push(`${lower.slice(0, -3)}f`)
    push(`${lower.slice(0, -3)}fe`)
  }
  if (lower.endsWith('es') && !lower.endsWith('ies') && lower.length > 4) push(lower.slice(0, -2))
  if (lower.endsWith('s') && !lower.endsWith('ss') && lower.length > 3) push(lower.slice(0, -1))

  for (const suffix of ['ing', 'ed', 'er', 'est', 'en', 'ly']) {
    if (lower.endsWith(suffix) && lower.length > suffix.length + 2) {
      const base = lower.slice(0, -suffix.length)
      push(base)
      if (suffix[0] === 'i' || suffix[0] === 'e') push(`${base}e`)
      if (base.length >= 4 && base.endsWith(base[base.length - 1])) push(base.slice(0, -1))
    }
  }

  for (const suffix of ['ation', 'ition', 'tion', 'sion', 'ness', 'ment', 'ship', 'hood', 'able', 'ible', 'less', 'ous', 'ful', 'ish', 'ize', 'ise', 'ism', 'ist', 'logy', 'graphy']) {
    if (lower.endsWith(suffix) && lower.length > suffix.length + 2) push(lower.slice(0, -suffix.length))
  }
  if (lower.endsWith('ical') && lower.length > 6) push(`${lower.slice(0, -4)}ic`)
  if (lower.endsWith('icity') && lower.length > 7) push(`${lower.slice(0, -5)}ic`)
  if (lower.endsWith('ity') && lower.length > 5) push(`${lower.slice(0, -3)}e`)
  if (lower.endsWith('ly') && lower.length > 4) push(lower.slice(0, -2))
  if (lower.endsWith('ize') || lower.endsWith('ise')) {
    if (lower.length > 5) push(lower.slice(0, -3))
  }

  return candidates
}

/** Drops diacritics so "ecole" and "�cole" unify for matching/suggestions. */
export function foldAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** French inflection recovery — plurals, common verb endings, noun suffixes. */
export function frenchInflectionCandidates(lower: string): string[] {
  const candidates: string[] = []
  const push = (s: string) => {
    if (s.length >= 2 && s.length <= 18) candidates.push(s)
  }

  // Plurals and gender stems.
  if (lower.endsWith('eaux')) push(`${lower.slice(0, -4)}eau`)
  if (lower.endsWith('aux')) push(`${lower.slice(0, -3)}al`)
  if (lower.endsWith('oux')) push(`${lower.slice(0, -3)}ou`)
  if (lower.endsWith('x') && lower.length > 3) push(lower.slice(0, -1))
  if (lower.endsWith('s') && lower.length > 3) push(lower.slice(0, -1))

  // Verb conjugations — try the stripped stem, its infinitive (-er) and
  // third-person (-e) form; the frequency dictionary usually already has the
  // inflected form, so these are a fallback for rarer verbs.
  const verbEndings = [
    'aient', 'eraient', 'erais', 'erait', 'erions', 'eriez', 'eront', 'erons',
    'erez', 'iez', 'ions', 'aient', 'ent', 'ons', 'ez', 'ais', 'ait', 'ant',
    'ees', 'es', 'ee', 'e', 'issent', 'issez', 'issons', 'irent', 'it', 'is',
  ]
  for (const suffix of verbEndings) {
    if (lower.endsWith(suffix) && lower.length > suffix.length + 2) {
      const stem = lower.slice(0, -suffix.length)
      push(stem)
      push(`${stem}er`)
      push(`${stem}e`)
      if (lower.endsWith('issent') || lower.endsWith('issez') || lower.endsWith('issons')) {
        push(`${stem}ir`)
      }
    }
  }

  // Common nominal/adjectival suffixes.
  for (const suffix of ['tion', 'sion', 'ment', 'age', 'ure', 'ance', 'ence', 'eur', 'euse', 'té', 'tés', 'isme', 'iste', 'erie', 'ique', 'able', 'ible', 'eux']) {
    if (lower.endsWith(suffix) && lower.length > suffix.length + 2) push(lower.slice(0, -suffix.length))
  }

  return candidates
}

export function isKnownWord(rawWord: string, language: SpellLanguage = 'EN'): boolean {
  const lower = normalizeWord(rawWord)
  if (!lower || lower.length < 2) return true
  if (language === 'EN' || lower.length > 18) {
    if (CONTRACTIONS.has(lower)) return true
    if (COMMON_ROMAN_NUMERALS.has(lower)) return true
    if (WORD_SET.has(lower)) return true
    return inflectionCandidates(lower).some((stem) => WORD_SET.has(stem))
  }
  // French
  if (FR_CONTRACTIONS.has(lower)) return true
  if (FR_WORD_SET.has(lower)) return true
  // Elided ("l'école", "c'est") and hyphenated ("rendez-vous") tokens are
  // accepted when every apostrophe/hyphen segment is itself a known word.
  if (/[\u0027\u2019-]/.test(lower)) {
    const segments = lower.split(/[\u0027\u2019-]/).filter(Boolean)
    if (segments.length > 1 && segments.every((seg) => isKnownWord(seg, 'FR'))) return true
  }
  // Also try the whole token without diacritics (dict is accent-coded).
  if (FR_WORD_SET.has(foldAccents(lower))) return true
  return frenchInflectionCandidates(lower).some((stem) => FR_WORD_SET.has(stem) || FR_WORD_SET.has(foldAccents(stem)))
}

/** Whether a word should be treated as an obvious acronym / all-caps token. */
export function isLikelyAcronym(word: string): boolean {
  if (word.length < 2) return false
  if (!/[A-Z]/.test(word[0])) return false
  if (word.length >= 2 && /^[A-Z]+$/.test(word)) return true
  return false
}

/**
 * Scans a single document body for misspelled words. Offsets refer to the
 * exact `text` string passed in, so callers can map them into a CodeMirror
 * document provided they pass the same (marker-free) string the editor holds.
 */
export function scanSpellIssues(
  text: string,
  ignore: ReadonlySet<string> = EMPTY_IGNORE,
  language: SpellLanguage = 'EN',
): SpellIssue[] {
  const skipRanges = markdownSkipRanges(text)
  const issues: SpellIssue[] = []
  for (const { word, start, end } of scannableWords(text, skipRanges)) {
    if (isLikelyAcronym(word)) continue
    const lower = normalizeWord(word)
    if (!lower || ignore.has(lower)) continue
    if (isKnownWord(word, language)) continue
    issues.push({ word, start, end })
  }
  return issues
}

const EMPTY_IGNORE: ReadonlySet<string> = new Set()

/**
 * Every occurrence of `rawWord` (exact spelling) as a standalone token in the
 * document, skipping markdown that must not be edited. Used by replace-all so
 * a flagged word's corrections reach exactly the positions the user saw,
 * regardless of which dictionary produced the flag.
 */
export function occurrencesOfRawWord(text: string, rawWord: string): Array<{ start: number; end: number }> {
  if (!rawWord) return []
  const skip = markdownSkipRanges(text)
  return scannableWords(text, skip)
    .filter((w) => w.word === rawWord)
    .map((w) => ({ start: w.start, end: w.end }))
}

/* ------------------------------ suggestions ------------------------------ */

interface WordEntry {
  word: string
  folded: string
}

// Buckets by (accent-folded) first letter so suggestion search touches a
// fraction of the list. Storing the folded form lets "ecole" match "école".
function buildBuckets(set: ReadonlySet<string>): ReadonlyMap<string, ReadonlyArray<WordEntry>> {
  const map = new Map<string, WordEntry[]>()
  for (const word of set) {
    const folded = foldAccents(word)
    const key = folded[0] ?? ''
    const bucket = map.get(key)
    const entry: WordEntry = { word, folded }
    if (bucket) bucket.push(entry)
    else map.set(key, [entry])
  }
  return map
}

const LANG_BUCKETS: Record<SpellLanguage, ReadonlyMap<string, ReadonlyArray<WordEntry>>> = {
  EN: buildBuckets(WORD_SET),
  FR: buildBuckets(FR_WORD_SET),
}

/** Optimal-string-alignment (OSA) Damerau–Levenshtein distance, capped. */
export function damerauLevenshtein(a: string, b: string, cap = 2): number {
  const m = a.length
  const n = b.length
  if (Math.abs(m - n) > cap) return cap + 1
  // Full matrix is fine: dictionary words are <= 8 (EN) / 18 (FR) chars, typos are short.
  const d: number[][] = []
  for (let i = 0; i <= m; i++) {
    d.push(new Array<number>(n + 1).fill(0))
    d[i][0] = i
  }
  for (let j = 0; j <= n; j++) d[0][j] = j
  for (let i = 1; i <= m; i++) {
    let rowMin = Infinity
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
      if (d[i][j] < rowMin) rowMin = d[i][j]
    }
    if (rowMin > cap) return cap + 1
  }
  return d[m][n]
}

export function suggestFor(rawWord: string, limit = 5, language: SpellLanguage = 'EN'): string[] {
  const lower = normalizeWord(rawWord)
  if (!lower) return []
  const foldedLower = foldAccents(lower)
  const key = foldedLower[0] ?? ''
  const bucket = LANG_BUCKETS[language].get(key) ?? []
  const scored: Array<{ word: string; dist: number }> = []
  const minLen = foldedLower.length - 2
  const maxLen = foldedLower.length + 2
  for (const candidate of bucket) {
    if (candidate.word === lower) continue
    if (candidate.folded.length < minLen || candidate.folded.length > maxLen) continue
    const dist = damerauLevenshtein(candidate.folded, foldedLower)
    if (dist <= 2) scored.push({ word: candidate.word, dist })
  }
  scored.sort((x, y) => x.dist - y.dist || x.word.localeCompare(y.word))
  return scored.slice(0, limit).map((s) => s.word)
}