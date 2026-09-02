import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireStaff } from '@/lib/auth/require-role'

/** Staff-only: real donations against one specific campaign — the admin campaign-detail page's donor list. */
function serializeDonation(d: {
  id: string
  userId: string
  donorName: string
  isAnonymous: boolean
  amountRwf: number
  status: string
  message: string | null
  createdAt: Date
}) {
  return {
    id: d.id,
    userId: d.userId,
    donorName: d.isAnonymous ? 'Anonymous' : d.donorName,
    amountRwf: d.amountRwf,
    status: d.status,
    message: d.message,
    createdAt: d.createdAt.toISOString(),
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const donations = await prisma.donation.findMany({ where: { campaignId: id }, orderBy: { createdAt: 'desc' } })

  return NextResponse.json({ data: donations.map(serializeDonation), message: 'Donations fetched successfully', code: 'success', status: 200 })
}
