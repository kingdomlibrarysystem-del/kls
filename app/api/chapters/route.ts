import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { roleNameToUserRole } from '@/lib/roles'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { gateChapters, serializeChapter, type ChapterRow } from '@/lib/data/chapters'

// Chapter gating lives in lib/data/chapters.ts (shared with the server-rendered
// reader page); re-exported here for existing importers.
export { serializeChapter, isEntitled, gateChapters } from '@/lib/data/chapters'

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

const createChapterSchema = z.object({
  resourceId: z.string().min(1, 'resourceId is required'),
  title: z.string().trim().min(1, 'title is required'),
  body: z.string(),
})

/**
 * Creates one chapter for a resource — staff-only authoring. Used by the
 * admin Resource form's markdown editor (shown for a TEXT resource) to
 * create a real first Chapter row alongside the Resource itself, so a
 * TEXT resource has real readable content from the moment it's created
 * instead of needing a separate chapter-authoring step. `order` is
 * assigned as the next value after this resource's existing chapters,
 * matching how additional chapters would be appended later.
 */
export const POST = withErrorHandling('/api/chapters', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const parsed = createChapterSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const resource = await prisma.resource.findUnique({ where: { id: body.resourceId } })
  if (!resource) throw new ApiError('The specified resource does not exist', 400)

  const maxOrder = await prisma.chapter.aggregate({ where: { resourceId: body.resourceId }, _max: { order: true } })
  const chapter = await prisma.chapter.create({
    data: {
      resourceId: body.resourceId,
      title: body.title,
      body: body.body,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  })

  return NextResponse.json({ data: serializeChapter(chapter, false), message: 'Chapter created successfully', code: 'success', status: 201 }, { status: 201 })
})
