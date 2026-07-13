import { PageTransition } from '@/components/ui/page-transition'
import { PublicationDetailView } from './_components/publication-detail-view'

interface PublicationDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PublicationDetailPage({ params }: PublicationDetailPageProps) {
  const { id } = await params
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <PageTransition>
          <PublicationDetailView id={id} />
        </PageTransition>
      </div>
    </div>
  )
}
