import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getAssessmentDetail } from '@/lib/data/assessments'
import { getCourseTitle } from '@/lib/data/courses'
import { toPlain } from '@/lib/server/to-plain'
import { QuizDetailView } from './_components/quiz-detail-view'
import type { TakeableAssessment } from '../_components/quizzes-config'

interface QuizDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function QuizDetailPage({ params }: QuizDetailPageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const assessment = await getAssessmentDetail(id)
  if (!assessment) notFound()
  const courseTitle = (await getCourseTitle(assessment.courseId)) || 'Unknown course'
  return <QuizDetailView initialAssessment={toPlain<TakeableAssessment>(assessment)} courseTitle={courseTitle} />
}
