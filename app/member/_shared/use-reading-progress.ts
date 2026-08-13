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

/** Starts (or resumes — no-op if one already exists) reading progress for a resource. */
export function startReading(resourceId: string) {
  if (!currentUserId) return
  const userId = currentUserId
  if (progress.some((p) => p.resourceId === resourceId)) return

  fetch('/api/reading-progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, resourceId }),
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.code !== 'success' || progress.some((p) => p.resourceId === resourceId)) return
      progress = [json.data, ...progress]
      emitChange()
    })
    .catch(() => {})
}

/**
 * Marks a chapter viewed (idempotent) and updates lastChapterId/lastReadAt
 * to that chapter — called every time the reader navigates. Optimistic:
 * updates the local store immediately, then persists.
 */
export function markChapterRead(resourceId: string, chapterId: string) {
  if (!currentUserId) return
  const userId = currentUserId
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

  fetch('/api/reading-progress', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, resourceId, chapterId }),
  }).catch(() => {
    progress = before
    emitChange()
  })
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
