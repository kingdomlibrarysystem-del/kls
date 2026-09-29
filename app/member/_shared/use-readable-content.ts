'use client'

import { useEffect, useState } from 'react'
import type { ReadableContent, Chapter } from './readable-content-data'

/**
 * Real fetch()-backed readable-content store, replacing
 * readable-content-data.ts's Record<string, ReadableContent> keyed by
 * legacy mock resource ids ('1', '7', ...) that didn't match any real
 * Resource ObjectId post-migration — this feature was silently
 * non-functional against real data before this hook existed. Fetches
 * the whole catalog once from GET /api/chapters (no resourceId — see
 * that route's grouped-by-resource mode), matching the old mock's
 * eagerly-loaded contract that ~6 call sites already depend on.
 */
let cache: Record<string, ReadableContent> = {}
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return cache
}

/** Non-hook accessor for use outside React components/render (e.g. other store modules). */
export function getReadableContentSnapshot() {
  return cache
}

function loadReadableContent(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/chapters')
    .then((res) => res.json())
    .then((json) => {
      if (json.code === 'success') {
        cache = json.data ?? {}
        hasFetched = true
        emitChange()
      }
    })
    .catch(() => {})
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

/**
 * Forces a re-fetch of the chapter catalog and notifies every subscriber.
 *
 * The store otherwise fetches exactly once per browser session and is never
 * invalidated, which is right for members browsing a finished catalog but
 * breaks the admin authoring loop: an admin who adds chapters to a book and
 * then opens the reader in the same session kept seeing the pre-save
 * snapshot (an empty chapter list, so the reader reported the book as "not
 * available to read online yet"). Called after a chapter save/authoring
 * operation so the reader reflects what was just written without needing a
 * hard reload.
 */
export async function refreshReadableContent(): Promise<void> {
  // Nothing to refresh if no screen in this session ever loaded the catalog.
  // The reader, library cards and resource pages no longer do (they use the
  // server-loaded single-book chapters / resource.chapterCount), so this no
  // longer re-downloads every chapter in the library after each admin save.
  if (!hasFetched) return
  hasFetched = false
  await loadReadableContent()
}

/** Whether a resource has any readable chapter content at all. */
export function isReadable(resourceId: string): boolean {
  return !!cache[resourceId]?.chapters.length
}

export function getChapter(resourceId: string, chapterId: string): Chapter | undefined {
  return cache[resourceId]?.chapters.find((c) => c.id === chapterId)
}

/** Live-subscribes to the shared readable-content catalog, keyed by resource ID. */
export function useReadableContent() {
  const [, setTick] = useState(0)

  useEffect(() => {
    const listener = () => setTick((t) => t + 1)
    listeners.add(listener)
    if (!hasFetched) loadReadableContent()
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return getSnapshot()
}
