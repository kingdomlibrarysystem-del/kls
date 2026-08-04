import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

function serializeProject(p: {
  id: string
  title: string
  description: string
  status: string
  startDate: Date
  members: { user: { id: string; name: string | null; firstName: string | null; lastName: string | null } }[]
  _count?: { papers: number }
}) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status,
    startDate: p.startDate.toISOString().split('T')[0],
    contributors: p.members.map((m) => ({
      id: m.user.id,
      name: m.user.name ?? `${m.user.firstName ?? ''} ${m.user.lastName ?? ''}`.trim(),
    })),
    paperCount: p._count?.papers ?? 0,
  }
}

const INCLUDE = {
  members: { include: { user: { select: { id: true, name: true, firstName: true, lastName: true } } } },
  _count: { select: { papers: true } },
} as const

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await prisma.researchProject.findUnique({ where: { id }, include: INCLUDE })
  if (!project) {
    return NextResponse.json({ data: null, message: 'Research project not found', code: 'error', status: 404 }, { status: 404 })
  }
  return NextResponse.json({ data: serializeProject(project), message: 'Research project fetched successfully', code: 'success', status: 200 })
}

/** Full contributor-list replace via `contributorIds` (if provided) — simpler and safer than a separate add/remove-member API for this data's scale. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.researchProject.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Research project not found', code: 'error', status: 404 }, { status: 404 })
    }

    if (Array.isArray(body.contributorIds)) {
      const found = await prisma.user.findMany({ where: { id: { in: body.contributorIds } } })
      if (found.length !== body.contributorIds.length) {
        return NextResponse.json({ data: null, message: 'One or more specified contributors do not exist', code: 'error', status: 400 }, { status: 400 })
      }
      await prisma.projectMember.deleteMany({ where: { projectId: id } })
      await prisma.projectMember.createMany({ data: body.contributorIds.map((userId: string) => ({ projectId: id, userId })) })
    }

    const data: Record<string, unknown> = { ...body }
    delete data.contributorIds
    delete data.id
    if (typeof data.status === 'string') data.status = data.status.toUpperCase()
    if (typeof data.startDate === 'string') data.startDate = new Date(data.startDate)

    const updated = await prisma.researchProject.update({ where: { id }, data, include: INCLUDE })
    return NextResponse.json({ data: serializeProject(updated), message: 'Research project updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update research project', code: 'error', status: 500 }, { status: 500 })
  }
}

/** Guarded: blocks deleting a project that still has papers, mirroring the "don't silently orphan real content" guard used for Course/Category deletes. */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await prisma.researchProject.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ data: null, message: 'Research project not found', code: 'error', status: 404 }, { status: 404 })
  }
  const paperCount = await prisma.researchPaper.count({ where: { projectId: id } })
  if (paperCount > 0) {
    return NextResponse.json({ data: null, message: 'Cannot delete a project that still has papers', code: 'error', status: 409 }, { status: 409 })
  }
  await prisma.projectMember.deleteMany({ where: { projectId: id } })
  await prisma.researchProject.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Research project deleted successfully', code: 'success', status: 200 })
}
