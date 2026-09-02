import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'

/** Real NewsSubscription API — subscribe/update (POST, upsert) and unsubscribe (DELETE), matching CounselingConsent's single-row-per-key upsert convention. */
function serializeSubscription(s: { id: string; userId: string; category: string | null }) {
  return { id: s.id, userId: s.userId, category: s.category }
}

const subscribeSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  category: z.string().trim().optional(),
})

export const POST = withErrorHandling('/api/news/alerts', 'POST', async (request: NextRequest) => {
  const parsed = subscribeSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const { userId, category } = parsed.data

  const auth = await requireOwnerOrStaff(userId)
  if (auth.response) return auth.response

  // Prisma's Mongo connector generates the userId_category compound-unique
  // where-input as { userId: string; category: string } — non-nullable,
  // even though category itself is nullable — so it can't express "find
  // the row where category is null" via that compound key. Only the
  // category-set case can use the real upsert; a null-category ("all
  // categories") subscription is found/created manually instead.
  const subscription = category
    ? await prisma.newsSubscription.upsert({
        where: { userId_category: { userId, category } },
        update: {},
        create: { userId, category },
      })
    : await prisma.newsSubscription.findFirst({ where: { userId, category: null } })
      ?? await prisma.newsSubscription.create({ data: { userId, category: null } })

  return NextResponse.json({ data: serializeSubscription(subscription), message: 'Subscribed successfully', code: 'success', status: 201 }, { status: 201 })
})

export const DELETE = withErrorHandling('/api/news/alerts', 'DELETE', async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const category = searchParams.get('category')

  if (!userId) throw new ApiError('userId is required', 400)

  const auth = await requireOwnerOrStaff(userId)
  if (auth.response) return auth.response

  await prisma.newsSubscription.deleteMany({ where: { userId, category: category || null } })

  return NextResponse.json({ data: null, message: 'Unsubscribed successfully', code: 'success', status: 200 })
})
