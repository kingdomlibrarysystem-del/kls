'use client'

import Link from 'next/link'
import { GraduationCap, BookOpen, ClipboardList, Award, BarChart2, Video } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { useCourseCatalog } from './_shared/use-course-catalog'
import { useEnrollmentsAdmin } from './enrollments/_components/use-enrollments-admin'
import { useLessonsByCourse } from '@/app/member/_shared/use-lessons'
import { useCertificatesAdmin } from './certificates/_components/use-certificates-admin'
import { ElearningTabs } from './_components/elearning-tabs'

interface ELearningSection {
  icon: React.ReactNode
  title: string
  desc: string
  href: string
}

const sections: ELearningSection[] = [
  { icon: <BookOpen size={20} />,       title: 'Course Catalog',       desc: 'Explore, add, edit, and archive every course across categories and languages.', href: '/dashboard/e-learning/catalog' },
  { icon: <GraduationCap size={20} />,  title: 'Enrollments',          desc: 'Track member enrollments, status, and course progress.',                  href: '/dashboard/e-learning/enrollments' },
  { icon: <Video size={20} />,          title: 'Lessons',              desc: 'Manage text, video, and file-based lesson content per course.',           href: '/dashboard/e-learning/lessons' },
  { icon: <ClipboardList size={20} />,  title: 'Quizzes & Exams',      desc: 'Manage quizzes and formal examinations linked to courses.',               href: '/dashboard/e-learning/quizzes' },
  { icon: <BarChart2 size={20} />,      title: 'Progress',             desc: 'View completion rates, top performers, and dropoff points per course.',    href: '/dashboard/e-learning/progress' },
  { icon: <Award size={20} />,          title: 'Certificates',         desc: 'View issued certificates and verify by code.',                             href: '/dashboard/e-learning/certificates' },
]

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
      <p className="font-cinzel text-2xl font-bold text-w-950">{value}</p>
      <p className="font-lato text-xs text-w-700 mt-1 leading-tight">{label}</p>
    </div>
  )
}

/**
 * Real E-Learning overview — replaces the old "under active development"
 * placeholder that predated Phase 5's real Course/Enrollment/Lesson/
 * Certificate backend. Pulls live counts from the same stores each admin
 * sub-page already uses, so this page can't drift out of sync with them.
 */
export default function ELearningPage() {
  const { data: courses } = useCourseCatalog()
  const { data: enrollments } = useEnrollmentsAdmin()
  const { data: lessonsByCourse } = useLessonsByCourse()
  const { data: certificates } = useCertificatesAdmin()

  const publishedCourses = courses.filter((c) => c.status === 'PUBLISHED').length
  const totalLessons = Object.values(lessonsByCourse).reduce((sum, c) => sum + c.lessons.length, 0)
  const activeEnrollments = enrollments.filter((e) => e.status !== 'COMPLETED').length

  return (
    <div>
      <PageHeader title="E-Learning" subtitle="Courses, lessons, quizzes, and certificates" />
      <ElearningTabs active="overview" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Published Courses" value={publishedCourses} />
        <StatCard label="Total Lessons" value={totalLessons} />
        <StatCard label="Active Enrollments" value={activeEnrollments} />
        <StatCard label="Certificates Issued" value={certificates.length} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link key={s.title} href={s.href} aria-label={s.title}>
            <div className="bg-form-highlight border border-w-300 rounded-lg p-5 flex flex-col gap-2 h-full hover:border-w-600 transition-colors">
              <div className="flex items-center gap-2 text-w-600">{s.icon}
                <h3 className="font-cinzel text-sm font-semibold text-w-950">{s.title}</h3>
              </div>
              <p className="font-lato text-xs text-w-700 leading-relaxed">{s.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
