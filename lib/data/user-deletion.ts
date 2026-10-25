import prisma from '@/prisma/client'

/**
 * Deleting a user (DELETE /api/users/[id]).
 *
 * MongoDB has no foreign keys, so Prisma enforces relations itself: a plain
 * `user.delete` fails (500) as soon as ANY required relation without
 * `onDelete: Cascade` still points at the user (orders, borrows, reviews,
 * enrollments, messages...). That is why deleting most real users failed.
 *
 * Rule:
 *  1. REFUSE (409, with the reason) when deleting would break data other
 *     people rely on — see `getDeletionBlockers`. The admin can suspend the
 *     account instead.
 *  2. Otherwise delete the user AND everything that belongs only to them, in
 *     one transaction, after clearing optional references to them (invited
 *     by, lecturer, reviewer, facilitator) so other people's records stay.
 *  3. Recompute the rating of every book they had reviewed.
 */

/** Human-readable reasons this user cannot be deleted; empty = safe to delete. */
export async function getDeletionBlockers(userId: string): Promise<string[]> {
  const [articles, publications, papers, campaigns, notesAboutOthers, milestonesForOthers, openBorrows, donations] = await Promise.all([
    prisma.newsArticle.count({ where: { authorId: userId } }),
    prisma.publication.count({ where: { contributorId: userId } }),
    prisma.researchPaper.count({ where: { authorId: userId } }),
    prisma.donationCampaign.count({ where: { createdById: userId } }),
    prisma.counselingNote.count({ where: { authorId: userId, userId: { not: userId } } }),
    prisma.rehabMilestone.count({ where: { recordedById: userId, userId: { not: userId } } }),
    prisma.borrow.count({ where: { userId, status: { in: ['ACTIVE', 'OVERDUE'] } } }),
    prisma.donation.count({ where: { userId } }),
  ])
  const n = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`
  return [
    articles && `wrote ${n(articles, 'news article')}`,
    publications && `submitted ${n(publications, 'publication')}`,
    papers && `authored ${n(papers, 'research paper')}`,
    campaigns && `created ${n(campaigns, 'donation campaign')}`,
    notesAboutOthers && `wrote ${n(notesAboutOthers, 'counseling note')} about other members`,
    milestonesForOthers && `recorded ${n(milestonesForOthers, 'rehabilitation milestone')} for other members`,
    openBorrows && `still has ${n(openBorrows, 'borrowed book')} not returned`,
    donations && `made ${n(donations, 'donation')} (they count toward campaign totals)`,
  ].filter((r): r is string => typeof r === 'string')
}


/** Progress of a permanent delete: `done` of `total` steps finished; `label` is the step just completed. */
export interface DeletionProgress {
  done: number
  total: number
  label: string
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

/**
 * Deletes the user and everything that is only theirs. Call
 * getDeletionBlockers first. Runs as named steps inside ONE transaction
 * (all-or-nothing) and calls `onProgress` after each step, so the admin
 * screen can show real progress — each step is a round trip to the database,
 * which is why a permanent delete takes a few seconds.
 */
export async function deleteUserAndOwnData(userId: string, onProgress?: (p: DeletionProgress) => void): Promise<void> {
  const reviewedResourceIds = (await prisma.review.findMany({ where: { userId }, select: { resourceId: true } })).map((r) => r.resourceId)
  const [orderIds, cartIds, sessionRequestIds] = await Promise.all([
    prisma.order.findMany({ where: { userId }, select: { id: true } }).then((rows) => rows.map((r) => r.id)),
    prisma.cart.findMany({ where: { userId }, select: { id: true } }).then((rows) => rows.map((r) => r.id)),
    prisma.sessionRequest.findMany({ where: { learnerId: userId }, select: { id: true } }).then((rows) => rows.map((r) => r.id)),
  ])

  const steps: [label: string, run: (tx: Tx) => Promise<unknown>][] = [
    // Keep other people's records: clear optional references to this user.
    ['Keeping other people’s records', async (tx) => {
      await tx.invitation.updateMany({ where: { invitedByUserId: userId }, data: { invitedByUserId: null } })
      await tx.course.updateMany({ where: { lecturerId: userId }, data: { lecturerId: null } })
      await tx.sessionRequest.updateMany({ where: { lecturerId: userId }, data: { lecturerId: null } })
      await tx.rehabIntake.updateMany({ where: { reviewedById: userId }, data: { reviewedById: null } })
      await tx.rehabSession.updateMany({ where: { facilitatorId: userId }, data: { facilitatorId: null } })
    }],
    // Their own records whose relation does not cascade (children first).
    ['Cart', async (tx) => {
      await tx.cartItem.deleteMany({ where: { cartId: { in: cartIds } } })
      await tx.cart.deleteMany({ where: { userId } })
    }],
    ['Orders and payments', async (tx) => {
      await tx.order.deleteMany({ where: { id: { in: orderIds } } })
      await tx.checkout.deleteMany({ where: { userId } })
      await tx.courseOrder.deleteMany({ where: { userId } })
    }],
    ['Reviews', (tx) => tx.review.deleteMany({ where: { userId } })],
    ['Borrowing history and reservations', async (tx) => {
      await tx.borrow.deleteMany({ where: { userId } })
      await tx.reservation.deleteMany({ where: { userId } })
    }],
    ['Courses, results and certificates', async (tx) => {
      await tx.enrollment.deleteMany({ where: { userId } })
      await tx.assessmentAttempt.deleteMany({ where: { userId } })
      await tx.certificate.deleteMany({ where: { userId } })
      await tx.sessionPresence.deleteMany({ where: { sessionRequestId: { in: sessionRequestIds } } })
      await tx.sessionRequest.deleteMany({ where: { learnerId: userId } })
    }],
    ['Research memberships', (tx) => tx.projectMember.deleteMany({ where: { userId } })],
    ['Messages and notifications', async (tx) => {
      await tx.message.deleteMany({ where: { senderId: userId } })
      await tx.notification.deleteMany({ where: { recipientId: userId } })
    }],
    ['News comments and likes', async (tx) => {
      await tx.newsArticleComment.deleteMany({ where: { userId } })
      await tx.newsArticleReaction.deleteMany({ where: { userId } })
    }],
    // Their own counseling notes / milestones: the subject relation cascades, the author relation does not.
    ['Counseling and rehabilitation notes', async (tx) => {
      await tx.counselingNote.deleteMany({ where: { authorId: userId } })
      await tx.rehabMilestone.deleteMany({ where: { recordedById: userId } })
    }],
    // View rows are keyed by "u:<id>" (no relation).
    ['Reading and viewing history', async (tx) => {
      await tx.resourceView.deleteMany({ where: { viewerKey: `u:${userId}` } })
      await tx.newsArticleView.deleteMany({ where: { viewerKey: `u:${userId}` } })
    }],
    // Everything else (sessions, favorites, progress, notes, appointments,
    // health, beauty, counseling, rehab, subscriptions...) cascades.
    ['Account', (tx) => tx.user.delete({ where: { id: userId } })],
  ]
  // +1 for recomputing book ratings after the transaction.
  const total = steps.length + 1

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < steps.length; i++) {
      const [label, run] = steps[i]
      await run(tx)
      onProgress?.({ done: i + 1, total, label })
    }
  }, { timeout: 60_000 })

  // Book ratings are denormalized on Resource: recompute the ones they had reviewed.
  for (const resourceId of [...new Set(reviewedResourceIds)]) {
    const agg = await prisma.review.aggregate({ where: { resourceId }, _avg: { rating: true }, _count: true })
    await prisma.resource.update({ where: { id: resourceId }, data: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count } }).catch(() => {})
  }
  onProgress?.({ done: total, total, label: 'Book ratings' })
}
