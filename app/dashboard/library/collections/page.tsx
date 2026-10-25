import { PageHeader } from '@/components/ui/page-header'
import { requireStaffPage, pageHasPermission } from '@/lib/server/page-session'
import { listCollections, type CollectionOption } from '@/lib/data/klp-register'
import { toPlain } from '@/lib/server/to-plain'
import { CollectionsView } from './_components/collections-view'

/** KLP collection codes (SS in KLP-SS-YY-NNN-EE-F). Server-loaded with usage counts. */
export default async function KlpCollectionsPage() {
  await requireStaffPage()
  const [collections, canManage] = await Promise.all([listCollections({ withUsage: true }), pageHasPermission('library:approve')])
  return (
    <div>
      <PageHeader title="KLP Collections" subtitle="The collection codes used in every Kingdom Library Publication Code" />
      <CollectionsView initialCollections={toPlain<CollectionOption[]>(collections)} canManage={canManage} />
    </div>
  )
}
