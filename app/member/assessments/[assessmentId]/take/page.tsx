import { PageTransition } from '@/components/ui/page-transition'
import { TakeAssessmentView } from './_components/take-assessment-view'

interface TakeAssessmentPageProps {
  params: Promise<{ assessmentId: string }>
}

export default async function TakeAssessmentPage({ params }: TakeAssessmentPageProps) {
  const { assessmentId } = await params
  return (
    <PageTransition>
      <TakeAssessmentView assessmentId={assessmentId} />
    </PageTransition>
  )
}
