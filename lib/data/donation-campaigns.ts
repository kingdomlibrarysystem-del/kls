import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export function serializeCampaign(c: {
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

/** One record in the GET /api/donations/campaigns/[id] shape. */
export async function getDonationCampaignDetail(id: string) {
  if (!isObjectId(id)) return null
  const row = await prisma.donationCampaign.findUnique({ where: { id } })
  return row ? serializeCampaign(row) : null
}
