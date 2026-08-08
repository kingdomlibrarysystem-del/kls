import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

const ROLE_INCLUDE = { role: { select: { name: true } } } as const

function serializeUser(u: {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
  email: string
  status: string
  role: { name: string } | null
  emailVerified: Date | null
  createdAt: Date
}) {
  return {
    id: u.id,
    name: u.name ?? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
    firstName: u.firstName ?? '',
    lastName: u.lastName ?? '',
    email: u.email,
    role: u.role?.name ?? 'Member',
    status: u.status.toLowerCase(),
    emailVerified: !!u.emailVerified,
    createdAt: u.createdAt.toISOString().split('T')[0],
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await prisma.user.findUnique({ where: { id }, include: ROLE_INCLUDE })
  if (!user) {
    return NextResponse.json({ data: null, message: 'User not found', code: 'error', status: 404 }, { status: 404 })
  }
  return NextResponse.json({ data: serializeUser(user), message: 'User fetched successfully', code: 'success', status: 200 })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'User not found', code: 'error', status: 404 }, { status: 404 })
    }

    if (body.email && body.email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email: body.email } })
      if (emailTaken) {
        return NextResponse.json({ data: null, message: 'A user with this email already exists', code: 'error', status: 409 }, { status: 409 })
      }
    }

    let roleId: string | undefined
    if (body.role) {
      const role = await prisma.role.upsert({
        where: { name: body.role },
        update: {},
        create: { name: body.role, permissions: [] },
      })
      roleId = role.id
    }

    const [firstName, ...rest] = body.name ? String(body.name).trim().split(/\s+/) : [undefined]

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name, firstName, lastName: rest.join(' ') }),
        ...(body.email && { email: body.email }),
        ...(body.status && { status: body.status.toUpperCase() }),
        ...(roleId && { roleId }),
      },
      include: ROLE_INCLUDE,
    })

    return NextResponse.json({ data: serializeUser(user), message: 'User updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update user', code: 'error', status: 500 }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'User not found', code: 'error', status: 404 }, { status: 404 })
    }
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ data: null, message: 'User deleted successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to delete user', code: 'error', status: 500 }, { status: 500 })
  }
}
