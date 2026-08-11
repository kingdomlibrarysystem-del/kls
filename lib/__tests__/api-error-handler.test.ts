import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling, ApiError, logApiError } from '../api-error-handler'

describe('ApiError', () => {
  it('carries a status and message', () => {
    const err = new ApiError('Not found', 404)
    expect(err.message).toBe('Not found')
    expect(err.status).toBe(404)
    expect(err.name).toBe('ApiError')
    expect(err).toBeInstanceOf(Error)
  })
})

describe('withErrorHandling', () => {
  const req = new NextRequest('http://localhost/api/test')

  it('returns the handler result unchanged on success', async () => {
    const handler = withErrorHandling('/api/test', 'GET', async (_req: NextRequest) =>
      NextResponse.json({ data: { ok: true }, message: 'ok', code: 'success', status: 200 })
    )
    const res = await handler(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data.ok).toBe(true)
  })

  it('converts a thrown ApiError into its own status/message', async () => {
    const handler = withErrorHandling('/api/test', 'POST', async (_req: NextRequest) => {
      throw new ApiError('Invalid input', 400)
    })
    const res = await handler(req)
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.code).toBe('error')
    expect(json.message).toBe('Invalid input')
    expect(json.data).toBeNull()
  })

  it('converts an unexpected error into a generic 500 without leaking details', async () => {
    const handler = withErrorHandling('/api/test', 'POST', async (_req: NextRequest) => {
      throw new Error('some internal secret detail')
    })
    const res = await handler(req)
    const json = await res.json()
    expect(res.status).toBe(500)
    expect(json.message).not.toContain('some internal secret detail')
    expect(json.message).toBe('An unexpected error occurred. Please try again.')
  })
})

describe('logApiError', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('logs a structured JSON object including route/method/error', () => {
    logApiError({ route: '/api/test', method: 'POST' }, new Error('boom'))
    expect(consoleSpy).toHaveBeenCalledTimes(1)
    const logged = JSON.parse(consoleSpy.mock.calls[0][0] as string)
    expect(logged.route).toBe('/api/test')
    expect(logged.method).toBe('POST')
    expect(logged.error.message).toBe('boom')
    expect(logged.level).toBe('error')
  })

  it('stringifies non-Error values safely', () => {
    logApiError({ route: '/api/test', method: 'GET' }, 'a plain string error')
    const logged = JSON.parse(consoleSpy.mock.calls[0][0] as string)
    expect(logged.error).toBe('a plain string error')
  })
})
