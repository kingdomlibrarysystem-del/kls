import { appBaseUrl } from '@/lib/mailer'
import { PaymentProviderError } from './types'

/** Rwanda mobile number → 2507XXXXXXXX (accepts 07…, 7…, 2507…, +2507…, spaces/dashes). Returns '' when it can't be one. */
export function toMsisdn(raw: string): string {
  const d = (raw ?? '').replace(/[\s\-()+]/g, '')
  let n = d
  if (n.startsWith('250')) n = n.slice(3)
  else if (n.startsWith('0')) n = n.slice(1)
  return /^7\d{8}$/.test(n) ? `250${n}` : ''
}

/** MTN Rwanda prefixes 078 / 079. */
export function isMtnNumber(raw: string): boolean {
  return /^2507[89]\d{7}$/.test(toMsisdn(raw))
}

/** Airtel Rwanda prefixes 072 / 073. */
export function isAirtelNumber(raw: string): boolean {
  return /^2507[23]\d{7}$/.test(toMsisdn(raw))
}

/** True for each provider: 'sandbox' unless its *_ENV variable is exactly "production" — never inferred from NODE_ENV, so a deployed build can still be tested against sandboxes. */
export function isProduction(envVar: string): boolean {
  return (process.env[envVar] ?? '').trim().toLowerCase() === 'production'
}

export function hasEnv(names: readonly string[]): boolean {
  return names.every((n) => !!process.env[n]?.trim())
}

/** JSON request with a timeout; throws PaymentProviderError with the provider's own message on a non-2xx. */
export async function requestJson<T>(url: string, init: { method?: 'GET' | 'POST'; headers?: Record<string, string>; body?: unknown; timeoutMs?: number; label: string }): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      method: init.method ?? 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...init.headers },
      ...(init.body !== undefined && { body: JSON.stringify(init.body) }),
      signal: AbortSignal.timeout(init.timeoutMs ?? 30_000),
      cache: 'no-store',
    })
  } catch (e) {
    throw new PaymentProviderError(`${init.label} could not be reached (${e instanceof Error ? e.message : 'network error'}). Please try again.`)
  }
  const text = await res.text()
  let json: unknown = null
  try { json = text ? JSON.parse(text) : null } catch { /* some endpoints answer 202 with an empty body */ }
  if (!res.ok) {
    const j = json as { message?: string; error?: { message?: string } | string } | null
    const msg = (typeof j?.error === 'string' ? j.error : j?.error?.message) || j?.message || `${init.label} answered ${res.status}`
    throw new PaymentProviderError(`${init.label}: ${msg}`)
  }
  return json as T
}

/** Absolute URL of one of our webhook/return routes (no double slash when the base URL ends with "/"). */
export function siteUrl(path: string): string {
  return `${appBaseUrl().replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}
