'use client'

import { useEffect, useState } from 'react'
import type { Donation } from './donations-data'

/** Real fetch()-backed admin-wide Donation store, mirrors use-orders-admin.ts's pattern. */
let cache: Donation[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadDonations(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/donations?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch donations (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch donations')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => { fetchPromise = null })
  return fetchPromise
}

export function useDonationsAdmin() {
  const [data, setData] = useState<Donation[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadDonations()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load donations'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => { listeners.delete(listener) }
  }, [])

  return { data, loading, error }
}

export async function refetchDonationsAdmin(): Promise<void> {
  hasFetched = false
  await loadDonations()
}

/** Real donations against one specific campaign — the campaign-detail page's donor list. Not part of the shared admin-wide cache since it's scoped differently. */
export function useCampaignDonations(campaignId: string | undefined) {
  const [data, setData] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!campaignId) { setLoading(false); return }
    fetch(`/api/donations/campaigns/${campaignId}/donations`)
      .then((res) => res.json())
      .then((json) => setData(json.data ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [campaignId])

  return { data, loading }
}

export async function pollDonationStatus(id: string): Promise<{ id: string; status: string }> {
  const res = await fetch(`/api/donations/${id}/poll-status`, { method: 'POST' })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to refresh status')
  await refetchDonationsAdmin()
  return json.data
}
