'use client'

import { useEffect, useState } from 'react'
import type { ResearchPaper } from './repository-data'

/** Real fetch()-backed ResearchPaper store, replacing repository-data.ts's mockPapers array. */
let cache: ResearchPaper[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadPapers(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/research-papers?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch research papers (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch research papers')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

export function useRepository() {
  const [data, setData] = useState<ResearchPaper[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadPapers()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load research papers'))
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

export async function refetchRepository(): Promise<void> {
  hasFetched = false
  await loadPapers()
}

export async function addPaperToRepository(entry: { title: string; abstract: string; authorId: string; projectId: string; keywords: string[] }): Promise<ResearchPaper> {
  const res = await fetch('/api/research-papers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to submit research paper')
  await refetchRepository()
  return json.data
}
