import { PageHeader } from '@/components/ui/page-header'
import { RecordsView } from './_components/records-view'

export default function HealthRecordsPage() {
  return (
    <div>
      <PageHeader title="Health Records" subtitle="Your consultation history, prescriptions, and referrals" />
      <RecordsView />
    </div>
  )
}
