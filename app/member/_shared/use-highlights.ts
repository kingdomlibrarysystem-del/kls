'use client'

import { useEffect, useSyncExternalStore } from 'react'
import type { Highlight } from './highlight-data'

/**
 * Real highlights store, backed by /api/highlights — replacing
 * highlight-data.ts's initialHighlights (deliberately empty). Same
 * module-level useSyncExternalStore design as use-favorites.ts.
 * Read-only from the reader's side now (list + delete an existing
 * highlight via HighlightsNotesList) — creating a new highlight required
 * a live text selection in the chapter body, which stopped being
 * possible once ChapterBody switched to rendering real markdown through
 * MdPreview (opaque HTML, no offset-mapping API); see reader-view.tsx's
 * docstring for the full reasoning.
 */
let highlights: Highlight[] = []
let loadedForUserId: string | null = null
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

async function loadHighlights(userId: string) {
  loadedForUserId = userId
  const res = await fetch(`/api/highlights?userId=${userId}`)
  const json = await res.json()
  if (loadedForUserId !== userId) return
  highlights = json.data ?? []
  emitChange()
}

export function removeHighlight(id: string) {
  const removed = highlights.find((h) => h.id === id)
  highlights = highlights.filter((h) => h.id !== id)
  emitChange()

  fetch(`/api/highlights/${id}`, { method: 'DELETE' }).catch(() => {
    if (removed) {
      highlights = [removed, ...highlights]
      emitChange()
    }
  })
}

/** Live-subscribes to the shared highlights store, loading it from the real API for the signed-in user. */
export function useHighlights(userId?: string) {
  useEffect(() => {
    if (!userId) return
    if (loadedForUserId !== userId) loadHighlights(userId)
  }, [userId])

  return useSyncExternalStore(subscribe, getSnapshot, () => [])
}
