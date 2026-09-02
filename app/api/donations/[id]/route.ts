import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'

function serializeDonation(d: {
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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const donation = await prisma.donation.findUnique({ where: { id } })
  if (!donation) {
    return NextResponse.json({ data: null, message: 'Donation not found', code: 'error', status: 404 }, { status: 404 })
  }
  const auth = await requireOwnerOrStaff(donation.userId)
  if (auth.response) return auth.response
  return NextResponse.json({ data: serializeDonation(donation), message: 'Donation fetched successfully', code: 'success', status: 200 })
}
