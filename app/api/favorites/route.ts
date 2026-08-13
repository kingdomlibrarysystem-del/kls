import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

/**
 * Real Favorite API, replacing app/member/_shared/favorites-data.ts's
 * mock store. A favorite targets either a Resource or a Course (two
 * different collections), so itemId/itemType is polymorphic rather than
 * two nullable relation FKs — see the Favorite model's schema comment.
 */
function serializeFavorite(f: {
  id: string
  itemId: string
  itemType: string
  title: string
  subtitle: string
}) {
  return {
    id: f.itemId,
    type: f.itemType,
    title: f.title,
    subtitle: f.subtitle,
  }
}

const createFavoriteSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  itemId: z.string().min(1, 'itemId is required'),
  itemType: z.enum(['RESOURCE', 'COURSE']),
  title: z.string().trim().min(1, 'title is required'),
  subtitle: z.string().trim().default(''),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ data: null, message: 'userId is required', code: 'error', status: 400 }, { status: 400 })
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    data: favorites.map(serializeFavorite),
    message: 'Favorites fetched successfully',
    code: 'success',
    status: 200,
  })
}

export const POST = withErrorHandling('/api/favorites', 'POST', async (request: NextRequest) => {
  const parsed = createFavoriteSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const user = await prisma.user.findUnique({ where: { id: body.userId } })
  if (!user) throw new ApiError('The specified user does not exist', 400)

  const favorite = await prisma.favorite.upsert({
    where: { userId_itemId: { userId: body.userId, itemId: body.itemId } },
    update: {},
    create: {
      userId: body.userId,
      itemId: body.itemId,
      itemType: body.itemType,
      title: body.title,
      subtitle: body.subtitle,
    },
  })

  return NextResponse.json({ data: serializeFavorite(favorite), message: 'Favorite added successfully', code: 'success', status: 201 }, { status: 201 })
})

export const DELETE = withErrorHandling('/api/favorites', 'DELETE', async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const itemId = searchParams.get('itemId')

  if (!userId || !itemId) {
    throw new ApiError('userId and itemId are required', 400)
  }

  await prisma.favorite.deleteMany({ where: { userId, itemId } })

  return NextResponse.json({ data: null, message: 'Favorite removed successfully', code: 'success', status: 200 })
})
