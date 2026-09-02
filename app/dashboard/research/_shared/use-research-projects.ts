'use client'

import { useEffect, useState } from 'react'
import type { ResearchProjectSummary } from '../collaborations/_components/collaborations-data'

/**
 * Real fetch()-backed ResearchProject store, replacing
 * collaborations-data.ts's mockProjects array. Shared by Collaborations
 * (read-only grid — no create/edit/delete UI exists) and the Submit
 * Paper form (needs the real project list to link a new paper to).
 */
let cache: ResearchProjectSummary[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadProjects(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/research-projects?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch research projects (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch research projects')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

export function useResearchProjects() {
  const [data, setData] = useState<ResearchProjectSummary[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadProjects()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load research projects'))
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

export async function refetchResearchProjects(): Promise<void> {
  hasFetched = false
  await loadProjects()
}

export interface ProjectInput {
  title: string
  description: string
  status?: string
  startDate?: string
  contributorIds?: string[]
}

export async function addResearchProject(input: ProjectInput): Promise<ResearchProjectSummary> {
  const res = await fetch('/api/research-projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to create project')
  await refetchResearchProjects()
  return json.data
}

export async function updateResearchProject(id: string, input: Partial<ProjectInput>): Promise<ResearchProjectSummary> {
  const res = await fetch(`/api/research-projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update project')
  await refetchResearchProjects()
  return json.data
}

/** Throws the raw API error message unmodified — the 409 "still has papers" guard's exact text is actionable information the caller needs to display, not a generic failure. */
export async function deleteResearchProject(id: string): Promise<void> {
  const res = await fetch(`/api/research-projects/${id}`, { method: 'DELETE' })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to delete project')
  await refetchResearchProjects()
}
