import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { getMediaTypes, serializeMediaType } from '@/lib/data/media-types'
import { mediaTypeCodeFromName } from '@/lib/media-types-shared'

/**
 * GET /api/media-types — public.
 * The admin-managed list of resource media types (names + what each type
 * contains). Public because the public library shows the names too.
 */
export const GET = withErrorHandling('/api/media-types', 'GET', async () => {
  const data = await getMediaTypes()
  return NextResponse.json({ data, message: 'Media types fetched successfully', code: 'success', status: 200 })
})

const createSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name is too long'),
  description: z.string().trim().max(300).optional(),
  allowsChapters: z.boolean().default(false),
  allowsDocument: z.boolean().default(false),
  allowsAudio: z.boolean().default(false),
  allowsVideo: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(9999).optional(),
})

/**
 * POST /api/media-types — staff.
 * Adds a media type. The stored `code` is generated from the name
 * ("Sermon notes" -> SERMON_NOTES) and must be unique.
 */
export const POST = withErrorHandling('/api/media-types', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const code = mediaTypeCodeFromName(body.name)
  if (!code) throw new ApiError('Name must contain letters or numbers', 400)

  // Make sure the system types exist before checking for clashes (first-ever call).
  const existing = await getMediaTypes()
  if (existing.some((t) => t.code === code)) throw new ApiError(`A media type with the code ${code} already exists`, 409)
  if (existing.some((t) => t.name.toLowerCase() === body.name.toLowerCase())) throw new ApiError('A media type with this name already exists', 409)

  const created = await prisma.resourceMediaType.create({
    data: {
      code,
      name: body.name,
      description: body.description || null,
      allowsChapters: body.allowsChapters,
      allowsDocument: body.allowsDocument,
      allowsAudio: body.allowsAudio,
      allowsVideo: body.allowsVideo,
      sortOrder: body.sortOrder ?? existing.reduce((max, t) => Math.max(max, t.sortOrder), 0) + 1,
    },
  })
  return NextResponse.json({ data: serializeMediaType(created), message: 'Media type created successfully', code: 'success', status: 201 }, { status: 201 })
})
