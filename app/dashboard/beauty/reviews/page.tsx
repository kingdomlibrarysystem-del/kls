import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { ReviewsView } from './_components/reviews-view'

export default function BeautyReviewsPage() {
  return (
    <PageTransition>
      <PageHeader title="Reviews & Ratings" subtitle="Rate your completed appointments to help other members choose a provider" />
      <ReviewsView />
    </PageTransition>
  )
}
