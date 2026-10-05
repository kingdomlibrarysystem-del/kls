import prisma from '@/prisma/client'
import type { MediaTypeOption } from '@/lib/media-types-shared'

/**
 * The five types that existed as the old `MediaType` enum. Seeded once as
 * `isSystem` rows so every existing resource keeps a matching type, with the
 * same upload/authoring behaviour the resource form used to hardcode:
 * TEXT -> chapters, DOCUMENT -> document, AUDIO -> audio, VIDEO -> video,
 * COMBINATION -> document + audio + video. This is bootstrap DATA only —
 * after seeding, the database is the single source of truth and admins
 * manage the list at /dashboard/library/media-types.
 */
const SYSTEM_MEDIA_TYPES = [
  { code: 'TEXT', name: 'Text', allowsChapters: true, allowsDocument: false, allowsAudio: false, allowsVideo: false, sortOrder: 1 },
  { code: 'DOCUMENT', name: 'Document', allowsChapters: false, allowsDocument: true, allowsAudio: false, allowsVideo: false, sortOrder: 2 },
  { code: 'AUDIO', name: 'Audio', allowsChapters: false, allowsDocument: false, allowsAudio: true, allowsVideo: false, sortOrder: 3 },
  { code: 'VIDEO', name: 'Video', allowsChapters: false, allowsDocument: false, allowsAudio: false, allowsVideo: true, sortOrder: 4 },
  { code: 'COMBINATION', name: 'Combination', allowsChapters: false, allowsDocument: true, allowsAudio: true, allowsVideo: true, sortOrder: 5 },
] as const

/** Used when a resource/publication is saved without a media type — the built-in Text type, which always exists. */
export const DEFAULT_MEDIA_TYPE_CODE = 'TEXT'

let seeded = false

/** Creates any missing system type (idempotent; one cheap count per server process once they exist). */
async function ensureSystemMediaTypes(): Promise<void> {
  if (seeded) return
  const existing = await prisma.resourceMediaType.findMany({ where: { code: { in: SYSTEM_MEDIA_TYPES.map((t) => t.code) } }, select: { code: true } })
  const have = new Set(existing.map((e) => e.code))
  const missing = SYSTEM_MEDIA_TYPES.filter((t) => !have.has(t.code))
  for (const t of missing) {
    // upsert (not create) so two concurrent first requests can't both insert the same code.
    await prisma.resourceMediaType.upsert({ where: { code: t.code }, update: {}, create: { ...t, isSystem: true } })
  }
  seeded = true
}

export function serializeMediaType(t: {
  id: string; code: string; name: string; description: string | null
  allowsChapters: boolean; allowsDocument: boolean; allowsAudio: boolean; allowsVideo: boolean
  isSystem: boolean; sortOrder: number
}): MediaTypeOption {
  return {
    id: t.id, code: t.code, name: t.name, description: t.description,
    allowsChapters: t.allowsChapters, allowsDocument: t.allowsDocument, allowsAudio: t.allowsAudio, allowsVideo: t.allowsVideo,
    isSystem: t.isSystem, sortOrder: t.sortOrder,
  }
}

/** Every media type, in display order. Shared by GET /api/media-types and server pages. */
export async function getMediaTypes(): Promise<MediaTypeOption[]> {
  await ensureSystemMediaTypes()
  const rows = await prisma.resourceMediaType.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
  return rows.map(serializeMediaType)
}

/** Same list plus how many resources use each type — one groupBy, no per-row counting. For the admin page. */
export async function getMediaTypesWithUsage(): Promise<MediaTypeOption[]> {
  const [types, usage] = await Promise.all([
    getMediaTypes(),
    prisma.resource.groupBy({ by: ['mediaType'], _count: { _all: true } }),
  ])
  const countByCode = new Map(usage.map((u) => [u.mediaType, u._count._all]))
  return types.map((t) => ({ ...t, resourceCount: countByCode.get(t.code) ?? 0 }))
}

/** True when `code` is an existing media type — used to validate resource/publication writes. */
export async function isValidMediaTypeCode(code: string): Promise<boolean> {
  await ensureSystemMediaTypes()
  const found = await prisma.resourceMediaType.findUnique({ where: { code }, select: { id: true } })
  return !!found
}
