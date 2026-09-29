'use client'

import { useAuth } from '@/contexts/auth-context'
import { useSharedList } from '@/lib/client/use-shared-list'

/** Real Certificate shape, matching /api/certificates' serializeCertificate. */
export interface Certificate {
  id: string
  userId: string
  member: string
  courseId?: string
  course: string
  issuedAt: string
  verificationCode: string
  revoked: boolean
}

/**
 * Fetches the signed-in member's own certificates from the real
 * /api/certificates, filtered by their session userId — replaces reading
 * the admin-facing shared mock store
 * (app/dashboard/e-learning/certificates/_components/use-certificates.ts)
 * and filtering client-side by a hardcoded member name. Issuance itself now
 * happens server-side (see app/api/_shared/issue-certificate-if-eligible.ts),
 * mirroring use-borrowings.ts's per-component fetch pattern.
 */
export function useCertificates() {
  const { user } = useAuth()
  // Shared + de-duplicated per URL (see lib/client/use-shared-list.ts): every
  // component on a page reuses one request, revisits render cached data first.
  return useSharedList<Certificate>(user ? `/api/certificates?userId=${user.id}&pageSize=1000` : null)
}
