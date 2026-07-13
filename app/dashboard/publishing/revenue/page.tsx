import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { RevenueStats } from './_components/revenue-stats'
import { RevenueTable } from './_components/revenue-table'
import { RevenueConfigForm } from './_components/revenue-config-form'

export default function RevenuePage() {
  return (
    <PageTransition>
      <PageHeader title="Revenue & Royalties" subtitle="Per-publication earnings and default revenue-share configuration" />
      <RevenueStats />
      <RevenueTable />
      <RevenueConfigForm />
    </PageTransition>
  )
}
