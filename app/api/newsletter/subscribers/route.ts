import { NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

export const GET = withErrorHandling('/api/newsletter/subscribers', 'GET', async () => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    data: subscribers.map((s) => ({
      id: s.id,
      email: s.email,
      active: s.active,
      createdAt: s.createdAt.toISOString(),
    })),
    message: 'Subscribers fetched successfully',
    code: 'success',
    status: 200,
    pagination: {
      page: 1,
      pageSize: subscribers.length,
      totalItems: subscribers.length,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    },
  })
})
