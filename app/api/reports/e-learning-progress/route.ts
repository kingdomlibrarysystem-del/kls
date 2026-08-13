import { NextResponse } from 'next/server'
import prisma from '@/prisma/client'

/**
 * Real E-Learning Progress Analytics API, replacing
 * app/dashboard/e-learning/progress/_components/progress-data.ts's four
 * hand-typed CourseAnalytics rows with live aggregates over the real
 * Course/Lesson/Enrollment collections (Phase 5). Dropoff-by-lesson is
 * derived from each lesson's real `order` against every enrollment's real
 * `completedLessonIds` — the percentage of a course's enrolled members
 * who have NOT completed a given lesson, which rises monotonically with
 * lesson order exactly like a funnel dropoff chart should.
 */
export async function GET() {
  const courses = await prisma.course.findMany({
    include: {
      lessons: { orderBy: { order: 'asc' }, select: { id: true, title: true, order: true } },
      enrollments: {
        select: {
          status: true,
          completedLessonIds: true,
          user: { select: { name: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { title: 'asc' },
  })

  const analytics = courses
    .filter((c) => c.enrollments.length > 0)
    .map((course) => {
      const enrolledCount = course.enrollments.length
      const totalLessons = course.lessons.length

      const members = course.enrollments.map((e) => {
        const name = e.user.name ?? (`${e.user.firstName ?? ''} ${e.user.lastName ?? ''}`.trim() || 'Unknown Member')
        const progress = totalLessons > 0 ? Math.round((e.completedLessonIds.length / totalLessons) * 100) : 0
        return { name, progress, status: e.status }
      })

      const avgCompletion = members.length
        ? Math.round(members.reduce((sum, m) => sum + m.progress, 0) / members.length)
        : 0

      const topPerformers = [...members]
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 3)
        .map((m) => ({ name: m.name, progress: m.progress }))

      const allDropoffPoints = course.lessons.map((lesson) => {
        const notCompleted = course.enrollments.filter((e) => !e.completedLessonIds.includes(lesson.id)).length
        const dropoffRate = enrolledCount > 0 ? Math.round((notCompleted / enrolledCount) * 100) : 0
        return { lesson: lesson.title, dropoffRate }
      })

      const dropoffPoints = [...allDropoffPoints]
        .sort((a, b) => b.dropoffRate - a.dropoffRate)
        .slice(0, 2)
        .filter((d) => d.dropoffRate > 0)

      return {
        id: course.id,
        title: course.title,
        enrolledCount,
        avgCompletion,
        topPerformers,
        dropoffPoints,
        enrolledMembers: members,
        allDropoffPoints,
      }
    })

  return NextResponse.json({
    data: analytics,
    message: 'E-learning progress analytics fetched successfully',
    code: 'success',
    status: 200,
  })
}
