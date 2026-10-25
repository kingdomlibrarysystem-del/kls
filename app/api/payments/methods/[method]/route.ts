import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAdmin } from '@/lib/auth/require-role'
import { listPaymentMethodsAdmin } from '@/lib/payments/methods'
import { PAYMENT_METHOD_CODES, type PaymentMethodCode } from '@/lib/payments/shared'

const schema = z.object({
  enabled: z.boolean().optional(),
  label: z.string().trim().min(2, 'Label is required').max(60).optional(),
  description: z.string().trim().max(160).nullable().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
})

/** PATCH — admin turns a method on/off, renames it or reorders it. Turning on a method whose credentials are missing is refused. */
export const PATCH = withErrorHandling('/api/payments/methods/[method]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ method: string }> }) => {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { method } = await params
  if (!(PAYMENT_METHOD_CODES as readonly string[]).includes(method)) throw new ApiError('Unknown payment method', 404)
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)

  const current = (await listPaymentMethodsAdmin()).find((m) => m.method === method)!
  if (parsed.data.enabled && !current.configured) {
    throw new ApiError(`Add ${current.missingEnv.join(', ')} to the server environment first.`, 409)
  }
  await prisma.paymentMethodConfig.update({ where: { method: method as PaymentMethodCode }, data: parsed.data })
  const updated = (await listPaymentMethodsAdmin()).find((m) => m.method === method)
  return NextResponse.json({ data: updated, message: 'Payment method updated', code: 'success', status: 200 })
})
