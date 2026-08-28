/**
 * In-memory SSE hub — holds open per-user notification streams for THIS
 * Node process only. Correct on a single, always-on Node server (local
 * dev, a traditional host); NOT guaranteed correct if this app is ever
 * deployed across multiple serverless instances (e.g. Vercel functions),
 * since a broadcast() call and a subscriber's open connection can land on
 * different instances with no shared state between them — a notification
 * created on one instance would silently never reach a browser connected
 * to another. A real multi-instance deployment would need a pub/sub
 * backend (Redis or similar) fanning broadcasts across instances instead
 * of this module-level Map. Flagged in PROGRESS.md, not silently ignored.
 */

type SseEvent = { type: string }

const subscribers = new Map<string, Set<ReadableStreamDefaultController>>()

export function subscribe(userId: string, controller: ReadableStreamDefaultController): void {
  if (!subscribers.has(userId)) subscribers.set(userId, new Set())
  subscribers.get(userId)!.add(controller)
}

export function unsubscribe(userId: string, controller: ReadableStreamDefaultController): void {
  const set = subscribers.get(userId)
  if (!set) return
  set.delete(controller)
  if (set.size === 0) subscribers.delete(userId)
}

/** Fire-and-forget — never throws into the caller (mirrors notifyUser's own posture toward its email step). A closed/errored controller is dropped silently rather than crashing the broadcast for other subscribers. */
export function broadcast(userId: string, event: SseEvent): void {
  const set = subscribers.get(userId)
  if (!set) return
  const payload = `data: ${JSON.stringify(event)}\n\n`
  const encoded = new TextEncoder().encode(payload)
  for (const controller of set) {
    try {
      controller.enqueue(encoded)
    } catch {
      unsubscribe(userId, controller)
    }
  }
}

/** Testing/diagnostics only — total number of open connections across all users on this process. */
export function subscriberCount(): number {
  let total = 0
  for (const set of subscribers.values()) total += set.size
  return total
}
