import { MySubmissionsView } from '@/app/dashboard/publishing/my/_components/my-submissions-view'
import { PublishHeader } from '@/components/publishing/publish-intro'
import { requirePageAuth } from '@/lib/server/page-session'
import { getMyPublications } from '@/lib/data/publications'
import { toPlain } from '@/lib/server/to-plain'

/** Member portal: your submitted books and their review status (server-loaded). */
export default async function MemberMyBooksPage({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  const [session, { done }] = await Promise.all([requirePageAuth(), searchParams])
  const publications = await getMyPublications(session.userId)
  return (
    <div className="space-y-6">
      <PublishHeader myBooksHref="/member/publish/books" submitHref="/member/publish" view="books" />
      <MySubmissionsView initialPublications={toPlain(publications)} justDone={done === 'submitted' ? 'submitted' : done === 'saved' ? 'saved' : null} submitHref="/member/publish" />
    </div>
  )
}
