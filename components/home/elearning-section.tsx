'use client'

import Link from 'next/link'
import { PlayCircle, Award, BookOpen, Users } from 'lucide-react'
import { useCourses } from '@/app/member/_shared/use-courses'
import { useLanguage } from '@/contexts/language-context'

export function ELearningSection() {
  const { t } = useLanguage()
  const { data: courses } = useCourses()
  const featured = courses.slice(0, 3)

  const stats = [
    { icon: <BookOpen size={20} />, value: String(courses.length), label: t('elearning.courses') },
    { icon: <Users size={20} />, value: String(courses.reduce((sum, c) => sum + c.students, 0)), label: t('elearning.enrollments') },
    { icon: <Award size={20} />, value: String(courses.reduce((sum, c) => sum + c.lessons, 0)), label: t('elearning.lessons') },
  ]

  if (featured.length === 0) return null

  return (
    <div className="py-16 px-4 bg-[#fdf8ef] dark:bg-[#0a0d1a]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="font-lato text-xs font-semibold text-w-600 dark:text-amber-500/70 uppercase tracking-widest">
              {t('elearning.learn_at_pace')}
            </span>
            <h2 className="font-cinzel text-2xl md:text-4xl font-bold text-w-950 dark:text-gray-100 mt-2 leading-tight">
              {t('elearning.title')}
            </h2>
            <p className="font-lato text-w-700 dark:text-gray-400 mt-3 max-w-md">
              {t('elearning.subtitle')}
            </p>
          </div>

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {featured.map((course, i) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className={`bg-white dark:bg-[#111828] rounded-xl shadow-sm border-l-4 ${['border-w-600', 'border-w-700', 'border-w-800'][i % 3]} p-6 hover:shadow-md dark:hover:shadow-black/20 transition-shadow`}
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
                  {course.lessons} {t('elearning.lessons').toLowerCase()}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={13} className="text-w-600 dark:text-amber-500/70" />
                  {course.students} {t('elearning.students')}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex justify-center">
          <Link
            href="/member/e-learning"
            className="inline-flex items-center gap-2 px-8 py-3 bg-w-950 dark:bg-amber-500 text-w-accent dark:text-[#0a0d1a] font-lato font-bold rounded hover:bg-w-800 dark:hover:bg-amber-400 transition"
          >
            <PlayCircle size={18} />
            {t('elearning.browse_all')}
          </Link>
        </div>
      </div>
    </div>
  )
}
