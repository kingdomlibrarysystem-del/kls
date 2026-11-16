import type { Metadata } from 'next'
import { ELearningSection } from '@/components/home/elearning-section'
import { getCachedCourseCatalog } from '@/lib/server/home-page'

export const metadata: Metadata = {
  title: 'E-Learning — Online Courses',
  description: 'Free and paid online courses from Kingdom Library — lessons, quizzes, a final exam and a certificate when you finish.',
  alternates: { canonical: '/e-learning' },
}

/**
 * Public course catalogue — readable without logging in, so Google can list
 * it. Each course opens its public preview (/courses/[id]) with the Enroll
 * button; learning itself still happens in /member/e-learning.
 */
export default async function PublicELearningPage() {
  const { courses, stats } = await getCachedCourseCatalog().catch(() => ({ courses: [], stats: { courses: 0, lessons: 0, enrollments: 0 } }))
  return <ELearningSection courses={courses} stats={stats} asPage />
}
