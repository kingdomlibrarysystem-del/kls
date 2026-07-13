import { PageTransition } from '@/components/ui/page-transition'
import { LessonViewerView } from './_components/lesson-viewer-view'

interface LessonPageProps {
  params: Promise<{ courseId: string; lessonId: string }>
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { courseId, lessonId } = await params
  return (
    <PageTransition>
      <LessonViewerView courseId={courseId} lessonId={lessonId} />
    </PageTransition>
  )
}
