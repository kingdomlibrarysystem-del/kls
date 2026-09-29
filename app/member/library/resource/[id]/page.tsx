import { PageTransition } from '@/components/ui/page-transition'
import { getResourceDetail } from '@/lib/data/resources'
import { getCategoryDisplayName } from '@/lib/data/categories'
import { getResourceReviews } from '@/lib/data/reviews'
import { toPlain } from '@/lib/server/to-plain'
import { ResourceDetailView } from './_components/resource-detail-view'
import type { Resource } from '@/app/dashboard/library/_components/resources-data'
import type { Review } from './_components/resource-reviews'

interface ResourceDetailPageProps {
  params: Promise<{ id: string }>
}

/** One server round trip: the resource and its reviews in parallel, then its category name. */
export default async function ResourceDetailPage({ params }: ResourceDetailPageProps) {
  const { id } = await params
  const [resource, reviews] = await Promise.all([getResourceDetail(id), getResourceReviews(id)])
  const categoryName = resource ? await getCategoryDisplayName(resource.categoryId) : 'Uncategorized'
  return (
    <PageTransition>
      <ResourceDetailView
        resource={resource ? toPlain<Resource>(resource) : null}
        categoryName={categoryName}
        initialReviews={toPlain<Review[]>(reviews)}
      />
    </PageTransition>
  )
}
