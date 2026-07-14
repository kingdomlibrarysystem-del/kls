'use client'

import { useSyncExternalStore } from 'react'
import { mockInvitations, type Invitation } from './invitations-data'

/**
 * Module-level mutable store so Invitations' invite/update/cancel actions
 * survive a route remount instead of resetting to `mockInvitations` every
 * time — mirrors the `use-audit-log.ts` pattern.
 */
let invitations: Invitation[] = [...mockInvitations]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return invitations
}

/** Adds a newly-sent invitation to the front of the shared list. */
export function addInvitation(invitation: Invitation) {
  invitations = [invitation, ...invitations]
  emitChange()
}

/** Replaces an existing invitation in place (e.g. status change). */
export function updateInvitation(updated: Invitation) {
  invitations = invitations.map((inv) => (inv.id === updated.id ? updated : inv))
  emitChange()
}

/** Removes an invitation from the shared list (e.g. cancel). */
export function removeInvitation(id: string) {
  invitations = invitations.filter((inv) => inv.id !== id)
  emitChange()
}

/** Live-subscribes to the shared invitations list. */
export function useInvitations() {
  return useSyncExternalStore(subscribe, getSnapshot, () => mockInvitations)
}
