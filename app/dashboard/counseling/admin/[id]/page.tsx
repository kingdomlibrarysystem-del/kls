import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getCounselingSessionDetail } from '@/lib/data/counseling-sessions'
import { toPlain } from '@/lib/server/to-plain'
import { SessionDetailView } from './_components/session-detail-view'
import type { CounselingSession } from '../../_shared/counseling-data'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const detail = await getCounselingSessionDetail(id)
  if (!detail) notFound()
  return <SessionDetailView initialSession={toPlain<CounselingSession>(detail.data)} />
}
