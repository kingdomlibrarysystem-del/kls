import { NextResponse } from 'next/server'
import prisma from '@/prisma/client'

/** Real Counselor directory API — GET-only reference data, mirrors /api/clinics. No admin CRUD UI this pass. */
function serializeCounselor(c: { id: string; name: string; specialty: string; bio: string | null; image: string }) {
  return { id: c.id, name: c.name, specialty: c.specialty, bio: c.bio, image: c.image }
}

export async function GET() {
  const counselors = await prisma.counselor.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({
    data: counselors.map(serializeCounselor),
    message: 'Counselors fetched successfully',
    code: 'success',
    status: 200,
  })
}
