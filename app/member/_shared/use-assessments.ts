'use client'

import { useEffect, useState } from 'react'
import type { TakeableAssessment, Question, ProjectSubmissionFormat } from './assessment-data'

/**
 * Real fetch()-backed assessment store, replacing the module-level
 * Record<id, TakeableAssessment> mock — already a single store shared by
 * the admin Quizzes & Exams page and the member take-flow, now backed by
 * the real Assessment collection (Phase 5). Keyed by assessment id,
 * matching the mock's own Record shape so consumers need minimal changes.
 */
let cache: Record<string, TakeableAssessment> = {}
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadAssessments(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/assessments?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch assessments (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch assessments')
      const byId: Record<string, TakeableAssessment> = {}
      for (const a of json.data) byId[a.id] = a
      cache = byId
      hasFetched = true
      notify()
    })
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

export function useAssessmentCatalog() {
  const [data, setData] = useState<Record<string, TakeableAssessment>>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData({ ...cache })
    listeners.add(listener)
    if (!hasFetched) {
      loadAssessments()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load assessments'))
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

export async function refetchAssessments(): Promise<void> {
  hasFetched = false
  await loadAssessments()
}

export interface AddAssessmentInput {
  title: string
  kind: TakeableAssessment['kind']
  courseId: string
  durationSeconds?: number
  questions: Question[]
  brief?: string
  submissionFormat?: ProjectSubmissionFormat
  projectMarks?: number
}

export async function addAssessment(input: AddAssessmentInput): Promise<TakeableAssessment> {
  const res = await fetch('/api/assessments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to create assessment')
  await refetchAssessments()
  return json.data
}

export async function updateAssessment(id: string, updates: Partial<AddAssessmentInput>): Promise<void> {
  const res = await fetch(`/api/assessments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update assessment')
  await refetchAssessments()
}

export async function removeAssessment(id: string): Promise<void> {
  const res = await fetch(`/api/assessments/${id}`, { method: 'DELETE' })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to delete assessment')
  await refetchAssessments()
}
