'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Newspaper, ArrowRight, CalendarDays } from 'lucide-react'
import { RemoteImage } from '@/components/ui/remote-image'
import { useLanguage } from '@/contexts/language-context'
import type { NewsArticle } from '@/app/dashboard/news/_shared/news-data'

const MAX_ITEMS = 5

/**
 * "Newspaper" strip on the landing page, rendered ABOVE the trending books.
 * Pulls the newest PUBLISHED articles/editions from the real news API and
 * lays them out like a real broadsheet: a centered masthead under a double
 * rule, then stacked article rows separated by hairlines, with each photo
 * pulled LEFT on even rows and RIGHT on odd rows. Photos are square-cornered
 * crops with no border, exactly like newsprint, and each row keeps its
 * height tight (kicker + one-line headline + one line of summary) so the
 * strip stays short. Self-hides when the API is unreachable or no news is
 * published yet (never shows a broken strip).
 */
export function NewsPaperSection() {
  const { t } = useLanguage()
  const [items, setItems] = useState<NewsArticle[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/news/articles?pageSize=5')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json) => {
        if (cancelled) return
        if (json.code === 'success' && Array.isArray(json.data)) setItems(json.data)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [])

  if (!loaded || items.length === 0) return null

  const visible = items.slice(0, MAX_ITEMS)

  const dateLabel = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  return (
    <div className="py-12 px-4 bg-[#fdf8ef] dark:bg-[#0a0d1a]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center border-b-2 border-w-950/80 dark:border-gray-200 pb-3">
          <span className="inline-flex items-center gap-1.5 font-lato text-[11px] font-semibold text-w-600 dark:text-amber-500/70 uppercase tracking-[0.3em]">
            <Newspaper size={13} className="text-w-500" />
            {t('news.label')}
          </span>
          <h2 className="font-cinzel font-bold text-3xl md:text-4xl text-w-950 dark:text-gray-100 mt-1" style={{ letterSpacing: '2px' }}>
            {t('news.title')}
          </h2>
        </div>

        <div className="bg-white/70 dark:bg-[#121726]/70 border-x border-w-200/70 dark:border-gray-800">
          {visible.map((a, i) => {
            const color = a.isEdition ? '#d4a843' : '#3b82f6'
            return (
              <Link
                key={a.id}
                href={`/member/news/${a.id}`}
                className={`group flex items-center gap-3 sm:gap-5 px-3 sm:px-5 py-3 border-t border-w-200/80 dark:border-gray-800 first:border-t-0 ${i % 2 === 1 ? 'flex-row-reverse' : ''}`}
              >
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 grow-0" style={{ background: 'var(--bg-section, #f3ede1)' }}>
                  <RemoteImage
                    src={a.coverImage}
                    alt={a.title}
                    fill
                    sizes="(max-width: 640px) 80px, 96px"
                    className="object-cover"
                    fallback={
                      <div className="w-full h-full flex items-center justify-center text-w-300 dark:text-gray-600">
                        <Newspaper size={16} />
                      </div>
                    }
                  />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-lato text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
                      {a.isEdition ? t('news.edition') : a.category}
                    </span>
                    {a.publishedAt && (
                      <span className="inline-flex items-center gap-1 font-lato text-[10px] text-w-700 dark:text-gray-500">
                        <CalendarDays size={10} /> {dateLabel(a.publishedAt)}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 font-cinzel font-semibold text-base sm:text-lg text-w-950 dark:text-gray-100 leading-snug line-clamp-1 group-hover:text-w-600 dark:group-hover:text-amber-400 transition-colors">
                    {a.title}
                  </h3>
                  <p className="mt-1 font-lato text-xs text-w-700 dark:text-gray-400 leading-snug line-clamp-1 sm:line-clamp-2">
                    {a.summary}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="flex justify-end mt-4">
          <Link
            href="/member/news"
            className="inline-flex items-center gap-1 font-lato font-semibold text-sm text-w-700 dark:text-gray-400 hover:text-w-950 dark:hover:text-gray-100 border-b border-w-600 dark:border-gray-600 hover:border-w-950 dark:hover:border-gray-100 transition pb-0.5"
          >
            {t('news.view_all')} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}