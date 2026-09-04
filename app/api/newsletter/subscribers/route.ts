import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

/**
 * Newsletter subscriber management — staff-only paginated list.
 * Also supports CSV export via ?export=csv query param.
 */
export const GET = withErrorHandling('/api/newsletter/subscribers', 'GET', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const search = searchParams.get('search')?.toLowerCase()
  const exportCsv = searchParams.get('export') === 'csv'

  const where = {
    ...(search && { email: { contains: search, mode: 'insensitive' as const } }),
  }

  const [totalItems, subscribers] = await Promise.all([
    prisma.newsletterSubscriber.count({ where }),
    prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...(exportCsv ? {} : { skip: (page - 1) * pageSize, take: pageSize }),
    }),
  ])

  if (exportCsv) {
    const header = 'Email,Subscribed At\n'
    const rows = subscribers.map((s) => `${s.email},${s.createdAt.toISOString()}`).join('\n')
    return new NextResponse(header + rows, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: subscribers.map((s) => ({ id: s.id, email: s.email, createdAt: s.createdAt.toISOString() })),
    message: 'Subscribers fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
})

export const POST = withErrorHandling('/api/newsletter/subscribers', 'POST', async () => {
  throw new ApiError('Use POST /api/newsletter/subscribe to subscribe', 405)
})
