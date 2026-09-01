import { PageTransition } from '@/components/ui/page-transition'
import { LibraryTabs } from './_components/library-tabs'
import { LibraryView } from './_components/library-view'

export default function AdminLibraryPage() {
  return (
    <PageTransition>
      <LibraryTabs active="inventory" />
      <LibraryView />
    </PageTransition>
  )
}
