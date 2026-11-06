import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'
import { isObjectId } from '@/lib/server/object-id'
import { buildCertificatePdf } from '@/lib/certificates/pdf'

/** GET — the certificate as a downloadable PDF (its owner or staff). `?inline=1` opens it in the browser instead. */
export const GET = withErrorHandling('/api/certificates/[id]/pdf', 'GET', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  if (!isObjectId(id)) throw new ApiError('Certificate not found', 404)
  const c = await prisma.certificate.findUnique({ where: { id } })
  if (!c) throw new ApiError('Certificate not found', 404)
  const auth = await requireOwnerOrStaff(c.userId)
  if (auth.response) return auth.response

  const bytes = await buildCertificatePdf({ memberName: c.memberName, courseTitle: c.courseTitle, issuedAt: c.issuedAt, verificationCode: c.verificationCode, revoked: c.revoked })
  const file = `Certificate - ${c.courseTitle}`.replace(/[^\w\s.-]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Certificate'
  const inline = new URL(request.url).searchParams.get('inline') === '1'
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${file}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
})
