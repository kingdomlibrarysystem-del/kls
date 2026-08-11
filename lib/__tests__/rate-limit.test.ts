import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { checkRateLimit } from '../rate-limit'
import { ApiError } from '../api-error-handler'

function makeRequest(ip: string) {
  return new NextRequest('http://localhost/api/auth/login', {
    headers: { 'x-forwarded-for': ip },
  })
}

describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    const req = makeRequest('10.0.0.1')
    for (let i = 0; i < 3; i++) {
      expect(() => checkRateLimit(req, 'test:under-limit', { max: 3, windowMs: 60_000 })).not.toThrow()
    }
  })

  it('throws a 429 ApiError once the limit is exceeded', () => {
    const req = makeRequest('10.0.0.2')
    for (let i = 0; i < 3; i++) {
      checkRateLimit(req, 'test:exceed-limit', { max: 3, windowMs: 60_000 })
    }
    expect(() => checkRateLimit(req, 'test:exceed-limit', { max: 3, windowMs: 60_000 })).toThrow(ApiError)
    try {
      checkRateLimit(req, 'test:exceed-limit', { max: 3, windowMs: 60_000 })
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).status).toBe(429)
    }
  })

  it('tracks separate buckets per IP', () => {
    const reqA = makeRequest('10.0.0.3')
    const reqB = makeRequest('10.0.0.4')
    for (let i = 0; i < 3; i++) {
      checkRateLimit(reqA, 'test:per-ip', { max: 3, windowMs: 60_000 })
    }
    expect(() => checkRateLimit(reqA, 'test:per-ip', { max: 3, windowMs: 60_000 })).toThrow(ApiError)
    expect(() => checkRateLimit(reqB, 'test:per-ip', { max: 3, windowMs: 60_000 })).not.toThrow()
  })

  it('tracks separate buckets per scope for the same IP', () => {
    const req = makeRequest('10.0.0.5')
    for (let i = 0; i < 3; i++) {
      checkRateLimit(req, 'test:scope-a', { max: 3, windowMs: 60_000 })
    }
    expect(() => checkRateLimit(req, 'test:scope-a', { max: 3, windowMs: 60_000 })).toThrow(ApiError)
    expect(() => checkRateLimit(req, 'test:scope-b', { max: 3, windowMs: 60_000 })).not.toThrow()
  })

  it('resets the window after windowMs has elapsed', async () => {
    const req = makeRequest('10.0.0.6')
    checkRateLimit(req, 'test:window-reset', { max: 1, windowMs: 50 })
    expect(() => checkRateLimit(req, 'test:window-reset', { max: 1, windowMs: 50 })).toThrow(ApiError)
    await new Promise((r) => setTimeout(r, 60))
    expect(() => checkRateLimit(req, 'test:window-reset', { max: 1, windowMs: 50 })).not.toThrow()
  })
})
