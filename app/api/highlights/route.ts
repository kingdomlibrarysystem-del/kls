import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

/**
 * Real Highlight API, replacing app/member/_shared/highlight-data.ts's
 * initialHighlights (deliberately empty — a seeded highlight would
 * reference offsets into chapter body text that could silently desync).
 */
function serializeHighlight(h: {
  id: string
  resourceId: string
  chapterId: string
  startOffset: number
  endOffset: number
  text: string
  color: string
  createdAt: Date
}) {
  return {
    id: h.id,
    resourceId: h.resourceId,
    chapterId: h.chapterId,
    startOffset: h.startOffset,
    endOffset: h.endOffset,
    text: h.text,
    color: h.color.toLowerCase(),
    createdAt: h.createdAt.toISOString().split('T')[0],
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const resourceId = searchParams.get('resourceId')

  if (!userId) {
    return NextResponse.json({ data: null, message: 'userId is required', code: 'error', status: 400 }, { status: 400 })
  }

  const highlights = await prisma.highlight.findMany({
    where: { userId, ...(resourceId && { resourceId }) },
    orderBy: { startOffset: 'asc' },
  })

  return NextResponse.json({
    data: highlights.map(serializeHighlight),
    message: 'Highlights fetched successfully',
    code: 'success',
    status: 200,
  })
}

const createHighlightSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  resourceId: z.string().min(1, 'resourceId is required'),
  chapterId: z.string().min(1, 'chapterId is required'),
  startOffset: z.number().int().nonnegative(),
  endOffset: z.number().int().nonnegative(),
  text: z.string().min(1, 'text is required'),
  color: z.enum(['gold', 'green', 'teal', 'pink']),
})

/** Creates a new highlight from a real text selection made in the reader. */
export const POST = withErrorHandling('/api/highlights', 'POST', async (request: NextRequest) => {
  const parsed = createHighlightSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const user = await prisma.user.findUnique({ where: { id: body.userId } })
  if (!user) throw new ApiError('The specified user does not exist', 400)

  const highlight = await prisma.highlight.create({
    data: {
      userId: body.userId,
      resourceId: body.resourceId,
      chapterId: body.chapterId,
      startOffset: body.startOffset,
      endOffset: body.endOffset,
      text: body.text,
      color: body.color.toUpperCase() as 'GOLD' | 'GREEN' | 'TEAL' | 'PINK',
    },
  })

  return NextResponse.json({ data: serializeHighlight(highlight), message: 'Highlight created successfully', code: 'success', status: 201 }, { status: 201 })
})
