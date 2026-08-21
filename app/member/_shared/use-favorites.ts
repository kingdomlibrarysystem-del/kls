'use client'

import { useEffect, useSyncExternalStore } from 'react'
import type { FavoriteItem, FavoriteType } from '../favorites/_components/favorites-data'

/**
 * Real favorites store, backed by /api/favorites. Kept as a module-level
 * useSyncExternalStore store (not a per-component fetch hook) because
 * toggleFavorite/isFavorited/addFavorite/removeFavorite are called as
 * plain synchronous functions from many places (scroll-card.tsx,
 * scroll-detail-view.tsx) without access to a hook's return value —
 * mirrors the shape the old mock already had so those call sites don't
 * need to change, just the implementation underneath.
 *
 * `currentUserId` is set by useFavorites() on every render (from
 * useAuth()), which is what lets the module-level toggle/add/remove
 * functions know which user's favorites to mutate without threading a
 * userId through every call site.
 */
let favorites: FavoriteItem[] = []
let currentUserId: string | null = null
let loadedForUserId: string | null = null
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return favorites
}

const EMPTY: FavoriteItem[] = []

async function loadFavorites(userId: string) {
  loadedForUserId = userId
  const res = await fetch(`/api/favorites?userId=${userId}`)
  const json = await res.json()
  if (loadedForUserId !== userId) return // a newer load (or logout) superseded this one
  favorites = json.data ?? []
  emitChange()
}

/** True if a resource/course with this id is already favorited. */
export function isFavorited(id: string) {
  return favorites.some((f) => f.id === id)
}

/** Adds an item to favorites if not already present. */
export function addFavorite(id: string, type: FavoriteType, title: string, subtitle: string) {
  if (!currentUserId || isFavorited(id)) return
  const userId = currentUserId
  favorites = [{ id, type, title, subtitle }, ...favorites]
  emitChange()
  fetch('/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, itemId: id, itemType: type, title, subtitle }),
  }).catch(() => {
    favorites = favorites.filter((f) => f.id !== id)
    emitChange()
  })
}

export function removeFavorite(id: string) {
  if (!currentUserId) return
  const userId = currentUserId
  const removed = favorites.find((f) => f.id === id)
  favorites = favorites.filter((f) => f.id !== id)
  emitChange()
  fetch(`/api/favorites?userId=${userId}&itemId=${id}`, { method: 'DELETE' }).catch(() => {
    if (removed) {
      favorites = [removed, ...favorites]
      emitChange()
    }
  })
}

/** Adds if absent, removes if present — matches a heart-toggle's expected behavior. */
export function toggleFavorite(id: string, type: FavoriteType, title: string, subtitle: string) {
  if (isFavorited(id)) removeFavorite(id)
  else addFavorite(id, type, title, subtitle)
}

/** Live-subscribes to the shared favorites store, loading it from the real API for the signed-in user. */
export function useFavorites(userId?: string) {
  const resolvedUserId = userId ?? currentUserId

  useEffect(() => {
    if (!userId) return
    currentUserId = userId
    if (loadedForUserId !== userId) {
      loadFavorites(userId)
    }
  }, [userId])

  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY)
}
