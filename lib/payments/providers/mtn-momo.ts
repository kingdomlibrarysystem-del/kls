import { randomUUID } from 'node:crypto'
import { hasEnv, isMtnNumber, requestJson, siteUrl, toMsisdn } from '../http'
import type { PaymentProvider } from '../types'

/**
 * MTN Mobile Money direct Collection API (RequestToPay), Rwanda production
 * proxy by default. Ported from Food Bundles
 * (src/services/payment/mtn-payment.service.ts). MTN needs its own UUID per
 * request (X-Reference-Id) — stored as the attempt's providerRef; our
 * reference travels as externalId.
 */
const ENV = ['MTN_MOMO_COLLECTION_PRIMARY_KEY', 'MTN_MOMO_REFERENCE_ID', 'MTN_MOMO_API_KEY'] as const

const baseUrl = () => (process.env.MTN_MOMO_BASE_URL?.trim() || 'https://proxy.momoapi.mtn.co.rw').replace(/\/+$/, '')
const targetEnv = () => process.env.MTN_MOMO_ENVIRONMENT?.trim() || 'mtnrwanda'
const currency = () => process.env.MTN_MOMO_CURRENCY?.trim() || 'RWF'
const subKey = () => process.env.MTN_MOMO_COLLECTION_PRIMARY_KEY!

let cached: { token: string; expiresAt: number } | null = null

async function token(): Promise<string> {
  if (cached && cached.expiresAt > Date.now()) return cached.token
  const basic = Buffer.from(`${process.env.MTN_MOMO_REFERENCE_ID}:${process.env.MTN_MOMO_API_KEY}`).toString('base64')
  const data = await requestJson<{ access_token: string; expires_in: number }>(`${baseUrl()}/collection/token/`, {
    label: 'MTN MoMo',
    headers: { Authorization: `Basic ${basic}`, 'Ocp-Apim-Subscription-Key': subKey() },
    body: {},
  })
  // Refresh five minutes early.
  cached = { token: data.access_token, expiresAt: Date.now() + Math.max(60, (data.expires_in ?? 3600) - 300) * 1000 }
  return data.access_token
}

const headers = async () => ({ Authorization: `Bearer ${await token()}`, 'X-Target-Environment': targetEnv(), 'Ocp-Apim-Subscription-Key': subKey() })

export const mtnMomoProvider: PaymentProvider = {
  kind: 'mobile',
  requiredEnv: ENV,
  isConfigured: () => hasEnv(ENV),
  phoneError: (phone) => (isMtnNumber(phone) ? null : 'MTN MoMo needs an MTN number (078 or 079).'),

  async collect({ reference, amountRwf, phone, description }) {
    const providerRef = randomUUID()
    await requestJson(`${baseUrl()}/collection/v1_0/requesttopay`, {
      label: 'MTN MoMo',
      headers: { ...(await headers()), 'X-Reference-Id': providerRef, 'X-Callback-Url': siteUrl('/api/webhooks/mtn-momo') },
      body: {
        amount: String(Math.round(amountRwf)),
        currency: currency(),
        externalId: reference,
        payer: { partyIdType: 'MSISDN', partyId: toMsisdn(phone ?? '') },
        payerMessage: description.slice(0, 160),
        payeeNote: `Kingdom Library ${reference}`,
      },
    })
    return { status: 'PENDING', providerRef, providerStatus: 'PENDING', message: 'Approve the MTN MoMo prompt on your phone.' }
  },

  async checkStatus({ providerRef }) {
    if (!providerRef) return { status: 'PENDING', providerStatus: 'NO_REFERENCE' }
    const data = await requestJson<{ status: string; reason?: string | { message?: string }; financialTransactionId?: string }>(
      `${baseUrl()}/collection/v1_0/requesttopay/${providerRef}`,
      { label: 'MTN MoMo', method: 'GET', headers: await headers() },
    )
    const s = (data.status ?? '').toUpperCase()
    const reason = typeof data.reason === 'string' ? data.reason : data.reason?.message
    return { status: s === 'SUCCESSFUL' ? 'SUCCESSFUL' : s === 'FAILED' || s === 'REJECTED' || s === 'TIMEOUT' ? 'FAILED' : 'PENDING', providerStatus: s || 'unknown', reason }
  },
}

/** Collection account balance, for the admin payments page. */
export async function mtnMomoBalance(): Promise<{ balance: number; currency: string }> {
  const data = await requestJson<{ availableBalance: string; currency: string }>(`${baseUrl()}/collection/v1_0/account/balance`, { label: 'MTN MoMo', method: 'GET', headers: await headers() })
  return { balance: Number(data.availableBalance ?? 0), currency: data.currency ?? 'RWF' }
}
