import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'
import { POST as createBorrow } from '@/app/api/borrowings/route'
import { POST as createReservation } from '@/app/api/reservations/route'

interface RouteParams {
  params: Promise<{ itemId: string }>
}

/**
 * Resolves a BORROW/RESERVE cart item into a real Borrow/Reservation
 * row by calling the exact same route handlers the direct (non-cart)
 * Borrow/Reserve buttons already use — so due-date and queue-position
 * assignment stay identical to before the cart existed, just triggered
 * from the cart instead of immediately on click. The cart item is
 * removed only after that call succeeds; a 409 (e.g. an existing
 * pending request) leaves the cart item in place so the member can see
 * and retry/remove it, rather than silently losing their cart entry.
 * SALE/RENTAL items are not handled here — those resolve through the
 * real payment checkout once it exists (see Cart's schema docstring).
 */
export const POST = withErrorHandling('/api/cart/[itemId]/confirm', 'POST', async (request: NextRequest, { params }: RouteParams) => {
  const { itemId } = await params
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, resource: { select: { title: true } } },
  })
  if (!item) throw new ApiError('Cart item not found', 404)
  if (item.type !== 'BORROW' && item.type !== 'RESERVE') {
    throw new ApiError('Only a Borrow or Reserve cart item can be confirmed this way', 400)
  }

  const auth = await requireOwnerOrStaff(item.cart.userId)
  if (auth.response) return auth.response

  const user = await prisma.user.findUnique({ where: { id: item.cart.userId } })
  if (!user) throw new ApiError('The specified user does not exist', 400)
  const memberName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.name || user.email
  const memberEmail = user.email

  const innerRequest = new NextRequest(new URL(item.type === 'BORROW' ? '/api/borrowings' : '/api/reservations', request.url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: item.cart.userId, resourceId: item.resourceId, memberName, memberEmail }),
  })

  const result = item.type === 'BORROW' ? await createBorrow(innerRequest) : await createReservation(innerRequest)
  const resultJson = await result.json()
  if (result.status >= 400) {
    return NextResponse.json(resultJson, { status: result.status })
  }

  await prisma.cartItem.delete({ where: { id: itemId } })

  return NextResponse.json(
    { data: resultJson.data, message: `${item.type === 'BORROW' ? 'Borrow' : 'Reservation'} request created successfully`, code: 'success', status: 201 },
    { status: 201 }
  )
})
