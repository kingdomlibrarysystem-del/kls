import { ReaderView } from '@/app/member/library/read/[resourceId]/_components/reader-view'
import { loadReaderData } from '@/lib/server/reader-page'

interface AdminReaderPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ chapter?: string; preview?: string }>
}

/**
 * Admin-side entry point into the exact same reader used by members —
 * reuses ReaderView/PdfReaderView directly rather than duplicating the
 * reading UI, so staff stay inside dashboard navigation/chrome (real
 * sidebar, "Back to Book Inventory") instead of being sent into the
 * member portal via a new-tab link, which was the only way to read a
 * resource from the admin side before this route existed.
 */
export default async function AdminReaderPage({ params, searchParams }: AdminReaderPageProps) {
  const { id } = await params
  const [{ chapter, preview }, data] = await Promise.all([searchParams, loadReaderData(id)])
  return (
    <ReaderView resourceId={id} resource={data.resource} readableChapters={data.readableChapters} initialChapterId={chapter} forcePreview={preview === '1'} backHref="/dashboard/library" />
  )
}
