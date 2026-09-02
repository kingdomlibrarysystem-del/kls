import { IntakeDetailView } from './_components/intake-detail-view'

interface RehabIntakeDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function RehabIntakeDetailPage({ params }: RehabIntakeDetailPageProps) {
  const { id } = await params
  return <IntakeDetailView id={id} />
}
