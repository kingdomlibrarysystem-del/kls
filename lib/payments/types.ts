/**
 * Shared contract for the mobile-money / hosted-checkout providers ported
 * from the Food Bundles backend (InTouch, MTN MoMo, PesaPal, UrubutoPay).
 * Every provider normalises its own vocabulary to these three states so the
 * attempt/settle layer (lib/payments/attempts.ts) never needs to know which
 * rail produced a result.
 */
export type AttemptState = 'PENDING' | 'SUCCESSFUL' | 'FAILED'

export interface CollectInput {
  /** Our unique transaction id (PaymentAttempt.reference) — sent to the provider and echoed back in callbacks. */
  reference: string
  amountRwf: number
  /** Payer's mobile number; required for mobile-money providers. */
  phone?: string
  payer: { id?: string; name: string; email: string }
  description: string
  /** Where a hosted checkout (PesaPal) sends the payer back to. */
  returnUrl: string
}

export interface CollectResult {
  status: AttemptState
  providerRef?: string
  /** Hosted payment page — the client redirects here (PesaPal). */
  redirectUrl?: string
  providerStatus?: string
  message: string
}

export interface StatusResult {
  status: AttemptState
  providerStatus: string
  providerRef?: string
  reason?: string
}

export interface ProviderAttemptRef {
  reference: string
  providerRef: string | null
}

export interface PaymentProvider {
  /** 'mobile' = approve a prompt on the phone, then we poll; 'redirect' = hosted payment page. */
  kind: 'mobile' | 'redirect'
  /** True when every credential this provider needs is set in the environment. */
  isConfigured(): boolean
  /** Names of the environment variables it needs (shown to admins when something is missing). */
  requiredEnv: readonly string[]
  /** Validates the phone for this provider; returns an error message or null. */
  phoneError?(phone: string): string | null
  collect(input: CollectInput): Promise<CollectResult>
  checkStatus(attempt: ProviderAttemptRef): Promise<StatusResult>
}

export class PaymentProviderError extends Error {
  constructor(message: string, public status = 502) { super(message) }
}
