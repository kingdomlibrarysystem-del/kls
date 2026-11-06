import { notFound } from 'next/navigation'
import { BookSubmissionForm } from '@/app/dashboard/publishing/_components/book-submission-form'
import { PublishHeader } from '@/components/publishing/publish-intro'
import { requirePageAuth } from '@/lib/server/page-session'
import { loadBookForm } from '@/lib/server/publish-page'

/** Member portal: submit a book (or edit your own draft / sent-back book with ?edit=<id>). Review happens in the admin dashboard. */
export default async function MemberPublishPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const [session, { edit }] = await Promise.all([requirePageAuth(), searchParams])
  const form = await loadBookForm(session, edit)
  if (!form) notFound()
  return (
    <div className="space-y-6">
      <PublishHeader editing={!!form.initial} myBooksHref="/member/publish/books" submitHref="/member/publish" view="submit" />
      <BookSubmissionForm {...form} doneHref="/member/publish/books" staffHelp={session.role !== 'member'} />
    </div>
  )
}
