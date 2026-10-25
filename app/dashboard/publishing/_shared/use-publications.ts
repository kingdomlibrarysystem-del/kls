'use client'

import { useEffect, useState } from 'react'
import type { PublicationSubmission } from '../review/_components/review-data'
import type { BindingType, MediaType } from '@/app/dashboard/library/_components/resources-data'

/**
 * Real fetch()-backed Publication store, shared by the Review Queue,
 * Published Catalog, and Revenue pages (all three now read the same
 * real Publication collection, filtered by status — see
 * prisma/schema.prisma's Publication model docstring for why a
 * PUBLISHED row IS the catalog entry rather than a second model). Same
 * module-cache + listener-Set pattern as the rest of this migration.
 * Extends the existing PublicationSubmission type (not a parallel
 * redefinition) so review-modal.tsx/submission-preview.tsx keep working
 * unchanged against real data.
 */
export interface PublicationRecord extends PublicationSubmission {
  contributorId: string
  categoryId?: string
  author?: string
  pages?: number
  borrowPrice?: number
  documentUrl?: string
  audioUrl?: string
  videoUrl?: string
  chapters?: { title: string; body: string }[]
  /** Reviewer's reason when the book was sent back (REJECTED). */
  reviewNotes?: string
  reviewedAt?: string
  resourceId?: string
  price?: number
  quantity?: number
  bindingType?: BindingType
  mediaType?: MediaType
  featured: boolean
  revenueShare?: { contributorShare: number; platformShare: number; totalRevenue: number }
}

let cache: PublicationRecord[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadPublications(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/publications?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch publications (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch publications')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

export function usePublications() {
  const [data, setData] = useState<PublicationRecord[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadPublications()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load publications'))
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

/** Fetches a single PUBLISHED publication by ID without auth — safe for public detail pages. Does not touch the shared staff cache. */
export function usePublicPublication(id: string) {
  const [data, setData] = useState<PublicationRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/publications/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch publication')
        setData(json.data)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load publication'))
      .finally(() => setLoading(false))
  }, [id])

  return { data, loading, error }
}

export async function refetchPublications(): Promise<void> {
  hasFetched = false
  await loadPublications()
}

async function patchPublication(id: string, body: Record<string, unknown>): Promise<PublicationRecord> {
  const res = await fetch(`/api/publications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update publication')
  await refetchPublications()
  return json.data
}

export function approvePublication(id: string, notes?: string) {
  // The split is decided on the server from the admin's commission setting.
  return patchPublication(id, { action: 'approve', ...(notes && { notes }) })
}
/** Sends the book back to the publisher; `notes` (the reason) is required and shown to them. */
export function rejectPublication(id: string, notes: string) {
  return patchPublication(id, { action: 'reject', notes })
}
export function toggleFeaturedPublication(id: string) {
  return patchPublication(id, { action: 'toggleFeatured' })
}
