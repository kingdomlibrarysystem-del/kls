import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

/**
 * Real Chapter API — chapter body content for a readable Resource,
 * replacing app/member/_shared/readable-content-data.ts's Record keyed
 * by legacy mock resource ids that no longer match any real Resource
 * ObjectId post-migration.
 */
function serializeChapter(c: { id: string; title: string; body: string; order: number }) {
  return { id: c.id, title: c.title, body: c.body }
}

/**
 * With `resourceId`, returns that one resource's chapters. Without it,
 * returns every resource's chapters grouped by resourceId — the shape
 * app/member/_shared/use-readable-content.ts's store needs to preload
 * the whole readable-content catalog in one request, matching the old
 * mock's eagerly-loaded Record<string, ReadableContent> contract that
 * ~6 call sites (ScrollCard, BookCard, ResourceDetailModal, etc.) already
 * depend on.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const resourceId = searchParams.get('resourceId')

  if (resourceId) {
    const chapters = await prisma.chapter.findMany({ where: { resourceId }, orderBy: { order: 'asc' } })
    return NextResponse.json({
      data: { resourceId, chapters: chapters.map(serializeChapter) },
      message: 'Chapters fetched successfully',
      code: 'success',
      status: 200,
    })
  }

  const allChapters = await prisma.chapter.findMany({ orderBy: { order: 'asc' } })
  const byResource: Record<string, { resourceId: string; chapters: ReturnType<typeof serializeChapter>[] }> = {}
  for (const chapter of allChapters) {
    byResource[chapter.resourceId] ??= { resourceId: chapter.resourceId, chapters: [] }
    byResource[chapter.resourceId].chapters.push(serializeChapter(chapter))
  }

  return NextResponse.json({
    data: byResource,
    message: 'Chapters fetched successfully',
    code: 'success',
    status: 200,
  })
}
