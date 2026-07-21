import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')
  const search = searchParams.get('search')?.toLowerCase()
  const status = searchParams.get('status')

  const where = {
    ...(search && { email: { contains: search, mode: 'insensitive' as const } }),
    ...(status && status !== 'all' && { status: status.toUpperCase() as 'PENDING' | 'ACCEPTED' | 'EXPIRED' }),
  }

  const [totalItems, invitations] = await Promise.all([
    prisma.invitation.count({ where }),
    prisma.invitation.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { role: { select: { id: true, name: true } } },
    }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: invitations,
    message: 'Invitations fetched successfully',
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.email || !body.roleId) {
      return NextResponse.json({ data: null, message: 'Missing required fields: email, roleId', code: 'error', status: 400 }, { status: 400 })
    }

    const role = await prisma.role.findUnique({ where: { id: body.roleId } })
    if (!role) {
      return NextResponse.json({ data: null, message: 'The specified role does not exist', code: 'error', status: 400 }, { status: 400 })
    }

    const invitation = await prisma.invitation.create({
      data: {
        email: body.email,
        roleId: body.roleId,
        invitedByUserId: body.invitedByUserId ?? null,
      },
      include: { role: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ data: invitation, message: 'Invitation sent successfully', code: 'success', status: 201 }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to create invitation', code: 'error', status: 500 }, { status: 500 })
  }
}
