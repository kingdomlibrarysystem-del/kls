import { PageTransition } from '@/components/ui/page-transition'
import { ReaderView } from './_components/reader-view'
import { loadReaderData } from '@/lib/server/reader-page'

interface ReaderPageProps {
  params: Promise<{ resourceId: string }>
  searchParams: Promise<{ chapter?: string; preview?: string }>
}

export default async function ReaderPage({ params, searchParams }: ReaderPageProps) {
  const { resourceId } = await params
  const [{ chapter, preview }, data] = await Promise.all([searchParams, loadReaderData(resourceId)])
  return (
    <PageTransition>
      <ReaderView resourceId={resourceId} resource={data.resource} readableChapters={data.readableChapters} initialChapterId={chapter} forcePreview={preview === '1'} />
    </PageTransition>
  )
}
