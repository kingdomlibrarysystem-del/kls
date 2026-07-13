import { PageTransition } from '@/components/ui/page-transition'
import { EarningsView } from './_components/earnings-view'

export default function EarningsPage() {
  return (
    <PageTransition>
      <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>
        Earnings
      </h1>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
        Revenue breakdown per publication and payout history
      </p>
      <EarningsView />
    </PageTransition>
  )
}
