import Link from 'next/link'
import { GraduationCap, BookOpen, ClipboardList, Award, BarChart2, Video } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

const sections = [
  { icon: <BookOpen size={20} />,       title: 'Browse Courses',       desc: 'Explore available courses across all categories and languages.',         status: 'coming' },
  { icon: <GraduationCap size={20} />,  title: 'My Enrollments',       desc: 'Continue your active courses and track your learning progress.',         status: 'coming' },
  { icon: <Video size={20} />,          title: 'Lessons',              desc: 'Access text, video, and file-based lesson content.',                      status: 'coming' },
  { icon: <ClipboardList size={20} />,  title: 'Quizzes & Exams',      desc: 'Take quizzes and formal examinations linked to your courses.',            status: 'coming' },
  { icon: <BarChart2 size={20} />,      title: 'My Progress',          desc: 'View completion percentages, quiz scores, and exam results.',             status: 'coming' },
  { icon: <Award size={20} />,          title: 'Certificates',         desc: 'Download and verify your course completion certificates.',                status: 'coming' },
]

export default function ELearningPage() {
  return (
    <div>
      <PageHeader title="E-Learning" subtitle="Courses, lessons, quizzes, and certificates" />

      <div className="bg-w-100 border border-w-300 rounded-lg px-5 py-4 mb-8 font-lato text-sm text-w-700">
        This module is under active development. The structure below reflects the full KLS e-learning specification.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <div key={s.title} className="bg-form-highlight border border-w-300 rounded-lg p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-w-600">{s.icon}
              <h3 className="font-cinzel text-sm font-semibold text-w-950">{s.title}</h3>
            </div>
            <p className="font-lato text-xs text-w-700 leading-relaxed">{s.desc}</p>
            <span className="inline-block mt-auto px-2 py-0.5 bg-w-200 text-w-700 rounded text-xs font-lato w-fit">Coming Soon</span>
          </div>
        ))}
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
