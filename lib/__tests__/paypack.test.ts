import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import crypto from 'crypto'
import {
  isValidPaypackPhone,
  normalizePaypackPhone,
  verifyPaypackSignature,
  requestCashin,
  findTransaction,
  __resetPaypackTokenCacheForTests,
} from '../paypack'

describe('isValidPaypackPhone', () => {
  it('accepts real MTN and Airtel Rwanda prefixes', () => {
    expect(isValidPaypackPhone('0781234567')).toBe(true)
    expect(isValidPaypackPhone('0791234567')).toBe(true)
    expect(isValidPaypackPhone('0751234567')).toBe(true)
    expect(isValidPaypackPhone('0731234567')).toBe(true)
    expect(isValidPaypackPhone('0721234567')).toBe(true)
  })

  it('accepts an optional 25/+25 country-code prefix', () => {
    expect(isValidPaypackPhone('250781234567')).toBe(true)
    expect(isValidPaypackPhone('+250781234567')).toBe(true)
  })

  it('rejects unsupported prefixes and malformed numbers', () => {
    expect(isValidPaypackPhone('0701234567')).toBe(false)
    expect(isValidPaypackPhone('12345')).toBe(false)
    expect(isValidPaypackPhone('')).toBe(false)
  })
})

describe('normalizePaypackPhone', () => {
  it('strips an optional 25/+25 prefix down to the bare 07XXXXXXXX form', () => {
    expect(normalizePaypackPhone('+250781234567')).toBe('0781234567')
    expect(normalizePaypackPhone('250781234567')).toBe('0781234567')
    expect(normalizePaypackPhone('0781234567')).toBe('0781234567')
  })
})

describe('verifyPaypackSignature', () => {
  const secret = 'test-webhook-secret'

  beforeEach(() => {
    vi.stubEnv('PAYPACK_WEBHOOK_SECRET', secret)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('accepts a signature computed the same way PayPack documents (HMAC-SHA256, base64, over the raw body)', () => {
    const rawBody = JSON.stringify({ kind: 'transaction:processed', data: { ref: 'abc', status: 'successful' } })
    const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('base64')
    expect(verifyPaypackSignature(rawBody, signature)).toBe(true)
  })

  it('rejects a signature computed over a different body (e.g. re-serialized JSON)', () => {
    const rawBody = JSON.stringify({ kind: 'transaction:processed', data: { ref: 'abc', status: 'successful' } })
    const reSerialized = JSON.stringify(JSON.parse(rawBody), null, 2)
    const signatureForReSerialized = crypto.createHmac('sha256', secret).update(reSerialized).digest('base64')
    expect(verifyPaypackSignature(rawBody, signatureForReSerialized)).toBe(false)
  })

  it('rejects a missing signature header', () => {
    expect(verifyPaypackSignature('{}', null)).toBe(false)
  })

  it('rejects when PAYPACK_WEBHOOK_SECRET is not configured', () => {
    vi.stubEnv('PAYPACK_WEBHOOK_SECRET', '')
    const rawBody = '{}'
    const signature = crypto.createHmac('sha256', 'anything').update(rawBody).digest('base64')
    expect(verifyPaypackSignature(rawBody, signature)).toBe(false)
  })

  it('rejects a hex-encoded signature (PayPack signs with base64, not hex)', () => {
    const rawBody = '{"a":1}'
    const hexSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    expect(verifyPaypackSignature(rawBody, hexSignature)).toBe(false)
  })
})

describe('requestCashin', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('PAYPACK_APPLICATION_ID', 'test-id')
    vi.stubEnv('PAYPACK_APPLICATION_SECRET', 'test-secret')
    __resetPaypackTokenCacheForTests()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('rejects amounts under PayPack\'s real 100 RWF minimum without making any network call', async () => {
    await expect(requestCashin({ amountRwf: 50, phone: '0781234567', idempotencyKey: 'order-1' })).rejects.toThrow(/minimum of 100 RWF/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects an invalid phone number without making any network call', async () => {
    await expect(requestCashin({ amountRwf: 1000, phone: '0701234567', idempotencyKey: 'order-2' })).rejects.toThrow(/Invalid Rwandan/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('authenticates then sends a real cashin request with the documented request shape', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access: 'token-123', refresh: 'refresh-123', expires: new Date(Date.now() + 60_000).toISOString() }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ref: 'ref-abc', amount: 1000, status: 'pending', kind: 'CASHIN', created_at: '2026-01-01T00:00:00Z' }) })

    const result = await requestCashin({ amountRwf: 1000, phone: '0781234567', idempotencyKey: 'order-3' })

    expect(result).toEqual({ ref: 'ref-abc', amount: 1000, status: 'pending', kind: 'CASHIN', createdAt: '2026-01-01T00:00:00Z' })

    const [authUrl, authInit] = fetchMock.mock.calls[0]
    expect(authUrl).toBe('https://payments.paypack.rw/api/auth/agents/authorize')
    expect(JSON.parse(authInit.body)).toEqual({ client_id: 'test-id', client_secret: 'test-secret' })

    const [cashinUrl, cashinInit] = fetchMock.mock.calls[1]
    expect(cashinUrl).toBe('https://payments.paypack.rw/api/transactions/cashin')
    expect(cashinInit.headers.Authorization).toBe('token-123')
    expect(cashinInit.headers['Idempotency-Key']).toBe('order-3')
    expect(JSON.parse(cashinInit.body)).toEqual({ amount: 1000, number: '0781234567' })
  })

  it('throws with the server-provided message when the cashin request fails', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access: 'token-123', refresh: 'r', expires: new Date(Date.now() + 60_000).toISOString() }) })
      .mockResolvedValueOnce({ ok: false, status: 400, json: () => Promise.resolve({ message: 'Insufficient funds' }) })

    await expect(requestCashin({ amountRwf: 1000, phone: '0781234567', idempotencyKey: 'order-4' })).rejects.toThrow('Insufficient funds')
  })
})

describe('findTransaction', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('PAYPACK_APPLICATION_ID', 'test-id')
    vi.stubEnv('PAYPACK_APPLICATION_SECRET', 'test-secret')
    __resetPaypackTokenCacheForTests()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('looks up a transaction by ref using the real documented endpoint', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access: 'token-xyz', refresh: 'r', expires: new Date(Date.now() + 60_000).toISOString() }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ref: 'ref-abc', status: 'successful', amount: 1000, client: '0781234567' }) })

    const result = await findTransaction('ref-abc')

    expect(result).toEqual({ ref: 'ref-abc', status: 'successful', amount: 1000, client: '0781234567' })
    const [lookupUrl, lookupInit] = fetchMock.mock.calls[1]
    expect(lookupUrl).toBe('https://payments.paypack.rw/api/transactions/find/ref-abc')
    expect(lookupInit.headers.Authorization).toBe('token-xyz')
  })
})
