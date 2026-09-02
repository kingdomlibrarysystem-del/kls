import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { DonationHistoryTable } from './_components/donation-history-table'

export default function DonationHistoryPage() {
  return (
    <PageTransition>
      <PageHeader title="Donation History" subtitle="Every real donation, its payment status, and receipts" />
      <DonationHistoryTable />
    </PageTransition>
  )
}
