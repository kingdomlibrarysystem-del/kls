import prisma from '@/prisma/client'
import { ApiError } from '@/lib/api-error-handler'
import { intouchProvider } from './providers/intouch'
import { mtnMomoProvider } from './providers/mtn-momo'
import { pesapalProvider } from './providers/pesapal'
import { urubutopayProvider } from './providers/urubutopay'
import type { PaymentProvider } from './types'
import { PAYMENT_METHOD_CODES, type PaymentMethodAdmin, type PaymentMethodCode, type PaymentOption } from './shared'

/** The four providers handled by lib/payments/attempts.ts. PayPack and Stripe keep their own code paths in each flow. */
export const PROVIDERS = {
  INTOUCH: intouchProvider,
  MTN_MOMO: mtnMomoProvider,
  PESAPAL: pesapalProvider,
  URUBUTOPAY: urubutopayProvider,
} satisfies Record<string, PaymentProvider>

export type ProviderMethod = keyof typeof PROVIDERS

export function isProviderMethod(m: string): m is ProviderMethod {
  return m in PROVIDERS
}

/** Integration facts per method (code, not admin data): payment style, credentials, sandbox switch. */
const INTEGRATION: Record<PaymentMethodCode, { kind: 'mobile' | 'redirect'; env: readonly string[]; modeVar?: string }> = {
  PAYPACK: { kind: 'mobile', env: ['PAYPACK_APPLICATION_ID', 'PAYPACK_APPLICATION_SECRET'] },
  STRIPE: { kind: 'redirect', env: ['STRIPE_SECRET_KEY'] },
  INTOUCH: { kind: 'mobile', env: intouchProvider.requiredEnv, modeVar: 'INTOUCH_ENV' },
  MTN_MOMO: { kind: 'mobile', env: mtnMomoProvider.requiredEnv },
  PESAPAL: { kind: 'redirect', env: pesapalProvider.requiredEnv, modeVar: 'PESAPAL_ENV' },
  URUBUTOPAY: { kind: 'mobile', env: urubutopayProvider.requiredEnv, modeVar: 'URUBUTOPAY_ENV' },
}

/**
 * Bootstrap rows, written once when the table is empty — after that the
 * admin page owns labels, order and on/off. PayPack and Stripe start enabled
 * (today's behaviour); the new providers start off until an admin turns
 * them on.
 */
const BOOTSTRAP: Record<PaymentMethodCode, { label: string; description: string; enabled: boolean }> = {
  PAYPACK: { label: 'Mobile Money', description: 'MTN MoMo or Airtel Money via PayPack', enabled: true },
  STRIPE: { label: 'Card', description: 'Visa / Mastercard via Stripe', enabled: true },
  INTOUCH: { label: 'MTN MoMo / Airtel Money', description: 'Approve the prompt on your phone (InTouch)', enabled: false },
  MTN_MOMO: { label: 'MTN MoMo', description: 'Approve the prompt on your MTN phone', enabled: false },
  PESAPAL: { label: 'Card & more', description: 'Card, mobile money and more on the secure PesaPal page', enabled: false },
  URUBUTOPAY: { label: 'MoMo / Airtel (UrubutoPay)', description: 'Approve the prompt on your phone (UrubutoPay)', enabled: false },
}

const missingEnv = (m: PaymentMethodCode) => INTEGRATION[m].env.filter((n) => !process.env[n]?.trim())
export const isMethodConfigured = (m: PaymentMethodCode) => missingEnv(m).length === 0

async function ensureRows() {
  const existing = await prisma.paymentMethodConfig.findMany({ select: { method: true } })
  const have = new Set(existing.map((e) => e.method))
  for (const [i, m] of PAYMENT_METHOD_CODES.entries()) {
    if (have.has(m)) continue
    // upsert so two first requests can't insert the same method twice.
    await prisma.paymentMethodConfig.upsert({ where: { method: m }, update: {}, create: { method: m, ...BOOTSTRAP[m], sortOrder: i + 1 } })
  }
}

export async function listPaymentMethodsAdmin(): Promise<PaymentMethodAdmin[]> {
  await ensureRows()
  const rows = await prisma.paymentMethodConfig.findMany({ orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] })
  return rows.map((r) => {
    const m = r.method as PaymentMethodCode
    const info = INTEGRATION[m]
    return {
      method: m, label: r.label, description: r.description, kind: info.kind,
      enabled: r.enabled, sortOrder: r.sortOrder,
      configured: isMethodConfigured(m), missingEnv: missingEnv(m),
      mode: info.modeVar ? ((process.env[info.modeVar] ?? '').trim().toLowerCase() === 'production' ? 'production' : 'sandbox') : null,
    }
  })
}

/** What payers can pick: enabled by an admin AND configured on this server. */
export async function getPaymentOptions(): Promise<PaymentOption[]> {
  return (await listPaymentMethodsAdmin())
    .filter((m) => m.enabled && m.configured)
    .map(({ method, label, description, kind }) => ({ method, label, description, kind }))
}

/** Throws a clear 4xx/503 when a flow is asked to use a method that is off or not configured. */
export async function assertMethodAvailable(method: string): Promise<PaymentMethodCode> {
  if (!(PAYMENT_METHOD_CODES as readonly string[]).includes(method)) throw new ApiError('Unknown payment method', 400)
  const m = method as PaymentMethodCode
  const row = (await listPaymentMethodsAdmin()).find((r) => r.method === m)
  if (!row?.enabled) throw new ApiError('This payment method is not available right now. Please choose another one.', 400)
  if (!row.configured) throw new ApiError('This payment method is not set up on the server yet. Please choose another one.', 503)
  return m
}
