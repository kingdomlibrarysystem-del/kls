import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { ReviewQueueView } from './_components/review-queue-view'

export default function NewsReviewPage() {
  return (
    <PageTransition>
      <PageHeader title="Review Queue" subtitle="Approve or reject articles submitted for review" />
      <ReviewQueueView />
    </PageTransition>
  )
}
