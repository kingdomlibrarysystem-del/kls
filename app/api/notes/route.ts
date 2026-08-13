import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

/**
 * Real Note API, replacing app/member/_shared/note-data.ts's
 * initialNotes (deliberately empty — a real note is written by a member
 * about a specific chapter/highlight they've actually read).
 */
function serializeNote(n: {
  id: string
  resourceId: string
  chapterId: string
  highlightId: string | null
  text: string
  createdAt: Date
}) {
  return {
    id: n.id,
    resourceId: n.resourceId,
    chapterId: n.chapterId,
    highlightId: n.highlightId ?? undefined,
    text: n.text,
    createdAt: n.createdAt.toISOString().split('T')[0],
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const resourceId = searchParams.get('resourceId')
  const chapterId = searchParams.get('chapterId')

  if (!userId) {
    return NextResponse.json({ data: null, message: 'userId is required', code: 'error', status: 400 }, { status: 400 })
  }

  const notes = await prisma.note.findMany({
    where: { userId, ...(resourceId && { resourceId }), ...(chapterId && { chapterId }) },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    data: notes.map(serializeNote),
    message: 'Notes fetched successfully',
    code: 'success',
    status: 200,
  })
}

const createNoteSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  resourceId: z.string().min(1, 'resourceId is required'),
  chapterId: z.string().min(1, 'chapterId is required'),
  highlightId: z.string().optional(),
  text: z.string().trim().min(1, 'text is required'),
})

/** Creates a new note, either attached to a chapter generally or to a specific highlight within it. */
export const POST = withErrorHandling('/api/notes', 'POST', async (request: NextRequest) => {
  const parsed = createNoteSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const user = await prisma.user.findUnique({ where: { id: body.userId } })
  if (!user) throw new ApiError('The specified user does not exist', 400)

  const note = await prisma.note.create({
    data: {
      userId: body.userId,
      resourceId: body.resourceId,
      chapterId: body.chapterId,
      highlightId: body.highlightId ?? null,
      text: body.text,
    },
  })

  return NextResponse.json({ data: serializeNote(note), message: 'Note created successfully', code: 'success', status: 201 }, { status: 201 })
})
