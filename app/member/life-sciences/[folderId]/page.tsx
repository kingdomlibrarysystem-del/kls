import { PageTransition } from '@/components/ui/page-transition'
import { MemberFolderView } from '../_components/member-folder-view'

interface MemberFolderPageProps {
  params: Promise<{ folderId: string }>
}

export default async function MemberLifeSciencesFolderPage({ params }: MemberFolderPageProps) {
  const { folderId } = await params
  return (
    <PageTransition>
      <MemberFolderView folderId={folderId} />
    </PageTransition>
  )
}
