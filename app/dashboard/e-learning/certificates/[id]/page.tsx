import { CertificateDetailView } from './_components/certificate-detail-view'

interface CertificateDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CertificateDetailPage({ params }: CertificateDetailPageProps) {
  const { id } = await params
  return <CertificateDetailView id={id} />
}
