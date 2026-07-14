import { PageTransition } from '@/components/ui/page-transition'
import { ReaderView } from './_components/reader-view'

interface ReaderPageProps {
  params: Promise<{ resourceId: string }>
  searchParams: Promise<{ chapter?: string }>
}

export default async function ReaderPage({ params, searchParams }: ReaderPageProps) {
  const { resourceId } = await params
  const { chapter } = await searchParams
  return (
    <PageTransition>
      <ReaderView resourceId={resourceId} initialChapterId={chapter} />
    </PageTransition>
  )
}
