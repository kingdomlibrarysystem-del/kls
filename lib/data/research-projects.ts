import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export function serializeProject(p: {
  id: string
  title: string
  description: string
  status: string
  startDate: Date
  members: { user: { id: string; name: string | null; firstName: string | null; lastName: string | null } }[]
  _count?: { papers: number }
}) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status,
    startDate: p.startDate.toISOString().split('T')[0],
    contributors: p.members.map((m) => ({
      id: m.user.id,
      name: m.user.name ?? `${m.user.firstName ?? ''} ${m.user.lastName ?? ''}`.trim(),
    })),
    paperCount: p._count?.papers ?? 0,
  }
}

export const INCLUDE = {
  members: { include: { user: { select: { id: true, name: true, firstName: true, lastName: true } } } },
  _count: { select: { papers: true } },
} as const

/** One record in the GET /api/research-projects/[id] shape. */
export async function getResearchProjectDetail(id: string) {
  if (!isObjectId(id)) return null
  const row = await prisma.researchProject.findUnique({ where: { id }, include: INCLUDE })
  return row ? serializeProject(row) : null
}
