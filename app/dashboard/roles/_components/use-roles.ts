'use client'

import { useSyncExternalStore } from 'react'
import { initialRoles, type Role } from './roles-data'

/**
 * Module-level mutable store so Role & Permission Management's
 * Create/Edit/Delete survive a route remount instead of resetting to
 * `initialRoles` every time — mirrors the `use-audit-log.ts` pattern.
 */
let roles: Role[] = [...initialRoles]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return roles
}

export type NewRoleInput = { name: string; description: string; permissions: string[] }

/** Appends a new role to the shared store. */
export function addRole(data: NewRoleInput): Role {
  const created: Role = { id: crypto.randomUUID(), userCount: 0, ...data }
  roles = [...roles, created]
  emitChange()
  return created
}

/** Replaces an existing role in place (used by the edit modal, which submits the full updated Role). */
export function updateRole(role: Role) {
  roles = roles.map((r) => (r.id === role.id ? role : r))
  emitChange()
}

/** Removes a role from the shared store. */
export function removeRole(id: string) {
  roles = roles.filter((r) => r.id !== id)
  emitChange()
}

/** Live-subscribes to the shared roles list. */
export function useRoles() {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialRoles)
}
