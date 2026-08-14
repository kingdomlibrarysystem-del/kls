import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

function serializeNote(n: {
  id: string
  resourceId: string
  chapterId: string
  highlightId: string | null
  text: string
  createdAt: Date
}) {
  return {
    id: n.id,
    resourceId: n.resourceId,
    chapterId: n.chapterId,
    highlightId: n.highlightId ?? undefined,
    text: n.text,
    createdAt: n.createdAt.toISOString().split('T')[0],
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    if (typeof body.text !== 'string' || !body.text.trim()) {
      return NextResponse.json({ data: null, message: 'text is required', code: 'error', status: 400 }, { status: 400 })
    }
    const existing = await prisma.note.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Note not found', code: 'error', status: 404 }, { status: 404 })
    }
    const updated = await prisma.note.update({ where: { id }, data: { text: body.text.trim() } })
    return NextResponse.json({ data: serializeNote(updated), message: 'Note updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update note', code: 'error', status: 500 }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await prisma.note.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ data: null, message: 'Note not found', code: 'error', status: 404 }, { status: 404 })
  }
  await prisma.note.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Note deleted successfully', code: 'success', status: 200 })
}
