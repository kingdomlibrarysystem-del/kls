'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Resource } from './resources-data'

/**
 * Real, fetch()-backed resources store — replaces the previous
 * `useSyncExternalStore` in-memory mock. Establishes this migration's
 * first async-store pattern (see PROGRESS.md's Phase 2 entry for the
 * full rationale): a synchronous mock could return data on first
 * render; a real API call cannot, so every consumer of `useResources()`
 * must now handle a real `loading`/`error` phase instead of assuming
 * data is already there. Components render their existing Skeleton/
 * EmptyState UI (already used everywhere in this app for the old
 * *simulated* loading delay) gated by this hook's real `loading`/`error`
 * flags instead of a fake `setTimeout`.
 *
 * Kept as one shared module-level cache (not per-component state) so
 * every consumer sees the same list without re-fetching independently,
 * and so a create/update/delete anywhere refreshes every consumer via
 * the same `refetch()` call.
 */
let cache: Resource[] = []
let hasFetched = false
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

async function fetchResources(): Promise<void> {
  const res = await fetch('/api/resources?pageSize=1000')
  if (!res.ok) throw new Error(`Failed to fetch resources (${res.status})`)
  const json = await res.json()
  if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch resources')
  cache = json.data
  hasFetched = true
  notify()
}

/** Live-subscribes to the shared resources store, fetching once on first mount. */
export function useResources() {
  const [data, setData] = useState<Resource[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData(cache)
    listeners.add(listener)

    if (!hasFetched) {
      fetchResources()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load resources'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }

    return () => { listeners.delete(listener) }
  }, [])

  return { data, loading, error }
}

/** Re-fetches the shared resources store — call after any create/update/delete so every consumer sees the change. */
export async function refetchResources(): Promise<void> {
  await fetchResources()
}

export async function addResource(resource: Omit<Resource, 'id'>): Promise<Resource> {
  const res = await fetch('/api/resources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resource),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to create resource')
  await refetchResources()
  return json.data
}

export async function updateResource(id: string, updates: Partial<Omit<Resource, 'id'>>): Promise<Resource> {
  const res = await fetch(`/api/resources/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update resource')
  await refetchResources()
  return json.data
}

export async function archiveResource(id: string): Promise<Resource> {
  return updateResource(id, { status: 'archived' })
}

/**
 * Finds canonical library resources filed under a given KCS scroll/category
 * id — e.g. the "genesis" scroll category matches the Genesis Resource
 * record (`categoryId` equal to that category's real id). Used by both the
 * admin KCS Map detail pages and the member Kingdom Library detail pages so
 * "related resources" is one real relationship, not two separately-
 * implemented lookups. Archived scrolls with no matching Resource correctly
 * return an empty array — no fabrication.
 */
export function findResourcesForScroll(categoryId: string, resources: Resource[]): Resource[] {
  return resources.filter((r) => r.categoryId === categoryId && r.status !== 'archived')
}
