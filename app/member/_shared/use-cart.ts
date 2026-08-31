'use client'

import { useEffect, useState } from 'react'

/** SALE is shown to members as "Reserve"; RENTAL is shown as "Borrow" — see CartItemType's schema docstring. */
export type CartItemType = 'SALE' | 'RENTAL'

export interface CartItem {
  id: string
  resourceId: string
  resourceTitle: string
  resourceAuthor: string
  resourceCover: string | null
  unitPriceRwf: number
  type: CartItemType
  quantity: number
  addedAt: string
}

interface CartData {
  id: string | null
  items: CartItem[]
  totalRwf: number
}

/**
 * Real shared cart store — module-level so "In Cart" state stays in sync
 * across every book-card/detail-page "Add to Cart" button and the cart
 * page itself, without each one independently refetching. Scoped to
 * whichever userId last loaded it — the store is cleared and reloaded
 * whenever the signed-in user changes (see loadCart's guard).
 */
let cache: CartData = { id: null, items: [], totalRwf: 0 }
let cachedUserId: string | null = null
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadCart(userId: string): Promise<void> {
  if (hasFetched && cachedUserId === userId) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch(`/api/cart?userId=${userId}`)
    .then((res) => res.json())
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch cart')
      cache = json.data
      cachedUserId = userId
      hasFetched = true
      notify()
    })
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

export function getCartSnapshot(): CartData {
  return cache
}

/** Whether a given resource (in this exact cart-item type) is already in the cart — for "In Cart" vs "Add to Cart" button state. */
export function isInCart(resourceId: string, type: CartItemType): boolean {
  return cache.items.some((i) => i.resourceId === resourceId && i.type === type)
}

export async function addToCart(userId: string, resourceId: string, type: CartItemType): Promise<void> {
  const res = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, resourceId, type }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to add to cart')
  cache = json.data
  cachedUserId = userId
  hasFetched = true
  notify()
}

export async function removeFromCart(itemId: string, userId: string): Promise<void> {
  const res = await fetch(`/api/cart/${itemId}`, { method: 'DELETE' })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to remove from cart')
  hasFetched = false
  await loadCart(userId)
}

/** Live-subscribes to the shared cart store, loading it from the real API for the signed-in user. */
export function useCart(userId: string | undefined) {
  const [, setTick] = useState(0)
  const [loading, setLoading] = useState(!hasFetched)

  useEffect(() => {
    const listener = () => setTick((t) => t + 1)
    listeners.add(listener)
    if (userId && (!hasFetched || cachedUserId !== userId)) {
      loadCart(userId).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => {
      listeners.delete(listener)
    }
  }, [userId])

  return { data: userId ? cache : { id: null, items: [], totalRwf: 0 }, loading }
}
