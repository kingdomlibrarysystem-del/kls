import { MemberFolderView } from '@/app/member/life-sciences/_components/member-folder-view'

interface PublicLifeSciencesFolderPageProps {
  params: Promise<{ folderId: string }>
}

export const metadata = { title: 'Life Sciences Folder' }

/** Public, guest-visible list of books inside one Life Sciences folder. */
export default async function PublicLifeSciencesFolderPage({ params }: PublicLifeSciencesFolderPageProps) {
  const { folderId } = await params
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <MemberFolderView folderId={folderId} basePath="/life-sciences" />
      </div>
    </div>
  )
}
