import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getLessonDetail, getCourseLessonRows } from '@/lib/data/lessons'
import { getCourseTitleAndPrice } from '@/lib/data/courses'
import { toPlain } from '@/lib/server/to-plain'
import { LessonDetailView, type LessonApiResponse } from './_components/lesson-detail-view'

interface LessonDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function LessonDetailPage({ params }: LessonDetailPageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const lesson = await getLessonDetail(id)
  if (!lesson) notFound()
  const [course, siblings] = await Promise.all([
    getCourseTitleAndPrice(lesson.courseId),
    getCourseLessonRows(lesson.courseId),
  ])
  return (
    <LessonDetailView
      initialLesson={toPlain<LessonApiResponse>(lesson)}
      courseTitle={course.title}
      coursePrice={course.price}
      siblings={siblings.map((l) => ({ id: l.id, title: l.title }))}
    />
  )
}
