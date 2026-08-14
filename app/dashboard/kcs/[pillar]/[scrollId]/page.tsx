import { PageTransition } from '@/components/ui/page-transition'
import { ScrollDetailView } from './_components/scroll-detail-view'

interface ScrollDetailPageProps {
  params: Promise<{ pillar: string; scrollId: string }>
}

export default async function ScrollDetailPage({ params }: ScrollDetailPageProps) {
  const { pillar, scrollId } = await params
  return (
    <PageTransition>
      <ScrollDetailView pillarSlug={pillar} scrollSlug={decodeURIComponent(scrollId)} />
    </PageTransition>
  )
}
