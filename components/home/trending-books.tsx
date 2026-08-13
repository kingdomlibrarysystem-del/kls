'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useResources } from '@/app/dashboard/library/_components/use-resources'

const badgeStyles = [
  { bg: 'bg-[#2c2416] dark:bg-amber-600', text1: 'text-w-accent dark:text-white', text2: 'text-w-300 dark:text-amber-100', border: 'border-w-accent dark:border-amber-400' },
  { bg: 'bg-[#6b5020] dark:bg-amber-700', text1: 'text-w-accent dark:text-white', text2: 'text-w-300 dark:text-amber-100', border: 'border-w-accent dark:border-amber-400' },
  { bg: 'bg-[#8a6d3b] dark:bg-amber-800', text1: 'text-white dark:text-white', text2: 'text-w-300 dark:text-amber-100', border: 'border-w-accent dark:border-amber-400' },
  { bg: 'bg-[#b8860b] dark:bg-amber-900', text1: 'text-white dark:text-white', text2: 'text-w-100 dark:text-amber-200', border: 'border-w-300 dark:border-amber-400' },
]

/** Real resources from /api/resources, most recently added first — badge labels are generic ("New") rather than fabricated claims like "Best Seller"/"Top Rated" this app has no sales/rating data to back. */
export function TrendingBooks() {
  const { data: resources } = useResources()
  const books = [...resources]
    .filter((r) => r.status !== 'archived')
    .slice(-4)
    .reverse()

  if (books.length === 0) return null

  return (
    <div className="py-12 px-4 bg-white dark:bg-[#0a0d1a]">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="font-lato text-xs font-semibold text-w-600 dark:text-amber-500/70 uppercase tracking-widest">
              Handpicked for You
            </span>
            <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-w-950 dark:text-gray-100 mt-1">
              Trending Right Now
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {books.map((book, i) => {
            const badge = badgeStyles[i % badgeStyles.length]
            return (
              <div key={book.id} className="relative group cursor-pointer">
                <div className={`absolute -top-3 -left-3 z-20 w-16 h-16 rounded-full ${badge.bg} border-2 ${badge.border} flex flex-col items-center justify-center shadow-md`}>
                  <p className={`font-cinzel text-xs font-bold ${badge.text1} leading-none`}>New</p>
                  <p className={`font-cinzel text-[10px] font-bold ${badge.text2} leading-none mt-0.5`}>Addition</p>
                </div>
                <div className="relative w-full h-64 md:h-72 rounded-lg overflow-hidden shadow-md">
                  <Image
                    src={book.coverImages[0]}
                    alt={book.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-[#2c2416]/40 dark:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end gap-2 pb-4">
                    <Link
                      href={`/library/${book.id}`}
                      className="w-32 text-center py-2 bg-w-accent text-w-950 dark:text-[#0a0d1a] rounded font-lato font-bold text-sm hover:bg-w-300 dark:hover:bg-amber-400 transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
                <p className="mt-2 font-lato text-sm font-semibold text-w-950 dark:text-gray-100 truncate">{book.title}</p>
              </div>
            )
          })}
        </div>

        <div className="flex justify-end mt-6">
          <Link
            href="/library"
            className="font-lato font-semibold text-w-700 dark:text-gray-400 hover:text-w-950 dark:hover:text-gray-100 border-b border-w-600 dark:border-gray-600 hover:border-w-950 dark:hover:border-gray-100 transition pb-0.5"
          >
            Explore More Books
          </Link>
        </div>

      </div>
    </div>
  )
}
