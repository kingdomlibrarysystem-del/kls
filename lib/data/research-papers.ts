import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export function serializePaper(p: {
  id: string
  title: string
  abstract: string
  authorId: string
  authorName: string
  projectId: string
  project: { title: string }
  keywords: string[]
  publishedAt: Date
  status: string
}) {
  return {
    id: p.id,
    title: p.title,
    abstract: p.abstract,
    authorId: p.authorId,
    author: p.authorName,
    projectId: p.projectId,
    project: p.project.title,
    keywords: p.keywords,
    publishedAt: p.publishedAt.toISOString().split('T')[0],
    status: p.status,
  }
}

export const INCLUDE = { project: { select: { title: true } } } as const

/** One record in the GET /api/research-papers/[id] shape. */
export async function getResearchPaperDetail(id: string) {
  if (!isObjectId(id)) return null
  const row = await prisma.researchPaper.findUnique({ where: { id }, include: INCLUDE })
  return row ? serializePaper(row) : null
}
