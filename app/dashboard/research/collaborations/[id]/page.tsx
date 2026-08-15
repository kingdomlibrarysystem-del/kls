import { ProjectDetailView } from './_components/project-detail-view'

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params
  return <ProjectDetailView id={id} />
}
