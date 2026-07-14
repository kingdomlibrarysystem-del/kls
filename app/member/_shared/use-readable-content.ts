'use client'

import { useSyncExternalStore } from 'react'
import { initialReadableContent, type ReadableContent, type Chapter } from './readable-content-data'

/**
 * Module-level mutable store for chapter body content, keyed by Resource
 * ID — mirrors use-lessons.ts's shape exactly (a Record store plus a
 * non-hook snapshot accessor for other store modules to read). Read-only
 * in this initial phase — no admin authoring UI exists yet, so no
 * add/update/remove mutators are needed; only the 4 seeded resources are
 * readable today.
 */
let byResource: Record<string, ReadableContent> = structuredClone(initialReadableContent)
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return byResource
}

/** Non-hook accessor for use outside React components/render (e.g. other store modules). */
export function getReadableContentSnapshot() {
  return byResource
}

/** Whether a resource has any readable chapter content at all. */
export function isReadable(resourceId: string): boolean {
  return !!byResource[resourceId]?.chapters.length
}

export function getChapter(resourceId: string, chapterId: string): Chapter | undefined {
  return byResource[resourceId]?.chapters.find((c) => c.id === chapterId)
}

/** Live-subscribes to the shared readable-content catalog, keyed by resource ID. */
export function useReadableContent() {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialReadableContent)
}
