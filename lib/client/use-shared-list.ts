'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'

/**
 * Shared, de-duplicated client cache for "GET a JSON list by URL" hooks.
 *
 * Before: every component that called e.g. useEnrollments() kept its own
 * state and fired its own identical request, so the member dashboard sent
 * the same /api/enrollments?userId=... call twice, /api/borrowings twice,
 * etc., and every revisit started from an empty skeleton.
 *
 * Now, per URL:
 * - concurrent mounts share ONE in-flight request;
 * - a revisited page renders the last known data immediately (no skeleton),
 *   then revalidates in the background — every mount still refetches, so
 *   data changed elsewhere (a new borrow, a completed lesson) is never
 *   served stale for longer than one request;
 * - refetch() from any consumer updates every consumer of that URL.
 */
interface Entry {
  data: unknown[] | undefined
  inflight: Promise<void> | null
  listeners: Set<() => void>
}

const entries = new Map<string, Entry>()

function entryFor(url: string): Entry {
  let e = entries.get(url)
  if (!e) {
    e = { data: undefined, inflight: null, listeners: new Set() }
    entries.set(url, e)
  }
  return e
}

function load(url: string): Promise<void> {
  const e = entryFor(url)
  if (e.inflight) return e.inflight
  e.inflight = fetch(url)
    .then((res) => res.json())
    .then((json) => {
      e.data = Array.isArray(json?.data) ? json.data : []
    })
    .catch(() => {
      // Keep the last known data on a failed refresh; first load resolves to empty.
      if (e.data === undefined) e.data = []
    })
    .finally(() => {
      e.inflight = null
      e.listeners.forEach((l) => l())
    })
  return e.inflight
}

const EMPTY: unknown[] = []

/**
 * `url` null means "nothing to load" (e.g. no signed-in user yet) — returns
 * an empty, non-loading list, matching the previous hooks' behavior.
 */
export function useSharedList<T>(url: string | null): { data: T[]; loading: boolean; refetch: () => Promise<void> } {
  const subscribe = useCallback((onChange: () => void) => {
    if (!url) return () => {}
    const e = entryFor(url)
    e.listeners.add(onChange)
    return () => { e.listeners.delete(onChange) }
  }, [url])

  const data = useSyncExternalStore(
    subscribe,
    () => (url ? entryFor(url).data : EMPTY),
    () => undefined,
  ) as T[] | undefined

  useEffect(() => {
    if (url) load(url)
  }, [url])

  const refetch = useCallback(async () => {
    if (url) await load(url)
  }, [url])

  return { data: data ?? (EMPTY as T[]), loading: !!url && data === undefined, refetch }
}
