'use client'

import { useEffect, useState } from 'react'
import type { Transaction } from './sales-data'

/** Real fetch()-backed Order store for the admin Sales & Rentals page, replacing the hardcoded 8-row Transaction[] mock. */
let cache: Transaction[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadOrders(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/orders?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch orders (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch orders')
      cache = json.data.map((o: { id: string; buyerName: string; buyerEmail: string; buyerPhone: string; resourceId: string; resourceTitle: string; resourceFormat: string; type: string; amount: number; status: string; paypackRef: string | null; createdAt: string }) => ({
        id: o.id,
        buyerName: o.buyerName,
        buyerEmail: o.buyerEmail,
        buyerPhone: o.buyerPhone,
        resourceId: o.resourceId,
        resourceTitle: o.resourceTitle,
        resourceFormat: o.resourceFormat,
        type: o.type,
        amount: o.amount,
        status: o.status,
        paypackRef: o.paypackRef,
        date: o.createdAt,
      }))
      hasFetched = true
      notify()
    })
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

export function useOrdersAdmin() {
  const [data, setData] = useState<Transaction[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadOrders()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load orders'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return { data, loading, error }
}
