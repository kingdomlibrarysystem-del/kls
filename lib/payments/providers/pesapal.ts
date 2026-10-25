import prisma from '@/prisma/client'
import { hasEnv, isProduction, requestJson, siteUrl, toMsisdn } from '../http'
import type { PaymentProvider } from '../types'

/**
 * PesaPal API 3.0 hosted checkout (card, mobile money, …). Ported from Food
 * Bundles (src/services/payment/pesapal-payment.service.ts). The payer is
 * redirected to PesaPal; PesaPal then calls our IPN and we confirm with
 * GetTransactionStatus before settling.
 *
 * SubmitOrderRequest needs a registered IPN id: PESAPAL_IPN_ID if set,
 * otherwise our /api/webhooks/pesapal URL is registered once and the id is
 * saved on PaymentMethodConfig(PESAPAL).externalId.
 */
const ENV = ['PESAPAL_CONSUMER_KEY', 'PESAPAL_CONSUMER_SECRET'] as const

const baseUrl = () => (isProduction('PESAPAL_ENV') ? 'https://pay.pesapal.com/v3' : 'https://cybqa.pesapal.com/pesapalv3')

let cached: { token: string; expiresAt: number } | null = null

async function token(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.token
  const data = await requestJson<{ token: string; expiryDate: string; error?: { message?: string } }>(`${baseUrl()}/api/Auth/RequestToken`, {
    label: 'PesaPal',
    body: { consumer_key: process.env.PESAPAL_CONSUMER_KEY, consumer_secret: process.env.PESAPAL_CONSUMER_SECRET },
  })
  if (!data?.token) throw new Error(`PesaPal: ${data?.error?.message ?? 'authentication failed'}`)
  const exp = Date.parse(data.expiryDate)
  cached = { token: data.token, expiresAt: Number.isNaN(exp) ? Date.now() + 4 * 60_000 : exp }
  return data.token
}

const auth = async () => ({ Authorization: `Bearer ${await token()}` })

async function ipnId(): Promise<string> {
  if (process.env.PESAPAL_IPN_ID?.trim()) return process.env.PESAPAL_IPN_ID.trim()
  const saved = await prisma.paymentMethodConfig.findUnique({ where: { method: 'PESAPAL' }, select: { externalId: true } })
  if (saved?.externalId) return saved.externalId
  const data = await requestJson<{ ipn_id: string }>(`${baseUrl()}/api/URLSetup/RegisterIPN`, {
    label: 'PesaPal',
    headers: await auth(),
    body: { url: siteUrl('/api/webhooks/pesapal'), ipn_notification_type: 'POST' },
  })
  await prisma.paymentMethodConfig.updateMany({ where: { method: 'PESAPAL' }, data: { externalId: data.ipn_id } })
  return data.ipn_id
}

/** status_code: 1 COMPLETED, 2 FAILED, 3 REVERSED, 0 INVALID (not paid yet). */
export function mapPesapalStatus(code: number | undefined): 'PENDING' | 'SUCCESSFUL' | 'FAILED' {
  return code === 1 ? 'SUCCESSFUL' : code === 2 || code === 3 ? 'FAILED' : 'PENDING'
}

export const pesapalProvider: PaymentProvider = {
  kind: 'redirect',
  requiredEnv: ENV,
  isConfigured: () => hasEnv(ENV),

  async collect({ reference, amountRwf, phone, payer, description, returnUrl }) {
    const [first, ...rest] = payer.name.trim().split(/\s+/)
    const data = await requestJson<{ order_tracking_id: string; redirect_url: string; error?: unknown; status?: string }>(`${baseUrl()}/api/Transactions/SubmitOrderRequest`, {
      label: 'PesaPal',
      headers: await auth(),
      body: {
        id: reference,
        currency: 'RWF',
        amount: Math.round(amountRwf),
        description: description.slice(0, 100),
        callback_url: returnUrl,
        cancellation_url: returnUrl,
        notification_id: await ipnId(),
        billing_address: {
          email_address: payer.email,
          ...(phone && toMsisdn(phone) && { phone_number: toMsisdn(phone) }),
          country_code: 'RW',
          first_name: first || payer.name,
          last_name: rest.join(' ') || undefined,
        },
      },
    })
    if (data.error || !data.redirect_url) throw new Error(`PesaPal: ${JSON.stringify(data.error ?? 'no payment page returned')}`)
    return { status: 'PENDING', providerRef: data.order_tracking_id, redirectUrl: data.redirect_url, providerStatus: data.status, message: 'Continue on the secure PesaPal page.' }
  },

  async checkStatus({ providerRef }) {
    if (!providerRef) return { status: 'PENDING', providerStatus: 'NO_REFERENCE' }
    const data = await requestJson<{ status_code?: number; payment_status_description?: string; confirmation_code?: string; description?: string }>(
      `${baseUrl()}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(providerRef)}`,
      { label: 'PesaPal', method: 'GET', headers: await auth() },
    )
    const status = mapPesapalStatus(data.status_code)
    return { status, providerStatus: data.payment_status_description ?? String(data.status_code ?? 'unknown'), reason: status === 'FAILED' ? data.description || data.payment_status_description : undefined }
  },
}

/** Refund a completed PesaPal payment (staff action; not wired to a flow yet). */
export async function pesapalRefund(input: { confirmationCode: string; amountRwf: number; username: string; remarks: string }) {
  return requestJson<{ status: string; message: string }>(`${baseUrl()}/api/Transactions/RefundRequest`, {
    label: 'PesaPal',
    headers: await auth(),
    body: { confirmation_code: input.confirmationCode, amount: String(input.amountRwf), username: input.username, remarks: input.remarks },
  })
}
