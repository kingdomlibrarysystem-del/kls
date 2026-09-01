'use client'

import Link from 'next/link'
import { ArrowRight, BookMarked, FlaskConical, Globe } from 'lucide-react'
import { useRepository } from '@/app/dashboard/research/repository/_components/use-repository'
import { useLanguage } from '@/contexts/language-context'

const tagIcons = [<FlaskConical size={16} key="f" />, <Globe size={16} key="g" />, <BookMarked size={16} key="b" />]

export function ResearchSection() {
  const { t } = useLanguage()
  const { data: papers } = useRepository()
  const published = papers.filter((p) => p.status === 'PUBLISHED').slice(0, 3)

  if (published.length === 0) return null

  return (
    <div className="py-16 px-4 bg-white dark:bg-[#0a0d1a]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="font-lato text-xs font-semibold text-w-600 dark:text-amber-500/70 uppercase tracking-widest">
              {t('research.inspire')}
            </span>
            <h2 className="font-cinzel text-2xl md:text-4xl font-bold text-w-950 dark:text-gray-100 mt-2">
              {t('research.title')}
            </h2>
            <p className="font-lato text-w-700 dark:text-gray-400 mt-3 max-w-lg">
              {t('research.subtitle')}
            </p>
          </div>
          <Link
            href="/dashboard/research/repository"
            className="inline-flex items-center gap-2 font-lato font-semibold text-w-700 dark:text-gray-400 hover:text-w-950 dark:hover:text-gray-100 border-b border-w-600 dark:border-gray-600 hover:border-w-950 dark:hover:border-gray-100 transition pb-0.5 self-start md:self-auto"
          >
            {t('research.view_all')} <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {published.map((paper, i) => (
            <Link
              key={paper.id}
              href="/dashboard/research/repository"
              className={`group flex flex-col rounded-xl overflow-hidden border transition-shadow hover:shadow-lg dark:hover:shadow-black/40 ${
                i === 0
                  ? 'border-w-600 dark:border-amber-900/50 bg-w-950 dark:bg-[#1a2035]'
                  : 'border-w-200 dark:border-white/10 bg-white dark:bg-[#111828]'
              }`}
            >
              <div className={`h-1 w-full ${i === 0 ? 'bg-w-accent' : 'bg-w-300 dark:bg-amber-900/60'}`} />
              <div className="flex flex-col flex-1 p-6">
                <span className={`inline-flex items-center gap-1.5 font-lato text-xs font-semibold uppercase tracking-wider mb-4 ${i === 0 ? 'text-w-accent dark:text-amber-400' : 'text-w-600 dark:text-amber-500/80'}`}>
                  {tagIcons[i % tagIcons.length]}
                  {paper.project}
                </span>
                <h3 className={`font-cinzel text-lg font-bold leading-snug mb-3 transition-colors ${i === 0 ? 'text-w-100 dark:text-amber-100 group-hover:text-w-accent dark:group-hover:text-amber-300' : 'text-w-950 dark:text-gray-100 group-hover:text-w-600 dark:group-hover:text-amber-400'}`}>
                  {paper.title}
                </h3>
                <p className={`font-lato text-sm leading-relaxed flex-1 mb-6 ${i === 0 ? 'text-w-300 dark:text-gray-300' : 'text-w-700 dark:text-gray-400'}`}>
                  {paper.keywords.join(', ')}
                </p>
                <div className={`flex items-center justify-between border-t pt-4 text-xs font-lato ${i === 0 ? 'border-w-800 dark:border-white/10 text-w-400 dark:text-gray-400' : 'border-w-200 dark:border-white/10 text-w-700 dark:text-gray-400'}`}>
                  <p className={`font-semibold ${i === 0 ? 'text-w-200 dark:text-amber-200' : 'text-w-950 dark:text-gray-100'}`}>{paper.author}</p>
                  <span className={`px-2 py-1 rounded ${i === 0 ? 'bg-w-800 dark:bg-white/10 text-w-300 dark:text-gray-200' : 'bg-w-100 dark:bg-white/5 text-w-700 dark:text-gray-300'}`}>
                    {new Date(paper.publishedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-xl bg-w-950 dark:bg-[#1a2035] dark:border dark:border-white/10 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-cinzel text-lg font-bold text-w-accent dark:text-amber-400">{t('research.cta_title')}</p>
            <p className="font-lato text-sm text-w-300 dark:text-gray-300 mt-1">{t('research.cta_body')}</p>
          </div>
          <Link
            href="/dashboard/research/submit"
            className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-w-accent dark:bg-amber-500 text-w-950 dark:text-[#0a0d1a] rounded font-lato font-bold hover:bg-w-300 dark:hover:bg-amber-400 transition"
          >
            {t('research.submit')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
