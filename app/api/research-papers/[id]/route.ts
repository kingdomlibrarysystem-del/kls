import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { serializePaper, INCLUDE } from '@/lib/data/research-papers'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const paper = await prisma.researchPaper.findUnique({ where: { id }, include: INCLUDE })
  if (!paper) {
    return NextResponse.json({ data: null, message: 'Research paper not found', code: 'error', status: 404 }, { status: 404 })
  }
  return NextResponse.json({ data: serializePaper(paper), message: 'Research paper fetched successfully', code: 'success', status: 200 })
}

const updatePaperSchema = z.object({
  title: z.string().trim().min(1).optional(),
  abstract: z.string().trim().min(1).optional(),
  keywords: z.array(z.string()).optional(),
  status: z.string().optional(),
})

export const PATCH = withErrorHandling('/api/research-papers/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const parsed = updatePaperSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const existing = await prisma.researchPaper.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Research paper not found', 404)

  const data: Record<string, unknown> = { ...body }
  if (typeof data.status === 'string') data.status = data.status.toUpperCase()

  const updated = await prisma.researchPaper.update({ where: { id }, data, include: INCLUDE })
  return NextResponse.json({ data: serializePaper(updated), message: 'Research paper updated successfully', code: 'success', status: 200 })
})

export const DELETE = withErrorHandling('/api/research-papers/[id]', 'DELETE', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const existing = await prisma.researchPaper.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Research paper not found', 404)

  await prisma.researchPaper.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Research paper deleted successfully', code: 'success', status: 200 })
})
