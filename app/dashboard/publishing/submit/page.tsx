import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { requireStaffPage, pageHasPermission } from '@/lib/server/page-session'
import { getKcsCategoryOptions, getKcsPillarNames, getPublication, EDITABLE_STATUSES } from '@/lib/data/publications'
import { getMediaTypes } from '@/lib/data/media-types'
import { toPlain } from '@/lib/server/to-plain'
import { BookSubmissionForm } from '../_components/book-submission-form'
import { NoPermission } from '@/components/app-shell/no-permission'

/**
 * Submit a Book (or, with ?edit=<id>, edit your own draft / rejected book).
 * Needs the role permission "publications:submit" (Admin always). Categories
 * (KCS) and media types are loaded here on the server (PERFORMANCE.md Rule 15).
 */
export default async function SubmitBookPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const session = await requireStaffPage()
  const { edit } = await searchParams

  if (!(await pageHasPermission('publications:submit'))) {
    return (
      <div>
        <PageHeader title="Submit a Book" subtitle="Add your book for review" />
        <NoPermission permissionLabel="Submit Publications" />
      </div>
    )
  }

  const [categories, pillarNames, mediaTypes, editing] = await Promise.all([
    getKcsCategoryOptions(),
    getKcsPillarNames(),
    getMediaTypes(),
    edit ? getPublication(edit) : Promise.resolve(null),
  ])
  if (edit && (!editing || (editing.contributorId !== session.userId && session.role !== 'admin') || !(EDITABLE_STATUSES as readonly string[]).includes(editing.status))) {
    notFound()
  }

  return (
    <div>
      <PageHeader
        title={editing ? 'Edit Book' : 'Submit a Book'}
        subtitle={editing ? `“${editing.title}” — save, then submit it for review` : 'File your book under a KCS category; members see it once a reviewer approves it'}
      />
      <BookSubmissionForm categories={toPlain(categories)} pillarNames={pillarNames} mediaTypes={toPlain(mediaTypes)} initial={editing ? toPlain(editing) : null} />
    </div>
  )
}
