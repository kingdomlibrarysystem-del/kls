import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const invitation = await prisma.invitation.findUnique({
    where: { id },
    include: { role: { select: { id: true, name: true } } },
  })

  if (!invitation) {
    return NextResponse.json({ data: null, message: 'Invitation not found', code: 'error', status: 404 }, { status: 404 })
  }

  return NextResponse.json({ data: invitation, message: 'Invitation fetched successfully', code: 'success', status: 200 })
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  try {
    const body = await request.json()
    const existing = await prisma.invitation.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Invitation not found', code: 'error', status: 404 }, { status: 404 })
    }

    const invitation = await prisma.invitation.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.roleId !== undefined && { roleId: body.roleId }),
      },
      include: { role: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ data: invitation, message: 'Invitation updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update invitation', code: 'error', status: 500 }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const existing = await prisma.invitation.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ data: null, message: 'Invitation not found', code: 'error', status: 404 }, { status: 404 })
  }

  await prisma.invitation.delete({ where: { id } })

  return NextResponse.json({ data: null, message: 'Invitation cancelled successfully', code: 'success', status: 200 })
}
