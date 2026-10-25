'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import type { ShopCart } from '@/lib/shop/shared'

/**
 * One shop cart shared by every component on the page (the "Add to cart"
 * buttons, the cart badge in the menu, the cart page). A change made anywhere
 * updates all of them at once. Loaded from /api/shop/cart for signed-in users.
 */
const EMPTY: ShopCart = { lines: [], itemCount: 0, subtotalRwf: 0 }
let state: ShopCart | null = null
let inflight: Promise<void> | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function set(next: ShopCart) {
  state = next
  emit()
}

function load(): Promise<void> {
  if (inflight) return inflight
  inflight = fetch('/api/shop/cart')
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => { if (json?.code === 'success') set(json.data) })
    .catch(() => {})
    .finally(() => { inflight = null })
  return inflight
}

async function mutate(method: 'POST' | 'DELETE', body?: unknown, query = ''): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`/api/shop/cart${query}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => null)
  if (res.ok && json?.code === 'success') {
    set(json.data)
    return { ok: true, message: json.message }
  }
  return { ok: false, message: json?.message ?? 'Something went wrong — please try again' }
}

/** `enabled` false (signed out) = empty cart, no requests. */
export function useShopCart(enabled = true) {
  const cart = useSyncExternalStore(
    useCallback((cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb) } }, []),
    () => state,
    () => null,
  )
  useEffect(() => { if (enabled) load() }, [enabled])

  return {
    cart: (enabled ? cart : null) ?? EMPTY,
    loading: enabled && cart === null,
    add: (productId: string, quantity = 1) => mutate('POST', { productId, quantity, mode: 'add' }),
    setQuantity: (productId: string, quantity: number) => mutate('POST', { productId, quantity, mode: 'set' }),
    remove: (productId: string) => mutate('DELETE', undefined, `?productId=${encodeURIComponent(productId)}`),
    refresh: load,
    /** Replace the cart after the server changed it (e.g. checkout removed the bought lines). */
    replace: set,
  }
}
