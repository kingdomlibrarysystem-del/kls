'use client'

import { useSyncExternalStore } from 'react'
import { initialHighlights, type Highlight, type HighlightColor } from './highlight-data'

/**
 * Module-level mutable store for reading highlights — same
 * useSyncExternalStore pattern as every other store in this app
 * (use-favorites.ts, use-reading-progress.ts, etc.), member-scoped state
 * kept separate from the readable-content catalog store, matching how
 * reading progress is kept separate from the lesson catalog.
 */
let highlights: Highlight[] = [...initialHighlights]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return highlights
}

function nextHighlightId() {
  const max = highlights.reduce((m, h) => {
    const n = Number(h.id.replace('hl-', ''))
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return `hl-${String(max + 1).padStart(3, '0')}`
}

export interface AddHighlightInput {
  resourceId: string
  chapterId: string
  startOffset: number
  endOffset: number
  text: string
  color: HighlightColor
}

/** Creates a new highlight from a real text selection made in the reader. */
export function addHighlight(input: AddHighlightInput): Highlight {
  const created: Highlight = { id: nextHighlightId(), createdAt: new Date().toISOString().slice(0, 10), ...input }
  highlights = [created, ...highlights]
  emitChange()
  return created
}

export function updateHighlightColor(id: string, color: HighlightColor) {
  highlights = highlights.map((h) => (h.id === id ? { ...h, color } : h))
  emitChange()
}

export function removeHighlight(id: string) {
  highlights = highlights.filter((h) => h.id !== id)
  emitChange()
}

/** All highlights for one chapter, ordered by position — used to render marks inside the reader's chapter body. */
export function getChapterHighlights(resourceId: string, chapterId: string): Highlight[] {
  return highlights
    .filter((h) => h.resourceId === resourceId && h.chapterId === chapterId)
    .sort((a, b) => a.startOffset - b.startOffset)
}

/** Live-subscribes to the shared highlights store. */
export function useHighlights() {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialHighlights)
}
