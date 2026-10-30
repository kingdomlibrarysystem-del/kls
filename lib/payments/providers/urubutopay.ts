import { hasEnv, isAirtelNumber, isMtnNumber, isProduction, requestJson, siteUrl, toMsisdn } from '../http'
import type { PaymentProvider } from '../types'

/**
 * UrubutoPay v2 — mobile money initiation (MTN MoMo / Airtel Money; the
 * channel follows the payer's number), transaction status, and the
 * invoice / recurring / wallet / bulk-disbursement operations, ported from
 * Food Bundles (src/services/payment/urubutopay-payment.service.ts). Callbacks
 * arrive at /api/webhooks/urubutopay with `Authorization: Bearer
 * URUBUTOPAY_WEBHOOK_TOKEN`.
 */
const ENV = ['URUBUTOPAY_API_KEY', 'URUBUTOPAY_MERCHANT_CODE', 'URUBUTOPAY_SERVICE_CODE'] as const

const baseUrl = () => (isProduction('URUBUTOPAY_ENV') ? 'https://urubutopay.rw/api/v2' : 'https://staging.urubutopay.rw/api/v2')
const merchant = () => process.env.URUBUTOPAY_MERCHANT_CODE!

function call<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>(`${baseUrl()}${path}`, { label: 'UrubutoPay', headers: { Authorization: process.env.URUBUTOPAY_API_KEY! }, body })
}

/** VALID / PENDING_SETTLEMENT = paid (settlement to the merchant is UrubutoPay's side); FAILED = failed; the rest are still in progress. */
export function mapUrubutoStatus(s: string | undefined): 'PENDING' | 'SUCCESSFUL' | 'FAILED' {
  const v = (s ?? '').toUpperCase()
  if (v === 'VALID' || v === 'SUCCESSFUL' || v === 'PENDING_SETTLEMENT') return 'SUCCESSFUL'
  if (v === 'FAILED' || v === 'CANCELLED' || v === 'EXPIRED') return 'FAILED'
  return 'PENDING'
}

export const urubutopayProvider: PaymentProvider = {
  kind: 'mobile',
  requiredEnv: ENV,
  isConfigured: () => hasEnv(ENV),
  phoneError: (phone) => (isMtnNumber(phone) || isAirtelNumber(phone) ? null : 'Enter an MTN (078/079) or Airtel (072/073) number.'),

  async collect({ reference, amountRwf, phone, payer }) {
    const data = await call<{ status: number; message?: string; data?: { internal_transaction_ref_number?: string } }>('/payment/initiate', {
      merchant_code: merchant(),
      service_code: process.env.URUBUTOPAY_SERVICE_CODE,
      payer_code: payer.id ?? reference,
      payer_names: payer.name,
      payer_email: payer.email,
      amount: Math.round(amountRwf),
      channel_name: isAirtelNumber(phone ?? '') ? 'AIRTEL_MONEY' : 'MOMO',
      phone_number: toMsisdn(phone ?? ''),
      transaction_id: reference,
      redirection_url: siteUrl('/member'),
    })
    return {
      status: 'PENDING',
      providerRef: data.data?.internal_transaction_ref_number,
      providerStatus: 'INITIATED',
      message: data.message || 'Approve the payment prompt on your phone.',
    }
  },

  async checkStatus({ reference }) {
    const data = await call<{ data?: { transaction_status?: string } ; message?: string }>('/payment/transaction/status', { merchant_code: merchant(), transaction_id: reference })
    const raw = data.data?.transaction_status
    const status = mapUrubutoStatus(raw)
    return { status, providerStatus: raw ?? 'unknown', reason: status === 'FAILED' ? data.message : undefined }
  },
}

// ─── Account holder ──────────────────────────────────────────────────────────
export const urubutopayValidateWallet = (phone: string, channel: 'MOMO' | 'AIRTEL_MONEY') =>
  call<{ valid?: boolean }>('/payment/account-holder/validate', { payer_phone_number: toMsisdn(phone), payment_channel_name: channel })
export const urubutopayAccountHolder = (phone: string, channel: 'MOMO' | 'AIRTEL_MONEY' | 'BK') =>
  call<{ data?: { given_name: string; family_name: string } }>('/payment/account-holder/detail', { payer_phone_number: toMsisdn(phone), payment_channel_name: channel })

// ─── Invoices ────────────────────────────────────────────────────────────────
export const urubutopayCreateInvoice = (input: { payerPhone: string; amountRwf: number; allowCustomAmount?: boolean }) =>
  call('/invoice/create', { merchant_code: merchant(), service_code: process.env.URUBUTOPAY_SERVICE_CODE, payer_phone_number: toMsisdn(input.payerPhone), amount: Math.round(input.amountRwf), currency: 'RWF', allow_custom_amount: !!input.allowCustomAmount })
export const urubutopayInvoiceStatus = (invoiceNumber: string) => call('/invoice/status', { invoice_number: invoiceNumber })
export const urubutopayValidateInvoice = (invoiceNumber: string) => call('/invoice/validate', { invoice_number: invoiceNumber })

// ─── Recurring ───────────────────────────────────────────────────────────────
export const urubutopayExecuteRecurring = (token: string, transactionId: string, metadata?: Record<string, unknown>) =>
  call('/recurring-payment/execute', { recurring_token: token, transaction_id: transactionId, metadata })
export const urubutopayRecurringStatus = (token: string) => call('/recurring-payment/status', { recurring_token: token })
export const urubutopayStopRecurring = (token: string) => call('/recurring-payment/cancel', { recurring_token: token })

// ─── Wallet ──────────────────────────────────────────────────────────────────
export async function urubutopayWalletBalance(walletAccountId?: string): Promise<{ balance: number; currency: string }> {
  const data = await call<{ data?: { balance?: number | string; available_balance?: number | string; currency?: string } }>('/wallet/balance', walletAccountId ? { wallet_account_id: walletAccountId } : {})
  return { balance: Number(data.data?.available_balance ?? data.data?.balance ?? 0), currency: data.data?.currency ?? 'RWF' }
}

// ─── Bulk disbursement ───────────────────────────────────────────────────────
export interface UrubutopayBeneficiary { beneficiary_names: string; beneficiary_phone_number: string; amount: number; beneficiary_code: string; description?: string }
export const urubutopayDisburse = (input: { reference: string; sourceOfFunds: string; destination: 'MOMO' | 'AIRTEL_MONEY' | 'EKASH' | 'BK'; beneficiaries: UrubutopayBeneficiary[]; chargeBeneficiary?: boolean; walletAccountId?: string }) =>
  call('/bulk-disbursement/initiate', {
    source_of_funds: input.sourceOfFunds,
    source_payment_channel: 'MERCHANT_WALLET',
    destination_payment_channel: input.destination,
    external_transaction_ref_number: input.reference,
    beneficiary_to_be_charged: input.chargeBeneficiary ? 'YES' : 'NO',
    ...(input.walletAccountId && { wallet_account_id: input.walletAccountId }),
    beneficiaries: input.beneficiaries,
  })
export const urubutopayDisbursementStatus = (internalRef: string) => call('/bulk-disbursement/check-transaction', { internal_transaction_ref_number: internalRef })
export const urubutopayTransferStatus = (internalRef: string, beneficiaryCode: string) => call('/bulk-disbursement/check-transfer', { internal_transaction_ref_number: internalRef, beneficiary_code: beneficiaryCode })
