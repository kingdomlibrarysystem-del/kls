import { PageTransition } from '@/components/ui/page-transition'
import { PublicationDetailView } from './_components/publication-detail-view'
import { RecordResourceView } from '@/components/record-resource-view'

interface PublicationDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PublicationDetailPage({ params }: PublicationDetailPageProps) {
  const { id } = await params
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <PageTransition>
          {/* Counts this visitor as a viewer of the book (works signed out, per device). */}
          <RecordResourceView resourceId={id} />
          <PublicationDetailView id={id} />
        </PageTransition>
      </div>
    </div>
  )
}
