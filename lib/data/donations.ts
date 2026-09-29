import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export function serializeDonation(d: {
  id: string
  userId: string
  donorName: string
  donorEmail: string
  donorPhone: string
  campaignId: string | null
  resourceId: string | null
  message: string | null
  isAnonymous: boolean
  method: string
  amountRwf: number
  status: string
  paypackRef: string | null
  paypackStatus: string | null
  stripeSessionId: string | null
  paidAt: Date | null
  createdAt: Date
}) {
  return {
    id: d.id,
    userId: d.userId,
    donorName: d.donorName,
    donorEmail: d.donorEmail,
    donorPhone: d.donorPhone,
    campaignId: d.campaignId,
    resourceId: d.resourceId,
    message: d.message,
    isAnonymous: d.isAnonymous,
    method: d.method,
    amountRwf: d.amountRwf,
    status: d.status.toLowerCase(),
    paypackRef: d.paypackRef,
    paypackStatus: d.paypackStatus,
    stripeSessionId: d.stripeSessionId,
    paidAt: d.paidAt ? d.paidAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
  }
}

/** One record in the GET /api/donations/[id] shape, plus its owner id for the owner-or-staff check. */
export async function getDonationDetail(id: string) {
  if (!isObjectId(id)) return null
  const row = await prisma.donation.findUnique({ where: { id } })
  return row ? { ownerId: row.userId, data: serializeDonation(row) } : null
}
