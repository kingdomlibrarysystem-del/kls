/** Issued certificate, per APP_DOC Task 6.7 / Prisma `Certificate`. */
export interface Certificate {
  id: string
  member: string
  course: string
  issuedAt: string
  verificationCode: string
  revoked: boolean
  /** Course ID from course-catalog-data.ts — links back to the enrollment that earned this certificate, so issuance can be deduplicated per course. */
  courseId?: string
}
