import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getResearchProjectDetail } from '@/lib/data/research-projects'
import { toPlain } from '@/lib/server/to-plain'
import { ProjectDetailView } from './_components/project-detail-view'
import type { ResearchProjectSummary } from '../_components/collaborations-data'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const detail = await getResearchProjectDetail(id)
  if (!detail) notFound()
  return <ProjectDetailView initialProject={toPlain<ResearchProjectSummary>(detail)} />
}
