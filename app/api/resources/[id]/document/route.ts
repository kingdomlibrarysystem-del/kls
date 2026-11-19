import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { roleNameToUserRole } from '@/lib/roles'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { isEntitled } from '@/app/api/chapters/route'
import { streamRemoteFile } from '@/lib/server/stream-document'

/**
 * Built free previews, kept in memory (a few books) so a preview is not rebuilt
 * with pdf-lib on every visit. Keyed by the file URL and the number of pages.
 */
const previewCache = new Map<string, Uint8Array>()
const PREVIEW_CACHE_MAX = 20

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Serves a resource's PDF, gated the same way /api/chapters gates
 * chapter text: a free resource (price === 0) or staff/entitled member
 * gets the real file, proxied through so the client never sees the raw
 * Cloudinary documentUrl directly. A non-entitled member instead gets a
 * real truncated PDF (only the first freePreviewChapterCount pages,
 * built server-side with pdf-lib) — the full file's bytes never reach
 * their browser, unlike a client-side page cap on the same file.
 */
export const GET = withErrorHandling('/api/resources/[id]/document', 'GET', async (request: NextRequest, { params }: RouteParams) => {
  const { id } = await params
  const forcePreview = new URL(request.url).searchParams.get('preview') === '1'
  const resource = await prisma.resource.findUnique({
    where: { id },
    select: { id: true, title: true, price: true, freePreviewChapterCount: true, documentUrl: true, status: true },
  })
  if (!resource) throw new ApiError('Resource not found', 404)
  if (!resource.documentUrl) throw new ApiError('This resource has no uploaded document', 404)

  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  const role = roleNameToUserRole(session?.user?.roleName ?? '')
  const isStaff = !forcePreview && (role === 'admin' || role === 'manager' || role === 'staff')
  // Drafts are readable only for the staff approval preview.
  if (resource.status === 'DRAFT' && role === 'member') throw new ApiError('Resource not found', 404)
  const memberEntitled = !forcePreview && userId ? await isEntitled(userId, resource.id) : false
  const entitled = resource.price <= 0 || isStaff || memberEntitled

  if (entitled) {
    // Streamed with Range support: the reader shows page 1 without waiting for the whole book.
    const streamed = await streamRemoteFile(resource.documentUrl, request, { contentType: 'application/pdf' })
    if (!streamed) throw new ApiError('Could not load this document', 502)
    return streamed
  }

  const previewPages = Math.max(0, resource.freePreviewChapterCount)
  const cacheKey = `${resource.documentUrl}#${previewPages}`
  const cached = previewCache.get(cacheKey)
  if (cached) {
    return new NextResponse(Buffer.from(cached), { headers: { 'Content-Type': 'application/pdf', 'Cache-Control': 'private, max-age=300' } })
  }

  const sourceRes = await fetch(resource.documentUrl)
  if (!sourceRes.ok) throw new ApiError('Could not load this document', 502)
  const sourceBytes = await sourceRes.arrayBuffer()
  const source = await PDFDocument.load(sourceBytes)
  const preview = await PDFDocument.create()
  const pageIndices = Array.from({ length: Math.min(previewPages, source.getPageCount()) }, (_, i) => i)
  const copied = await preview.copyPages(source, pageIndices)
  copied.forEach((page) => preview.addPage(page))
  const previewBytes = await preview.save()
  if (previewCache.size >= PREVIEW_CACHE_MAX) previewCache.delete(previewCache.keys().next().value as string)
  previewCache.set(cacheKey, previewBytes)

  return new NextResponse(Buffer.from(previewBytes), { headers: { 'Content-Type': 'application/pdf', 'Cache-Control': 'private, max-age=300' } })
})
