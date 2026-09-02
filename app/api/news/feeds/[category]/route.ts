import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

/** Thin wrapper for the in-page hint's literal GET /api/news/feeds/:category — published, non-edition articles in one category. */
function serializeArticle(a: { id: string; title: string; summary: string; coverImage: string | null; category: string; publishedAt: Date | null }) {
  return { id: a.id, title: a.title, summary: a.summary, coverImage: a.coverImage, category: a.category, publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const articles = await prisma.newsArticle.findMany({
    where: { status: 'PUBLISHED', isEdition: false, category: decodeURIComponent(category) },
    orderBy: { publishedAt: 'desc' },
  })

  return NextResponse.json({
    data: articles.map(serializeArticle),
    message: 'Feed fetched successfully',
    code: 'success',
    status: 200,
  })
}
