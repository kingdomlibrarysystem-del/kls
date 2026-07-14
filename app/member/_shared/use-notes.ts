'use client'

import { useSyncExternalStore } from 'react'
import { initialNotes, type Note } from './note-data'

/**
 * Module-level mutable store for reading notes — same
 * useSyncExternalStore pattern as use-highlights.ts, member-scoped,
 * kept as its own store rather than folded into highlights since a note
 * can exist per-chapter with no highlight at all (the two attachment
 * modes the phase spec calls for: per-page or per-highlight).
 */
let notes: Note[] = [...initialNotes]
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

function nextNoteId() {
  const max = notes.reduce((m, n) => {
    const num = Number(n.id.replace('note-', ''))
    return Number.isFinite(num) && num > m ? num : m
  }, 0)
  return `note-${String(max + 1).padStart(3, '0')}`
}

export interface AddNoteInput {
  resourceId: string
  chapterId: string
  highlightId?: string
  text: string
}

/** Creates a new note, either attached to a chapter generally or to a specific highlight within it. */
export function addNote(input: AddNoteInput): Note {
  const created: Note = { id: nextNoteId(), createdAt: new Date().toISOString().slice(0, 10), ...input }
  notes = [created, ...notes]
  emitChange()
  return created
}

export function updateNote(id: string, text: string) {
  notes = notes.map((n) => (n.id === id ? { ...n, text } : n))
  emitChange()
}

export function removeNote(id: string) {
  notes = notes.filter((n) => n.id !== id)
  emitChange()
}

/** All notes for one chapter (both chapter-level and highlight-attached), newest first. */
export function getChapterNotes(resourceId: string, chapterId: string): Note[] {
  return notes.filter((n) => n.resourceId === resourceId && n.chapterId === chapterId)
}

/** Live-subscribes to the shared notes store. */
export function useNotes() {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialNotes)
}
