'use client'

import { useSyncExternalStore } from 'react'
import { categories as initialCategories } from './taxonomy-helpers'
import type { Category } from './types'

/**
 * Module-level mutable store so the admin Categories CRUD (now the "Manage
 * Categories" section on `/dashboard/kcs`, previously a standalone
 * `/dashboard/library/categories` page before that page was absorbed into
 * KCS Map) survives a route remount instead of resetting to the seed array
 * every time — mirrors the `use-roles.ts` / `use-resources.ts` pattern
 * already established in this codebase.
 */
let categories: Category[] = [...initialCategories]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return categories
}

/** Appends a new category to the shared store. */
export function addCategory(category: Category) {
  categories = [category, ...categories]
  emitChange()
}

/** Patches an existing category in place (used by the edit panel). */
export function updateCategory(id: string, updates: Partial<Omit<Category, 'id'>>) {
  categories = categories.map((c) => (c.id === id ? { ...c, ...updates } : c))
  emitChange()
}

/** Removes a category from the shared store. */
export function removeCategory(id: string) {
  categories = categories.filter((c) => c.id !== id)
  emitChange()
}

/** Live-subscribes to the shared categories store. */
export function useCategories() {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialCategories)
}
