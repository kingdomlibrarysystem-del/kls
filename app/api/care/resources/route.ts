import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAuth, requireStaff } from '@/lib/auth/require-role'
import { listAllResources, listPublishedResources, serializeResource } from '@/lib/care/data'
import { careResourceSchema } from '@/lib/care/schemas'

/**
 * GET /api/care/resources — signed-in members: published readings, audio and
 * video (?program=COUNSELING|REHABILITATION). ?all=1 — staff: everything incl.
 * drafts and Trash.
 */
export const GET = withErrorHandling('/api/care/resources', 'GET', async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('all') === '1') {
    const auth = await requireStaff()
    if (auth.response) return auth.response
    return NextResponse.json({ data: await listAllResources(), message: 'Resources fetched', code: 'success', status: 200 })
  }
  const auth = await requireAuth()
  if (auth.response) return auth.response
  const program = searchParams.get('program')
  const data = await listPublishedResources(program === 'COUNSELING' || program === 'REHABILITATION' ? program : undefined)
  return NextResponse.json({ data, message: 'Resources fetched', code: 'success', status: 200 })
})

/** POST /api/care/resources — staff: publish a reading, audio or video. */
export const POST = withErrorHandling('/api/care/resources', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response
  const parsed = careResourceSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const b = parsed.data
  if (b.kind === 'ARTICLE' && (!b.body || b.body.trim().length < 50)) throw new ApiError('Write the article (at least 50 characters)', 400)
  if (b.kind !== 'ARTICLE' && !b.mediaUrl) throw new ApiError(`Upload the ${b.kind === 'AUDIO' ? 'audio' : 'video'} (or paste a link)`, 400)
  const user = await prisma.user.findUnique({ where: { id: auth.session.userId }, select: { name: true, firstName: true, lastName: true } })
  const created = await prisma.careResource.create({
    data: {
      ...b,
      body: b.body || null, mediaUrl: b.mediaUrl || null, coverImage: b.coverImage || null, durationMins: b.durationMins ?? null,
      published: b.published ?? true,
      createdById: auth.session.userId,
      createdByName: (user?.name || `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()) || 'Staff',
    },
  })
  return NextResponse.json({ data: serializeResource(created), message: created.published ? 'Published — members can open it now' : 'Saved as draft', code: 'success', status: 201 }, { status: 201 })
})
