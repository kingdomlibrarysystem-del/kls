import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export interface ChapterRow {
  id: string
  title: string
  body: string
  order: number
  resourceId: string
}

/**
 * Real Chapter API — chapter body content for a readable Resource,
 * replacing app/member/_shared/readable-content-data.ts's Record keyed
 * by legacy mock resource ids that no longer match any real Resource
 * ObjectId post-migration.
 *
 * Real entitlement gating (previously this route was fully public and
 * ungated — anyone could fetch any resource's full chapter text
 * regardless of price): a free resource (price === 0) stays fully
 * open. A priced resource with no free preview shows nothing past the
 * first `freePreviewChapterCount` chapters unless the requesting
 * session's user is entitled — either a PAID Reserve (SALE) Order
 * (permanent access), an active/overdue Borrow (a paid Borrow's
 * settlement creates this row PENDING, same as a staff-created one — a
 * PAID RENTAL Order alone does NOT grant access; it must actually be
 * ACTIVE, matching the exact rule a free borrow already follows, not a
 * payment-only shortcut), or a claimed Reservation — locked chapters
 * are still listed (title/order) so the reader can show a real
 * "Chapter N — locked" row, just without `body`.
 */
export function serializeChapter(c: ChapterRow, locked: boolean) {
  return { id: c.id, title: c.title, order: c.order, locked, body: locked ? undefined : c.body }
}

export async function isEntitled(userId: string, resourceId: string): Promise<boolean> {
  const [paidSaleOrder, activeBorrow, claimedReservation] = await Promise.all([
    prisma.order.findFirst({ where: { userId, resourceId, status: 'PAID', type: 'SALE' } }),
    prisma.borrow.findFirst({ where: { userId, resourceId, status: { in: ['ACTIVE', 'OVERDUE'] } } }),
    prisma.reservation.findFirst({ where: { userId, resourceId, status: 'CLAIMED' } }),
  ])
  return !!(paidSaleOrder || activeBorrow || claimedReservation)
}

/**
 * Splits one resource's ordered chapters into (visible, locked) based on
 * price/preview/entitlement — shared by both response modes below.
 * `isStaff` (admin/manager/staff) always sees full content, same as a
 * genuinely entitled member — this is what powers the admin-only
 * "Preview Reader" link (resource-detail-view.tsx) actually showing the
 * whole book for QA, rather than hitting the same paywall a real member
 * would past the free preview.
 */
export async function gateChapters(resource: { id: string; price: number; freePreviewChapterCount: number }, chapters: ChapterRow[], userId: string | undefined, isStaff: boolean) {
  if (resource.price <= 0 || isStaff) return chapters.map((c) => serializeChapter(c, false))

  const entitled = userId ? await isEntitled(userId, resource.id) : false
  if (entitled) return chapters.map((c) => serializeChapter(c, false))

  return chapters.map((c, i) => serializeChapter(c, i >= resource.freePreviewChapterCount))
}

/**
 * One resource's chapters, gated exactly like GET /api/chapters?resourceId=
 * (free book / staff / entitled member -> full bodies; otherwise bodies past
 * the free preview are omitted and flagged locked). Null when the resource
 * doesn't exist.
 */
export async function getGatedChapters(resourceId: string, userId: string | undefined, isStaff: boolean) {
  if (!isObjectId(resourceId)) return null
  const [resource, chapters] = await Promise.all([
    prisma.resource.findUnique({ where: { id: resourceId }, select: { id: true, price: true, freePreviewChapterCount: true } }),
    prisma.chapter.findMany({ where: { resourceId }, orderBy: { order: 'asc' } }),
  ])
  if (!resource) return null
  return gateChapters(resource, chapters, userId, isStaff)
}
