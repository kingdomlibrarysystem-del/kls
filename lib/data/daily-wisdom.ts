import prisma from '@/prisma/client'
import en from '@/locales/en.json'
import fr from '@/locales/fr.json'
import rw from '@/locales/rw.json'
import {
  pickTodayVerse,
  type DailyVerseItem,
  type DailyWisdomLanguage,
  type TodayVerse,
} from '@/lib/daily-wisdom-shared'

/**
 * The three verses that used to be hardcoded in the header (locale keys
 * daily_wisdom.verse_1..3 / ref_1..3, in en, fr and rw). They are copied into
 * the DailyVerse collection ONCE, as automatic verses, the first time the
 * collection is read while empty — bootstrap data only. After that the
 * database is the single source of truth and staff manage the list at
 * /dashboard/daily-wisdom (deleting every verse does not bring them back
 * until the collection is empty again).
 */
function seedVerses() {
  const locales: [DailyWisdomLanguage, typeof en][] = [['en', en], ['fr', fr as typeof en], ['rw', rw as typeof en]]
  return locales.flatMap(([language, l]) =>
    ([1, 2, 3] as const).map((i) => ({
      language,
      text: l.daily_wisdom[`verse_${i}`],
      reference: l.daily_wisdom[`ref_${i}`].replace(/^[—–-]\s*/, ''),
      scheduledDate: null,
      active: true,
      createdByName: 'Kingdom Library',
    })),
  ).filter((v) => v.text && v.reference)
}

let seeded = false

async function ensureSeedVerses(): Promise<void> {
  if (seeded) return
  const count = await prisma.dailyVerse.count()
  if (count === 0) await prisma.dailyVerse.createMany({ data: seedVerses() })
  seeded = true
}

type VerseRow = {
  id: string; text: string; reference: string; language: string; scheduledDate: string | null
  active: boolean; createdByName: string; createdAt: Date
}

export function serializeVerse(v: VerseRow): DailyVerseItem {
  return {
    id: v.id,
    text: v.text,
    reference: v.reference,
    language: v.language as DailyWisdomLanguage,
    scheduledDate: v.scheduledDate,
    active: v.active,
    createdByName: v.createdByName,
    createdAt: v.createdAt.toISOString(),
  }
}

/** Every verse (sent + automatic), newest first — for the admin page. */
export async function getAllVerses(): Promise<DailyVerseItem[]> {
  await ensureSeedVerses()
  const rows = await prisma.dailyVerse.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map(serializeVerse)
}

/**
 * The verse the header shows on `dateKey` for `lang`. Loads only what the
 * rule needs: the active verses sent for that day plus the active automatic
 * rotation (two indexed queries in parallel), then applies pickTodayVerse.
 */
export async function getTodayVerse(dateKey: string, lang: DailyWisdomLanguage): Promise<TodayVerse | null> {
  await ensureSeedVerses()
  const [sent, pool] = await Promise.all([
    prisma.dailyVerse.findMany({ where: { scheduledDate: dateKey, active: true } }),
    prisma.dailyVerse.findMany({ where: { scheduledDate: null, active: true } }),
  ])
  return pickTodayVerse([...sent, ...pool].map(serializeVerse), dateKey, lang)
}

/** Another active-or-not verse already SENT for this day and language (one per day per language), excluding `exceptId`. */
export async function findSentVerseClash(dateKey: string, language: string, exceptId?: string) {
  return prisma.dailyVerse.findFirst({
    where: { scheduledDate: dateKey, language, ...(exceptId && { id: { not: exceptId } }) },
    select: { id: true },
  })
}
