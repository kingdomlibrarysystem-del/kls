import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

interface RouteParams {
  params: Promise<{ itemId: string }>
}

const updateQuantitySchema = z.object({ quantity: z.number().int().min(1, 'Quantity must be at least 1') })

export const PATCH = withErrorHandling('/api/cart/[itemId]', 'PATCH', async (request: NextRequest, { params }: RouteParams) => {
  const { itemId } = await params
  const parsed = updateQuantitySchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)

  const existing = await prisma.cartItem.findUnique({ where: { id: itemId } })
  if (!existing) throw new ApiError('Cart item not found', 404)

  const updated = await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: parsed.data.quantity } })
  return NextResponse.json({ data: { id: updated.id, quantity: updated.quantity }, message: 'Cart item updated', code: 'success', status: 200 })
})

export const DELETE = withErrorHandling('/api/cart/[itemId]', 'DELETE', async (_request: NextRequest, { params }: RouteParams) => {
  const { itemId } = await params

  const existing = await prisma.cartItem.findUnique({ where: { id: itemId } })
  if (!existing) throw new ApiError('Cart item not found', 404)

  await prisma.cartItem.delete({ where: { id: itemId } })
  return NextResponse.json({ data: null, message: 'Removed from cart', code: 'success', status: 200 })
})
