import { PageHeader } from '@/components/ui/page-header'
import { requireStaffPage, pageHasPermission } from '@/lib/server/page-session'
import { getMyPublications } from '@/lib/data/publications'
import { toPlain } from '@/lib/server/to-plain'
import { MySubmissionsView } from './_components/my-submissions-view'
import { NoPermission } from '@/components/app-shell/no-permission'

/** The signed-in publisher's own books and where each one is in review. Loaded on the server. */
export default async function MySubmissionsPage({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  const session = await requireStaffPage()
  const { done } = await searchParams
  if (!(await pageHasPermission('publications:submit'))) {
    return (
      <div>
        <PageHeader title="My Submissions" subtitle="Your books and their review status" />
        <NoPermission permissionLabel="Submit Publications" />
      </div>
    )
  }
  const publications = await getMyPublications(session.userId)
  return (
    <div>
      <PageHeader title="My Submissions" subtitle="Your books and their review status" />
      <MySubmissionsView initialPublications={toPlain(publications)} justDone={done === 'submitted' ? 'submitted' : done === 'saved' ? 'saved' : null} />
    </div>
  )
}
