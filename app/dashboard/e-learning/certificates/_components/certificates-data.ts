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

export const initialCertificates: Certificate[] = [
  { id: 'cert-001', member: 'Jean Paul Nkurunziza', course: 'Foundations of Faith',  issuedAt: '2026-05-02', verificationCode: 'KLS-7F3A-91BC', revoked: false },
  { id: 'cert-002', member: 'Sarah Uwase',           course: 'Missions & Outreach',   issuedAt: '2026-04-18', verificationCode: 'KLS-2D9E-44A1', revoked: false },
  { id: 'cert-003', member: 'David Ndayisenga',      course: 'Foundations of Faith',  issuedAt: '2026-06-10', verificationCode: 'KLS-88C1-0F2D', revoked: false },
]
