import { PageTransition } from '@/components/ui/page-transition'
import { LibraryView } from './_components/library-view'

export default function AdminLibraryPage() {
  return (
    <PageTransition>
      <LibraryView />
    </PageTransition>
  )
}
