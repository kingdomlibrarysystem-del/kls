import { NextResponse } from 'next/server'
import prisma from '@/prisma/client'

/** Real BeautyProvider directory API — GET-only reference data, mirrors /api/clinics. No admin CRUD UI this pass. */
function serializeProvider(p: { id: string; name: string; specialties: string[]; location: string; image: string; bio: string | null; avgRating: number; reviewCount: number }) {
  return { id: p.id, name: p.name, specialties: p.specialties, location: p.location, image: p.image, bio: p.bio, avgRating: p.avgRating, reviewCount: p.reviewCount }
}

export async function GET() {
  const providers = await prisma.beautyProvider.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({
    data: providers.map(serializeProvider),
    message: 'Beauty providers fetched successfully',
    code: 'success',
    status: 200,
  })
}
