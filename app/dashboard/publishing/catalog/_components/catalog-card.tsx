import Image from 'next/image'
import type { PublishedBook } from './catalog-data'
import { languageBadgeLabels } from './catalog-data'

interface CatalogCardProps {
  book: PublishedBook
}

/** One published-book card: cover, title, contributor, language badge. */
export function CatalogCard({ book }: CatalogCardProps) {
  return (
    <div className="bg-form-highlight border border-w-300 rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col group">
      <div className="relative w-full h-56 bg-w-200 overflow-hidden">
        <Image
          src={book.coverImage}
          alt={book.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2">
          <span className="px-2 py-0.5 bg-w-950/80 text-white rounded text-xs font-lato font-semibold">
            {languageBadgeLabels[book.language]}
          </span>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="font-cinzel text-sm font-semibold text-w-950 leading-snug line-clamp-2">{book.title}</h3>
        <p className="font-lato text-xs text-w-700">by {book.contributor}</p>
      </div>
    </div>
  )
}
