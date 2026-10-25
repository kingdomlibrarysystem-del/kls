import prisma from '@/prisma/client'
import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { requireStaffPage, pageHasPermission } from '@/lib/server/page-session'
import { REVENUE_INCLUDE, REVIEW_STATUSES, serializePublication } from '@/lib/data/publications'
import { toPlain } from '@/lib/server/to-plain'
import { ReviewQueueView } from './_components/review-queue-view'

/**
 * Books waiting for review, loaded on the server. Approving publishes the
 * book to the library for members; only roles with "publications:approve"
 * (and Admin) may decide, never on their own book.
 *
 * Before: the queue fetched /api/publications without a status, which the
 * API treats as the PUBLIC catalog (published books only) — so submitted
 * books never appeared here.
 */
export default async function ReviewQueuePage() {
  const session = await requireStaffPage()
  const [rows, canApprove] = await Promise.all([
    prisma.publication.findMany({ where: { status: { in: [...REVIEW_STATUSES] } }, include: REVENUE_INCLUDE, orderBy: { submittedAt: 'asc' } }),
    pageHasPermission('publications:approve'),
  ])
  return (
    <PageTransition>
      <PageHeader title="Review Queue" subtitle="Approve books to publish them to the library, or send them back with a reason" />
      <ReviewQueueView
        initialQueue={toPlain(rows.map(serializePublication))}
        canApprove={canApprove}
        currentUserId={session.userId}
        isAdmin={session.role === 'admin'}
      />
    </PageTransition>
  )
}
