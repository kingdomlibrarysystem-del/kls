import crypto from 'crypto'

const BASE_URL = 'https://payments.paypack.rw/api'

const RWANDA_PHONE_PATTERN = /^(\+?25)?(078|079|075|073|072)\d{7}$/

export function isValidPaypackPhone(phone: string): boolean {
  return RWANDA_PHONE_PATTERN.test(phone.trim())
}

/** Normalizes to the bare 07XXXXXXXX form PayPack's cashin endpoint expects, stripping an optional +250/250 prefix. */
export function normalizePaypackPhone(phone: string): string {
  return phone.trim().replace(/^\+?25/, '')
}

interface AuthTokenResponse {
  access: string
  refresh: string
  expires: string
}

let cachedToken: { access: string; expiresAt: number } | null = null

/** Test-only seam — clears the module-level token cache so each test starts from a clean, unauthenticated state instead of reusing a token cached by an earlier test. */
export function __resetPaypackTokenCacheForTests(): void {
  cachedToken = null
}

/**
 * Exchanges PAYPACK_APPLICATION_ID/SECRET for a bearer token, caching it
 * until shortly before its real expiry. PayPack's own SDK sends this
 * token back as `Authorization: <token>` with NO "Bearer " prefix — a
 * verified detail from reading the SDK source directly, since the public
 * docs describe it only generically.
 */
async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.access
  }

  const res = await fetch(`${BASE_URL}/auth/agents/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.PAYPACK_APPLICATION_ID,
      client_secret: process.env.PAYPACK_APPLICATION_SECRET,
    }),
  })

  if (!res.ok) {
    throw new Error(`PayPack auth failed (${res.status})`)
  }

  const json: AuthTokenResponse = await res.json()
  const expiresAt = Date.parse(json.expires)
  cachedToken = { access: json.access, expiresAt: Number.isNaN(expiresAt) ? Date.now() + 5 * 60_000 : expiresAt }
  return json.access
}

export interface CashinResult {
  ref: string
  amount: number
  status: string
  kind: string
  createdAt: string
}

/**
 * Requests a real mobile-money charge from a customer's phone — this
 * moves real money the moment it's called; there is no PayPack sandbox
 * (confirmed against both the docs and SDK source: one base URL, one
 * live API, regardless of environment). The returned `ref` is NOT proof
 * of payment — status starts "pending" and only becomes final via the
 * `transaction:processed` webhook or a status poll.
 */
export async function requestCashin(params: { amountRwf: number; phone: string; idempotencyKey: string }): Promise<CashinResult> {
  if (params.amountRwf < 100) {
    throw new Error('PayPack cashin requires a minimum of 100 RWF')
  }
  if (!isValidPaypackPhone(params.phone)) {
    throw new Error('Invalid Rwandan mobile money number')
  }

  const token = await getAccessToken()
  const webhookMode = process.env.PAYPACK_WEBHOOK_MODE || 'production'

  const res = await fetch(`${BASE_URL}/transactions/cashin`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Idempotency-Key': params.idempotencyKey.slice(0, 32),
      'X-Webhook-Mode': webhookMode,
    },
    body: JSON.stringify({
      amount: params.amountRwf,
      number: normalizePaypackPhone(params.phone),
    }),
  })

  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.ref) {
    throw new Error(json?.message ?? `PayPack cashin request failed (${res.status})`)
  }

  return {
    ref: json.ref,
    amount: json.amount,
    status: json.status,
    kind: json.kind,
    createdAt: json.created_at,
  }
}

export interface TransactionStatus {
  ref: string
  status: string
  amount: number
  client: string
}

/** Polling fallback for when a webhook delivery is lost or delayed. */
export async function findTransaction(ref: string): Promise<TransactionStatus> {
  const token = await getAccessToken()
  const res = await fetch(`${BASE_URL}/transactions/find/${encodeURIComponent(ref)}`, {
    headers: { Authorization: token, Accept: 'application/json' },
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.ref) {
    throw new Error(json?.message ?? `PayPack transaction lookup failed (${res.status})`)
  }
  return { ref: json.ref, status: json.status, amount: json.amount, client: json.client }
}

/**
 * Verifies the `x-paypack-signature` header against the raw request
 * body — HMAC-SHA256 keyed with PAYPACK_WEBHOOK_SECRET, base64-encoded
 * (not hex, per PayPack's own documented example). Must run against the
 * exact raw bytes PayPack sent; re-serializing a parsed JSON body before
 * hashing will produce a mismatch even for a genuine webhook.
 */
export function verifyPaypackSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false
  const secret = process.env.PAYPACK_WEBHOOK_SECRET
  if (!secret) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('base64')
  const expectedBuf = Buffer.from(expected)
  const actualBuf = Buffer.from(signatureHeader)
  if (expectedBuf.length !== actualBuf.length) return false
  return crypto.timingSafeEqual(expectedBuf, actualBuf)
}

export interface PaypackWebhookPayload {
  event_id: string
  kind: string
  created_at: string
  data: {
    ref: string
    kind: string
    fee: number
    merchant: string
    client: string
    amount: number
    provider: string
    status: string
    created_at: string
    processed_at: string
  }
}
