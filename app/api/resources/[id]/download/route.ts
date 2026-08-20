import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { roleNameToUserRole } from '@/lib/roles'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Downloading the actual file is a real purchase (SALE) privilege, not
 * a reading one — a rental or borrow/reservation grants read access
 * (see /api/resources/[id]/document) but never a downloadable copy.
 * Staff can also download, for the same QA reasons they bypass the
 * reading paywall. Proxied server-side (not a redirect to documentUrl)
 * so the SALE check is actually enforced rather than just hidden by UI.
 */
export const GET = withErrorHandling('/api/resources/[id]/download', 'GET', async (_request: NextRequest, { params }: RouteParams) => {
  const { id } = await params
  const resource = await prisma.resource.findUnique({
    where: { id },
    select: { id: true, title: true, documentUrl: true },
  })
  if (!resource) throw new ApiError('Resource not found', 404)
  if (!resource.documentUrl) throw new ApiError('This resource has no uploaded document', 404)

  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  const role = roleNameToUserRole(session?.user?.roleName ?? '')
  const isStaff = role === 'admin' || role === 'manager' || role === 'staff'

  if (!isStaff) {
    if (!userId) throw new ApiError('You must be signed in to download this.', 401)
    const paidSaleOrder = await prisma.order.findFirst({ where: { userId, resourceId: resource.id, status: 'PAID', type: 'SALE' } })
    if (!paidSaleOrder) throw new ApiError('Buy this resource to download it.', 403)
  }

  const sourceRes = await fetch(resource.documentUrl)
  if (!sourceRes.ok) throw new ApiError('Could not load this document', 502)
  const bytes = await sourceRes.arrayBuffer()

  const fileName = `${resource.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`
  return new NextResponse(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
})
