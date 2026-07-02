import Link from 'next/link'
import { GraduationCap, BookOpen, ClipboardList, Award, BarChart2, Video, PlusCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

interface ELearningSection {
  icon: React.ReactNode
  title: string
  desc: string
  href?: string
}

const sections: ELearningSection[] = [
  { icon: <PlusCircle size={20} />,     title: 'Add / Edit Course',    desc: 'Create or update a course in the KLS e-learning catalog.',                href: '/dashboard/e-learning/add' },
  { icon: <BookOpen size={20} />,       title: 'Browse Courses',       desc: 'Explore available courses across all categories and languages.',        href: '/dashboard/e-learning/catalog' },
  { icon: <GraduationCap size={20} />,  title: 'Enrollments',          desc: 'Track member enrollments, status, and course progress.',                  href: '/dashboard/e-learning/enrollments' },
  { icon: <Video size={20} />,          title: 'Lessons',              desc: 'Access text, video, and file-based lesson content.' },
  { icon: <ClipboardList size={20} />,  title: 'Quizzes & Exams',      desc: 'Take quizzes and formal examinations linked to your courses.' },
  { icon: <BarChart2 size={20} />,      title: 'My Progress',          desc: 'View completion rates, top performers, and dropoff points per course.',    href: '/dashboard/e-learning/progress' },
  { icon: <Award size={20} />,          title: 'Certificates',         desc: 'View issued certificates and verify by code.',                             href: '/dashboard/e-learning/certificates' },
]

export default function ELearningPage() {
  return (
    <div>
      <PageHeader title="E-Learning" subtitle="Courses, lessons, quizzes, and certificates" />

      <div className="bg-w-100 border border-w-300 rounded-lg px-5 py-4 mb-8 font-lato text-sm text-w-700">
        This module is under active development. The structure below reflects the full KLS e-learning specification.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => {
          const card = (
            <div className={`bg-form-highlight border border-w-300 rounded-lg p-5 flex flex-col gap-2 h-full ${s.href ? 'hover:border-w-600 transition-colors' : ''}`}>
              <div className="flex items-center gap-2 text-w-600">{s.icon}
                <h3 className="font-cinzel text-sm font-semibold text-w-950">{s.title}</h3>
              </div>
              <p className="font-lato text-xs text-w-700 leading-relaxed">{s.desc}</p>
              <span className={`inline-block mt-auto px-2 py-0.5 rounded text-xs font-lato w-fit ${
                s.href ? 'bg-green-50 text-green-700' : 'bg-w-200 text-w-700'
              }`}>
                {s.href ? 'Available' : 'Coming Soon'}
              </span>
            </div>
          )
          return s.href ? (
            <Link key={s.title} href={s.href} aria-label={s.title}>{card}</Link>
          ) : (
            <div key={s.title}>{card}</div>
          )
        })}
      </div>

      <div className="mt-8 bg-form-section border border-w-400 rounded-lg p-5">
        <h3 className="font-cinzel text-sm font-semibold text-w-950 mb-2">Planned API Endpoints</h3>
        <ul className="font-lato text-xs text-w-700 space-y-1">
          <li>GET /api/courses — list courses with pagination, filters</li>
          <li>POST /api/courses/:id/enroll — enroll in a course</li>
          <li>GET /api/enrollments — member's enrolled courses + progress</li>
          <li>GET /api/courses/:id/lessons — lessons for a course</li>
          <li>POST /api/quizzes/:id/submit — submit quiz answers</li>
          <li>GET /api/certificates/:code/verify — public certificate verification</li>
        </ul>
      </div>
    </div>
  )
}
