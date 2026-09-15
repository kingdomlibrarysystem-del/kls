import { PageHeader } from '@/components/ui/page-header'
import { SubscribersView } from './_components/subscribers-view'

export default function SubscribersPage() {
  return (
    <div>
      <PageHeader
        title="Newsletter Subscribers"
        subtitle="Manage who receives email updates for new resources, courses, lessons, and articles"
      />
      <SubscribersView />
    </div>
  )
}
