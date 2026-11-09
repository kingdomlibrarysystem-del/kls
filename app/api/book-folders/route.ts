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

/**
 * Life Sciences folders (categories). Public/member reads return ACTIVE
 * folders only; staff may ask for archived ones with ?includeArchived=1.
 */
async function canManage(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return false
  return roleNameToUserRole(session.user.roleName ?? '') !== 'member'
}

export const GET = withErrorHandling('/api/book-folders', 'GET', async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.trim()
  const statusParam = searchParams.get('status')
  const includeArchived = searchParams.get('includeArchived') === '1' && (await canManage())

  const status =
    includeArchived && (statusParam === 'active' || statusParam === 'archived')
      ? statusParam.toUpperCase()
      : includeArchived
        ? undefined
        : 'ACTIVE'

  const folders = await prisma.bookFolder.findMany({
    where: {
      ...(status && { status: status as 'ACTIVE' | 'ARCHIVED' }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { books: true } } },
  })

  return NextResponse.json({
    data: folders.map((folder) => serializeFolder(folder, folder._count.books)),
    message: 'Folders fetched successfully',
    code: 'success',
    status: 200,
  })
})

const createFolderSchema = z.object({
  name: z.string().trim().min(1, 'Folder name is required').max(120, 'Folder name is too long'),
  description: z.string().trim().max(2000, 'Description is too long').optional(),
  sortOrder: z.number().int().optional(),
})

export const POST = withErrorHandling('/api/book-folders', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const parsed = createFolderSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const folder = await prisma.bookFolder.create({
    data: {
      name: body.name,
      slug: await uniqueFolderSlug(body.name),
      description: body.description || null,
      sortOrder: body.sortOrder ?? 0,
      createdById: auth.session.userId,
    },
  })

  return NextResponse.json(
    { data: serializeFolder(folder, 0), message: 'Folder created successfully', code: 'success', status: 201 },
    { status: 201 },
  )
})
