/** Client-safe payment method types (no server imports). */

export type PaymentMethodCode = 'PAYPACK' | 'STRIPE' | 'INTOUCH' | 'MTN_MOMO' | 'PESAPAL' | 'URUBUTOPAY'

export const PAYMENT_METHOD_CODES: readonly PaymentMethodCode[] = ['PAYPACK', 'STRIPE', 'INTOUCH', 'MTN_MOMO', 'PESAPAL', 'URUBUTOPAY']

/** A method a payer can choose — enabled by an admin and with its credentials configured. */
export interface PaymentOption {
  method: PaymentMethodCode
  label: string
  description: string | null
  /** 'mobile' = phone number + approve the prompt; 'redirect' = sent to a secure payment page. */
  kind: 'mobile' | 'redirect'
}

/** Admin view of one method (/dashboard/settings/payments). */
export interface PaymentMethodAdmin extends PaymentOption {
  enabled: boolean
  configured: boolean
  sortOrder: number
  /** Env variable names still missing (names only, never values). */
  missingEnv: string[]
  /** "sandbox" | "production" where the provider has a switch. */
  mode: string | null
}

export const isMobileMethod = (o: Pick<PaymentOption, 'kind'>) => o.kind === 'mobile'

/** Methods that charge a phone (prompt to approve) vs. send the payer to a payment page. Integration fact, mirrors lib/payments/methods.ts. */
const MOBILE_CODES: readonly PaymentMethodCode[] = ['PAYPACK', 'INTOUCH', 'MTN_MOMO', 'URUBUTOPAY']
export const isMobileMethodCode = (code: string | null | undefined): boolean => !!code && (MOBILE_CODES as readonly string[]).includes(code)

/** Short generic wording for a past payment (the admin's current label may have changed since). */
export const paymentKindLabel = (code: string | null | undefined): string => (isMobileMethodCode(code) ? 'Mobile money' : 'Card / online payment')
