import type { Category } from './types'
import { kcsRoots } from './roots-data'
import { kcsScrolls } from './scrolls-data'

/**
 * The full canonical taxonomy: 8 root pillars + 75 child scrolls. This
 * array is the one source of truth for the whole app — admin Categories
 * CRUD, the KCS Map, the member library, the public library filter, and
 * `Resource.categoryId` all resolve against it.
 *
 * ID scheme: every id is that category's own `slug` (roots use their
 * existing `kcs-xxx` slugs, e.g. `"kcs-fnd"`; scrolls use their book slug,
 * e.g. `"genesis"`). Verified unique across all 83 rows before adopting
 * this scheme — simpler and more self-documenting than a `root-N`/`sub-N`
 * counter scheme, and just as stable since slugs don't change once seeded.
 */
export const categories: Category[] = [...kcsRoots, ...kcsScrolls]

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id)
}

export function getRootCategories(): Category[] {
  return categories.filter((c) => c.parentId === null)
}

export function getChildCategories(parentId: string): Category[] {
  return categories.filter((c) => c.parentId === parentId)
}

/**
 * Computes a live resource count for a category from the real `Resource[]`
 * store, replacing the old hand-set/hardcoded `resourceCount` field.
 *
 * Recursive for root categories: a root's count includes every resource
 * whose `categoryId` matches the root itself OR any of its children — this
 * matches how the admin Categories page already displayed root counts
 * (e.g. "Foundation" showing a number that implicitly represented its
 * whole section, not literally 0 resources filed directly under the root
 * node, since in practice every resource is filed under a leaf/scroll).
 * Leaf categories simply count their own direct matches.
 */
export function resourceCountFor(categoryId: string, resources: { categoryId: string }[]): number {
  const isRoot = categories.some((c) => c.id === categoryId && c.parentId === null)
  if (!isRoot) {
    return resources.filter((r) => r.categoryId === categoryId).length
  }
  const childIds = new Set(getChildCategories(categoryId).map((c) => c.id))
  return resources.filter((r) => r.categoryId === categoryId || childIds.has(r.categoryId)).length
}

/** Display name for a category id, in English — used wherever a raw id must resolve to a human-readable label. */
export function getCategoryName(categoryId: string | undefined): string {
  if (!categoryId) return 'Uncategorized'
  return getCategoryById(categoryId)?.name.en ?? 'Uncategorized'
}

/** The parent root's display name for a child category, or null for a root/unknown category — replaces the old stored `parentName` field. */
export function getParentName(category: Category): string | null {
  if (!category.parentId) return null
  return getCategoryById(category.parentId)?.name.en ?? null
}
