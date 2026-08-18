import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { roleNameToUserRole } from '@/lib/roles'
import prisma from '@/prisma/client'

interface ChapterRow {
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
 * session's user has a PAID Order, an active (not yet returned) Borrow,
 * or a claimed Reservation for that resource — locked chapters are
 * still listed (title/order) so the reader can show a real "Chapter N
 * — locked" row, just without `body`.
 */
export function serializeChapter(c: ChapterRow, locked: boolean) {
  return { id: c.id, title: c.title, order: c.order, locked, body: locked ? undefined : c.body }
}

export async function isEntitled(userId: string, resourceId: string): Promise<boolean> {
  const [paidOrder, activeBorrow, claimedReservation] = await Promise.all([
    prisma.order.findFirst({ where: { userId, resourceId, status: 'PAID' } }),
    prisma.borrow.findFirst({ where: { userId, resourceId, status: { in: ['ACTIVE', 'OVERDUE'] } } }),
    prisma.reservation.findFirst({ where: { userId, resourceId, status: 'CLAIMED' } }),
  ])
  return !!(paidOrder || activeBorrow || claimedReservation)
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const resourceId = searchParams.get('resourceId')
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  const role = roleNameToUserRole(session?.user?.roleName ?? '')
  const isStaff = role === 'admin' || role === 'manager' || role === 'staff'

  if (resourceId) {
    const [resource, chapters] = await Promise.all([
      prisma.resource.findUnique({ where: { id: resourceId }, select: { id: true, price: true, freePreviewChapterCount: true } }),
      prisma.chapter.findMany({ where: { resourceId }, orderBy: { order: 'asc' } }),
    ])
    if (!resource) {
      return NextResponse.json({ data: null, message: 'Resource not found', code: 'error', status: 404 }, { status: 404 })
    }
    const gated = await gateChapters(resource, chapters, userId, isStaff)
    return NextResponse.json({
      data: { resourceId, chapters: gated },
      message: 'Chapters fetched successfully',
      code: 'success',
      status: 200,
    })
  }

  const [resources, allChapters] = await Promise.all([
    prisma.resource.findMany({ select: { id: true, price: true, freePreviewChapterCount: true } }),
    prisma.chapter.findMany({ orderBy: { order: 'asc' } }),
  ])
  const resourceById = new Map(resources.map((r) => [r.id, r]))

  const chaptersByResource = new Map<string, ChapterRow[]>()
  for (const chapter of allChapters) {
    const list = chaptersByResource.get(chapter.resourceId) ?? []
    list.push(chapter)
    chaptersByResource.set(chapter.resourceId, list)
  }

  const byResource: Record<string, { resourceId: string; chapters: ReturnType<typeof serializeChapter>[] }> = {}
  for (const [resId, chapters] of chaptersByResource) {
    const resource = resourceById.get(resId)
    if (!resource) continue
    byResource[resId] = { resourceId: resId, chapters: await gateChapters(resource, chapters, userId, isStaff) }
  }

  return NextResponse.json({
    data: byResource,
    message: 'Chapters fetched successfully',
    code: 'success',
    status: 200,
  })
}
