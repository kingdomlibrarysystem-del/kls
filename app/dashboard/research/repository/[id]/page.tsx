import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getResearchPaperDetail } from '@/lib/data/research-papers'
import { toPlain } from '@/lib/server/to-plain'
import { PaperDetailView } from './_components/paper-detail-view'
import type { PaperDetailData } from './_components/paper-detail-view'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const detail = await getResearchPaperDetail(id)
  if (!detail) notFound()
  return <PaperDetailView initialPaper={toPlain<PaperDetailData>(detail)} />
}
