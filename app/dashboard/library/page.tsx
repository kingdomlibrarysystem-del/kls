import { PageTransition } from '@/components/ui/page-transition'
import { pageHasPermission } from '@/lib/server/page-session'
import { listCollections } from '@/lib/data/klp-register'
import { toPlain } from '@/lib/server/to-plain'
import { LibraryTabs } from './_components/library-tabs'
import { LibraryView } from './_components/library-view'
import type { CollectionOption } from '@/lib/data/klp-register'

/** Approver permission and the KLP collections come from the server in parallel; the inventory list itself is the shared client store. */
export default async function AdminLibraryPage() {
  const [canApprove, collections] = await Promise.all([pageHasPermission('library:approve'), listCollections()])
  return (
    <PageTransition>
      <LibraryTabs active="inventory" />
      <LibraryView canApprove={canApprove} collections={toPlain<CollectionOption[]>(collections)} />
    </PageTransition>
  )
}
