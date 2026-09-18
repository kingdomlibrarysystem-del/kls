'use client'

import { Target, Users, HeartHandshake, BookMarked } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

const pillars = [
  { icon: Target, key: 'p1' },
  { icon: Users, key: 'p2' },
  { icon: HeartHandshake, key: 'p3' },
]

/**
 * Simple About Us section on the landing page — deliberately one short
 * section (a label, a headline, a few sentences, and three bullet cards)
 * that staff can find quickly via the footer "About Us" link (#about).
 */
export function AboutSection() {
  const { t } = useLanguage()

  return (
    <div id="about" className="py-20 px-4 bg-[#fdf8ef] dark:bg-[#0a0d1a]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <span className="font-lato text-sm font-semibold text-w-600 dark:text-amber-500/70 uppercase tracking-widest">
            {t('about.label')}
          </span>
          <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-w-950 dark:text-gray-100 mt-3 mb-4" style={{ letterSpacing: '1.5px' }}>
            {t('about.title')}
          </h2>
          <p className="font-cormorant text-xl text-w-700 dark:text-gray-300 leading-relaxed">
            {t('about.body')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {pillars.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="bg-white dark:bg-[#121726] border border-w-200 dark:border-gray-700 rounded-lg p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-w-100 dark:bg-gray-800 flex items-center justify-center">
                <Icon size={20} className="text-w-600 dark:text-amber-500/70" />
              </div>
              <p className="font-cinzel font-semibold text-w-950 dark:text-gray-100">
                {t(`about.${key}_title`)}
              </p>
              <p className="font-lato text-sm text-w-700 dark:text-gray-400 mt-2 leading-relaxed">
                {t(`about.${key}_body`)}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 flex items-center justify-center gap-2 font-lato text-sm text-w-700 dark:text-gray-400">
          <BookMarked size={15} className="text-w-500 dark:text-amber-500/70" />
          {t('about.signoff')}
        </p>
      </div>
    </div>
  )
}