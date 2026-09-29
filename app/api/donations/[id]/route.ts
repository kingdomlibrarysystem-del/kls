import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'
import { serializeDonation } from '@/lib/data/donations'

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
