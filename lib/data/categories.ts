import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export function serializeCategory(c: {
  id: string
  slug: string
  nameEn: string
  nameFr: string
  nameRw: string
  parentId: string | null
  code: string | null
  subtitle: string | null
  range: string | null
  theme: string | null
  description: string | null
  detail: string | null
  heroImage: string | null
  status: string | null
  createdAt: Date
}) {
  return {
    id: c.id,
    slug: c.slug,
    name: { en: c.nameEn, fr: c.nameFr, rw: c.nameRw },
    parentId: c.parentId,
    code: c.code ?? undefined,
    subtitle: c.subtitle ?? undefined,
    range: c.range ?? undefined,
    theme: c.theme ?? undefined,
    description: c.description ?? undefined,
    detail: c.detail ?? undefined,
    heroImage: c.heroImage ?? undefined,
    status: c.status ?? undefined,
    createdAt: c.createdAt.toISOString().split('T')[0],
  }
}

/** One KCS category in the GET /api/categories/[id] shape. */
export async function getCategoryDetail(id: string) {
  if (!isObjectId(id)) return null
  const category = await prisma.category.findUnique({ where: { id } })
  return category ? serializeCategory(category) : null
}

/** English display name of one KCS category ('Uncategorized' when missing) — resolved server-side so pages don't depend on the client category cache. */
export async function getCategoryDisplayName(categoryId: string | null | undefined): Promise<string> {
  if (!categoryId || !isObjectId(categoryId)) return 'Uncategorized'
  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { nameEn: true } })
  return category?.nameEn ?? 'Uncategorized'
}
