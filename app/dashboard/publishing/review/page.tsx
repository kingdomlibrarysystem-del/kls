import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { ReviewQueueView } from './_components/review-queue-view'

export default function ReviewQueuePage() {
  return (
    <PageTransition>
      <PageHeader title="Review Queue" subtitle="Approve or reject submitted publications" />
      <ReviewQueueView />
    </PageTransition>
  )
}
