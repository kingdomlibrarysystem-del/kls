import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

/**
 * Publications = books submitted by publishers (authors). Lifecycle:
 *   DRAFT -> SUBMITTED -> (UNDER_REVIEW) -> PUBLISHED   (approve: creates the library Resource)
 *                                        -> REJECTED    (with reviewNotes; the publisher can edit and resubmit)
 * One serializer + loaders shared by /api/publications* and the server pages.
 */

export const REVENUE_INCLUDE = { revenueShare: { select: { contributorShare: true, platformShare: true, totalRevenue: true } } } as const

/** Statuses the publisher can still edit (and submit again). */
export const EDITABLE_STATUSES = ['DRAFT', 'REJECTED'] as const
/** Statuses waiting for a reviewer. */
export const REVIEW_STATUSES = ['SUBMITTED', 'UNDER_REVIEW'] as const

type PublicationRow = {
  id: string
  title: string
  contributorId: string
  contributorName: string
  author?: string | null
  category: string
  categoryId?: string | null
  language: string
  coverImage: string | null
  description: string
  status: string
  resourceId: string | null
  price: number | null
  borrowPrice?: number | null
  quantity: number | null
  pages?: number | null
  bindingType: string | null
  mediaType: string | null
  documentUrl?: string | null
  audioUrl?: string | null
  videoUrl?: string | null
  chapters?: { title: string; body: string }[]
  reviewNotes?: string | null
  reviewedAt?: Date | null
  featured: boolean
  submittedAt: Date
  revenueShare?: { contributorShare: number; platformShare: number; totalRevenue: number } | null
}

export function serializePublication(p: PublicationRow) {
  return {
    id: p.id,
    title: p.title,
    contributorId: p.contributorId,
    contributor: p.contributorName,
    author: p.author ?? p.contributorName,
    category: p.category,
    categoryId: p.categoryId ?? undefined,
    language: p.language.toLowerCase(),
    coverImage: p.coverImage ?? '',
    description: p.description,
    status: p.status,
    resourceId: p.resourceId ?? undefined,
    price: p.price ?? undefined,
    borrowPrice: p.borrowPrice ?? undefined,
    quantity: p.quantity ?? undefined,
    pages: p.pages ?? undefined,
    bindingType: p.bindingType ?? undefined,
    mediaType: p.mediaType ?? undefined,
    documentUrl: p.documentUrl ?? undefined,
    audioUrl: p.audioUrl ?? undefined,
    videoUrl: p.videoUrl ?? undefined,
    chapters: (p.chapters ?? []).map((c) => ({ title: c.title, body: c.body })),
    reviewNotes: p.reviewNotes ?? undefined,
    reviewedAt: p.reviewedAt ? p.reviewedAt.toISOString() : undefined,
    featured: p.featured,
    submittedAt: p.submittedAt.toISOString().split('T')[0],
    revenueShare: p.revenueShare
      ? { contributorShare: p.revenueShare.contributorShare, platformShare: p.revenueShare.platformShare, totalRevenue: p.revenueShare.totalRevenue }
      : undefined,
  }
}

export type SerializedPublication = ReturnType<typeof serializePublication>

/** The signed-in publisher's own books, newest first. */
export async function getMyPublications(userId: string): Promise<SerializedPublication[]> {
  const rows = await prisma.publication.findMany({ where: { contributorId: userId }, include: REVENUE_INCLUDE, orderBy: { submittedAt: 'desc' } })
  return rows.map(serializePublication)
}

/** One publication (or null). */
export async function getPublication(id: string): Promise<SerializedPublication | null> {
  if (!isObjectId(id)) return null
  const row = await prisma.publication.findUnique({ where: { id }, include: REVENUE_INCLUDE })
  return row ? serializePublication(row) : null
}

/** Numbers for the Publishing overview: counts by status (whole platform and the user's own) and revenue. Counts/aggregates only. */
export async function getPublishingOverview(userId: string) {
  const [all, mine, revenue] = await Promise.all([
    prisma.publication.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.publication.groupBy({ by: ['status'], where: { contributorId: userId }, _count: { _all: true } }),
    prisma.revenueShare.aggregate({ _sum: { totalRevenue: true } }),
  ])
  const pick = (rows: typeof all, ...statuses: string[]) => rows.filter((r) => statuses.includes(r.status)).reduce((n, r) => n + r._count._all, 0)
  return {
    awaitingReview: pick(all, ...REVIEW_STATUSES),
    published: pick(all, 'PUBLISHED'),
    totalRevenue: revenue._sum.totalRevenue ?? 0,
    mine: {
      total: mine.reduce((n, r) => n + r._count._all, 0),
      drafts: pick(mine, 'DRAFT'),
      inReview: pick(mine, ...REVIEW_STATUSES),
      published: pick(mine, 'PUBLISHED'),
      rejected: pick(mine, 'REJECTED'),
    },
  }
}

export interface KcsCategoryOption {
  id: string
  name: string
  /** The pillar (root category) it belongs to, e.g. "Foundations". */
  pillar: string
  pillarCode: string | null
}

/**
 * The KCS categories a book can be filed under: every scroll (a category with
 * a parent pillar) that is not archived, grouped by pillar order. Read from
 * the Category table, which admins manage at /dashboard/library/kcs.
 */
export async function getKcsCategoryOptions(): Promise<KcsCategoryOption[]> {
  const rows = await prisma.category.findMany({
    select: { id: true, nameEn: true, parentId: true, code: true, status: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  const roots = new Map(rows.filter((r) => !r.parentId).map((r) => [r.id, r]))
  const rootOrder = [...roots.keys()]
  return rows
    .filter((r) => r.parentId && roots.has(r.parentId) && r.status !== 'ARCHIVED')
    .sort((a, b) => rootOrder.indexOf(a.parentId!) - rootOrder.indexOf(b.parentId!) || a.nameEn.localeCompare(b.nameEn))
    .map((r) => ({ id: r.id, name: r.nameEn, pillar: roots.get(r.parentId!)!.nameEn, pillarCode: roots.get(r.parentId!)!.code ?? null }))
}

/** True when `id` is a selectable KCS scroll (has a parent pillar, not archived). Returns its name. */
export async function findKcsCategory(id: string): Promise<{ id: string; name: string } | null> {
  if (!isObjectId(id)) return null
  const c = await prisma.category.findUnique({ where: { id }, select: { id: true, nameEn: true, parentId: true, status: true } })
  return c && c.parentId && c.status !== 'ARCHIVED' ? { id: c.id, name: c.nameEn } : null
}

/** Names of the KCS pillars (root categories) — used to explain an empty scroll list. */
export async function getKcsPillarNames(): Promise<string[]> {
  const rows = await prisma.category.findMany({ where: { OR: [{ parentId: null }, { parentId: { isSet: false } }] }, select: { nameEn: true }, orderBy: { createdAt: 'asc' } })
  return rows.map((r) => r.nameEn)
}
