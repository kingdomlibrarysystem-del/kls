'use client'

import { useSyncExternalStore } from 'react'
import { initialResources, type Resource } from './resources-data'

/**
 * Module-level mutable store so the admin Book Inventory
 * (`/dashboard/library`) and the public library browse/detail pages
 * (`/library`, `/library/[id]`) share one canonical Book/Resource dataset
 * across route navigations, without a backend. Previously `/library` had
 * its own disconnected inline `books` array that duplicated (and drifted
 * from) this data — this store makes it the single source of truth.
 */
let resources: Resource[] = [...initialResources]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return resources
}

export function addResource(resource: Resource) {
  resources = [resource, ...resources]
  emitChange()
}

export function updateResource(id: string, updates: Partial<Omit<Resource, 'id'>>) {
  resources = resources.map((r) => (r.id === id ? { ...r, ...updates } : r))
  emitChange()
}

export function archiveResource(id: string) {
  updateResource(id, { status: 'archived' })
}

/** Live-subscribes to the shared resources store. */
export function useResources() {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialResources)
}

/**
 * Finds canonical library resources filed under a given KCS scroll/category
 * id — e.g. the "genesis" scroll category matches the Genesis Resource
 * record (`categoryId: 'genesis'`). Used by both the admin KCS Map detail
 * pages and the member Kingdom Library detail pages so "related resources"
 * is one real relationship, not two separately-implemented lookups.
 *
 * Previously matched by title string against a free-text `category` field
 * (a fragile hack); now a real FK filter now that every scroll has a
 * stable id shared with `Resource.categoryId`. Archived/apocryphal scrolls
 * with no matching Resource correctly return an empty array — no fabrication.
 */
export function findResourcesForScroll(categoryId: string, resources: Resource[]): Resource[] {
  return resources.filter((r) => r.categoryId === categoryId && r.status !== 'archived')
}
