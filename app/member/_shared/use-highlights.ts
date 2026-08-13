'use client'

import { useEffect, useSyncExternalStore } from 'react'
import type { Highlight, HighlightColor } from './highlight-data'

/**
 * Real highlights store, backed by /api/highlights — replacing
 * highlight-data.ts's initialHighlights (deliberately empty). Same
 * module-level useSyncExternalStore + currentUserId design as
 * use-favorites.ts, since addHighlight/removeHighlight/etc. are called
 * as plain synchronous functions from ReaderView and its children.
 */
let highlights: Highlight[] = []
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

export interface AddHighlightInput {
  resourceId: string
  chapterId: string
  startOffset: number
  endOffset: number
  text: string
  color: HighlightColor
}

/** Creates a new highlight from a real text selection made in the reader. Optimistic — reconciled with the server id once the request resolves. */
export function addHighlight(input: AddHighlightInput) {
  if (!currentUserId) return
  const userId = currentUserId
  const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const optimistic: Highlight = { id: tempId, createdAt: new Date().toISOString().slice(0, 10), ...input }
  highlights = [optimistic, ...highlights]
  emitChange()

  fetch('/api/highlights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...input }),
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message)
      highlights = highlights.map((h) => (h.id === tempId ? json.data : h))
      emitChange()
    })
    .catch(() => {
      highlights = highlights.filter((h) => h.id !== tempId)
      emitChange()
    })
}

export function updateHighlightColor(id: string, color: HighlightColor) {
  const before = highlights
  highlights = highlights.map((h) => (h.id === id ? { ...h, color } : h))
  emitChange()

  fetch(`/api/highlights/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ color }),
  }).catch(() => {
    highlights = before
    emitChange()
  })
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

/** All highlights for one chapter, ordered by position — used to render marks inside the reader's chapter body. */
export function getChapterHighlights(resourceId: string, chapterId: string): Highlight[] {
  return highlights
    .filter((h) => h.resourceId === resourceId && h.chapterId === chapterId)
    .sort((a, b) => a.startOffset - b.startOffset)
}

/** Live-subscribes to the shared highlights store, loading it from the real API for the signed-in user. */
export function useHighlights(userId?: string) {
  useEffect(() => {
    if (!userId) return
    currentUserId = userId
    if (loadedForUserId !== userId) loadHighlights(userId)
  }, [userId])

  return useSyncExternalStore(subscribe, getSnapshot, () => [])
}
