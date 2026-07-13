'use client'

import { useSyncExternalStore } from 'react'
import { mockRevenue, type RevenueRow } from './revenue-data'

/**
 * Module-level mutable store so approving a submission in the Review Queue
 * can seed a new revenue row (using the current default share config)
 * without a backend, and so the Revenue table reflects it immediately.
 */
let revenue: RevenueRow[] = [...mockRevenue]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return revenue
}

/** Default contributor/platform share applied to newly-approved publications. */
let defaultShare = { contributorShare: 70, platformShare: 30 }

export function setDefaultRevenueShare(share: { contributorShare: number; platformShare: number }) {
  defaultShare = share
}

export function addRevenueRowForApproval(publication: string, contributor: string) {
  const created: RevenueRow = {
    id: `rev-${String(revenue.length + 1).padStart(3, '0')}`,
    publication,
    contributor,
    contributorShare: defaultShare.contributorShare,
    platformShare: defaultShare.platformShare,
    totalRevenue: 0,
  }
  revenue = [created, ...revenue]
  emitChange()
  return created
}

/** Live-subscribes to the shared revenue store. */
export function useRevenue() {
  return useSyncExternalStore(subscribe, getSnapshot, () => mockRevenue)
}
