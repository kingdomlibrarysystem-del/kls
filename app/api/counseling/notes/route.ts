import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'

/**
 * Real CounselingNote API — a note is always staff-authored. GET
 * redacts summary/followUp when the requester is the subject and their
 * own CounselingConsent.shareNotesWithMember is false, a real
 * enforcement of the consent flag rather than a stored-and-ignored
 * setting.
 */
function serializeNote(n: { id: string; sessionId: string; userId: string; authorId: string; summary: string; followUp: string | null; createdAt: Date; author?: { name: string | null; firstName: string | null; lastName: string | null } }) {
  return {
    id: n.id,
    sessionId: n.sessionId,
    userId: n.userId,
    authorId: n.authorId,
    authorName: n.author ? (n.author.name ?? `${n.author.firstName ?? ''} ${n.author.lastName ?? ''}`.trim()) : undefined,
    summary: n.summary,
    followUp: n.followUp,
    createdAt: n.createdAt.toISOString(),
  }
}

const REDACTED = { summary: 'Withheld per your privacy settings.', followUp: null }

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const sessionId = searchParams.get('sessionId')
  if (!userId && !sessionId) {
    return NextResponse.json({ data: null, message: 'userId or sessionId is required', code: 'error', status: 400 }, { status: 400 })
  }

  const scopeUserId = userId ?? undefined
  if (scopeUserId) {
    const auth = await requireOwnerOrStaff(scopeUserId)
    if (auth.response) return auth.response
  } else {
    const auth = await requireStaff()
    if (auth.response) return auth.response
  }

  const notes = await prisma.counselingNote.findMany({
    where: { ...(userId && { userId }), ...(sessionId && { sessionId }) },
    include: { author: { select: { name: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  })

  let redactedFor: string | null = null
  if (scopeUserId) {
    const consent = await prisma.counselingConsent.findUnique({ where: { userId: scopeUserId } })
    if (consent && !consent.shareNotesWithMember) redactedFor = scopeUserId
  }

  const data = notes.map((n) => {
    const serialized = serializeNote(n)
    return n.userId === redactedFor ? { ...serialized, ...REDACTED } : serialized
  })

  return NextResponse.json({ data, message: 'Notes fetched successfully', code: 'success', status: 200 })
}

const createNoteSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  userId: z.string().min(1, 'userId is required'),
  authorId: z.string().min(1, 'authorId is required'),
  summary: z.string().trim().min(1, 'summary is required'),
  followUp: z.string().trim().optional(),
})

export const POST = withErrorHandling('/api/counseling/notes', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const parsed = createNoteSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const session = await prisma.counselingSession.findUnique({ where: { id: body.sessionId } })
  if (!session) throw new ApiError('Session not found', 404)
  if (session.userId !== body.userId) throw new ApiError('The specified session does not belong to this user', 400)

  const note = await prisma.counselingNote.create({
    data: { sessionId: body.sessionId, userId: body.userId, authorId: body.authorId, summary: body.summary, followUp: body.followUp },
    include: { author: { select: { name: true, firstName: true, lastName: true } } },
  })

  return NextResponse.json({ data: serializeNote(note), message: 'Note added successfully', code: 'success', status: 201 }, { status: 201 })
})
