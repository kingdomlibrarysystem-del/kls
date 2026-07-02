import Image from 'next/image'
import Link from 'next/link'
import { Star, Eye } from 'lucide-react'
import type { PublishedBook } from './catalog-data'
import { languageBadgeLabels } from './catalog-data'
import { toggleFeatured } from './use-catalog'

interface CatalogCardProps {
  book: PublishedBook
}

/**
 * One published-book card: cover, title, contributor, language badge, a
 * Featured toggle, and a Details link out to the existing public
 * publication-detail page (same underlying record — no duplicate view).
 */
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
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          <span className="px-2 py-0.5 bg-w-950/80 text-white rounded text-xs font-lato font-semibold">
            {languageBadgeLabels[book.language]}
          </span>
          {book.featured && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded text-xs font-lato font-semibold">
              <Star size={10} fill="currentColor" /> Featured
            </span>
          )}
        </div>
      </div>
      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="font-cinzel text-sm font-semibold text-w-950 leading-snug line-clamp-2">{book.title}</h3>
        <p className="font-lato text-xs text-w-700 mb-2">by {book.contributor}</p>

        <div className="mt-auto flex items-center gap-1.5">
          <Link
            href={`/library/${book.id}`}
            aria-label={`View details for ${book.title}`}
            className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors"
          >
            <Eye size={12} /> Details
          </Link>
          <button
            onClick={() => toggleFeatured(book.id)}
            aria-label={book.featured ? `Remove ${book.title} from featured` : `Mark ${book.title} as featured`}
            className={`flex items-center justify-center p-1.5 rounded border text-xs font-lato transition-colors ${
              book.featured
                ? 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100'
                : 'bg-white text-w-700 border-w-300 hover:bg-w-100'
            }`}
          >
            <Star size={13} fill={book.featured ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  )
}
