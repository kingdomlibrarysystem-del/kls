import { NextResponse } from 'next/server'
import prisma from '@/prisma/client'

/** Thin wrapper for the in-page hint's literal GET /api/news/editions — published editions only. */
function serializeArticle(a: { id: string; title: string; summary: string; coverImage: string | null; category: string; publishedAt: Date | null }) {
  return { id: a.id, title: a.title, summary: a.summary, coverImage: a.coverImage, category: a.category, publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null }
}

export async function GET() {
  const editions = await prisma.newsArticle.findMany({
    where: { status: 'PUBLISHED', isEdition: true },
    orderBy: { publishedAt: 'desc' },
  })

  return NextResponse.json({
    data: editions.map(serializeArticle),
    message: 'Editions fetched successfully',
    code: 'success',
    status: 200,
  })
}
