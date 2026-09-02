import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { findTransaction } from '@/lib/paypack'
import { settleDonation } from '../../settle'

/**
 * Manual reconciliation for a PENDING donation's real PayPack status —
 * PayPack has no sandbox (any real charge is live), so this is the
 * only safe way for staff to verify a stuck PENDING donation's status
 * in dev/staging without waiting on a live webhook. Staff-only, not a
 * member-facing action.
 */
export const POST = withErrorHandling('/api/donations/[id]/poll-status', 'POST', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const donation = await prisma.donation.findUnique({ where: { id } })
  if (!donation) throw new ApiError('Donation not found', 404)
  if (!donation.paypackRef) throw new ApiError('This donation has no PayPack transaction to check', 400)

  const transaction = await findTransaction(donation.paypackRef)
  const updated = await settleDonation(id, { paypackStatus: transaction.status, providerStatus: transaction.status })

  return NextResponse.json({ data: { id: updated.id, status: updated.status.toLowerCase() }, message: 'Status refreshed', code: 'success', status: 200 })
})
