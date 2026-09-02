'use client'

import { useEffect, useState } from 'react'
import type { DonationCampaign } from './donations-data'

/** Real fetch()-backed DonationCampaign store, mirrors use-publications.ts's exact module-cache + listener-Set pattern. */
let cache: DonationCampaign[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadCampaigns(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/donations/campaigns')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch campaigns (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch campaigns')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => { fetchPromise = null })
  return fetchPromise
}

export function useCampaigns() {
  const [data, setData] = useState<DonationCampaign[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadCampaigns()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load campaigns'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => { listeners.delete(listener) }
  }, [])

  return { data, loading, error }
}

export async function refetchCampaigns(): Promise<void> {
  hasFetched = false
  await loadCampaigns()
}

export interface CampaignInput {
  createdById: string
  title: string
  description: string
  coverImage?: string
  category: string
  goalRwf: number
  endDate?: string
}

export async function addCampaign(input: CampaignInput): Promise<DonationCampaign> {
  const res = await fetch('/api/donations/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to create campaign')
  await refetchCampaigns()
  return json.data
}

async function patchCampaign(id: string, body: Record<string, unknown>): Promise<DonationCampaign> {
  const res = await fetch(`/api/donations/campaigns/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update campaign')
  await refetchCampaigns()
  return json.data
}

export function updateCampaign(id: string, input: Partial<CampaignInput>) {
  return patchCampaign(id, input)
}
export function archiveCampaign(id: string) {
  return patchCampaign(id, { action: 'archive' })
}
export function completeCampaign(id: string) {
  return patchCampaign(id, { action: 'complete' })
}
export function toggleFeaturedCampaign(id: string) {
  return patchCampaign(id, { action: 'toggleFeatured' })
}

export async function deleteCampaign(id: string): Promise<void> {
  const res = await fetch(`/api/donations/campaigns/${id}`, { method: 'DELETE' })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to delete campaign')
  await refetchCampaigns()
}
