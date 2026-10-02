'use client'

const ANON_ID_KEY = 'kls-anon-viewer-id'

/**
 * Stable random id for this browser/device, kept in localStorage. Lets a
 * visitor who is NOT signed in still count as exactly one viewer per book.
 */
function anonymousViewerId(): string | undefined {
  try {
    let id = window.localStorage.getItem(ANON_ID_KEY)
    if (!id) {
      id = (window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).slice(0, 64)
      window.localStorage.setItem(ANON_ID_KEY, id)
    }
    return id
  } catch {
    // Storage blocked (private mode): fall back to a per-page-load id so the view is still counted.
    return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }
}

/**
 * Records that this visitor opened a book (POST /api/resource-views). Works
 * with or without login: signed-in readers are identified by their account
 * on the server, everyone else by this device's anonymous id. `keepalive`
 * lets the request finish during navigation; failures are ignored — the
 * count must never block reading.
 */
export function recordResourceView(resourceId: string): void {
  try {
    fetch('/api/resource-views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceId, anonymousId: anonymousViewerId() }),
      keepalive: true,
    }).catch(() => {})
  } catch { /* ignore */ }
}
