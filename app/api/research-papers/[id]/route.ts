import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

function serializePaper(p: {
  id: string
  title: string
  abstract: string
  authorId: string
  authorName: string
  projectId: string
  project: { title: string }
  keywords: string[]
  publishedAt: Date
  status: string
}) {
  return {
    id: p.id,
    title: p.title,
    abstract: p.abstract,
    authorId: p.authorId,
    author: p.authorName,
    projectId: p.projectId,
    project: p.project.title,
    keywords: p.keywords,
    publishedAt: p.publishedAt.toISOString().split('T')[0],
    status: p.status,
  }
}

const INCLUDE = { project: { select: { title: true } } } as const

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const paper = await prisma.researchPaper.findUnique({ where: { id }, include: INCLUDE })
  if (!paper) {
    return NextResponse.json({ data: null, message: 'Research paper not found', code: 'error', status: 404 }, { status: 404 })
  }
  return NextResponse.json({ data: serializePaper(paper), message: 'Research paper fetched successfully', code: 'success', status: 200 })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.researchPaper.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Research paper not found', code: 'error', status: 404 }, { status: 404 })
    }
    const data: Record<string, unknown> = { ...body }
    delete data.id
    delete data.authorId
    delete data.projectId
    if (typeof data.status === 'string') data.status = data.status.toUpperCase()
    const updated = await prisma.researchPaper.update({ where: { id }, data, include: INCLUDE })
    return NextResponse.json({ data: serializePaper(updated), message: 'Research paper updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update research paper', code: 'error', status: 500 }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await prisma.researchPaper.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ data: null, message: 'Research paper not found', code: 'error', status: 404 }, { status: 404 })
  }
  await prisma.researchPaper.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Research paper deleted successfully', code: 'success', status: 200 })
}
