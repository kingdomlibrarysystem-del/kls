import Link from 'next/link'
import { ElegantButton } from '@/components/ui/elegant-button'
import { MemberFoldersView } from '@/app/member/life-sciences/_components/member-folders-view'

export const metadata = { title: 'Life Sciences' }

/** Public, guest-visible Life Sciences folder browser. */
export default function PublicLifeSciencesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <MemberFoldersView basePath="/life-sciences" />
        <div className="mt-14 text-center border-t border-w-300 pt-10">
          <p className="font-lato text-w-700 mb-4">
            Want to save books or join the community? Create a free account.
          </p>
          <Link href="/auth/register">
            <ElegantButton variant="primary">Join Kingdom Library</ElegantButton>
          </Link>
        </div>
      </div>
    </div>
  )
}
