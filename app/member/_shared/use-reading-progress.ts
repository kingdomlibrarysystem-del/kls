'use client'

import { useSyncExternalStore } from 'react'
import { initialReadingProgress, type ReadingProgress } from './reading-progress-data'
import { getReadableContentSnapshot } from './use-readable-content'

/**
 * Module-level mutable store for per-member reading progress — mirrors
 * use-enrollments.ts exactly: member-only state, a percentage always
 * derived from completedChapterIds/totalChapters (never stored directly),
 * and a "next chapter" resolver that cross-references the live readable-
 * content store the same way getNextLessonId cross-references
 * getLessonsSnapshot(). Deliberately not merged into use-readable-content.ts,
 * matching how enrollment/progress is kept separate from the lesson
 * catalog store — a content-catalog store and a per-member progress store
 * are different concerns.
 */
let progress: ReadingProgress[] = [...initialReadingProgress]
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

/** Percentage complete, derived from completedChapterIds — never stored directly. */
export function getReadingProgressPercent(entry: ReadingProgress): number {
  return entry.totalChapters > 0
    ? Math.round((entry.completedChapterIds.length / entry.totalChapters) * 100)
    : 0
}

/** Starts (or resumes — no-op if one already exists) reading progress for a resource. */
export function startReading(resourceId: string): ReadingProgress {
  const existing = progress.find((p) => p.resourceId === resourceId)
  if (existing) return existing

  const chapters = getReadableContentSnapshot()[resourceId]?.chapters ?? []
  const created: ReadingProgress = {
    resourceId,
    status: 'READING',
    startedAt: new Date().toISOString().slice(0, 10),
    completedChapterIds: [],
    totalChapters: chapters.length,
    lastChapterId: chapters[0]?.id ?? '',
    lastReadAt: new Date().toISOString().slice(0, 10),
  }
  progress = [created, ...progress]
  emitChange()
  return created
}

/**
 * Marks a chapter viewed (idempotent) and updates lastChapterId/lastReadAt
 * to that chapter — called every time the reader navigates, not only on
 * an explicit "mark complete" action, since simply reading a chapter is
 * the natural completion signal for prose (unlike a lesson's separate
 * "Mark Complete" button). Auto-flips status to COMPLETED once every
 * chapter has been viewed.
 */
export function markChapterRead(resourceId: string, chapterId: string) {
  const today = new Date().toISOString().slice(0, 10)
  progress = progress.map((p) => {
    if (p.resourceId !== resourceId) return p
    const completedChapterIds = p.completedChapterIds.includes(chapterId)
      ? p.completedChapterIds
      : [...p.completedChapterIds, chapterId]
    const status: ReadingProgress['status'] = completedChapterIds.length >= p.totalChapters ? 'COMPLETED' : 'READING'
    return { ...p, completedChapterIds, status, lastChapterId: chapterId, lastReadAt: today }
  })
  emitChange()
}

/** Live-subscribes to the shared reading-progress store. */
export function useReadingProgress() {
  return useSyncExternalStore(subscribe, getProgressSnapshot, () => initialReadingProgress)
}
