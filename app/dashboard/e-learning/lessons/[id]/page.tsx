import { LessonDetailView } from './_components/lesson-detail-view'

interface LessonDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function LessonDetailPage({ params }: LessonDetailPageProps) {
  const { id } = await params
  return <LessonDetailView id={id} />
}
