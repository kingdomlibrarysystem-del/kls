import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BookSubmissionForm } from '@/app/dashboard/publishing/_components/book-submission-form'
import { PublishHeader, PublishSignIn } from '@/components/publishing/publish-intro'
import { getPageSession } from '@/lib/server/page-session'
import { loadBookForm } from '@/lib/server/publish-page'

export const metadata: Metadata = { title: 'Publish a Book', description: 'Submit your book to the Kingdom Library. Every submission is reviewed before it is published.' }

/**
 * Public "Publish a Book". Anyone signed in — any role — can submit; guests
 * are asked to sign in first and come back here. ?edit=<id> edits your own
 * draft / sent-back book. Review stays in the admin dashboard.
 */
export default async function PublicPublishPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const [session, { edit }] = await Promise.all([getPageSession(), searchParams])
  if (!session) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <PublishHeader myBooksHref="/publish/books" submitHref="/publish" view="submit" />
        <PublishSignIn redirect={edit ? `/publish?edit=${edit}` : '/publish'} />
      </div>
    )
  }
  const form = await loadBookForm(session, edit)
  if (!form) notFound()
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <PublishHeader editing={!!form.initial} myBooksHref="/publish/books" submitHref="/publish" view="submit" />
      <BookSubmissionForm {...form} doneHref="/publish/books" staffHelp={session.role !== 'member'} />
    </div>
  )
}
