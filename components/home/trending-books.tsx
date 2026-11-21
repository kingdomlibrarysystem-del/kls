'use client'

import Link from 'next/link'
import { BookOpen, Eye, ArrowRight } from 'lucide-react'
import { RemoteImage } from '@/components/ui/remote-image'
import { useLanguage } from '@/contexts/language-context'
import type { TrendingBook } from '@/lib/data/home'

/**
 * Landing-page "Trending" grid: up to 10 books (most viewed first, then
 * newest), 5 per row on md+ screens (two rows) and 2 per row on phones. Each
 * card shows only the cover, the title, the number of viewers and a "Read"
 * button under the cover. Books come from the server (getTrendingBooks) —
 * the section no longer downloads the whole catalog in the browser. Opening
 * a book (cover or Read) is counted as a view by the book page itself
 * (RecordResourceView), for signed-in and signed-out visitors alike.
 */
export function TrendingBooks({ books }: { books: TrendingBook[] }) {
  const { t } = useLanguage()

  if (books.length === 0) return null

  return (
    <section className="bg-white px-4 py-12 dark:bg-[#0a0d1a]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <span className="font-lato text-xs font-semibold uppercase tracking-widest text-w-600 dark:text-amber-500/70">
              {t('trending.handpicked')}
            </span>
            <h2 className="mt-1 font-cinzel text-2xl font-bold text-w-950 md:text-3xl dark:text-gray-100">
              {t('trending.title')}
            </h2>
          </div>
          <Link
            href="/library"
            className="hidden shrink-0 items-center gap-1.5 border-b border-w-600 pb-0.5 font-lato text-sm font-semibold text-w-700 transition hover:border-w-950 hover:text-w-950 sm:inline-flex dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-100 dark:hover:text-gray-100"
          >
            {t('common.explore_more')} <ArrowRight size={14} />
          </Link>
        </div>

        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 md:grid-cols-5">
          {books.map((book, i) => (
            <li key={book.id} className="group flex min-w-0 flex-col">
              <Link
                href={`/library/${book.id}`}
                aria-label={book.title}
                className="relative block aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted shadow-md ring-1 ring-black/5 transition-shadow group-hover:shadow-lg dark:ring-white/10"
              >
                {book.cover ? (
                  <RemoteImage
                    src={book.cover}
                    alt={book.title}
                    fill
                    sizes="(max-width: 768px) 46vw, (max-width: 1280px) 19vw, 240px"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    loading={i < 5 ? 'eager' : 'lazy'}
                    fallback={<CoverFallback />}
                  />
                ) : (
                  <CoverFallback />
                )}
              </Link>

              {/* Title and views side by side, centred with padding so they never touch the card edges. */}
              <div className="mt-3 flex items-center justify-center gap-3 px-2">
                <h3 className="min-w-0 truncate font-lato text-sm font-semibold leading-5 text-w-950 dark:text-gray-100" title={book.title}>
                  {book.title}
                </h3>
                <p className="flex shrink-0 items-center gap-1 font-lato text-xs text-w-700 dark:text-gray-400">
                  <Eye size={13} className="text-w-600 dark:text-amber-500/70" />
                  <span suppressHydrationWarning>
                    {book.views.toLocaleString()} {book.views === 1 ? t('common.view_singular') : t('common.views')}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            href="/library"
            className="inline-flex items-center gap-1.5 border-b border-w-600 pb-0.5 font-lato text-sm font-semibold text-w-700 dark:border-gray-600 dark:text-gray-400"
          >
            {t('common.explore_more')} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}

function CoverFallback() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
      <BookOpen size={28} />
      <span className="font-lato text-[10px] font-semibold uppercase tracking-widest">Kingdom Library</span>
    </div>
  )
}
