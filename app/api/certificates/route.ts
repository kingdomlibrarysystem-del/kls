import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'
import { notifyUser } from '@/lib/notify'
import { certificateIssuedEmailHtml } from '@/lib/email-templates'
import { appBaseUrl } from '@/lib/mailer'

/** Real Certificate API, replacing app/dashboard/e-learning/certificates/_components/certificates-data.ts. */
function serializeCertificate(c: {
  id: string
  userId: string
  memberName: string
  courseId: string | null
  courseTitle: string
  issuedAt: Date
  verificationCode: string
  revoked: boolean
}) {
  return {
    id: c.id,
    userId: c.userId,
    member: c.memberName,
    courseId: c.courseId ?? undefined,
    course: c.courseTitle,
    issuedAt: c.issuedAt.toISOString().split('T')[0],
    verificationCode: c.verificationCode,
    revoked: c.revoked,
  }
}

function generateVerificationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `KLS-${part()}-${part()}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const search = searchParams.get('search')?.toLowerCase()
  const userId = searchParams.get('userId')
  const verificationCode = searchParams.get('verificationCode')

  // A verificationCode lookup is the public "verify this certificate" page
  // (app/(public)/certificate/verify/[code]) — anyone with the code is
  // meant to be able to confirm it's real, so that path stays unauthenticated.
  // Without a code, this is "my certificates" (ownership) or the admin list
  // (staff, no filter at all).
  if (!verificationCode) {
    const auth = await (userId ? requireOwnerOrStaff(userId) : requireStaff())
    if (auth.response) return auth.response
  }

  const where = {
    ...(userId && { userId }),
    ...(verificationCode && { verificationCode }),
    ...(search && {
      OR: [
        { memberName: { contains: search, mode: 'insensitive' as const } },
        { courseTitle: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [totalItems, certificates] = await Promise.all([
    prisma.certificate.count({ where }),
    prisma.certificate.findMany({ where, orderBy: { issuedAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: certificates.map(serializeCertificate),
    message: 'Certificates fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

const createCertificateSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  courseTitle: z.string().trim().min(1, 'courseTitle is required'),
  courseId: z.string().optional(),
})

/** Guarded: only one certificate per user per course (deduplicates issuance, matching the mock's own stated intent for the optional courseId field). */
export const POST = withErrorHandling('/api/certificates', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const parsed = createCertificateSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const user = await prisma.user.findUnique({ where: { id: body.userId } })
  if (!user) throw new ApiError('The specified user does not exist', 400)

  if (body.courseId) {
    const already = await prisma.certificate.findFirst({ where: { userId: body.userId, courseId: body.courseId } })
    if (already) throw new ApiError('A certificate for this user and course already exists', 409)
  }

  const memberName = user.name ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
  const certificate = await prisma.certificate.create({
    data: {
      userId: body.userId,
      memberName,
      courseId: body.courseId ?? null,
      courseTitle: body.courseTitle,
      verificationCode: generateVerificationCode(),
    },
  })

  const certificateUrl = `${appBaseUrl()}/member/certificates/${certificate.id}`
  await notifyUser({
    userId: body.userId,
    type: 'COURSE',
    category: 'certificate-issued',
    title: 'Certificate issued',
    message: `You've earned a certificate for completing "${body.courseTitle}".`,
    href: `/member/certificates/${certificate.id}`,
    email: { subject: 'Your certificate is ready', html: certificateIssuedEmailHtml(memberName, body.courseTitle, certificateUrl) },
  })

  return NextResponse.json({ data: serializeCertificate(certificate), message: 'Certificate issued successfully', code: 'success', status: 201 }, { status: 201 })
})
