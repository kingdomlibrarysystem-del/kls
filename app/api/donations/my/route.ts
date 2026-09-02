import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'

/** The hinted GET /api/donations/my — member's own donation history and receipts. */
function serializeDonation(d: { id: string; campaignId: string | null; resourceId: string | null; amountRwf: number; status: string; paidAt: Date | null; createdAt: Date }) {
  return {
    id: d.id,
    campaignId: d.campaignId,
    resourceId: d.resourceId,
    amountRwf: d.amountRwf,
    status: d.status.toLowerCase(),
    paidAt: d.paidAt ? d.paidAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ data: null, message: 'userId is required', code: 'error', status: 400 }, { status: 400 })
  }

  const auth = await requireOwnerOrStaff(userId)
  if (auth.response) return auth.response

  const donations = await prisma.donation.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })

  return NextResponse.json({ data: donations.map(serializeDonation), message: 'Donations fetched successfully', code: 'success', status: 200 })
}
