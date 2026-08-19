import { EnrollmentDetailView } from './_components/enrollment-detail-view'

interface EnrollmentDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EnrollmentDetailPage({ params }: EnrollmentDetailPageProps) {
  const { id } = await params
  return <EnrollmentDetailView id={id} />
}
