import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaign = await prisma.donationCampaign.findUnique({ where: { id } })
  if (!campaign) {
    return NextResponse.json({ data: null, message: 'Campaign not found', code: 'error', status: 404 }, { status: 404 })
  }
  return NextResponse.json({ data: serializeCampaign(campaign), message: 'Campaign fetched successfully', code: 'success', status: 200 })
}

const patchCampaignSchema = z.union([
  z.object({ action: z.literal('archive') }),
  z.object({ action: z.literal('complete') }),
  z.object({ action: z.literal('toggleFeatured') }),
  z.object({ action: z.undefined() }).passthrough(),
])

export const PATCH = withErrorHandling('/api/donations/campaigns/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const parsed = patchCampaignSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const existing = await prisma.donationCampaign.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Campaign not found', 404)

  if (body.action === 'archive') {
    const updated = await prisma.donationCampaign.update({ where: { id }, data: { status: 'ARCHIVED' } })
    return NextResponse.json({ data: serializeCampaign(updated), message: 'Campaign archived', code: 'success', status: 200 })
  }
  if (body.action === 'complete') {
    const updated = await prisma.donationCampaign.update({ where: { id }, data: { status: 'COMPLETED' } })
    return NextResponse.json({ data: serializeCampaign(updated), message: 'Campaign marked complete', code: 'success', status: 200 })
  }
  if (body.action === 'toggleFeatured') {
    const updated = await prisma.donationCampaign.update({ where: { id }, data: { featured: !existing.featured } })
    return NextResponse.json({ data: serializeCampaign(updated), message: 'Campaign updated successfully', code: 'success', status: 200 })
  }

  const data: Record<string, unknown> = { ...body }
  delete data.action
  const updated = await prisma.donationCampaign.update({ where: { id }, data })
  return NextResponse.json({ data: serializeCampaign(updated), message: 'Campaign updated successfully', code: 'success', status: 200 })
})

export const DELETE = withErrorHandling('/api/donations/campaigns/[id]', 'DELETE', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const existing = await prisma.donationCampaign.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Campaign not found', 404)
  if (existing.raisedRwf > 0) throw new ApiError('Cannot delete a campaign that already has donations', 409)

  await prisma.donationCampaign.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Campaign deleted successfully', code: 'success', status: 200 })
})
