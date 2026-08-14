import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

/**
 * Append-only audit trail — GET (list) and POST (append) only, no
 * PATCH/DELETE, matching RULES.md §10 and the mock's own doc comment: an
 * audit log entry is never edited or removed once written.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')
  const search = searchParams.get('search')?.toLowerCase()
  const action = searchParams.get('action')

  const where = {
    ...(action && action !== 'all' && { action }),
    ...(search && {
      OR: [
        { actor: { contains: search, mode: 'insensitive' as const } },
        { target: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [totalItems, entries] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: entries,
    message: 'Audit log entries fetched successfully',
    code: 'success',
    status: 200,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  })
}

const createAuditLogSchema = z.object({
  actor: z.string().trim().min(1, 'actor is required'),
  action: z.string().trim().min(1, 'action is required'),
  target: z.string().trim().min(1, 'target is required'),
  actorId: z.string().optional(),
  targetId: z.string().optional(),
  targetType: z.string().optional(),
  ipAddress: z.string().optional(),
  notes: z.string().optional(),
})

export const POST = withErrorHandling('/api/audit-log', 'POST', async (request: NextRequest) => {
  const parsed = createAuditLogSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const entry = await prisma.auditLog.create({
    data: {
      actor: body.actor,
      actorId: body.actorId ?? null,
      action: body.action,
      target: body.target,
      targetId: body.targetId ?? null,
      targetType: body.targetType ?? null,
      ipAddress: body.ipAddress ?? null,
      notes: body.notes ?? null,
    },
  })

  return NextResponse.json({ data: entry, message: 'Audit log entry recorded successfully', code: 'success', status: 201 }, { status: 201 })
})
