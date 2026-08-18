import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'

/**
 * Real Immunization API, replacing health-data.ts's initialImmunizations.
 * Read-only, same reasoning as /api/health-records.
 */
function serializeImmunization(i: {
  id: string
  vaccine: string
  dateAdministered: Date
  nextDue: Date | null
}) {
  return {
    id: i.id,
    vaccine: i.vaccine,
    dateAdministered: i.dateAdministered.toISOString().split('T')[0],
    nextDue: i.nextDue ? i.nextDue.toISOString().split('T')[0] : undefined,
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

  const immunizations = await prisma.immunization.findMany({
    where: { userId },
    orderBy: { dateAdministered: 'desc' },
  })

  return NextResponse.json({
    data: immunizations.map(serializeImmunization),
    message: 'Immunizations fetched successfully',
    code: 'success',
    status: 200,
  })
}
