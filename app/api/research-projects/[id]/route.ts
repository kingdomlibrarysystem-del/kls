import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { serializeProject, INCLUDE } from '@/lib/data/research-projects'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const project = await prisma.researchProject.findUnique({ where: { id }, include: INCLUDE })
  if (!project) {
    return NextResponse.json({ data: null, message: 'Research project not found', code: 'error', status: 404 }, { status: 404 })
  }
  return NextResponse.json({ data: serializeProject(project), message: 'Research project fetched successfully', code: 'success', status: 200 })
}

const updateProjectSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  contributorIds: z.array(z.string()).optional(),
})

/** Full contributor-list replace via `contributorIds` (if provided) — simpler and safer than a separate add/remove-member API for this data's scale. */
export const PATCH = withErrorHandling('/api/research-projects/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const parsed = updateProjectSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const existing = await prisma.researchProject.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Research project not found', 404)

  if (body.contributorIds) {
    const found = await prisma.user.findMany({ where: { id: { in: body.contributorIds } } })
    if (found.length !== body.contributorIds.length) throw new ApiError('One or more specified contributors do not exist', 400)
    await prisma.projectMember.deleteMany({ where: { projectId: id } })
    await prisma.projectMember.createMany({ data: body.contributorIds.map((userId) => ({ projectId: id, userId })) })
  }

  const data: Record<string, unknown> = {}
  if (body.title !== undefined) data.title = body.title
  if (body.description !== undefined) data.description = body.description
  if (body.status !== undefined) data.status = body.status.toUpperCase()
  if (body.startDate !== undefined) data.startDate = new Date(body.startDate)

  const updated = await prisma.researchProject.update({ where: { id }, data, include: INCLUDE })
  return NextResponse.json({ data: serializeProject(updated), message: 'Research project updated successfully', code: 'success', status: 200 })
})

/** Guarded: blocks deleting a project that still has papers, mirroring the "don't silently orphan real content" guard used for Course/Category deletes. */
export const DELETE = withErrorHandling('/api/research-projects/[id]', 'DELETE', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const existing = await prisma.researchProject.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Research project not found', 404)

  const paperCount = await prisma.researchPaper.count({ where: { projectId: id } })
  if (paperCount > 0) throw new ApiError('Cannot delete a project that still has papers', 409)

  await prisma.projectMember.deleteMany({ where: { projectId: id } })
  await prisma.researchProject.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Research project deleted successfully', code: 'success', status: 200 })
})
