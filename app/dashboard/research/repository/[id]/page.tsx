import { PaperDetailView } from './_components/paper-detail-view'

interface PaperDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PaperDetailPage({ params }: PaperDetailPageProps) {
  const { id } = await params
  return <PaperDetailView id={id} />
}
