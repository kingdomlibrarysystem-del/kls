import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

/** Real BeautyService catalog API — GET-only, optional providerId filter, mirrors /api/beauty/providers' scope. */
function serializeService(s: { id: string; providerId: string; name: string; category: string; priceRwf: number; durationMins: number; description: string | null }) {
  return { id: s.id, providerId: s.providerId, name: s.name, category: s.category, priceRwf: s.priceRwf, durationMins: s.durationMins, description: s.description }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const providerId = searchParams.get('providerId')

  const services = await prisma.beautyService.findMany({
    where: { ...(providerId && { providerId }) },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({
    data: services.map(serializeService),
    message: 'Beauty services fetched successfully',
    code: 'success',
    status: 200,
  })
}
