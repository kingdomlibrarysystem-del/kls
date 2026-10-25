import { redirect } from 'next/navigation'
import { PageTransition } from '@/components/ui/page-transition'
import { ReaderView } from './_components/reader-view'
import { loadReaderData } from '@/lib/server/reader-page'
import { isResourceReadable } from '@/app/dashboard/library/_components/resources-data'
import { playableKind } from '@/lib/media-embed'

interface ReaderPageProps {
  params: Promise<{ resourceId: string }>
  searchParams: Promise<{ chapter?: string; preview?: string }>
}

export default async function ReaderPage({ params, searchParams }: ReaderPageProps) {
  const { resourceId } = await params
  const [{ chapter, preview }, data] = await Promise.all([searchParams, loadReaderData(resourceId)])
  // An audio / video title has nothing to read — send old "Read" links to its player instead of an empty reader.
  if (data.resource && !isResourceReadable(data.resource) && playableKind(data.resource)) {
    redirect(`/member/library/resource/${resourceId}#player`)
  }
  return (
    <PageTransition>
      <ReaderView resourceId={resourceId} resource={data.resource} readableChapters={data.readableChapters} initialChapterId={chapter} forcePreview={preview === '1'} />
    </PageTransition>
  )
}
