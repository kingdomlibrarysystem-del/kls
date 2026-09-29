import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export function serializeArticle(a: {
  id: string
  title: string
  content: string
  summary: string
  coverImage: string | null
  category: string
  language: string
  authorId: string
  authorName: string
  status: string
  publishedAt: Date | null
  isEdition: boolean
  featured: boolean
  align: string
  createdAt: Date
}) {
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    summary: a.summary,
    coverImage: a.coverImage,
    category: a.category,
    language: a.language.toLowerCase(),
    authorId: a.authorId,
    authorName: a.authorName,
    status: a.status,
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
    isEdition: a.isEdition,
    featured: a.featured,
    align: a.align,
    createdAt: a.createdAt.toISOString(),
  }
}

/** One article in the GET /api/news/articles/[id] shape, plus whether it's published (unpublished ones are staff-only). */
export async function getNewsArticleDetail(id: string) {
  if (!isObjectId(id)) return null
  const article = await prisma.newsArticle.findUnique({ where: { id } })
  return article ? { published: article.status === 'PUBLISHED', article: serializeArticle(article) } : null
}

/** The DB-driven color of one news category (name is unique) — replaces downloading every category just to color one article. */
export async function getNewsCategoryColor(name: string): Promise<string | null> {
  if (!name) return null
  const category = await prisma.newsArticleCategory.findUnique({ where: { name }, select: { color: true } })
  return category?.color ?? null
}
