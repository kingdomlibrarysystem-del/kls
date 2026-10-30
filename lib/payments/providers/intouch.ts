import crypto from 'node:crypto'
import { hasEnv, isAirtelNumber, isMtnNumber, isProduction, requestJson, siteUrl, toMsisdn } from '../http'
import type { PaymentProvider, StatusResult } from '../types'

/**
 * IntouchPay — MTN MoMo and Airtel Money collection through one API.
 * Ported from Food Bundles (src/services/payment/intouch-payment.service.ts).
 * Auth on every call: username + accountno + timestamp + sha256(username +
 * accountno + partnerPassword + timestamp). Balance and deposit (payout)
 * helpers are kept for the admin payments page.
 */
const ENV = ['INTOUCH_USERNAME', 'INTOUCH_ACCOUNT_NO', 'INTOUCH_PARTNER_PASSWORD'] as const

const baseUrl = () => (isProduction('INTOUCH_ENV') ? 'https://www.intouchpay.co.rw/api' : 'https://developer.intouchpay.co.rw/api/v1/sandbox')

/** yyyyMMddHHmmss */
function timestamp(): string {
  return new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14)
}

function auth() {
  const ts = timestamp()
  const username = process.env.INTOUCH_USERNAME!
  const accountno = process.env.INTOUCH_ACCOUNT_NO!
  const password = crypto.createHash('sha256').update(`${username}${accountno}${process.env.INTOUCH_PARTNER_PASSWORD!}${ts}`).digest('hex')
  return { username, accountno, timestamp: ts, password }
}

interface IntouchResponse {
  success?: boolean
  status?: string
  statusdesc?: string
  responsecode?: string
  message?: string
  transactionid?: string
  requesttransactionid?: string
  balance?: string | number
}

/** InTouch says "Successfull" (sic) / "Pending" / "Failed"; response code 01 = success. */
export function mapIntouchStatus(status?: string, responsecode?: string): StatusResult['status'] {
  const s = (status ?? '').toLowerCase()
  if (responsecode === '01' || s.startsWith('success')) return 'SUCCESSFUL'
  if (/fail|reject|cancel|declin|expire|insufficient/.test(s)) return 'FAILED'
  return 'PENDING'
}

export const intouchProvider: PaymentProvider = {
  kind: 'mobile',
  requiredEnv: ENV,
  isConfigured: () => hasEnv(ENV),
  phoneError: (phone) => (isMtnNumber(phone) || isAirtelNumber(phone) ? null : 'Enter an MTN (078/079) or Airtel (072/073) number.'),

  async collect({ reference, amountRwf, phone }) {
    const data = await requestJson<IntouchResponse>(`${baseUrl()}/requestpayment/`, {
      label: 'InTouch',
      body: { ...auth(), amount: Math.round(amountRwf), mobilephone: toMsisdn(phone ?? ''), requesttransactionid: reference, callbackurl: `${siteUrl('/api/webhooks/intouch')}` },
    })
    // 1000 = request accepted, waiting for the payer.
    const accepted = data.success ?? data.responsecode === '1000'
    return {
      status: accepted ? 'PENDING' : 'FAILED',
      providerRef: data.transactionid,
      providerStatus: data.status ?? data.responsecode,
      message: accepted ? 'Approve the payment prompt on your phone.' : data.message || 'InTouch refused the payment request.',
    }
  },

  async checkStatus({ reference, providerRef }) {
    const data = await requestJson<IntouchResponse>(`${baseUrl()}/gettransactionstatus/`, {
      label: 'InTouch',
      body: { ...auth(), requesttransactionid: reference, transactionid: providerRef ?? '' },
    })
    const status = mapIntouchStatus(data.status, data.responsecode)
    return { status, providerStatus: data.status ?? data.responsecode ?? 'unknown', reason: status === 'FAILED' ? data.message ?? data.statusdesc : undefined }
  },
}

/** Merchant balance, for the admin payments page. */
export async function intouchBalance(): Promise<{ balance: number; currency: string }> {
  const data = await requestJson<IntouchResponse>(`${baseUrl()}/getbalance/`, { label: 'InTouch', body: auth() })
  return { balance: Number(data.balance ?? 0), currency: 'RWF' }
}

/** B2C payout to a mobile wallet (not used by any flow yet — kept from the Food Bundles service for refunds/payouts). */
export async function intouchDeposit(input: { amountRwf: number; phone: string; reference: string; reason: string }) {
  return requestJson<IntouchResponse>(`${baseUrl()}/requestdeposit/`, {
    label: 'InTouch',
    body: { ...auth(), amount: Math.round(input.amountRwf), mobilephone: toMsisdn(input.phone), requesttransactionid: input.reference, reason: input.reason, callbackurl: `${siteUrl('/api/webhooks/intouch')}`, withdrawcharge: 1, sid: 1 },
  })
}
