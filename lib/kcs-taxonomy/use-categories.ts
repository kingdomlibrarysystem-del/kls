'use client'

import { useEffect, useState } from 'react'
import {
  categories as cache,
  loadCategories,
  subscribeCategories,
  categoriesHaveLoaded,
  refetchCategories,
} from './taxonomy-helpers'
import type { Category } from './types'

/**
 * Real, fetch()-backed categories store — replaces the previous
 * `useSyncExternalStore` in-memory mock. Same async-store pattern
 * `use-resources.ts` establishes (see that file's docstring and
 * PROGRESS.md's Phase 2 entry): components subscribing via
 * `useCategories()` now get a genuine `loading`/`error` phase instead of
 * assuming the taxonomy is already there. The underlying cache lives in
 * `taxonomy-helpers.ts` (not here) so the many synchronous
 * `getCategoryById`/`getChildCategories`/etc. helpers used throughout
 * this app keep working unchanged once that cache is populated — only
 * this hook and `loadCategories()` know about the fetch itself.
 */
export function useCategories() {
  const [data, setData] = useState<Category[]>(cache)
  const [loading, setLoading] = useState(!categoriesHaveLoaded())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeCategories(() => setData([...cache]))

    if (!categoriesHaveLoaded()) {
      loadCategories()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load categories'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }

    return unsubscribe
  }, [])

  return { data, loading, error }
}

export async function addCategory(input: { slug: string; name: { en: string; fr?: string; rw?: string }; parentId: string | null }): Promise<Category> {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to create category')
  await refetchCategories()
  return json.data
}

export async function updateCategory(id: string, updates: Partial<{ slug: string; name: { en?: string; fr?: string; rw?: string }; parentId: string | null }>): Promise<Category> {
  const res = await fetch(`/api/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update category')
  await refetchCategories()
  return json.data
}

export async function removeCategory(id: string): Promise<void> {
  const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to delete category')
  await refetchCategories()
}
