import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getRehabIntakeDetail } from '@/lib/data/rehab-intakes'
import { toPlain } from '@/lib/server/to-plain'
import { IntakeDetailView } from './_components/intake-detail-view'
import type { RehabIntake } from '../../../_shared/rehab-data'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const detail = await getRehabIntakeDetail(id)
  if (!detail) notFound()
  return <IntakeDetailView initialIntake={toPlain<RehabIntake>(detail.data)} />
}
