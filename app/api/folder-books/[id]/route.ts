import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import prisma from '@/prisma/client'
import { authOptions } from '@/lib/auth-options'
import { roleNameToUserRole } from '@/lib/roles'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { documentTypeFromName, serializeBook } from '@/lib/data/book-folders'
import { isObjectId } from '@/lib/server/object-id'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function canManage(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return false
  return roleNameToUserRole(session.user.roleName ?? '') !== 'member'
}

export const GET = withErrorHandling('/api/folder-books/[id]', 'GET', async (_request: NextRequest, { params }: RouteParams) => {
  const { id } = await params
  if (!isObjectId(id)) throw new ApiError('Book not found', 404)

  const book = await prisma.folderBook.findUnique({
    where: { id },
    include: { folder: { select: { name: true, status: true } } },
  })
  if (!book) throw new ApiError('Book not found', 404)
  const manager = await canManage()
  if (!manager && (book.status === 'ARCHIVED' || book.folder?.status === 'ARCHIVED')) {
    throw new ApiError('Book not found', 404)
  }

  return NextResponse.json({ data: serializeBook(book), message: 'Book fetched successfully', code: 'success', status: 200 })
})

const updateBookSchema = z.object({
  folderId: z.string().min(1).optional(),
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long').optional(),
  description: z.string().trim().min(1, 'Description is required').max(4000, 'Description is too long').optional(),
  author: z.string().trim().min(1, 'Author is required').max(160, 'Author is too long').optional(),
  documentUrl: z.string().url('A valid document URL is required').optional(),
  documentName: z.string().trim().min(1).optional(),
  documentType: z.string().trim().optional(),
  documentSize: z.number().int().nonnegative().nullable().optional(),
  status: z.enum(['active', 'archived']).optional(),
})

export const PATCH = withErrorHandling('/api/folder-books/[id]', 'PATCH', async (request: NextRequest, { params }: RouteParams) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  if (!isObjectId(id)) throw new ApiError('Book not found', 404)

  const parsed = updateBookSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const existing = await prisma.folderBook.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Book not found', 404)

  if (body.folderId) {
    if (!isObjectId(body.folderId)) throw new ApiError('The selected folder does not exist', 400)
    const folder = await prisma.bookFolder.findUnique({ where: { id: body.folderId } })
    if (!folder || folder.status === 'ARCHIVED') throw new ApiError('The selected folder does not exist or is archived', 400)
  }

  let documentType: string | undefined
  if (body.documentType !== undefined || body.documentName !== undefined) {
    const name = body.documentName ?? existing.documentName
    documentType = (body.documentType || documentTypeFromName(name) || existing.documentType || 'FILE').toUpperCase()
  }

  const book = await prisma.folderBook.update({
    where: { id },
    data: {
      ...(body.folderId !== undefined && { folderId: body.folderId }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.author !== undefined && { author: body.author }),
      ...(body.documentUrl !== undefined && { documentUrl: body.documentUrl }),
      ...(body.documentName !== undefined && { documentName: body.documentName }),
      ...(documentType !== undefined && { documentType }),
      ...(body.documentSize !== undefined && { documentSize: body.documentSize }),
      ...(body.status !== undefined && { status: body.status === 'archived' ? 'ARCHIVED' : 'ACTIVE' }),
    },
    include: { folder: { select: { name: true } } },
  })

  return NextResponse.json({
    data: serializeBook(book),
    message: body.status === 'archived' ? 'Book archived successfully' : 'Book updated successfully',
    code: 'success',
    status: 200,
  })
})

export const DELETE = withErrorHandling('/api/folder-books/[id]', 'DELETE', async (_request: NextRequest, { params }: RouteParams) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  if (!isObjectId(id)) throw new ApiError('Book not found', 404)

  const existing = await prisma.folderBook.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Book not found', 404)

  await prisma.folderBook.delete({ where: { id } })

  return NextResponse.json({ data: null, message: 'Book deleted successfully', code: 'success', status: 200 })
})
