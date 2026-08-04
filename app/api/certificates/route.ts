import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

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

/** Guarded: only one certificate per user per course (deduplicates issuance, matching the mock's own stated intent for the optional courseId field). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.userId || !body.courseTitle) {
      return NextResponse.json({ data: null, message: 'Missing required fields: userId, courseTitle', code: 'error', status: 400 }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { id: body.userId } })
    if (!user) {
      return NextResponse.json({ data: null, message: 'The specified user does not exist', code: 'error', status: 400 }, { status: 400 })
    }
    if (body.courseId) {
      const already = await prisma.certificate.findFirst({ where: { userId: body.userId, courseId: body.courseId } })
      if (already) {
        return NextResponse.json({ data: null, message: 'A certificate for this user and course already exists', code: 'error', status: 409 }, { status: 409 })
      }
    }
    const certificate = await prisma.certificate.create({
      data: {
        userId: body.userId,
        memberName: user.name ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
        courseId: body.courseId ?? null,
        courseTitle: body.courseTitle,
        verificationCode: generateVerificationCode(),
      },
    })
    return NextResponse.json({ data: serializeCertificate(certificate), message: 'Certificate issued successfully', code: 'success', status: 201 }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to issue certificate', code: 'error', status: 500 }, { status: 500 })
  }
}
