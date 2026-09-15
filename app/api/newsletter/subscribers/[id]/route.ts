import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

const patchSchema = z.object({ active: z.boolean() })

export const PATCH = withErrorHandling('/api/newsletter/subscribers/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const parsed = patchSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Subscriber not found', 404)

  const updated = await prisma.newsletterSubscriber.update({ where: { id }, data: { active: parsed.data.active } })

  return NextResponse.json({
    data: { id: updated.id, email: updated.email, active: updated.active, createdAt: updated.createdAt.toISOString() },
    message: `Subscriber ${parsed.data.active ? 'enabled' : 'disabled'} successfully`,
    code: 'success',
    status: 200,
  })
})

export const DELETE = withErrorHandling('/api/newsletter/subscribers/[id]', 'DELETE', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Subscriber not found', 404)

  await prisma.newsletterSubscriber.delete({ where: { id } })

  return NextResponse.json({ data: null, message: 'Subscriber removed successfully', code: 'success', status: 200 })
})
