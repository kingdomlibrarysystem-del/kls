import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getRehabSessionDetail } from '@/lib/data/rehab-sessions'
import { toPlain } from '@/lib/server/to-plain'
import { SessionDetailView } from './_components/session-detail-view'
import type { RehabSession } from '../../../_shared/rehab-data'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const detail = await getRehabSessionDetail(id)
  if (!detail) notFound()
  return <SessionDetailView initialSession={toPlain<RehabSession>(detail.data)} />
}
