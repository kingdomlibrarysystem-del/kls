import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { roleNameToUserRole } from '@/lib/roles'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { isEntitled } from '@/app/api/chapters/route'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Tells the PDF reader, before it requests the actual document bytes,
 * whether the current viewer is entitled to the full file (free
 * resource, staff, or a real PAID Order / active Borrow / claimed
 * Reservation) or only the free-preview page count — so the UI can
 * decide up front whether to show the full viewer or the locked
 * preview + Buy/Rent CTA, same gating rule as /api/chapters.
 */
export const GET = withErrorHandling('/api/resources/[id]/entitlement', 'GET', async (request: NextRequest, { params }: RouteParams) => {
  const { id } = await params
  const forcePreview = new URL(request.url).searchParams.get('preview') === '1'
  const resource = await prisma.resource.findUnique({
    where: { id },
    select: { id: true, price: true, freePreviewChapterCount: true },
  })
  if (!resource) throw new ApiError('Resource not found', 404)

  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  const role = roleNameToUserRole(session?.user?.roleName ?? '')
  const isStaff = !forcePreview && (role === 'admin' || role === 'manager' || role === 'staff')
  const memberEntitled = !forcePreview && userId ? await isEntitled(userId, resource.id) : false
  const entitled = resource.price <= 0 || isStaff || memberEntitled

  const paidSaleOrder = !forcePreview && userId
    ? await prisma.order.findFirst({ where: { userId, resourceId: resource.id, status: 'PAID', type: 'SALE' } })
    : null

  return NextResponse.json({
    data: {
      entitled,
      freePreviewPages: resource.freePreviewChapterCount,
      canDownload: isStaff || !!paidSaleOrder,
    },
    message: 'Entitlement resolved',
    code: 'success',
    status: 200,
  })
})
