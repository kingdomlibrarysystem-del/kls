'use client'

import { useSyncExternalStore } from 'react'
import { initialFavorites, type FavoriteItem, type FavoriteType } from '../favorites/_components/favorites-data'

/**
 * Module-level mutable store so the library page's heart toggles and the
 * Favorites page's Remove action share one real favorites list across
 * route navigations, without a backend — mirrors the use-enrollments.ts
 * pattern. Previously the library page's heart toggle was local useState
 * only and never wrote here.
 */
let favorites: FavoriteItem[] = [...initialFavorites]
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

/** True if a resource/course with this id is already favorited. */
export function isFavorited(id: string) {
  return favorites.some((f) => f.id === id)
}

/** Adds an item to favorites if not already present. */
export function addFavorite(id: string, type: FavoriteType, title: string, subtitle: string) {
  if (isFavorited(id)) return
  favorites = [{ id, type, title, subtitle }, ...favorites]
  emitChange()
}

export function removeFavorite(id: string) {
  favorites = favorites.filter((f) => f.id !== id)
  emitChange()
}

/** Adds if absent, removes if present — matches a heart-toggle's expected behavior. */
export function toggleFavorite(id: string, type: FavoriteType, title: string, subtitle: string) {
  if (isFavorited(id)) removeFavorite(id)
  else addFavorite(id, type, title, subtitle)
}

/** Live-subscribes to the shared favorites store. */
export function useFavorites() {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialFavorites)
}
