'use client'

import { useEffect, useSyncExternalStore } from 'react'
import type { Note } from './note-data'

/**
 * Real notes store, backed by /api/notes — replacing note-data.ts's
 * initialNotes (deliberately empty). Same module-level
 * useSyncExternalStore + currentUserId design as use-favorites.ts.
 */
let notes: Note[] = []
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
  return notes
}

async function loadNotes(userId: string) {
  loadedForUserId = userId
  const res = await fetch(`/api/notes?userId=${userId}`)
  const json = await res.json()
  if (loadedForUserId !== userId) return
  notes = json.data ?? []
  emitChange()
}

export interface AddNoteInput {
  resourceId: string
  chapterId: string
  highlightId?: string
  text: string
}

/** Creates a new note, either attached to a chapter generally or to a specific highlight within it. Optimistic — reconciled with the server id once the request resolves. */
export function addNote(input: AddNoteInput) {
  if (!currentUserId) return
  const userId = currentUserId
  const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const optimistic: Note = { id: tempId, createdAt: new Date().toISOString().slice(0, 10), ...input }
  notes = [optimistic, ...notes]
  emitChange()

  fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...input }),
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message)
      notes = notes.map((n) => (n.id === tempId ? json.data : n))
      emitChange()
    })
    .catch(() => {
      notes = notes.filter((n) => n.id !== tempId)
      emitChange()
    })
}

export function updateNote(id: string, text: string) {
  const before = notes
  notes = notes.map((n) => (n.id === id ? { ...n, text } : n))
  emitChange()

  fetch(`/api/notes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }).catch(() => {
    notes = before
    emitChange()
  })
}

export function removeNote(id: string) {
  const removed = notes.find((n) => n.id === id)
  notes = notes.filter((n) => n.id !== id)
  emitChange()

  fetch(`/api/notes/${id}`, { method: 'DELETE' }).catch(() => {
    if (removed) {
      notes = [removed, ...notes]
      emitChange()
    }
  })
}

/** All notes for one chapter (both chapter-level and highlight-attached), newest first. */
export function getChapterNotes(resourceId: string, chapterId: string): Note[] {
  return notes.filter((n) => n.resourceId === resourceId && n.chapterId === chapterId)
}

/** Live-subscribes to the shared notes store, loading it from the real API for the signed-in user. */
export function useNotes(userId?: string) {
  useEffect(() => {
    if (!userId) return
    currentUserId = userId
    if (loadedForUserId !== userId) loadNotes(userId)
  }, [userId])

  return useSyncExternalStore(subscribe, getSnapshot, () => [])
}
