'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, ChevronUp, BookMarked, Film, Package, BookOpenCheck, ShoppingCart, Check } from 'lucide-react'
import { UniversalButton } from '@/components/ui/universal-button'
import { useAuth } from '@/contexts/auth-context'
import { bindingTypeLabels, mediaTypeLabels, type Resource } from '@/app/dashboard/library/_components/resources-data'
import { useReadableContent } from '@/app/member/_shared/use-readable-content'
import { useCart, addToCart, isInCart, type CartItemType } from '@/app/member/_shared/use-cart'
import { getCategoryName } from '@/lib/kcs-taxonomy'

/**
 * The identity portion (cover, title, price, badges) is wrapped in a real
 * `<Link>` to the detail page — previously this grid had no click-through
 * to `/library/[id]` at all. The "show more"/Borrow/Reserve controls stay
 * as siblings outside that link (not nested inside it), so a real `<button>`
 * or a real `<Link>` (signed-out state) never ends up nested inside another
 * `<a>`, which HTML disallows — same reasoning `scroll-card.tsx` uses,
 * just via sibling placement here instead of `stopPropagation` since none
 * of the actions need to happen "through" the link area. Borrow/Reserve
 * are real charges (RENTAL/SALE) added straight to the cart — there is no
 * separate free confirm flow; the member pays and completes the request
 * from the Cart page.
 */
export function BookCard({ book }: { book: Resource }) {
  const [showSummary, setShowSummary] = useState(false)
  const [addingType, setAddingType] = useState<CartItemType | null>(null)
  const [cartError, setCartError] = useState('')
  const { user, isAuthenticated } = useAuth()
  const readableContent = useReadableContent()
  useCart(user?.id)
  const isReadable = !!readableContent[book.id]
  const outOfStock = book.availableQty === 0
  const detailHref = `/library/${book.id}`
  const loginHref = `/auth/login?redirect=${encodeURIComponent(detailHref)}`
  const readHref = `/auth/login?redirect=${encodeURIComponent(`/member/library/read/${book.id}`)}`
  const inCartRental = isInCart(book.id, 'RENTAL')
  const inCartSale = isInCart(book.id, 'SALE')

  const handleAddToCart = async (type: CartItemType) => {
    if (!user) return
    setAddingType(type)
    setCartError('')
    try {
      await addToCart(user.id, book.id, type)
    } catch (err) {
      setCartError(err instanceof Error ? err.message : 'Could not add to cart')
    } finally {
      setAddingType(null)
    }
  }

  return (
    <div className="bg-form-highlight border border-w-300 rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <Link href={detailHref} aria-label={`View details for ${book.title}`} className="block bg-w-200 pt-6 pb-4 px-6">
        <div
          className="relative w-full h-96 rounded-[2px] overflow-hidden"
          style={{
            boxShadow:
              '0 1px 0 1px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.15), 0 8px 16px -4px rgba(0,0,0,0.25), inset -3px 0 6px rgba(0,0,0,0.12)',
          }}
        >
          <Image src={book.coverImages[0]} alt={book.title} fill className="object-cover" sizes="(max-width: 640px) 90vw, (max-width: 1024px) 40vw, 25vw" />
          {/* Page-edge stripe on the right — the visual cue that reads as "this is a bound book," not a flat poster. */}
          <div
            className="absolute top-0 right-0 h-full w-[6px]"
            style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.15), rgba(255,255,255,0.35) 40%, rgba(0,0,0,0.1))' }}
          />
          {/* Spine-shadow on the left edge, suggesting the cover wraps around a bound spine. */}
          <div
            className="absolute top-0 left-0 h-full w-3"
            style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.35), transparent)' }}
          />
        </div>
      </Link>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <Link href={detailHref} className="hover:text-w-600 transition-colors">
          <h3 className="font-cinzel text-base font-semibold text-w-950 leading-snug mb-1">{book.title}</h3>
          <p className="font-lato text-sm text-w-700">by {book.author}</p>
        </Link>
        <p className="font-cinzel text-lg font-bold text-w-600">
          {book.price > 0 ? `${book.price.toLocaleString('en-RW')} RWF` : 'Free'} <span className="text-xs font-lato font-semibold text-w-500">to reserve</span>
        </p>
        <p className="font-lato text-xs text-w-600">{book.borrowPrice > 0 ? `${book.borrowPrice.toLocaleString('en-RW')} RWF` : 'Free'} to borrow · {book.borrowDurationDays}d</p>
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato">{getCategoryName(book.categoryId)}</span>
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
              <UniversalButton href={`/member/library/read/${book.id}`} variant="primary" size="sm" fullWidth icon={<BookOpenCheck size={13} />}>
                {book.price > 0 ? 'Preview' : 'Read Online'}
              </UniversalButton>
            ) : (
              <UniversalButton href={readHref} variant="primary" size="sm" fullWidth icon={<BookOpenCheck size={13} />}>
                {book.price > 0 ? 'Sign In to Preview' : 'Sign In to Read'}
              </UniversalButton>
            )
          )}
          {(inCartRental || inCartSale) && (
            <div className="flex items-center gap-1.5 bg-w-100 text-w-700 text-xs font-lato font-semibold px-2 py-1 rounded">
              <Check size={12} /> {inCartRental && inCartSale ? 'Borrow & Reserve in cart' : inCartRental ? 'Borrow in cart' : 'Reserve in cart'}
            </div>
          )}
          {isAuthenticated ? (
            <div className="flex gap-2">
              <UniversalButton
                variant={isReadable ? 'outline' : 'primary'}
                size="sm"
                disabled={outOfStock || inCartRental}
                loading={addingType === 'RENTAL'}
                icon={<ShoppingCart size={13} />}
                className="flex-1"
                onClick={() => handleAddToCart('RENTAL')}
              >
                Borrow
              </UniversalButton>
              <UniversalButton
                variant="outline"
                size="sm"
                disabled={inCartSale}
                loading={addingType === 'SALE'}
                icon={<ShoppingCart size={13} />}
                className="flex-1"
                onClick={() => handleAddToCart('SALE')}
              >
                Reserve
              </UniversalButton>
            </div>
          ) : (
            <div className="flex gap-2">
              <UniversalButton href={loginHref} variant={isReadable ? 'outline' : 'primary'} size="sm" className="flex-1">Borrow</UniversalButton>
              <UniversalButton href={loginHref} variant="outline" size="sm" className="flex-1">Reserve</UniversalButton>
            </div>
          )}
          {cartError && <p className="font-lato text-xs text-red-700">{cartError}</p>}
        </div>
      </div>
    </div>
  )
}
