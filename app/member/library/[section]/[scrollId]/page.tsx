import { PageTransition } from '@/components/ui/page-transition'
import { ScrollDetailView } from './_components/scroll-detail-view'

interface ScrollDetailPageProps {
  params: Promise<{ section: string; scrollId: string }>
}

export default async function ScrollDetailPage({ params }: ScrollDetailPageProps) {
  const { scrollId } = await params
  return (
    <PageTransition>
      <ScrollDetailView scrollId={decodeURIComponent(scrollId)} />
    </PageTransition>
  )
}
