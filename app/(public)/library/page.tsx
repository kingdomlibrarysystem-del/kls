import { Suspense } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { ElegantButton } from '@/components/ui/elegant-button'
import { LibraryBrowser } from './_components/library-browser'

/**
 * Browse the Library: reads the same shared resources store the admin
 * Book Inventory manages (`/dashboard/library`) — previously this page had
 * its own disconnected inline `books` array with a different ID scheme
 * and no quantity/binding/media data, which drifted from the real
 * inventory and couldn't support real availability checks.
 */
export default function LibraryPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <PageHeader
          title="Browse the Library"
          subtitle="Discover books, journals, and digital resources"
          className="text-center"
        />
        <Suspense fallback={null}>
          <LibraryBrowser />
        </Suspense>
        <div className="mt-14 text-center border-t border-w-300 pt-10">
          <p className="font-lato text-w-700 mb-4">
            Want to borrow or reserve books? Create a free account.
          </p>
          <Link href="/auth/register">
            <ElegantButton variant="primary">Join Kingdom Library</ElegantButton>
          </Link>
        </div>
      </div>
    </div>
  )
}
