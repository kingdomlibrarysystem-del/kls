import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getCourseDetail } from '@/lib/data/courses'
import { getCourseLessonRows } from '@/lib/data/lessons'
import { getCourseEnrollments } from '@/lib/data/enrollments'
import { toPlain } from '@/lib/server/to-plain'
import { CourseDetailView, type CourseApiResponse } from './_components/course-detail-view'
import type { CourseLessonRow } from './_components/course-lessons-panel'
import type { EnrollmentRecord } from '../../enrollments/_components/use-enrollments-admin'

interface CourseDetailPageProps {
  params: Promise<{ id: string }>
}

/** Course + its lessons + its enrollments in one server round trip (parallel queries), instead of three client fetches that each downloaded the whole collection. */
export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const [course, lessons, enrollments] = await Promise.all([
    getCourseDetail(id),
    getCourseLessonRows(id),
    getCourseEnrollments(id),
  ])
  if (!course) notFound()
  return (
    <CourseDetailView
      initialCourse={toPlain<CourseApiResponse>(course)}
      lessons={toPlain<CourseLessonRow[]>(lessons)}
      enrollments={toPlain<EnrollmentRecord[]>(enrollments)}
    />
  )
}
