import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

/**
 * Delete a newsletter subscriber — staff-only.
 */
export const DELETE = withErrorHandling('/api/newsletter/subscribers/[id]', 'DELETE', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  if (!/^[0-9a-fA-F]{24}$/.test(id)) throw new ApiError('Subscriber not found', 404)
  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { id } })
  if (!subscriber) throw new ApiError('Subscriber not found', 404)

  await prisma.newsletterSubscriber.delete({ where: { id } })

  return NextResponse.json({ data: { id }, message: 'Subscriber removed successfully', code: 'success', status: 200 })
})
