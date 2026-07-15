'use client'

import { useReviewQueue, addSubmission, removeSubmission } from '@/app/dashboard/publishing/review/_components/use-review-queue'
import type { PublicationSubmission } from '@/app/dashboard/publishing/review/_components/review-data'
import { CONTRIBUTOR_NAME } from '@/lib/identity/contributor-identity'

/**
 * Thin wrapper over the shared submissions store (see
 * app/dashboard/publishing/review/_components/use-review-queue.ts) —
 * filters to this contributor's own rows. Previously this file owned a
 * second, disconnected module-level array (`mySubmissions`) that an admin
 * approval/rejection never touched, so a title could sit at SUBMITTED
 * here forever even after it was genuinely decided elsewhere. Now both
 * screens read the exact same store; there is no separate sync step.
 */
export function useMySubmissions(): PublicationSubmission[] {
  const all = useReviewQueue()
  return all.filter((s) => s.contributor === CONTRIBUTOR_NAME)
}

/** Appends a new submission for the signed-in contributor — used by Submit a Book. */
export function addMySubmission(entry: { title: string; category: string; language: PublicationSubmission['language']; coverImage: string; description: string; status: PublicationSubmission['status'] }) {
  return addSubmission({ ...entry, contributor: CONTRIBUTOR_NAME })
}

/** Withdraws (removes) a submission — only ever called for this contributor's own DRAFT/SUBMITTED rows. */
export function removeMySubmission(id: string) {
  removeSubmission(id)
}
