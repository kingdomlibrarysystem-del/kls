/**
 * Kingdom Library Publication Code — the numbering standard from the
 * "Kingdom Library Publication Code" document. Pure and client-safe; the
 * database side (master register, assignment) lives in lib/data/klp-register.ts.
 *
 *   KLP Code            KLP-SS-YY-NNN-EE-F       e.g. KLP-09-26-001-01-P
 *   Kingdom Library ID  KK SS YY NNN EE F C      e.g. 1009260010117 (13 digits)
 *
 *   SS  collection code (PublicationCollection, 01–99)
 *   YY  two-digit year the title was registered
 *   NNN publication number from the master register (001–999, never reused)
 *   EE  edition (01, 02, …)
 *   F   format — a letter in the KLP code, a digit in the Library ID
 *   KK  always 10 (Kingdom Library)
 *   C   check digit, computed like an EAN-13 (weights 1,3,1,3…, mod 10)
 *
 * The Kingdom Library ID is an internal identifier and is NOT an ISBN.
 * Official ISBNs are only ever assigned by the ISBN agency and are stored
 * separately (Resource.officialIsbn).
 */

/** The fixed format table of the standard: letter (KLP code) → digit (Library ID). Part of the algorithm, not admin data. */
export const KLP_FORMATS = [
  { letter: 'P', digit: 1, label: 'Printed book' },
  { letter: 'E', digit: 2, label: 'eBook' },
  { letter: 'A', digit: 3, label: 'Audiobook' },
  { letter: 'D', digit: 4, label: 'Digital document' },
  { letter: 'R', digit: 5, label: 'Research publication' },
  { letter: 'J', digit: 6, label: 'Journal' },
  { letter: 'V', digit: 7, label: 'Video publication' },
  { letter: 'M', digit: 8, label: 'Manual' },
  { letter: 'G', digit: 9, label: 'Guide' },
  { letter: 'C', digit: 9, label: "Children's publication" },
  { letter: 'S', digit: 9, label: 'Special publication' },
] as const

export type KlpFormatLetter = (typeof KLP_FORMATS)[number]['letter']

/** "Kingdom Library" prefix of every Library ID. */
export const LIBRARY_ID_PREFIX = '10'

export function isKlpFormat(v: string | null | undefined): v is KlpFormatLetter {
  return !!v && KLP_FORMATS.some((f) => f.letter === v)
}

export function klpFormatLabel(letter: string | null | undefined): string {
  return KLP_FORMATS.find((f) => f.letter === letter)?.label ?? '—'
}

/**
 * Sensible format when the admin doesn't pick one: video file → V, audio
 * file → A, uploaded document or written chapters → E (eBook), otherwise a
 * physical copy → P. The admin can always override it in the form.
 */
export function defaultKlpFormat(r: { videoUrl?: string | null; audioUrl?: string | null; documentUrl?: string | null; hasChapters?: boolean }): KlpFormatLetter {
  if (r.videoUrl) return 'V'
  if (r.audioUrl) return 'A'
  if (r.documentUrl || r.hasChapters) return 'E'
  return 'P'
}

/** EAN-13 style check digit for the first 12 digits (weights 1,3,1,3…). */
export function checkDigit(first12: string): number {
  if (!/^\d{12}$/.test(first12)) throw new Error('Check digit needs exactly 12 digits')
  const sum = first12.split('').reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0)
  return (10 - (sum % 10)) % 10
}

export interface KlpParts {
  /** "01"–"99" */
  collection: string
  /** 0–99 (two-digit year) */
  year: number
  /** 1–999 */
  sequence: number
  /** 1–99 */
  edition: number
  format: KlpFormatLetter
}

const pad = (n: number, len: number) => String(n).padStart(len, '0')

function assertParts(p: KlpParts) {
  if (!/^\d{2}$/.test(p.collection) || p.collection === '00') throw new Error(`Invalid collection code "${p.collection}"`)
  if (!Number.isInteger(p.year) || p.year < 0 || p.year > 99) throw new Error('Year must be two digits')
  if (!Number.isInteger(p.sequence) || p.sequence < 1 || p.sequence > 999) throw new Error('Publication number must be 001–999')
  if (!Number.isInteger(p.edition) || p.edition < 1 || p.edition > 99) throw new Error('Edition must be 01–99')
  if (!isKlpFormat(p.format)) throw new Error(`Unknown format "${p.format}"`)
}

/** KLP-SS-YY-NNN-EE-F */
export function buildKlpCode(p: KlpParts): string {
  assertParts(p)
  return `KLP-${p.collection}-${pad(p.year, 2)}-${pad(p.sequence, 3)}-${pad(p.edition, 2)}-${p.format}`
}

/** 13 digits: KK SS YY NNN EE F C */
export function buildLibraryId(p: KlpParts): string {
  assertParts(p)
  const digit = KLP_FORMATS.find((f) => f.letter === p.format)!.digit
  const first12 = `${LIBRARY_ID_PREFIX}${p.collection}${pad(p.year, 2)}${pad(p.sequence, 3)}${pad(p.edition, 2)}${digit}`
  return `${first12}${checkDigit(first12)}`
}

/** Readable grouping of a Library ID: "10 09 26 001 01 1 7". */
export function formatLibraryId(id: string | null | undefined): string {
  if (!id || !/^\d{13}$/.test(id)) return id ?? ''
  return [id.slice(0, 2), id.slice(2, 4), id.slice(4, 6), id.slice(6, 9), id.slice(9, 11), id.slice(11, 12), id.slice(12)].join(' ')
}

/** True when a 13-digit Library ID has the right prefix and check digit. */
export function isValidLibraryId(id: string): boolean {
  return /^\d{13}$/.test(id) && id.startsWith(LIBRARY_ID_PREFIX) && checkDigit(id.slice(0, 12)) === Number(id[12])
}

/**
 * Validates an official ISBN typed by staff (ISBN-13 or ISBN-10, hyphens and
 * spaces allowed). Returns the digits-only form, or null when invalid.
 */
export function normalizeIsbn(raw: string): string | null {
  const v = raw.replace(/[\s-]/g, '').toUpperCase()
  if (/^\d{13}$/.test(v)) {
    return checkDigit(v.slice(0, 12)) === Number(v[12]) && (v.startsWith('978') || v.startsWith('979')) ? v : null
  }
  if (/^\d{9}[\dX]$/.test(v)) {
    const sum = v.split('').reduce((acc, ch, i) => acc + (ch === 'X' ? 10 : Number(ch)) * (10 - i), 0)
    return sum % 11 === 0 ? v : null
  }
  return null
}

/** Two-digit year for a date (26 for 2026). */
export function twoDigitYear(d = new Date()): number {
  return d.getFullYear() % 100
}

/**
 * Picks the collection whose name matches a KCS category's root name
 * ("Foundation" → 01 Foundation), so the form and publisher approvals can
 * pre-select it. Returns '' when nothing matches; the admin then chooses.
 */
export function suggestCollection(rootCategoryName: string | null | undefined, collections: { code: string; name: string; active?: boolean }[]): string {
  const name = (rootCategoryName ?? '').trim().toLowerCase()
  if (!name) return ''
  const active = collections.filter((c) => c.active !== false)
  const exact = active.find((c) => c.name.trim().toLowerCase() === name)
  if (exact) return exact.code
  const first = name.split(/\s+/)[0]
  return active.find((c) => c.name.trim().toLowerCase().split(/\s+/)[0] === first)?.code ?? ''
}
