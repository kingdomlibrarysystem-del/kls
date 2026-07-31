import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

function serializeResource(r: {
  id: string
  title: string
  author: string
  publisher: string
  categoryId: string
  type: string
  format: string
  language: string
  year: number
  pages: number
  isbn: string
  price: number
  totalQty: number
  availableQty: number
  status: string
  coverImages: string[]
  bindingType: string
  mediaType: string
  description: string
  tags: string[]
  documentUrl: string | null
  audioUrl: string | null
  videoUrl: string | null
}) {
  return {
    id: r.id,
    title: r.title,
    author: r.author,
    publisher: r.publisher,
    categoryId: r.categoryId,
    type: r.type,
    format: r.format,
    language: r.language,
    year: r.year,
    pages: r.pages,
    isbn: r.isbn,
    price: r.price,
    totalQty: r.totalQty,
    availableQty: r.availableQty,
    status: r.status.toLowerCase(),
    coverImages: r.coverImages,
    bindingType: r.bindingType,
    mediaType: r.mediaType,
    description: r.description,
    tags: r.tags,
    documentUrl: r.documentUrl ?? undefined,
    audioUrl: r.audioUrl ?? undefined,
    videoUrl: r.videoUrl ?? undefined,
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const resource = await prisma.resource.findUnique({ where: { id } })
  if (!resource) {
    return NextResponse.json({ data: null, message: 'Resource not found', code: 'error', status: 404 }, { status: 404 })
  }

  return NextResponse.json({ data: serializeResource(resource), message: 'Resource fetched successfully', code: 'success', status: 200 })
}

/**
 * Full update (mirrors the mock's `updateResource`, which accepts any
 * partial patch — including a status-only patch, which is exactly what
 * the mock's `archiveResource` helper does under the hood). No separate
 * archive endpoint: the frontend's archive action just PATCHes
 * `{ status: 'archived' }`, same as it called `updateResource` before.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  try {
    const body = await request.json()
    const existing = await prisma.resource.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Resource not found', code: 'error', status: 404 }, { status: 404 })
    }

    if (body.categoryId && body.categoryId !== existing.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: body.categoryId } })
      if (!category) {
        return NextResponse.json({ data: null, message: 'The specified category does not exist', code: 'error', status: 400 }, { status: 400 })
      }
    }

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.author !== undefined && { author: body.author }),
        ...(body.publisher !== undefined && { publisher: body.publisher }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.format !== undefined && { format: body.format }),
        ...(body.language !== undefined && { language: body.language }),
        ...(body.year !== undefined && { year: body.year }),
        ...(body.pages !== undefined && { pages: body.pages }),
        ...(body.isbn !== undefined && { isbn: body.isbn }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.totalQty !== undefined && { totalQty: body.totalQty }),
        ...(body.availableQty !== undefined && { availableQty: body.availableQty }),
        ...(body.status !== undefined && { status: body.status.toUpperCase() }),
        ...(body.coverImages !== undefined && { coverImages: body.coverImages }),
        ...(body.bindingType !== undefined && { bindingType: body.bindingType }),
        ...(body.mediaType !== undefined && { mediaType: body.mediaType }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.documentUrl !== undefined && { documentUrl: body.documentUrl }),
        ...(body.audioUrl !== undefined && { audioUrl: body.audioUrl }),
        ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl }),
      },
    })

    return NextResponse.json({ data: serializeResource(resource), message: 'Resource updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update resource', code: 'error', status: 500 }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const existing = await prisma.resource.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ data: null, message: 'Resource not found', code: 'error', status: 404 }, { status: 404 })
  }

  await prisma.resource.delete({ where: { id } })

  return NextResponse.json({ data: null, message: 'Resource deleted successfully', code: 'success', status: 200 })
}
