'use client'

import { useSyncExternalStore } from 'react'
import { mockBorrowings as initialBorrowings, type Borrowing } from '../borrowings/_components/borrowings-data'

/**
 * Module-level mutable store so a Borrow made from the public library
 * (`/library/[id]`) is immediately visible on `/member/borrowings`,
 * without a backend. Mirrors the use-enrollments.ts pattern from Phase 17.
 */
let borrowings: Borrowing[] = [...initialBorrowings]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return borrowings
}

function nextId() {
  return borrowings.reduce((max, b) => Math.max(max, b.id), 0) + 1
}

/** Adds a new active borrowing (e.g. from a public-library Borrow action), due in 14 days. */
export function addBorrowing(title: string, author: string): Borrowing {
  const borrowed = new Date()
  const due = new Date(borrowed)
  due.setDate(due.getDate() + 14)
  const format = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })

  const created: Borrowing = {
    id: nextId(),
    title,
    author,
    borrowed: format(borrowed),
    due: format(due),
    status: 'Active',
  }
  borrowings = [created, ...borrowings]
  emitChange()
  return created
}

/** Live-subscribes to the shared borrowings store. */
export function useBorrowings() {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialBorrowings)
}
