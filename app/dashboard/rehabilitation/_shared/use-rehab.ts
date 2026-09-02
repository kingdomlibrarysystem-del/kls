'use client'

import { useEffect, useState } from 'react'
import type { SupportGroup, RehabIntake, RehabSession, RehabMilestone } from './rehab-data'

/** Real member-facing Rehabilitation hooks — groups directory, intake submission, read-only schedule/progress. Mirrors use-health.ts's pattern. */

let groupsCache: SupportGroup[] | null = null
let groupsFetchPromise: Promise<void> | null = null
const groupsListeners = new Set<() => void>()

function loadGroups(): Promise<void> {
  if (groupsCache) return Promise.resolve()
  if (groupsFetchPromise) return groupsFetchPromise
  groupsFetchPromise = fetch('/api/rehabilitation/groups')
    .then((res) => res.json())
    .then((json) => {
      groupsCache = json.data ?? []
      groupsListeners.forEach((l) => l())
    })
    .catch(() => { groupsCache = [] })
    .finally(() => { groupsFetchPromise = null })
  return groupsFetchPromise
}

export function useSupportGroups() {
  const [data, setData] = useState<SupportGroup[]>(groupsCache ?? [])
  const [loading, setLoading] = useState(!groupsCache)

  useEffect(() => {
    const listener = () => setData(groupsCache ?? [])
    groupsListeners.add(listener)
    if (!groupsCache) loadGroups().finally(() => setLoading(false))
    else setLoading(false)
    return () => { groupsListeners.delete(listener) }
  }, [])

  return { data, loading }
}

export async function joinSupportGroup(userId: string, groupId: string) {
  const res = await fetch('/api/rehabilitation/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, groupId }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to join group')
  return json.data
}

let intakes: RehabIntake[] = []
let loadedIntakesForUserId: string | null = null
const intakeListeners = new Set<() => void>()

function emitIntakesChange() {
  intakeListeners.forEach((l) => l())
}

async function loadIntakes(userId: string) {
  loadedIntakesForUserId = userId
  const res = await fetch(`/api/rehabilitation/intake?userId=${userId}`)
  const json = await res.json()
  if (loadedIntakesForUserId !== userId) return
  intakes = json.data ?? []
  emitIntakesChange()
}

export interface SubmitIntakeInput {
  concernArea: string
  history: string
  goals: string
}

/** Submits a new SUBMITTED intake for the signed-in member. Optimistic. */
export function submitIntake(userId: string, input: SubmitIntakeInput) {
  const tempId = `pending-${Date.now()}`
  const optimistic: RehabIntake = { id: tempId, status: 'SUBMITTED', submittedAt: new Date().toISOString(), ...input }
  intakes = [optimistic, ...intakes]
  emitIntakesChange()

  fetch('/api/rehabilitation/intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...input }),
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message)
      intakes = intakes.map((i) => (i.id === tempId ? json.data : i))
      emitIntakesChange()
    })
    .catch(() => {
      intakes = intakes.filter((i) => i.id !== tempId)
      emitIntakesChange()
    })
}

export function useRehabIntakes(userId: string | undefined) {
  const [data, setData] = useState<RehabIntake[]>(intakes)

  useEffect(() => {
    const listener = () => setData(intakes)
    intakeListeners.add(listener)
    if (userId && loadedIntakesForUserId !== userId) loadIntakes(userId)
    return () => { intakeListeners.delete(listener) }
  }, [userId])

  return data
}

/** Read-only, per-user program schedule — mirrors useHealthRecords (scheduling itself is staff-only, see /api/rehabilitation/schedule). */
export function useRehabSchedule(userId: string | undefined) {
  const [data, setData] = useState<RehabSession[]>([])

  useEffect(() => {
    if (!userId) { setData([]); return }
    fetch(`/api/rehabilitation/schedule?userId=${userId}`)
      .then((res) => res.json())
      .then((json) => setData(json.data ?? []))
      .catch(() => setData([]))
  }, [userId])

  return data
}

/** Read-only, per-user recovery milestones — mirrors useHealthRecords. */
export function useRehabProgress(userId: string | undefined) {
  const [data, setData] = useState<RehabMilestone[]>([])

  useEffect(() => {
    if (!userId) { setData([]); return }
    fetch(`/api/rehabilitation/progress?userId=${userId}`)
      .then((res) => res.json())
      .then((json) => setData(json.data ?? []))
      .catch(() => setData([]))
  }, [userId])

  return data
}
