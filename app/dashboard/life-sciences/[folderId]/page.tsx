import { PageTransition } from '@/components/ui/page-transition'
import { FolderDetailView } from '../_components/folder-detail-view'

interface FolderPageProps {
  params: Promise<{ folderId: string }>
}

export default async function LifeSciencesFolderPage({ params }: FolderPageProps) {
  const { folderId } = await params
  return (
    <PageTransition>
      <FolderDetailView folderId={folderId} />
    </PageTransition>
  )
}
