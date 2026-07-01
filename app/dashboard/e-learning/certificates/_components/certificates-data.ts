/** Issued certificate, per APP_DOC Task 6.7 / Prisma `Certificate`. */
export interface Certificate {
  id: string
  member: string
  course: string
  issuedAt: string
  verificationCode: string
}

export const mockCertificates: Certificate[] = [
  { id: 'cert-001', member: 'Jean Paul Nkurunziza', course: 'Foundations of Faith',  issuedAt: '2026-05-02', verificationCode: 'KLS-7F3A-91BC' },
  { id: 'cert-002', member: 'Sarah Uwase',           course: 'Missions & Outreach',   issuedAt: '2026-04-18', verificationCode: 'KLS-2D9E-44A1' },
  { id: 'cert-003', member: 'David Ndayisenga',      course: 'Foundations of Faith',  issuedAt: '2026-06-10', verificationCode: 'KLS-88C1-0F2D' },
]
