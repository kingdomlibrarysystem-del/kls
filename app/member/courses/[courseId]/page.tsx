import { PageTransition } from '@/components/ui/page-transition'
import { CourseRedirectView } from './_components/course-redirect-view'

interface CourseRedirectPageProps {
  params: Promise<{ courseId: string }>
}

/**
 * `/member/courses/[courseId]` has no page content of its own — it exists so
 * links that only know a course id (e.g. the public course-preview's
 * "Go to Course") have somewhere real to land instead of 404ing, since the
 * real lesson content lives at the nested `lessons/[lessonId]` route.
 */
export default async function CourseRedirectPage({ params }: CourseRedirectPageProps) {
  const { courseId } = await params
  return (
    <PageTransition>
      <CourseRedirectView courseId={courseId} />
    </PageTransition>
  )
}
