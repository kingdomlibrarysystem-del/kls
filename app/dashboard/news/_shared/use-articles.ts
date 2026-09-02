'use client'

import { useEffect, useState } from 'react'
import type { NewsArticle } from './news-data'

/** Real fetch()-backed NewsArticle store, mirrors use-publications.ts's exact module-cache + listener-Set pattern. */
let cache: NewsArticle[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadArticles(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/news/articles?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch articles (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch articles')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => { fetchPromise = null })
  return fetchPromise
}

export function useArticles() {
  const [data, setData] = useState<NewsArticle[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadArticles()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load articles'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => { listeners.delete(listener) }
  }, [])

  return { data, loading, error }
}

export async function refetchArticles(): Promise<void> {
  hasFetched = false
  await loadArticles()
}

export interface ArticleInput {
  authorId: string
  title: string
  content: string
  summary: string
  coverImage?: string
  category: string
  language?: 'EN' | 'FR' | 'RW'
  isEdition?: boolean
}

export async function addArticle(input: ArticleInput): Promise<NewsArticle> {
  const res = await fetch('/api/news/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to create article')
  await refetchArticles()
  return json.data
}

async function patchArticle(id: string, body: Record<string, unknown>): Promise<NewsArticle> {
  const res = await fetch(`/api/news/articles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update article')
  await refetchArticles()
  return json.data
}

export function updateArticle(id: string, input: Partial<ArticleInput>) {
  return patchArticle(id, input)
}
export function submitArticle(id: string) {
  return patchArticle(id, { action: 'submit' })
}
export function approveArticle(id: string) {
  return patchArticle(id, { action: 'approve' })
}
export function rejectArticle(id: string) {
  return patchArticle(id, { action: 'reject' })
}
export function publishArticle(id: string) {
  return patchArticle(id, { action: 'publish' })
}
export function toggleFeaturedArticle(id: string) {
  return patchArticle(id, { action: 'toggleFeatured' })
}

export async function deleteArticle(id: string): Promise<void> {
  const res = await fetch(`/api/news/articles/${id}`, { method: 'DELETE' })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to delete article')
  await refetchArticles()
}
