import Link from 'next/link'
import { PlayCircle, Award, BookOpen, Users } from 'lucide-react'

const courses = [
  {
    category: 'Research Methods',
    title: 'Academic Writing Mastery',
    instructor: 'Prof. David Osei',
    duration: '6 weeks',
    students: '1.2k',
    level: 'Intermediate',
    accent: 'border-w-600',
  },
  {
    category: 'Digital Skills',
    title: 'Library Science & Information Management',
    instructor: 'Dr. Grace Nkomo',
    duration: '4 weeks',
    students: '890',
    level: 'Beginner',
    accent: 'border-w-700',
  },
  {
    category: 'Publishing',
    title: 'From Manuscript to Published Work',
    instructor: 'Dr. James Kariuki',
    duration: '8 weeks',
    students: '640',
    level: 'Advanced',
    accent: 'border-w-800',
  },
]

const stats = [
  { icon: <BookOpen size={20} />, value: '120+', label: 'Courses' },
  { icon: <Users size={20} />, value: '8k+', label: 'Learners' },
  { icon: <Award size={20} />, value: '95%', label: 'Completion' },
]

export function ELearningSection() {
  return (
    <div className="py-16 px-4 bg-[#fdf8ef] dark:bg-[#0a0d1a]">
      <div className="max-w-7xl mx-auto">

        {/* Header row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="font-lato text-xs font-semibold text-w-600 dark:text-amber-500/70 uppercase tracking-widest">
              Learn at Your Pace
            </span>
            <h2 className="font-cinzel text-2xl md:text-4xl font-bold text-w-950 dark:text-gray-100 mt-2 leading-tight">
              E-Learning Platform
            </h2>
            <p className="font-lato text-w-700 dark:text-gray-400 mt-3 max-w-md">
              Expert-led courses designed for scholars, researchers, and lifelong learners.
            </p>
          </div>

          {/* Stats row */}
          <div className="flex gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="flex items-center justify-center text-w-600 dark:text-amber-500/70 mb-1">{s.icon}</div>
                <p className="font-cinzel text-xl font-bold text-w-950 dark:text-gray-100">{s.value}</p>
                <p className="font-lato text-xs text-w-700 dark:text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Course cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {courses.map((course) => (
            <div
              key={course.title}
              className={`bg-white dark:bg-[#111828] rounded-xl shadow-sm border-l-4 ${course.accent} p-6 hover:shadow-md dark:hover:shadow-black/20 transition-shadow`}
            >
              <span className="inline-block font-lato text-xs font-semibold text-w-600 dark:text-amber-500/80 uppercase tracking-wider bg-w-100 dark:bg-white/5 px-3 py-1 rounded-full mb-4">
                {course.category}
              </span>
              <h3 className="font-cinzel text-lg font-bold text-w-950 dark:text-gray-100 mb-3 leading-snug">
                {course.title}
              </h3>
              <p className="font-lato text-sm text-w-700 dark:text-gray-400 mb-5">{course.instructor}</p>

              <div className="flex items-center justify-between text-xs font-lato text-w-700 dark:text-gray-400 border-t border-w-200 dark:border-white/10 pt-4">
                <span className="flex items-center gap-1">
                  <PlayCircle size={13} className="text-w-600 dark:text-amber-500/70" />
                  {course.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={13} className="text-w-600 dark:text-amber-500/70" />
                  {course.students} students
                </span>
                <span className="px-2 py-0.5 bg-w-100 dark:bg-white/5 rounded font-semibold text-w-800 dark:text-gray-200">
                  {course.level}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-8 py-3 bg-w-950 dark:bg-amber-500 text-w-accent dark:text-[#0a0d1a] font-lato font-bold rounded hover:bg-w-800 dark:hover:bg-amber-400 transition"
          >
            <PlayCircle size={18} />
            Browse All Courses
          </Link>
        </div>

      </div>
    </div>
  )
}
