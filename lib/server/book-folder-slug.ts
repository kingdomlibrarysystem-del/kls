import prisma from '@/prisma/client'
import { slugify } from '@/lib/data/book-folders'

/**
 * Returns `base`, `base-2`, `base-3`… whichever is not already taken.
 * Server-only because it queries Prisma — the pure slug/types module stays
 * importable from client components.
 */
export async function uniqueFolderSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base)
  let candidate = root
  let suffix = 2
  // Bounded loop: the taxonomy has a handful of folders, so this always settles.
  while (true) {
    const existing = await prisma.bookFolder.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!existing || existing.id === ignoreId) return candidate
    candidate = `${root}-${suffix}`
    suffix += 1
  }
}
