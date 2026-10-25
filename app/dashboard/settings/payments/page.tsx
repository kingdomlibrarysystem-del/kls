import prisma from '@/prisma/client'
import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { NoPermission } from '@/components/app-shell/no-permission'
import { requireStaffPage } from '@/lib/server/page-session'
import { listPaymentMethodsAdmin } from '@/lib/payments/methods'
import { siteUrl } from '@/lib/payments/http'
import { toPlain } from '@/lib/server/to-plain'
import type { PaymentMethodAdmin } from '@/lib/payments/shared'
import { PaymentMethodsView, type RecentAttempt } from './_components/payment-methods-view'

/** Admin: which payment methods payers see, their setup state, webhook URLs and the latest provider transactions. Server-loaded. */
export default async function PaymentMethodsPage() {
  const session = await requireStaffPage()
  if (session.role !== 'admin') {
    return <PageTransition><PageHeader title="Payment Methods" /><NoPermission permissionLabel="Admin" /></PageTransition>
  }
  const [methods, attempts] = await Promise.all([
    listPaymentMethodsAdmin(),
    prisma.paymentAttempt.findMany({
      orderBy: { createdAt: 'desc' }, take: 25,
      select: { id: true, provider: true, targetKind: true, reference: true, amountRwf: true, phone: true, status: true, providerStatus: true, failureReason: true, createdAt: true },
    }),
  ])
  const webhooks = {
    INTOUCH: siteUrl('/api/webhooks/intouch'),
    MTN_MOMO: siteUrl('/api/webhooks/mtn-momo'),
    PESAPAL: siteUrl('/api/webhooks/pesapal'),
    URUBUTOPAY: siteUrl('/api/webhooks/urubutopay'),
    PAYPACK: siteUrl('/api/webhooks/paypack'),
    STRIPE: siteUrl('/api/webhooks/stripe'),
  }
  return (
    <PageTransition>
      <PageHeader title="Payment Methods" subtitle="Choose how members pay — mobile money and card providers" />
      <PaymentMethodsView initialMethods={toPlain<PaymentMethodAdmin[]>(methods)} recent={toPlain<RecentAttempt[]>(attempts)} webhooks={webhooks} />
    </PageTransition>
  )
}
