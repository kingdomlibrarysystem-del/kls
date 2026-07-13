'use client'

import { useSyncExternalStore } from 'react'
import { mockCatalog, type PublishedBook } from './catalog-data'

/** Module-level mutable store so toggling "Featured" re-renders the catalog grid. */
let catalog: PublishedBook[] = [...mockCatalog]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return catalog
}

export function toggleFeatured(id: string) {
  catalog = catalog.map((b) => (b.id === id ? { ...b, featured: !b.featured } : b))
  emitChange()
}

/** Live-subscribes to the shared published-catalog store. */
export function useCatalog() {
  return useSyncExternalStore(subscribe, getSnapshot, () => mockCatalog)
}
