import type { Category } from './types'

/**
 * The full canonical taxonomy — now a real, fetch()-backed module-level
 * cache instead of a static seed array (previously `[...kcsRoots,
 * ...kcsScrolls]` from roots-data.ts/scrolls-data.ts, both deleted once
 * this and every consumer were rewired — see PROGRESS.md's Phase 2 entry).
 *
 * Kept as a synchronous, always-populated-after-first-fetch cache
 * (rather than converting every helper below to async) so the ~19 real
 * consumers of `getCategoryById`/`getChildCategories`/`getRootCategories`/
 * `resourceCountFor` across admin, member, and public pages don't all
 * need to become async-aware individually — only `useCategories()` (the
 * one hook components actually subscribe to for loading/error state) and
 * this module's own `loadCategories()` bootstrap need to know about the
 * fetch. Every plain helper function still reads this array synchronously,
 * exactly as before; it's just populated from a real API call now.
 */
export let categories: Category[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

/** Internal: fetches the real Category collection once, caching the in-flight promise so concurrent callers share one request. */
export function loadCategories(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise

  fetchPromise = fetch('/api/categories?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch categories (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch categories')
      categories = json.data
      hasFetched = true
      notify()
    })
    .finally(() => {
      fetchPromise = null
    })

  return fetchPromise
}

export function subscribeCategories(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function categoriesHaveLoaded(): boolean {
  return hasFetched
}

export async function refetchCategories(): Promise<void> {
  hasFetched = false
  await loadCategories()
}

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
  return resourcesForCategory(categoryId, resources).length
}

/**
 * Live resource list for a category — same recursive root/leaf join as
 * `resourceCountFor` (root includes every child's own matches too), just
 * returning the matched rows instead of only a count, so the category
 * detail page's Resources/Borrowings/Reservations/Members/Finance
 * sections can all derive from one real `categoryId` FK lookup rather than
 * five separate re-implementations of the same join.
 */
export function resourcesForCategory<T extends { categoryId: string }>(categoryId: string, resources: T[]): T[] {
  const isRoot = categories.some((c) => c.id === categoryId && c.parentId === null)
  if (!isRoot) {
    return resources.filter((r) => r.categoryId === categoryId)
  }
  const childIds = new Set(getChildCategories(categoryId).map((c) => c.id))
  return resources.filter((r) => r.categoryId === categoryId || childIds.has(r.categoryId))
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

/**
 * Real Unsplash imagery for a scroll card. Only the 8 root pillars have
 * their own `heroImage` seeded (a distinct, fitting image per individual
 * scroll — 75 of them — isn't something to fabricate); each scroll falls
 * back to its parent pillar's real photo, which is still genuine
 * imagery contextually tied to that scroll's section rather than a
 * decorative placeholder.
 */
export function getScrollImage(category: Category): string | undefined {
  if (category.heroImage) return category.heroImage
  if (!category.parentId) return undefined
  return getCategoryById(category.parentId)?.heroImage
}
