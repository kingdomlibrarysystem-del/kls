import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckoutView } from './_components/checkout-view'

export default function CheckoutPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Cinzel',serif" }}>
          Checkout
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          Review your items and pay in one transaction
        </div>
      </div>
      <Suspense fallback={<Skeleton style={{ height: 320, borderRadius: 8, maxWidth: 640 }} />}>
        <CheckoutView />
      </Suspense>
    </div>
  )
}
