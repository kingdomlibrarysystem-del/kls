/**
 * Types + the "which verse shows today" rule for Daily Wisdom, shared by the
 * API, the server loader and the admin page (which previews today's verse
 * with the same rule). Free of Prisma so client code can import it.
 *
 * Verses are DATA (the DailyVerse collection, managed at
 * /dashboard/daily-wisdom) — never a hardcoded list in the UI.
 */
export const DAILY_WISDOM_LANGUAGES = ['en', 'fr', 'rw'] as const
export type DailyWisdomLanguage = (typeof DAILY_WISDOM_LANGUAGES)[number]

export const VERSE_TEXT_MAX = 600
export const VERSE_REFERENCE_MAX = 80

export interface DailyVerseItem {
  id: string
  text: string
  reference: string
  language: DailyWisdomLanguage
  /** "YYYY-MM-DD" for a verse sent for one day; null for the automatic rotation. */
  scheduledDate: string | null
  active: boolean
  createdByName: string
  createdAt: string
}

/** What the header card shows. `source` says whether a person sent it for today or it came from the rotation. */
export interface TodayVerse {
  id: string
  text: string
  reference: string
  language: DailyWisdomLanguage
  source: 'sent' | 'automatic'
  date: string
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** True for a real calendar date written as YYYY-MM-DD. */
export function isDateKey(value: string): boolean {
  if (!DATE_RE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

/** The viewer's LOCAL calendar day as YYYY-MM-DD (a verse lasts from local midnight to midnight). */
export function localDateKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function isDailyWisdomLanguage(value: string): value is DailyWisdomLanguage {
  return (DAILY_WISDOM_LANGUAGES as readonly string[]).includes(value)
}

/** Whole days since 1970-01-01 for a YYYY-MM-DD key — the same number for everyone on that date. */
function dayNumber(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}

/** The automatic verse for a day: active rotation verses in a stable order (oldest first), one per day, cycling. */
export function pickAutomaticVerse<T extends { createdAt: string; id: string }>(pool: T[], dateKey: string): T | null {
  if (pool.length === 0) return null
  const ordered = [...pool].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
  const n = dayNumber(dateKey)
  return ordered[((n % ordered.length) + ordered.length) % ordered.length]
}

/**
 * Which verse shows on `dateKey` for a reader using `lang`, from a list of
 * verses (any languages, any kinds):
 *  1. a verse SENT for that day in the reader's language;
 *  2. otherwise the AUTOMATIC verse in the reader's language;
 *  3. otherwise a verse sent for that day in another language;
 *  4. otherwise the automatic verse from any language;
 *  5. otherwise nothing (the header hides the card).
 * Inactive verses never show.
 */
export function pickTodayVerse(verses: DailyVerseItem[], dateKey: string, lang: DailyWisdomLanguage): TodayVerse | null {
  const active = verses.filter((v) => v.active)
  const sent = active.filter((v) => v.scheduledDate === dateKey)
  const pool = active.filter((v) => v.scheduledDate === null)
  const toToday = (v: DailyVerseItem, source: TodayVerse['source']): TodayVerse =>
    ({ id: v.id, text: v.text, reference: v.reference, language: v.language, source, date: dateKey })

  const sentInLang = sent.find((v) => v.language === lang)
  if (sentInLang) return toToday(sentInLang, 'sent')
  const autoInLang = pickAutomaticVerse(pool.filter((v) => v.language === lang), dateKey)
  if (autoInLang) return toToday(autoInLang, 'automatic')
  const sentOther = sent.find((v) => v.language === 'en') ?? sent[0]
  if (sentOther) return toToday(sentOther, 'sent')
  const autoAny = pickAutomaticVerse(pool, dateKey)
  return autoAny ? toToday(autoAny, 'automatic') : null
}
