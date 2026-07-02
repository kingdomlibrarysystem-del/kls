'use client'

import { useSyncExternalStore } from 'react'
import { initialCourseCatalog, type CourseCatalogEntry } from './course-catalog-data'

/**
 * Module-level mutable store so the Add-Course form (`/dashboard/e-learning/add`)
 * and the Course Catalog list (`/dashboard/e-learning/catalog`) share one course
 * list across route navigations, without a backend. Scoped to the admin
 * `/dashboard/e-learning/*` domain only — not shared with `/contributor/courses`
 * or `/member/courses`, which keep their own separate mock datasets.
 */
let catalog: CourseCatalogEntry[] = [...initialCourseCatalog]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return catalog
}

function nextId() {
  const max = catalog.reduce((m, c) => {
    const n = Number(c.id.replace('crs-', ''))
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return `crs-${String(max + 1).padStart(3, '0')}`
}

export function addCourseToCatalog(entry: Omit<CourseCatalogEntry, 'id' | 'enrolledCount' | 'createdAt'>) {
  const created: CourseCatalogEntry = {
    ...entry,
    id: nextId(),
    enrolledCount: 0,
    createdAt: new Date().toISOString().slice(0, 10),
  }
  catalog = [created, ...catalog]
  emitChange()
  return created
}

export function updateCourseInCatalog(id: string, updates: Partial<Omit<CourseCatalogEntry, 'id'>>) {
  catalog = catalog.map((c) => (c.id === id ? { ...c, ...updates } : c))
  emitChange()
}

export function archiveCourseInCatalog(id: string) {
  updateCourseInCatalog(id, { status: 'DRAFT' })
}

export function removeCourseFromCatalog(id: string) {
  catalog = catalog.filter((c) => c.id !== id)
  emitChange()
}

/** Live-subscribes to the shared course catalog store. */
export function useCourseCatalog() {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialCourseCatalog)
}
