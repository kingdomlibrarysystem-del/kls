import type { NextRequest } from 'next/server'
import { ApiError } from './api-error-handler'

/**
 * In-memory sliding-window rate limiter — no Redis/external store exists
 * in this project, and a single-instance Next.js deployment (the current
 * target) doesn't need one. This resets on every server restart/redeploy
 * and does not share state across horizontally-scaled instances; if this
 * app is ever deployed with multiple instances behind a load balancer,
 * this must move to a shared store (Redis, Upstash, etc.) — noted here
 * rather than silently left as a false sense of protection.
 */
const buckets = new Map<string, { count: number; windowStart: number }>()

function clientKey(request: NextRequest, scope: string): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  return `${scope}:${ip}`
}

/** Throws a 429 ApiError once `max` requests have been made for this scope+IP within `windowMs`. */
export function checkRateLimit(request: NextRequest, scope: string, { max, windowMs }: { max: number; windowMs: number }) {
  const key = clientKey(request, scope)
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now })
    return
  }

  if (bucket.count >= max) {
    throw new ApiError('Too many requests. Please try again later.', 429)
  }
  bucket.count += 1
}
