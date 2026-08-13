import { NextResponse } from 'next/server'
import prisma from '@/prisma/client'

/**
 * Real Clinic API, replacing app/dashboard/health/_shared/health-data.ts's
 * hand-typed `clinics` array. No admin CRUD UI exists yet (the mock had
 * none either), so only GET is implemented — same scope as the mock.
 */
function serializeClinic(c: { id: string; name: string; specialty: string; location: string; image: string }) {
  return { id: c.id, name: c.name, specialty: c.specialty, location: c.location, image: c.image }
}

export async function GET() {
  const clinics = await prisma.clinic.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({
    data: clinics.map(serializeClinic),
    message: 'Clinics fetched successfully',
    code: 'success',
    status: 200,
  })
}
