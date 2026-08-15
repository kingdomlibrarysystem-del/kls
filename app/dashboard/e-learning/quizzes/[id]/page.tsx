import { QuizDetailView } from './_components/quiz-detail-view'

interface QuizDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function QuizDetailPage({ params }: QuizDetailPageProps) {
  const { id } = await params
  return <QuizDetailView id={id} />
}
