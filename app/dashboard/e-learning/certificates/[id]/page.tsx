import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getCertificateDetail } from '@/lib/data/certificates'
import { toPlain } from '@/lib/server/to-plain'
import { CertificateDetailView } from './_components/certificate-detail-view'
import type { CertificateRecord } from '../_components/use-certificates-admin'

interface CertificateDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CertificateDetailPage({ params }: CertificateDetailPageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const detail = await getCertificateDetail(id)
  if (!detail) notFound()
  return <CertificateDetailView initialCertificate={toPlain<CertificateRecord>(detail.certificate)} />
}
