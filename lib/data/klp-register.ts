import prisma from '@/prisma/client'
import { buildKlpCode, buildLibraryId, defaultKlpFormat, isKlpFormat, suggestCollection, twoDigitYear, type KlpParts } from '@/lib/klp-code'

/**
 * Master register for Kingdom Library Publication Codes (see lib/klp-code.ts).
 * Codes are assigned exactly once, when a record is published — drafts that
 * are never approved don't use up a number — and are never changed after.
 */

/**
 * Collections 01–30 exactly as listed in the Kingdom Library Publication Code
 * document. Bootstrap DATA only, seeded once like the system media types:
 * after that the PublicationCollection table is the source of truth and
 * admins add 31–99 (or rename) at /dashboard/library/collections.
 */
const STANDARD_COLLECTIONS = [
  'Foundation', 'History', 'Wisdom', 'Prophetic', 'Gospel', 'Acts', 'Epistles', 'Revelation', 'Kingdom Life', 'Kingdom Health',
  'Kingdom Restoration', 'Kubora Research', 'Science & Life', 'Rehabilitation', 'Counseling', 'Research & Publications',
  'Leadership & Management', 'Education', 'Family & Society', 'Beauty & Wellness', 'Nutraceuticals & Health Products',
  "Children's Library", 'Youth Library', 'Biography & Testimony', 'Literature & Creative Works', 'Journals & Periodicals',
  'Manuals & Protocols', 'Academic & Scientific Works', 'Translation & Language', 'Archives & Special Collections',
]

let seeded = false

/** Creates any missing standard collection (idempotent; one query per server process once they exist). */
export async function ensureStandardCollections(): Promise<void> {
  if (seeded) return
  const count = await prisma.publicationCollection.count()
  if (count === 0) {
    for (const [i, name] of STANDARD_COLLECTIONS.entries()) {
      const code = String(i + 1).padStart(2, '0')
      await prisma.publicationCollection.upsert({ where: { code }, update: {}, create: { code, name } })
    }
  }
  seeded = true
}

export interface CollectionOption {
  id: string
  code: string
  name: string
  description: string | null
  active: boolean
  /** Resources filed in this collection (admin page only). */
  usage?: number
}

export async function listCollections(opts: { withUsage?: boolean } = {}): Promise<CollectionOption[]> {
  await ensureStandardCollections()
  const [rows, usage] = await Promise.all([
    prisma.publicationCollection.findMany({ orderBy: { code: 'asc' } }),
    opts.withUsage ? prisma.resource.groupBy({ by: ['klpCollection'], _count: { _all: true } }) : Promise.resolve([]),
  ])
  const used = new Map(usage.map((u) => [u.klpCollection, u._count._all]))
  return rows.map((c) => ({ id: c.id, code: c.code, name: c.name, description: c.description, active: c.active, ...(opts.withUsage && { usage: used.get(c.code) ?? 0 }) }))
}

export async function isValidCollection(code: string): Promise<boolean> {
  await ensureStandardCollections()
  return !!(await prisma.publicationCollection.findFirst({ where: { code, active: true }, select: { id: true } }))
}

/** Next NNN for a collection + year. Atomic increment on one register row; retries the first-insert race. */
async function nextSequence(collection: string, year: number): Promise<number> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const row = await prisma.publicationSequence.upsert({
        where: { collection_year: { collection, year } },
        create: { collection, year, last: 1 },
        update: { last: { increment: 1 } },
      })
      if (row.last > 999) throw new Error(`Collection ${collection} has used all 999 publication numbers for 20${String(year).padStart(2, '0')}`)
      return row.last
    } catch (e) {
      if ((e as { code?: string }).code === 'P2002' && attempt < 2) continue
      throw e
    }
  }
  throw new Error('Could not reserve a publication number')
}

export interface AssignedCodes { klpCode: string; libraryId: string; parts: KlpParts }

/**
 * Gives a published resource its KLP Code and Kingdom Library ID. No-op when
 * it already has one or has no collection yet (the admin then picks one and
 * the next save assigns it).
 *
 * Same work, another format or edition: when a coded record in the same
 * collection has the same title and author, its YY-NNN is reused so the
 * print, eBook and audio of one book share a number and differ only in EE/F
 * (as the standard describes). A translation has a different title, so it
 * gets its own number — also as the standard describes.
 */
export async function assignKlpCodes(resourceId: string): Promise<AssignedCodes | null> {
  const r = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: { id: true, title: true, author: true, status: true, klpCode: true, klpCollection: true, klpEdition: true, klpFormat: true, videoUrl: true, audioUrl: true, documentUrl: true },
  })
  if (!r || r.klpCode || !r.klpCollection || r.status === 'DRAFT') return null

  const hasChapters = (await prisma.chapter.count({ where: { resourceId } })) > 0
  const format = isKlpFormat(r.klpFormat) ? r.klpFormat : defaultKlpFormat({ ...r, hasChapters })
  const edition = r.klpEdition && r.klpEdition > 0 ? r.klpEdition : 1

  const sibling = await prisma.resource.findFirst({
    where: {
      id: { not: r.id },
      klpCollection: r.klpCollection,
      klpSequence: { not: null },
      title: { equals: r.title, mode: 'insensitive' },
      author: { equals: r.author, mode: 'insensitive' },
    },
    select: { klpYear: true, klpSequence: true },
  })

  let parts: KlpParts | null = null
  if (sibling?.klpYear != null && sibling.klpSequence != null) {
    const candidate: KlpParts = { collection: r.klpCollection, year: sibling.klpYear, sequence: sibling.klpSequence, edition, format }
    const taken = await prisma.resource.findFirst({ where: { klpCode: buildKlpCode(candidate) }, select: { id: true } })
    if (!taken) parts = candidate
  }
  if (!parts) {
    const year = twoDigitYear()
    // Loop guards against a code someone typed in by hand elsewhere — the register itself never repeats.
    for (let i = 0; i < 5 && !parts; i++) {
      const candidate: KlpParts = { collection: r.klpCollection, year, sequence: await nextSequence(r.klpCollection, year), edition, format }
      if (!(await prisma.resource.findFirst({ where: { klpCode: buildKlpCode(candidate) }, select: { id: true } }))) parts = candidate
    }
    if (!parts) throw new Error('Could not assign a unique KLP code')
  }

  const klpCode = buildKlpCode(parts)
  const libraryId = buildLibraryId(parts)
  // Conditional write: if two saves race, only the first one sets the codes.
  const { count } = await prisma.resource.updateMany({
    where: { id: r.id, OR: [{ klpCode: null }, { klpCode: { isSet: false } }] },
    data: { klpCode, libraryId, klpYear: parts.year, klpSequence: parts.sequence, klpEdition: parts.edition, klpFormat: parts.format },
  })
  return count ? { klpCode, libraryId, parts } : null
}

/** The KLP collection matching a KCS category's pillar by name (e.g. pillar "Foundation" → "01"), or null. */
export async function collectionForCategory(categoryId: string | null | undefined): Promise<string | null> {
  if (!categoryId) return null
  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { nameEn: true, parent: { select: { nameEn: true } } } })
  if (!category) return null
  const collections = await listCollections()
  return suggestCollection(category.parent?.nameEn ?? category.nameEn, collections) || null
}
