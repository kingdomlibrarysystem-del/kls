/**
 * Short course codes for numbering lessons, e.g. "Science of Successful Life
 * \"Successology\"" → "SSL", so its lessons read "SSL 01", "SSL 02"…
 * Made from the first letters of the main words of the title (small words
 * like "of"/"the"/"de"/"na" and anything in quotes or brackets are skipped);
 * a one-word title uses its first three letters.
 */
const SMALL_WORDS = new Set([
  'a', 'an', 'and', 'the', 'of', 'in', 'on', 'to', 'for', 'with', 'by', 'at', 'from',
  'de', 'du', 'des', 'la', 'le', 'les', 'et', 'en', 'au', 'aux', 'pour', 'sur',
  'na', 'ya', 'wa', 'za', 'cya', 'mu', 'ku', 'kuri',
])

export function courseCode(title: string): string {
  const main = title
    .replace(/["“”«»'‘’][^"“”«»'‘’]*["“”«»'‘’]/g, ' ') // drop quoted nicknames
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
  const words = (main.match(/[\p{L}\p{N}]+/gu) ?? []).filter((w) => !SMALL_WORDS.has(w.toLowerCase()))
  if (words.length === 0) return 'LSN'
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words.slice(0, 4).map((w) => w[0]).join('').toUpperCase()
}

/** "SSL" + 0 → "SSL 01" (index is 0-based; numbers are two digits, or more past 99). */
export function lessonCode(code: string, index: number): string {
  return `${code} ${String(index + 1).padStart(2, '0')}`
}
