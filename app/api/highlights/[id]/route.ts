import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'

function serializeHighlight(h: {
  id: string
  resourceId: string
  chapterId: string
  startOffset: number
  endOffset: number
  text: string
  color: string
  createdAt: Date
}) {
  return {
    id: h.id,
    resourceId: h.resourceId,
    chapterId: h.chapterId,
    startOffset: h.startOffset,
    endOffset: h.endOffset,
    text: h.text,
    color: h.color.toLowerCase(),
    createdAt: h.createdAt.toISOString().split('T')[0],
  }
}

/** `color` is the only field the reader UI ever updates on an existing highlight. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    if (!body.color || !['gold', 'green', 'teal', 'pink'].includes(body.color)) {
      return NextResponse.json({ data: null, message: 'A valid color is required', code: 'error', status: 400 }, { status: 400 })
    }
    const existing = await prisma.highlight.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Highlight not found', code: 'error', status: 404 }, { status: 404 })
    }
    const auth = await requireOwnerOrStaff(existing.userId)
    if (auth.response) return auth.response
    const updated = await prisma.highlight.update({ where: { id }, data: { color: body.color.toUpperCase() } })
    return NextResponse.json({ data: serializeHighlight(updated), message: 'Highlight updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update highlight', code: 'error', status: 500 }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await prisma.highlight.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ data: null, message: 'Highlight not found', code: 'error', status: 404 }, { status: 404 })
  }
  const auth = await requireOwnerOrStaff(existing.userId)
  if (auth.response) return auth.response
  await prisma.highlight.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Highlight deleted successfully', code: 'success', status: 200 })
}
