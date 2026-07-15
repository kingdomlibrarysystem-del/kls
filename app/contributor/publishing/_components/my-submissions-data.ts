/**
 * Re-exports the unified submission shape from the admin Review Queue —
 * this file previously defined its own separate `MySubmission` type and
 * `mySubmissions` seed array, disconnected from admin's `PublicationSubmission`/
 * `mockSubmissions`. See use-my-submissions.ts's docstring for why they
 * were merged into one store.
 */
export {
  type PublicationSubmission as MySubmission,
  type PublicationStatus,
  publicationStatusConfig,
  withdrawableStatuses,
} from '@/app/dashboard/publishing/review/_components/review-data'
