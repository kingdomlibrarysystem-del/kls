'use client'

import { useSyncExternalStore } from 'react'
import { initialUsers, type PlatformUser } from './users-data'

/**
 * Module-level mutable store so User Management's Create/Edit/Delete
 * survive a route remount instead of resetting to `initialUsers` every
 * time — mirrors the `use-audit-log.ts` / `use-resources.ts` pattern.
 */
let users: PlatformUser[] = [...initialUsers]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return users
}

export type NewUserInput = { name: string; email: string; role: PlatformUser['role']; status: PlatformUser['status'] }

/** Appends a new platform user to the shared store. */
export function addUser(data: NewUserInput): PlatformUser {
  const created: PlatformUser = { id: crypto.randomUUID(), joinDate: new Date().toISOString().split('T')[0], ...data }
  users = [created, ...users]
  emitChange()
  return created
}

/** Updates an existing platform user in place. */
export function updateUser(id: string, data: NewUserInput) {
  users = users.map((u) => (u.id === id ? { ...u, ...data } : u))
  emitChange()
}

/** Removes a platform user from the shared store. */
export function removeUser(id: string) {
  users = users.filter((u) => u.id !== id)
  emitChange()
}

/** Live-subscribes to the shared platform-user list. */
export function useUsers() {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialUsers)
}
