'use client'

import { useEffect, useSyncExternalStore } from 'react'
import type { ReadingProgress } from './reading-progress-data'

/**
 * Real reading-progress store, backed by /api/reading-progress —
 * replacing reading-progress-data.ts's initialReadingProgress (2
 * hand-typed rows, no userId at all). Kept as a module-level
 * useSyncExternalStore store (same design as use-favorites.ts) because
 * startReading/markChapterRead are called as plain synchronous
 * functions from ReaderView without access to a hook's return value.
 * `currentUserId` is set by useReadingProgress() on every render, same
 * as use-favorites.ts's currentUserId.
 */
let progress: ReadingProgress[] = []
let currentUserId: string | null = null
let loadedForUserId: string | null = null
const listeners = new Set<() => void>()

/**
 * Tracks the in-flight "ensure a ReadingProgress row exists" request per
 * resource, so markChapterRead can await it instead of racing it. Without
 * this, navigating to a later chapter before startReading's POST resolved
 * made every markChapterRead call 404 against the server (no row yet) and
 * silently no-op locally too — the local progress.map() only updates an
 * entry that already exists, so a completion could be lost entirely with
 * no visible error. Confirmed by a real user report: jumping from chapter
 * 1 to chapter 3 via the chapter list left BOTH chapters unmarked.
 */
const ensureStartedPromises = new Map<string, Promise<void>>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getProgressSnapshot() {
  return progress
}

async function loadProgress(userId: string) {
  loadedForUserId = userId
  const res = await fetch(`/api/reading-progress?userId=${userId}`)
  const json = await res.json()
  if (loadedForUserId !== userId) return
  progress = json.data ?? []
  emitChange()
}

/** Percentage complete, derived from completedChapterIds — never stored directly. */
export function getReadingProgressPercent(entry: ReadingProgress): number {
  return entry.totalChapters > 0
    ? Math.round((entry.completedChapterIds.length / entry.totalChapters) * 100)
    : 0
}

/**
 * Ensures a ReadingProgress row exists for this resource before any
 * chapter-completion write is attempted against it — the actual fix for
 * the race described above. Safe to call repeatedly; in-flight/created
 * rows short-circuit immediately.
 */
function ensureStarted(userId: string, resourceId: string): Promise<void> {
  if (progress.some((p) => p.resourceId === resourceId)) return Promise.resolve()

  const key = `${userId}:${resourceId}`
  const inFlight = ensureStartedPromises.get(key)
  if (inFlight) return inFlight

  const promise = fetch('/api/reading-progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, resourceId }),
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to start reading progress')
      if (!progress.some((p) => p.resourceId === resourceId)) {
        progress = [json.data, ...progress]
        emitChange()
      }
    })
    .finally(() => {
      ensureStartedPromises.delete(key)
    })

  ensureStartedPromises.set(key, promise)
  return promise
}

/** Starts (or resumes — no-op if one already exists) reading progress for a resource. */
export function startReading(resourceId: string) {
  if (!currentUserId) return
  ensureStarted(currentUserId, resourceId).catch(() => {})
}

/**
 * Marks a chapter viewed (idempotent) and updates lastChapterId/lastReadAt
 * to that chapter — called every time the reader navigates. Waits for a
 * ReadingProgress row to exist (see ensureStarted) before writing, then
 * updates optimistically and persists.
 */
export function markChapterRead(resourceId: string, chapterId: string) {
  if (!currentUserId) return
  const userId = currentUserId

  ensureStarted(userId, resourceId)
    .then(() => {
      const today = new Date().toISOString().slice(0, 10)
      const before = progress
      progress = progress.map((p) => {
        if (p.resourceId !== resourceId) return p
        const completedChapterIds = p.completedChapterIds.includes(chapterId)
          ? p.completedChapterIds
          : [...p.completedChapterIds, chapterId]
        const status: ReadingProgress['status'] = completedChapterIds.length >= p.totalChapters ? 'COMPLETED' : 'READING'
        return { ...p, completedChapterIds, status, lastChapterId: chapterId, lastReadAt: today }
      })
      emitChange()

      return fetch('/api/reading-progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, resourceId, chapterId }),
      }).catch(() => {
        progress = before
        emitChange()
      })
    })
    .catch(() => {})
}

/**
 * Explicitly finishes a book from the last chapter, marking every
 * chapter as read (including any skipped along the way) rather than
 * only the currently-viewed one — the deliberate "Mark Complete" action,
 * distinct from markChapterRead's implicit per-chapter tracking used for
 * dropoff analytics. Optimistic, same pattern as markChapterRead.
 */
export function markBookComplete(resourceId: string, allChapterIds: string[]) {
  if (!currentUserId) return
  const userId = currentUserId

  ensureStarted(userId, resourceId)
    .then(() => {
      const today = new Date().toISOString().slice(0, 10)
      const before = progress
      progress = progress.map((p) => {
        if (p.resourceId !== resourceId) return p
        return { ...p, completedChapterIds: allChapterIds, status: 'COMPLETED' as const, lastReadAt: today }
      })
      emitChange()

      return fetch('/api/reading-progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, resourceId, markAllComplete: true }),
      }).catch(() => {
        progress = before
        emitChange()
      })
    })
    .catch(() => {})
}

/** Live-subscribes to the shared reading-progress store, loading it from the real API for the signed-in user. */
export function useReadingProgress(userId?: string) {
  useEffect(() => {
    if (!userId) return
    currentUserId = userId
    if (loadedForUserId !== userId) loadProgress(userId)
  }, [userId])

  return useSyncExternalStore(subscribe, getProgressSnapshot, () => [])
}
