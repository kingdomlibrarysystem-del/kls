import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getEnrollmentDetail } from '@/lib/data/enrollments'
import { toPlain } from '@/lib/server/to-plain'
import { EnrollmentDetailView, type EnrollmentDetail } from './_components/enrollment-detail-view'

interface EnrollmentDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EnrollmentDetailPage({ params }: EnrollmentDetailPageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const detail = await getEnrollmentDetail(id)
  if (!detail) notFound()
  return <EnrollmentDetailView initialEnrollment={toPlain<EnrollmentDetail>(detail.enrollment)} />
}
