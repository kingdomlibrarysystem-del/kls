import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'

/**
 * Real Reading Progress API, replacing
 * app/member/_shared/reading-progress-data.ts's initialReadingProgress
 * (2 hand-typed rows, no userId at all — single-persona mock).
 */
function serializeProgress(p: {
  resourceId: string
  status: string
  startedAt: Date
  completedChapterIds: string[]
  totalChapters: number
  lastChapterId: string | null
  lastReadAt: Date
}) {
  return {
    resourceId: p.resourceId,
    status: p.status,
    startedAt: p.startedAt.toISOString().split('T')[0],
    completedChapterIds: p.completedChapterIds,
    totalChapters: p.totalChapters,
    lastChapterId: p.lastChapterId ?? '',
    lastReadAt: p.lastReadAt.toISOString().split('T')[0],
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ data: null, message: 'userId is required', code: 'error', status: 400 }, { status: 400 })
  }

  const auth = await requireOwnerOrStaff(userId)
  if (auth.response) return auth.response

  const progress = await prisma.readingProgress.findMany({
    where: { userId },
    orderBy: { lastReadAt: 'desc' },
  })

  return NextResponse.json({
    data: progress.map(serializeProgress),
    message: 'Reading progress fetched successfully',
    code: 'success',
    status: 200,
  })
}

const startReadingSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  resourceId: z.string().min(1, 'resourceId is required'),
})

/** Starts (or resumes — returns the existing row) reading progress for a resource. */
export const POST = withErrorHandling('/api/reading-progress', 'POST', async (request: NextRequest) => {
  const parsed = startReadingSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const { userId, resourceId } = parsed.data

  const auth = await requireOwnerOrStaff(userId)
  if (auth.response) return auth.response

  const existing = await prisma.readingProgress.findUnique({ where: { userId_resourceId: { userId, resourceId } } })
  if (existing) {
    return NextResponse.json({ data: serializeProgress(existing), message: 'Reading progress already started', code: 'success', status: 200 })
  }

  const [user, chapters] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.chapter.findMany({ where: { resourceId }, orderBy: { order: 'asc' } }),
  ])
  if (!user) throw new ApiError('The specified user does not exist', 400)

  const created = await prisma.readingProgress.create({
    data: {
      userId,
      resourceId,
      status: 'READING',
      completedChapterIds: [],
      totalChapters: chapters.length,
      lastChapterId: chapters[0]?.id ?? null,
    },
  })

  return NextResponse.json({ data: serializeProgress(created), message: 'Reading progress started', code: 'success', status: 201 }, { status: 201 })
})

const markChapterReadSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  resourceId: z.string().min(1, 'resourceId is required'),
  chapterId: z.string().min(1).optional(),
  /** Explicit "Mark Complete" action from the last chapter — finishes the book even if earlier chapters were skipped, rather than only marking the currently-viewed chapter. */
  markAllComplete: z.boolean().optional(),
}).refine((v) => v.markAllComplete || v.chapterId, { message: 'chapterId is required unless markAllComplete is set' })

/**
 * Marks a chapter viewed (idempotent) and updates lastChapterId/lastReadAt
 * to that chapter — ports the mock's markChapterRead semantics: this is
 * called on every chapter navigation, not only an explicit "mark
 * complete" action, since simply reading a chapter is the natural
 * completion signal for prose. Auto-flips status to COMPLETED once every
 * chapter has been viewed. `markAllComplete: true` is the deliberate
 * "Mark Complete" button on the last chapter — marks every chapter as
 * read at once, including any skipped along the way.
 */
export const PATCH = withErrorHandling('/api/reading-progress', 'PATCH', async (request: NextRequest) => {
  const parsed = markChapterReadSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const { userId, resourceId, chapterId, markAllComplete } = parsed.data

  const auth = await requireOwnerOrStaff(userId)
  if (auth.response) return auth.response

  const existing = await prisma.readingProgress.findUnique({ where: { userId_resourceId: { userId, resourceId } } })
  if (!existing) throw new ApiError('Reading progress not found — call POST to start reading first', 404)

  if (markAllComplete) {
    const chapters = await prisma.chapter.findMany({ where: { resourceId }, select: { id: true } })
    const updated = await prisma.readingProgress.update({
      where: { userId_resourceId: { userId, resourceId } },
      data: { completedChapterIds: chapters.map((c) => c.id), status: 'COMPLETED', lastReadAt: new Date() },
    })
    return NextResponse.json({ data: serializeProgress(updated), message: 'Book marked complete', code: 'success', status: 200 })
  }

  const completedChapterIds = existing.completedChapterIds.includes(chapterId!)
    ? existing.completedChapterIds
    : [...existing.completedChapterIds, chapterId!]
  const status = completedChapterIds.length >= existing.totalChapters ? 'COMPLETED' : 'READING'

  const updated = await prisma.readingProgress.update({
    where: { userId_resourceId: { userId, resourceId } },
    data: { completedChapterIds, status, lastChapterId: chapterId, lastReadAt: new Date() },
  })

  return NextResponse.json({ data: serializeProgress(updated), message: 'Chapter marked read', code: 'success', status: 200 })
})
