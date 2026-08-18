import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'

/**
 * Real Health Record API, replacing health-data.ts's initialHealthRecords.
 * Read-only, per the mock's own design note — no clinic-practitioner
 * authoring UI exists yet to write these.
 */
function serializeRecord(r: {
  id: string
  clinicId: string
  date: Date
  summary: string
  prescriptions: string[]
  referral: string | null
}) {
  return {
    id: r.id,
    clinicId: r.clinicId,
    date: r.date.toISOString().split('T')[0],
    summary: r.summary,
    prescriptions: r.prescriptions,
    referral: r.referral ?? undefined,
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

  const records = await prisma.healthRecord.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json({
    data: records.map(serializeRecord),
    message: 'Health records fetched successfully',
    code: 'success',
    status: 200,
  })
}
