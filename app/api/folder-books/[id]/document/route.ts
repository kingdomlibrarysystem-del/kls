import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/prisma/client'
import { authOptions } from '@/lib/auth-options'
import { roleNameToUserRole } from '@/lib/roles'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { isObjectId } from '@/lib/server/object-id'

interface RouteParams {
  params: Promise<{ id: string }>
}

const CONTENT_TYPES: Record<string, string> = {
  PDF: 'application/pdf',
  PPT: 'application/vnd.ms-powerpoint',
  PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

/**
 * Streams a folder book's uploaded document. Active books in active folders are
 * public (so guests can read them like the Library); archived books remain
 * visible only to staff. Proxying through the app (instead of handing out the
 * raw Cloudinary URL) also avoids cross-origin fetch failures in the PDF
 * reader. `?download=1` forces a file download instead of inline display.
 */
export const GET = withErrorHandling('/api/folder-books/[id]/document', 'GET', async (request: NextRequest, { params }: RouteParams) => {
  const { id } = await params
  if (!isObjectId(id)) throw new ApiError('Book not found', 404)

  const book = await prisma.folderBook.findUnique({
    where: { id },
    include: { folder: { select: { status: true } } },
  })
  if (!book) throw new ApiError('Book not found', 404)

  const session = await getServerSession(authOptions)
  const role = session?.user?.id ? roleNameToUserRole(session.user.roleName ?? '') : null
  const isStaff = role !== null && role !== 'member'
  if (!isStaff && (book.status === 'ARCHIVED' || book.folder?.status === 'ARCHIVED')) {
    throw new ApiError('Book not found', 404)
  }

  const download = new URL(request.url).searchParams.get('download') === '1'
  const source = await fetch(book.documentUrl)
  if (!source.ok) throw new ApiError('Could not load this document', 502)

  const bytes = await source.arrayBuffer()
  const contentType = CONTENT_TYPES[book.documentType.toUpperCase()] ?? source.headers.get('content-type') ?? 'application/octet-stream'
  const safeName = book.documentName.replace(/[^\w.\- ]+/g, '_').trim() || `book.${book.documentType.toLowerCase()}`

  return new NextResponse(bytes, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(bytes.byteLength),
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${safeName}"`,
      'Cache-Control': 'private, max-age=0, must-revalidate',
    },
  })
})
