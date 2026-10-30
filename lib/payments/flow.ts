import { z } from 'zod'
import { ApiError } from '@/lib/api-error-handler'
import { isValidPaypackPhone } from '@/lib/paypack'
import { assertMethodAvailable, isProviderMethod } from './methods'
import { assertPhoneFor } from './attempts'
import type { PaymentMethodCode } from './shared'

/** zod field for a payment method in any flow's request body. */
export const paymentMethodField = z.enum(['PAYPACK', 'STRIPE', 'INTOUCH', 'MTN_MOMO', 'PESAPAL', 'URUBUTOPAY'])

/**
 * Checks, before a flow creates anything, that the chosen method is switched
 * on and configured, and that the phone suits it (PayPack: any Rwandan MoMo
 * number; MTN MoMo: MTN only; InTouch / UrubutoPay: MTN or Airtel). Card-style
 * methods need no phone.
 */
export async function prepareMethod(method: string, phone: string | undefined): Promise<PaymentMethodCode> {
  const m = await assertMethodAvailable(method)
  if (m === 'PAYPACK' && !isValidPaypackPhone(phone ?? '')) {
    throw new ApiError('Enter a valid Rwandan mobile money number (MTN or Airtel).', 400)
  }
  if (isProviderMethod(m)) assertPhoneFor(m, phone)
  return m
}

export { isProviderMethod }
