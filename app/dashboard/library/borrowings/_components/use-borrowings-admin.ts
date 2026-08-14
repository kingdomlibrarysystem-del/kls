'use client'

import { useEffect, useState } from 'react'
import type { Borrowing } from './borrowings-data'

/**
 * Real fetch()-backed store for the admin Borrowings Management page,
 * replacing page.tsx's old `useState<Borrowing[]>(initialData)`. Same
 * module-level cache + listener Set + in-flight-promise-dedup pattern
 * established in Phase 2 (see lib/kcs-taxonomy/taxonomy-helpers.ts).
 */
let cache: Borrowing[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadBorrowings(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/borrowings?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch borrowings (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch borrowings')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

export function useBorrowingsAdmin() {
  const [data, setData] = useState<Borrowing[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadBorrowings()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load borrowings'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return { data, loading, error }
}

export async function refetchBorrowingsAdmin(): Promise<void> {
  hasFetched = false
  await loadBorrowings()
}

async function patchBorrowing(id: string, body: Record<string, unknown>): Promise<Borrowing> {
  const res = await fetch(`/api/borrowings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update borrowing')
  await refetchBorrowingsAdmin()
  return json.data
}

export function approveBorrowing(id: string) {
  return patchBorrowing(id, { action: 'approve' })
}
export function rejectBorrowing(id: string) {
  return patchBorrowing(id, { action: 'reject' })
}
export function returnBorrowing(id: string) {
  return patchBorrowing(id, { action: 'return' })
}
export function waiveFine(id: string) {
  return patchBorrowing(id, { action: 'waiveFine' })
}
