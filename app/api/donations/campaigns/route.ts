import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

/** Real DonationCampaign API — public/member-readable list (defaults to active-only), staff-only create. */
function serializeCampaign(c: {
  id: string
  title: string
  description: string
  coverImage: string | null
  category: string
  goalRwf: number
  raisedRwf: number
  status: string
  startDate: Date
  endDate: Date | null
  featured: boolean
  createdById: string
}) {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    coverImage: c.coverImage,
    category: c.category,
    goalRwf: c.goalRwf,
    raisedRwf: c.raisedRwf,
    status: c.status,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate ? c.endDate.toISOString() : null,
    featured: c.featured,
    createdById: c.createdById,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const requestedStatus = searchParams.get('status')

  const staffAuth = await requireStaff()
  const isStaff = !staffAuth.response

  const status = isStaff && requestedStatus && requestedStatus !== 'all'
    ? requestedStatus.toUpperCase()
    : isStaff ? undefined : 'ACTIVE'

  const campaigns = await prisma.donationCampaign.findMany({
    where: { ...(status && { status: status as 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' }) },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: campaigns.map(serializeCampaign), message: 'Campaigns fetched successfully', code: 'success', status: 200 })
}

const createCampaignSchema = z.object({
  createdById: z.string().min(1, 'createdById is required'),
  title: z.string().trim().min(3, 'title must be at least 3 characters'),
  description: z.string().trim().min(1, 'description is required'),
  coverImage: z.string().trim().optional(),
  category: z.string().trim().min(1, 'category is required'),
  goalRwf: z.number().positive('goalRwf must be greater than 0'),
  endDate: z.string().datetime().optional(),
})

export const POST = withErrorHandling('/api/donations/campaigns', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const parsed = createCampaignSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const creator = await prisma.user.findUnique({ where: { id: body.createdById } })
  if (!creator) throw new ApiError('The specified user does not exist', 400)

  const campaign = await prisma.donationCampaign.create({
    data: {
      createdById: body.createdById,
      title: body.title,
      description: body.description,
      coverImage: body.coverImage,
      category: body.category,
      goalRwf: body.goalRwf,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      status: 'ACTIVE',
    },
  })

  return NextResponse.json({ data: serializeCampaign(campaign), message: 'Campaign created successfully', code: 'success', status: 201 }, { status: 201 })
})
