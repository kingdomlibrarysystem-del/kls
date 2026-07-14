'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, ChevronUp, BookMarked, Film, Package, BookOpenCheck } from 'lucide-react'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'
import { bindingTypeLabels, mediaTypeLabels, type Resource } from '@/app/dashboard/library/_components/resources-data'
import { useReadableContent } from '@/app/member/_shared/use-readable-content'

/**
 * The identity portion (cover, title, price, badges) is wrapped in a real
 * `<Link>` to the detail page — previously this grid had no click-through
 * to `/library/[id]` at all. The "show more"/Borrow/Reserve controls stay
 * as siblings outside that link (not nested inside it), so a real `<button>`
 * or a real `<Link>` (signed-out state) never ends up nested inside another
 * `<a>`, which HTML disallows — same reasoning `scroll-card.tsx` uses,
 * just via sibling placement here instead of `stopPropagation` since none
 * of the actions need to happen "through" the link area.
 */
export function BookCard({ book, onAction }: { book: Resource; onAction: (book: Resource, action: 'borrow' | 'reserve') => void }) {
  const [showSummary, setShowSummary] = useState(false)
  const { isAuthenticated } = useAuth()
  const readableContent = useReadableContent()
  const isReadable = !!readableContent[book.id]
  const outOfStock = book.availableQty === 0
  const detailHref = `/library/${book.id}`
  const loginHref = `/auth/login?redirect=${encodeURIComponent(detailHref)}`
  const readHref = `/auth/login?redirect=${encodeURIComponent(`/member/library/read/${book.id}`)}`

  return (
    <div className="bg-form-highlight border border-w-300 rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
      <Link href={detailHref} aria-label={`View details for ${book.title}`}>
        <div className="relative w-full h-52 bg-w-200">
          <Image src={book.coverImages[0]} alt={book.title} fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" />
        </div>
      </Link>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <Link href={detailHref} className="hover:text-w-600 transition-colors">
          <h3 className="font-cinzel text-sm font-semibold text-w-950 leading-snug mb-1">{book.title}</h3>
          <p className="font-lato text-xs text-w-700">by {book.author}</p>
        </Link>
        <p className="font-cinzel text-base font-bold text-w-600">{book.price.toLocaleString('en-RW')} RWF</p>
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato">{book.category}</span>
          <span className="flex items-center gap-1 px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato"><BookMarked size={10} /> {bindingTypeLabels[book.bindingType]}</span>
          <span className="flex items-center gap-1 px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato"><Film size={10} /> {mediaTypeLabels[book.mediaType]}</span>
        </div>
        <div className="flex gap-3 text-xs font-lato text-w-700 items-center">
          <span>{book.pages} pages</span><span>·</span>
          <span>{book.language}</span><span>·</span>
          <span className={`flex items-center gap-1 ${outOfStock ? 'text-red-700 font-semibold' : ''}`}><Package size={11} /> {book.availableQty} available</span>
        </div>
        <button
          onClick={() => setShowSummary((v) => !v)}
          className="flex items-center gap-1 font-lato text-xs text-w-600 hover:text-w-950 transition-colors w-fit"
        >
          {showSummary ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {showSummary ? 'Hide summary' : 'View summary'}
        </button>
        {showSummary && (
          <p className="font-lato text-xs text-w-700 leading-relaxed border-t border-w-300 pt-2">{book.description}</p>
        )}
        <div className="flex flex-col gap-2 mt-auto pt-3">
          {isReadable && (
            isAuthenticated ? (
              <Link href={`/member/library/read/${book.id}`} className="w-full">
                <ElegantButton variant="primary" className="w-full text-xs py-2 flex items-center justify-center gap-1.5"><BookOpenCheck size={13} /> Read Online</ElegantButton>
              </Link>
            ) : (
              <Link href={readHref} className="w-full">
                <ElegantButton variant="primary" className="w-full text-xs py-2 flex items-center justify-center gap-1.5"><BookOpenCheck size={13} /> Sign In to Read</ElegantButton>
              </Link>
            )
          )}
          <div className="flex gap-2">
            {isAuthenticated ? (
              <>
                <ElegantButton variant={isReadable ? 'outline' : 'primary'} disabled={outOfStock} className="flex-1 text-xs py-2" onClick={() => onAction(book, 'borrow')}>Borrow</ElegantButton>
                <ElegantButton variant="outline" className="flex-1 text-xs py-2" onClick={() => onAction(book, 'reserve')}>Reserve</ElegantButton>
              </>
            ) : (
              <>
                <Link href={loginHref} className="flex-1">
                  <ElegantButton variant={isReadable ? 'outline' : 'primary'} className="w-full text-xs py-2">Borrow</ElegantButton>
                </Link>
                <Link href={loginHref} className="flex-1">
                  <ElegantButton variant="outline" className="w-full text-xs py-2">Reserve</ElegantButton>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
