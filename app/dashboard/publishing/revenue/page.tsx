import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { requireStaffPage } from '@/lib/server/page-session'
import { getCommissionPercent } from '@/lib/data/publishing-revenue'
import { RevenueStats } from './_components/revenue-stats'
import { RevenueTable } from './_components/revenue-table'
import { CommissionRateCard } from '../_components/commission-rate-card'

/** Per-book earnings, and the platform commission (set by an admin, stored in Settings). */
export default async function RevenuePage() {
  const session = await requireStaffPage()
  const commission = await getCommissionPercent()
  return (
    <PageTransition>
      <PageHeader title="Revenue & Royalties" subtitle="Per-book earnings and the platform commission" />
      <CommissionRateCard percent={commission} canEdit={session.role === 'admin'} className="mb-6" />
      <RevenueStats />
      <RevenueTable />
    </PageTransition>
  )
}
