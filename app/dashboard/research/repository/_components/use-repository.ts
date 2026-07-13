'use client'

import { useSyncExternalStore } from 'react'
import { mockPapers, type ResearchPaper } from './repository-data'

/**
 * Module-level mutable store so Submit Paper
 * (`/dashboard/research/submit`) can append a new paper and the Repository
 * table reflects it immediately, without a backend.
 */
let papers: ResearchPaper[] = [...mockPapers]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return papers
}

export function addPaperToRepository(entry: Omit<ResearchPaper, 'id' | 'publishedAt' | 'status'>) {
  const created: ResearchPaper = {
    ...entry,
    id: `paper-${String(papers.length + 1).padStart(3, '0')}`,
    publishedAt: new Date().toISOString().slice(0, 10),
    status: 'SUBMITTED',
  }
  papers = [created, ...papers]
  emitChange()
  return created
}

/** Live-subscribes to the shared research-paper repository store. */
export function useRepository() {
  return useSyncExternalStore(subscribe, getSnapshot, () => mockPapers)
}
