import { redirect } from 'next/navigation'
import { MySubmissionsView } from '@/app/dashboard/publishing/my/_components/my-submissions-view'
import { PublishHeader } from '@/components/publishing/publish-intro'
import { getPageSession } from '@/lib/server/page-session'
import { getMyPublications } from '@/lib/data/publications'
import { toPlain } from '@/lib/server/to-plain'

/** The signed-in user's submitted books (public site version). Server-loaded. */
export default async function PublicMyBooksPage({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  const [session, { done }] = await Promise.all([getPageSession(), searchParams])
  if (!session) redirect('/auth/login?redirect=%2Fpublish%2Fbooks')
  const publications = await getMyPublications(session.userId)
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <PublishHeader myBooksHref="/publish/books" submitHref="/publish" view="books" />
      <MySubmissionsView initialPublications={toPlain(publications)} justDone={done === 'submitted' ? 'submitted' : done === 'saved' ? 'saved' : null} submitHref="/publish" />
    </div>
  )
}
