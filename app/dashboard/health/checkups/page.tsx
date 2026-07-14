import { PageHeader } from '@/components/ui/page-header'
import { CheckupsView } from './_components/checkups-view'

export default function BookCheckupPage() {
  return (
    <div>
      <PageHeader title="Book a Checkup" subtitle="Schedule a general health checkup with a partnered clinic" />
      <CheckupsView />
    </div>
  )
}
