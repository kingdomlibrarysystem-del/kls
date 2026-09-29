import { notFound } from 'next/navigation'
import { requirePageAuth, canAccessOwned } from '@/lib/server/page-session'
import { getCertificateDetail } from '@/lib/data/certificates'
import { toPlain } from '@/lib/server/to-plain'
import { CertificateDetailView } from './_components/certificate-detail-view'
import type { Certificate } from '@/app/member/_shared/use-certificates'

interface CertificateDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CertificateDetailPage({ params }: CertificateDetailPageProps) {
  const [{ id }, session] = await Promise.all([params, requirePageAuth()])
  const detail = await getCertificateDetail(id)
  // Same owner-or-staff rule as GET /api/certificates/[id].
  if (!detail || !canAccessOwned(session, detail.ownerId)) notFound()
  return <CertificateDetailView initialCertificate={toPlain<Certificate>(detail.certificate)} />
}
