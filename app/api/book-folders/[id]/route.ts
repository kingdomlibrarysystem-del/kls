import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import prisma from '@/prisma/client'
import { authOptions } from '@/lib/auth-options'
import { roleNameToUserRole } from '@/lib/roles'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { serializeFolder } from '@/lib/data/book-folders'
import { uniqueFolderSlug } from '@/lib/server/book-folder-slug'
import { isObjectId } from '@/lib/server/object-id'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function canManage(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return false
  return roleNameToUserRole(session.user.roleName ?? '') !== 'member'
}

export const GET = withErrorHandling('/api/book-folders/[id]', 'GET', async (_request: NextRequest, { params }: RouteParams) => {
  const { id } = await params
  if (!isObjectId(id)) throw new ApiError('Folder not found', 404)

  const folder = await prisma.bookFolder.findUnique({
    where: { id },
    include: { _count: { select: { books: true } } },
  })
  if (!folder) throw new ApiError('Folder not found', 404)
  if (folder.status === 'ARCHIVED' && !(await canManage())) throw new ApiError('Folder not found', 404)

  return NextResponse.json({
    data: serializeFolder(folder, folder._count.books),
    message: 'Folder fetched successfully',
    code: 'success',
    status: 200,
  })
})

const updateFolderSchema = z.object({
  name: z.string().trim().min(1, 'Folder name is required').max(120, 'Folder name is too long').optional(),
  description: z.string().trim().max(2000, 'Description is too long').optional(),
  status: z.enum(['active', 'archived']).optional(),
  sortOrder: z.number().int().optional(),
})

export const PATCH = withErrorHandling('/api/book-folders/[id]', 'PATCH', async (request: NextRequest, { params }: RouteParams) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  if (!isObjectId(id)) throw new ApiError('Folder not found', 404)

  const parsed = updateFolderSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const existing = await prisma.bookFolder.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Folder not found', 404)

  const folder = await prisma.bookFolder.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.name !== undefined &&
        body.name !== existing.name && { slug: await uniqueFolderSlug(body.name, id) }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.status !== undefined && { status: body.status === 'archived' ? 'ARCHIVED' : 'ACTIVE' }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
    include: { _count: { select: { books: true } } },
  })

  return NextResponse.json({
    data: serializeFolder(folder, folder._count.books),
    message: body.status === 'archived' ? 'Folder archived successfully' : 'Folder updated successfully',
    code: 'success',
    status: 200,
  })
})

export const DELETE = withErrorHandling('/api/book-folders/[id]', 'DELETE', async (_request: NextRequest, { params }: RouteParams) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  if (!isObjectId(id)) throw new ApiError('Folder not found', 404)

  const existing = await prisma.bookFolder.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Folder not found', 404)

  const bookCount = await prisma.folderBook.count({ where: { folderId: id } })
  if (bookCount > 0) {
    throw new ApiError(
      `Cannot delete — ${bookCount} book${bookCount === 1 ? ' is' : 's are'} still in this folder. Move or archive them first.`,
      409,
    )
  }

  await prisma.bookFolder.delete({ where: { id } })

  return NextResponse.json({ data: null, message: 'Folder deleted successfully', code: 'success', status: 200 })
})
