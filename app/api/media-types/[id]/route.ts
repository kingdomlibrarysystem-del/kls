import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { isObjectId } from '@/lib/server/object-id'
import { serializeMediaType } from '@/lib/data/media-types'

const updateSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name is too long').optional(),
  description: z.string().trim().max(300).nullable().optional(),
  allowsChapters: z.boolean().optional(),
  allowsDocument: z.boolean().optional(),
  allowsAudio: z.boolean().optional(),
  allowsVideo: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
})

/**
 * PATCH /api/media-types/[id] — staff.
 * Rename / describe / reorder any type. The `allows*` flags can only be
 * changed on custom types: the built-in ones define how existing resources
 * are authored and read. The `code` never changes (resources store it).
 */
export const PATCH = withErrorHandling('/api/media-types/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  if (!isObjectId(id)) throw new ApiError('Media type not found', 404)
  const parsed = updateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const existing = await prisma.resourceMediaType.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Media type not found', 404)

  const changesFlags = (['allowsChapters', 'allowsDocument', 'allowsAudio', 'allowsVideo'] as const)
    .some((k) => body[k] !== undefined && body[k] !== existing[k])
  if (existing.isSystem && changesFlags) {
    throw new ApiError('Built-in media types can be renamed, but what they contain cannot be changed', 400)
  }

  if (body.name && body.name.toLowerCase() !== existing.name.toLowerCase()) {
    const clash = await prisma.resourceMediaType.findFirst({ where: { name: { equals: body.name, mode: 'insensitive' }, id: { not: id } }, select: { id: true } })
    if (clash) throw new ApiError('A media type with this name already exists', 409)
  }

  const updated = await prisma.resourceMediaType.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      ...(!existing.isSystem && {
        ...(body.allowsChapters !== undefined && { allowsChapters: body.allowsChapters }),
        ...(body.allowsDocument !== undefined && { allowsDocument: body.allowsDocument }),
        ...(body.allowsAudio !== undefined && { allowsAudio: body.allowsAudio }),
        ...(body.allowsVideo !== undefined && { allowsVideo: body.allowsVideo }),
      }),
    },
  })
  return NextResponse.json({ data: serializeMediaType(updated), message: 'Media type updated successfully', code: 'success', status: 200 })
})

/**
 * DELETE /api/media-types/[id] — staff.
 * Only custom types that no resource or publication uses can be deleted.
 */
export const DELETE = withErrorHandling('/api/media-types/[id]', 'DELETE', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  if (!isObjectId(id)) throw new ApiError('Media type not found', 404)
  const existing = await prisma.resourceMediaType.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Media type not found', 404)
  if (existing.isSystem) throw new ApiError('Built-in media types cannot be deleted', 409)

  const [resources, publications] = await Promise.all([
    prisma.resource.count({ where: { mediaType: existing.code } }),
    prisma.publication.count({ where: { mediaType: existing.code } }),
  ])
  if (resources + publications > 0) {
    throw new ApiError(`Cannot delete — ${resources + publications} resource(s)/publication(s) still use this media type`, 409)
  }

  await prisma.resourceMediaType.delete({ where: { id } })
  return NextResponse.json({ data: { id }, message: 'Media type deleted successfully', code: 'success', status: 200 })
})
