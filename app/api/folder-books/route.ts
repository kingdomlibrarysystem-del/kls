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

async function canManage(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return false
  return roleNameToUserRole(session.user.roleName ?? '') !== 'member'
}

export const GET = withErrorHandling('/api/folder-books', 'GET', async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const folderId = searchParams.get('folderId')
  const search = searchParams.get('search')?.trim()
  const statusParam = searchParams.get('status')
  const manager = await canManage()
  const includeArchived = searchParams.get('includeArchived') === '1' && manager

  if (folderId && !isObjectId(folderId)) throw new ApiError('Folder not found', 404)

  const status =
    includeArchived && (statusParam === 'active' || statusParam === 'archived')
      ? statusParam.toUpperCase()
      : includeArchived
        ? undefined
        : 'ACTIVE'

  const books = await prisma.folderBook.findMany({
    where: {
      ...(folderId && { folderId }),
      // A book inside an archived folder is not member-visible, even if the book itself is active.
      ...(!manager && { folder: { status: 'ACTIVE' as const } }),
      ...(status && { status: status as 'ACTIVE' | 'ARCHIVED' }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    orderBy: { createdAt: 'desc' },
    include: { folder: { select: { name: true } } },
  })

  return NextResponse.json({
    data: books.map(serializeBook),
    message: 'Books fetched successfully',
    code: 'success',
    status: 200,
  })
})

const createBookSchema = z.object({
  folderId: z.string().min(1, 'Select a folder'),
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().trim().min(1, 'Description is required').max(4000, 'Description is too long'),
  author: z.string().trim().min(1, 'Author is required').max(160, 'Author is too long'),
  documentUrl: z.string().url('A valid document URL is required'),
  documentName: z.string().trim().min(1, 'The uploaded document is required'),
  documentType: z.string().trim().optional(),
  documentSize: z.number().int().nonnegative().optional(),
})

export const POST = withErrorHandling('/api/folder-books', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const parsed = createBookSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  if (!isObjectId(body.folderId)) throw new ApiError('The selected folder does not exist', 400)
  const folder = await prisma.bookFolder.findUnique({ where: { id: body.folderId } })
  if (!folder || folder.status === 'ARCHIVED') throw new ApiError('The selected folder does not exist or is archived', 400)

  const documentType = (body.documentType || documentTypeFromName(body.documentName) || 'FILE').toUpperCase()

  const book = await prisma.folderBook.create({
    data: {
      folderId: body.folderId,
      title: body.title,
      description: body.description,
      author: body.author,
      documentUrl: body.documentUrl,
      documentName: body.documentName,
      documentType,
      documentSize: body.documentSize ?? null,
      createdById: auth.session.userId,
    },
    include: { folder: { select: { name: true } } },
  })

  return NextResponse.json(
    { data: serializeBook(book), message: 'Book added successfully', code: 'success', status: 201 },
    { status: 201 },
  )
})
