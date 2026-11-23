/**
 * Small text helpers for site search: turn HTML / markdown into plain text,
 * split long text into parts, and make a short "…around the word…" snippet.
 */

/** Longest stored part (characters). Long texts are split on paragraphs/sentences. */
export const CHUNK_SIZE = 2500

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', mdash: '—', ndash: '–' }

/** HTML or markdown → plain readable text (keeps paragraph breaks). */
export function toPlainText(input: string | null | undefined): string {
  if (!input) return ''
  return input
    .replace(/<!--[\s\S]*?-->/g, ' ') // editor style comments
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|blockquote|tr|br)\s*>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#\d+|[a-z]+);/gi, (m, e: string) => (e[0] === '#' ? String.fromCharCode(Number(e.slice(1))) : ENTITIES[e.toLowerCase()] ?? m))
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // markdown images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // markdown links → their text
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '') // headings, quotes, list marks
    .replace(/(\*\*|__|\*|_|`|~~)/g, '')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Normalises text taken out of a PDF/Word page (joins broken spacing). */
export function cleanText(text: string): string {
  return text.replace(/[ \t\f\v]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

/** Splits text into parts of at most `size` characters, at paragraph, then sentence, then word breaks. */
export function chunkText(text: string, size = CHUNK_SIZE): string[] {
  const clean = text.trim()
  if (!clean) return []
  if (clean.length <= size) return [clean]
  const parts: string[] = []
  let rest = clean
  while (rest.length > size) {
    const window = rest.slice(0, size)
    const cut = Math.max(window.lastIndexOf('\n\n'), window.lastIndexOf('. '), window.lastIndexOf('\n'))
    const at = cut > size * 0.5 ? cut + 1 : window.lastIndexOf(' ') > size * 0.5 ? window.lastIndexOf(' ') : size
    parts.push(rest.slice(0, at).trim())
    rest = rest.slice(at).trim()
  }
  if (rest) parts.push(rest)
  return parts
}

/** A piece of a snippet; `hit` pieces are the searched words (shown highlighted). */
export interface SnippetPart {
  text: string
  hit: boolean
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The words of a search (quotes removed), longest first, at most 8. */
export function searchWords(query: string): string[] {
  const words = (query.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []).filter((w) => w.length > 1)
  return [...new Set(words)].sort((a, b) => b.length - a.length).slice(0, 8)
}

/** A regex that finds any of the words (as the start of a word, so "corrupt" also marks "corruption"). */
export function wordsRegex(words: string[]): RegExp | null {
  if (words.length === 0) return null
  return new RegExp(`(?<![\\p{L}\\p{N}])(${words.map(escapeRegExp).join('|')})[\\p{L}\\p{N}]*`, 'giu')
}

/** About `radius` characters around the first match, with the matches marked. */
export function makeSnippet(text: string, words: string[], radius = 110): SnippetPart[] | null {
  const re = wordsRegex(words)
  if (!re) return null
  const flat = text.replace(/\s+/g, ' ')
  const first = re.exec(flat)
  if (!first) return null
  let start = Math.max(0, first.index - radius)
  let end = Math.min(flat.length, first.index + first[0].length + radius)
  // Start and end on whole words.
  if (start > 0) start = flat.indexOf(' ', start) + 1 || start
  if (end < flat.length) end = flat.lastIndexOf(' ', end) > first.index ? flat.lastIndexOf(' ', end) : end
  const piece = flat.slice(start, end)
  const parts: SnippetPart[] = []
  if (start > 0) parts.push({ text: '…', hit: false })
  let last = 0
  for (const m of piece.matchAll(wordsRegex(words)!)) {
    if (m.index! > last) parts.push({ text: piece.slice(last, m.index), hit: false })
    parts.push({ text: m[0], hit: true })
    last = m.index! + m[0].length
  }
  if (last < piece.length) parts.push({ text: piece.slice(last), hit: false })
  if (end < flat.length) parts.push({ text: '…', hit: false })
  return parts
}
