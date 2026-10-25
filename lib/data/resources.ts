import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export function serializeResource(r: {
  id: string
  title: string
  author: string
  publisher: string
  categoryId: string | null
  type: string
  format: string
  language: string
  year: number
  pages: number
  isbn: string
  price: number
  borrowPrice: number
  borrowDurationDays: number
  freePreviewChapterCount: number
  totalQty: number
  availableQty: number
  status: string
  coverImages: string[]
  bindingType: string
  mediaType: string
  description: string
  tags: string[]
  documentUrl: string | null
  audioUrl: string | null
  videoUrl: string | null
  avgRating: number
  reviewCount: number
  officialIsbn?: string | null
  klpCode?: string | null
  libraryId?: string | null
  klpCollection?: string | null
  klpEdition?: number | null
  klpFormat?: string | null
  reviewNote?: string | null
  approvedAt?: Date | null
  createdAt?: Date
}, chapterCount: number, views = 0) {
  return {
    id: r.id,
    title: r.title,
    author: r.author,
    publisher: r.publisher,
    categoryId: r.categoryId ?? '',
    type: r.type,
    format: r.format,
    language: r.language,
    year: r.year,
    pages: r.pages,
    isbn: r.isbn,
    price: r.price,
    borrowPrice: r.borrowPrice,
    borrowDurationDays: r.borrowDurationDays,
    freePreviewChapterCount: r.freePreviewChapterCount,
    totalQty: r.totalQty,
    availableQty: r.availableQty,
    status: r.status.toLowerCase(),
    coverImages: r.coverImages,
    bindingType: r.bindingType,
    mediaType: r.mediaType,
    description: r.description,
    tags: r.tags,
    documentUrl: r.documentUrl ?? undefined,
    audioUrl: r.audioUrl ?? undefined,
    videoUrl: r.videoUrl ?? undefined,
    avgRating: r.avgRating,
    reviewCount: r.reviewCount,
    chapterCount,
    views,
    officialIsbn: r.officialIsbn ?? null,
    klpCode: r.klpCode ?? null,
    libraryId: r.libraryId ?? null,
    klpCollection: r.klpCollection ?? null,
    klpEdition: r.klpEdition ?? null,
    klpFormat: r.klpFormat ?? null,
    reviewNote: r.reviewNote ?? null,
    approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
  }
}

/** Statuses readers (guests and members) may see — everything except a not-yet-approved DRAFT. */
export const READER_VISIBLE_STATUSES = ['AVAILABLE', 'OUT_OF_STOCK', 'ARCHIVED'] as const

/** True when this stored status means the record has been approved and published. */
export function isPublishedStatus(status: string): boolean {
  return status.toUpperCase() !== 'DRAFT'
}

/** One resource in the GET /api/resources/[id] shape (incl. its real chapterCount). Resource + chapter count run in parallel. */
export async function getResourceDetail(id: string, opts: { includeDraft?: boolean } = {}) {
  if (!isObjectId(id)) return null
  const [resource, chapterCount, views] = await Promise.all([
    prisma.resource.findUnique({ where: { id } }),
    prisma.chapter.count({ where: { resourceId: id } }),
    prisma.resourceView.count({ where: { resourceId: id } }).catch(() => 0),
  ])
  if (!resource || (!opts.includeDraft && !isPublishedStatus(resource.status))) return null
  return serializeResource(resource, chapterCount, views)
}
