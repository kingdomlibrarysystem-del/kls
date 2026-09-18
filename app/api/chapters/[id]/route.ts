import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { serializeChapter } from '../route'

const patchChapterSchema = z.object({
  title: z.string().trim().min(1, 'title is required').optional(),
  body: z.string().optional(),
})

export const PATCH = withErrorHandling('/api/chapters/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const parsed = patchChapterSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)

  const existing = await prisma.chapter.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Chapter not found', 404)

  const updated = await prisma.chapter.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.body !== undefined && { body: parsed.data.body }),
    },
  })

  return NextResponse.json({ data: serializeChapter(updated, false), message: 'Chapter updated successfully', code: 'success', status: 200 })
})

/**
 * Deletes one chapter - staff-only. Used by the Book Inventory form's
 * chapter editor when saving: chapters the admin removed from the typed
 * book are deleted so the member reading view matches exactly what was
 * authored (the editor reconciles: patch in place / create extras /
 * delete removed).
 */
export const DELETE = withErrorHandling('/api/chapters/[id]', 'DELETE', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const existing = await prisma.chapter.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Chapter not found', 404)

  await prisma.chapter.delete({ where: { id } })

  return NextResponse.json({ data: null, message: 'Chapter deleted successfully', code: 'success', status: 200 })
})
