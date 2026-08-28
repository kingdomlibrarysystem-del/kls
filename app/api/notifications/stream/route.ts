import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/require-role'
import { subscribe, unsubscribe } from '@/lib/sse-hub'

// This route must run per-request, never cached/statically optimized —
// it's a long-lived stream, not a normal JSON response.
export const dynamic = 'force-dynamic'

const PING_INTERVAL_MS = 25_000

/**
 * Real-time notification stream — a member's own bell badge subscribes
 * here (see use-member-notifications.ts) so a new Notification created
 * anywhere (session approved, payment confirmed, etc.) shows up without
 * a page reload. Only ever your own stream — no userId query param to
 * spoof, matching every other "my own X" route in this codebase.
 */
export async function GET(_request: NextRequest) {
  const auth = await requireAuth()
  if (auth.response) return auth.response
  const { userId } = auth.session

  let pingTimer: ReturnType<typeof setInterval> | undefined

  const stream = new ReadableStream({
    start(controller) {
      subscribe(userId, controller)
      // Immediate comment so the browser's EventSource fires 'open' right away rather than waiting for the first real event.
      controller.enqueue(new TextEncoder().encode(': connected\n\n'))
      pingTimer = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': ping\n\n'))
        } catch {
          // Connection already closed — the cancel() callback below will clean up.
        }
      }, PING_INTERVAL_MS)
    },
    cancel(controller) {
      if (pingTimer) clearInterval(pingTimer)
      unsubscribe(userId, controller)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
