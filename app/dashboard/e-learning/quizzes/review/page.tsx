import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { ReviewQueueView } from './_components/review-queue-view'

export default function AssessmentReviewPage() {
  return (
    <PageTransition>
      <PageHeader title="Assessment Review" subtitle="Grade open-ended answers awaiting manager review" />
      <ReviewQueueView />
    </PageTransition>
  )
}
