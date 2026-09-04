'use client'

import { useEffect, useState } from 'react'

/** A single anonymous newsletter subscriber (from the homepage signup form). */
export interface NewsletterSubscriber {
  id: string
  email: string
  createdAt: string
}

/** Real fetch()-backed newsletter subscriber store, mirrors use-articles.ts's module-cache + listener-Set pattern. */
let cache: NewsletterSubscriber[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadSubscribers(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/newsletter/subscribers?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch subscribers (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch subscribers')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => { fetchPromise = null })
  return fetchPromise
}

export function useNewsletterSubscribers() {
  const [data, setData] = useState<NewsletterSubscriber[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadSubscribers()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load subscribers'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => { listeners.delete(listener) }
  }, [])

  return { data, loading, error }
}

export async function refetchSubscribers(): Promise<void> {
  hasFetched = false
  await loadSubscribers()
}

export async function deleteSubscriber(id: string): Promise<void> {
  const res = await fetch(`/api/newsletter/subscribers/${id}`, { method: 'DELETE' })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to remove subscriber')
  await refetchSubscribers()
}

/** Download every subscriber as a CSV via the API's ?export=csv branch. */
export async function exportSubscribersCsv(): Promise<void> {
  const res = await fetch('/api/newsletter/subscribers?export=csv')
  if (!res.ok) throw new Error('Failed to export subscribers')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}