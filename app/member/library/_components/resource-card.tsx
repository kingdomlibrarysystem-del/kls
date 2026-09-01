'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, Heart, BookOpenCheck, ShoppingCart, Check, Package } from 'lucide-react'
import { RemoteImage } from '@/components/ui/remote-image'
import { useAuth } from '@/contexts/auth-context'
import { useFavorites, toggleFavorite } from '@/app/member/_shared/use-favorites'
import { useReadableContent } from '@/app/member/_shared/use-readable-content'
import { useCart, addToCart, isInCart, type CartItemType } from '@/app/member/_shared/use-cart'
import { getCategoryName } from '@/lib/kcs-taxonomy'
import type { Resource } from '@/app/dashboard/library/_components/resources-data'

interface ResourceCardProps {
  resource: Resource
}

function StarRating({ avgRating, reviewCount }: { avgRating: number; reviewCount: number }) {
  if (reviewCount === 0) {
    return <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No reviews yet</span>
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }} aria-label={`${avgRating.toFixed(1)} out of 5 stars, ${reviewCount} review${reviewCount === 1 ? '' : 's'}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={13} color="var(--gold)" fill={i < Math.round(avgRating) ? 'var(--gold)' : 'none'} />
      ))}
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({reviewCount})</span>
    </div>
  )
}

function useIsFavorited(id: string) {
  const { user } = useAuth()
  const favorites = useFavorites(user?.id)
  return favorites.some((f) => f.id === id)
}

/** Resource cover with Featured badge + favorite heart, shared by the grid card and list row. */
function ResourceCover({ resource, liked, height }: { resource: Resource; liked: boolean; height: number }) {
  return (
    <div style={{ position: 'relative' }}>
      <Link href={`/member/library/resource/${resource.id}`} aria-label={`View details for ${resource.title}`} style={{ display: 'block' }}>
        <div style={{ height, background: 'var(--bg-section)', position: 'relative', overflow: 'hidden' }}>
          {resource.coverImages[0] ? (
            <RemoteImage src={resource.coverImages[0]} alt={resource.title} fill sizes="(max-width: 768px) 90vw, 30vw" className="object-cover" fallback={<Package size={32} color="var(--text-muted)" />} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={32} color="var(--text-muted)" /></div>
          )}
          <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 8, background: 'linear-gradient(to right, rgba(0,0,0,0.15), rgba(255,255,255,0.3) 40%, rgba(0,0,0,0.1))' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: 16, background: 'linear-gradient(to right, rgba(0,0,0,0.35), transparent)' }} />
        </div>
      </Link>
      {resource.status === 'available' && resource.availableQty > 0 && (
        <span style={{ position: 'absolute', top: 10, left: 10, background: 'var(--gold)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>Featured</span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); toggleFavorite(resource.id, 'RESOURCE', resource.title, resource.author) }}
        aria-label={liked ? `Remove ${resource.title} from favorites` : `Add ${resource.title} to favorites`}
        style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      >
        <Heart size={16} color={liked ? 'var(--red-light)' : 'var(--text-muted)'} fill={liked ? 'var(--red-light)' : 'none'} />
      </button>
    </div>
  )
}

function useResourceCardState(resource: Resource) {
  const { user, isAuthenticated } = useAuth()
  const [addingType, setAddingType] = useState<CartItemType | null>(null)
  const [cartError, setCartError] = useState('')
  const readableContent = useReadableContent()
  useCart(user?.id)
  const liked = useIsFavorited(resource.id)
  const isReadable = !!readableContent[resource.id] || !!resource.documentUrl
  const outOfStock = resource.availableQty === 0
  const inCartRental = isInCart(resource.id, 'RENTAL')
  const inCartSale = isInCart(resource.id, 'SALE')
  const loginHref = `/auth/login?redirect=${encodeURIComponent(`/member/library/resource/${resource.id}`)}`

  const handleAddToCart = async (type: CartItemType) => {
    if (!user) return
    setAddingType(type)
    setCartError('')
    try {
      await addToCart(user.id, resource.id, type)
    } catch (err) {
      setCartError(err instanceof Error ? err.message : 'Could not add to cart')
    } finally {
      setAddingType(null)
    }
  }

  return { isAuthenticated, addingType, cartError, liked, isReadable, outOfStock, inCartRental, inCartSale, loginHref, handleAddToCart }
}

/**
 * Resource-first card for the member library — cover, real star rating
 * (Resource.avgRating/reviewCount, recomputed from Review rows), price,
 * and real actions: Preview/Read (if any Chapter rows or a documentUrl
 * exist), Borrow (RENTAL), Reserve (SALE), and View Details. Borrow/
 * Reserve are real charges added straight to the cart — there is no
 * separate free confirm flow; payment happens on the Cart page.
 * Modeled on ScrollCard's Dialect B styling since this is a /member/*
 * route.
 */
export function ResourceCard({ resource }: ResourceCardProps) {
  const { isAuthenticated, addingType, cartError, liked, isReadable, outOfStock, inCartRental, inCartSale, loginHref, handleAddToCart } = useResourceCardState(resource)

  return (
    <div
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.16)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <ResourceCover resource={resource} liked={liked} height={220} />

      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <Link href={`/member/library/resource/${resource.id}`} style={{ textDecoration: 'none', minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resource.title}</div>
          </Link>
          <StarRating avgRating={resource.avgRating} reviewCount={resource.reviewCount} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{getCategoryName(resource.categoryId)}</div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {resource.description}
        </p>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--gold)' }}>{resource.price > 0 ? `${resource.price.toLocaleString()} RWF` : 'Free'} <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>to reserve</span></span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{resource.borrowPrice > 0 ? `${resource.borrowPrice.toLocaleString()} RWF` : 'Free'} to borrow · {resource.borrowDurationDays}d</span>
            </div>
            {isReadable && (
              <Link href={`/member/library/read/${resource.id}`} aria-label={`Preview ${resource.title}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--gold)', textDecoration: 'none' }}>
                <BookOpenCheck size={13} /> Preview
              </Link>
            )}
          </div>

          {(inCartRental || inCartSale) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--gold-dim, rgba(184,134,11,0.12))', color: 'var(--gold)', fontSize: 11, fontWeight: 600, padding: '5px 8px', borderRadius: 6 }}>
              <Check size={12} /> {inCartRental && inCartSale ? 'Borrow & Reserve in cart' : inCartRental ? 'Borrow in cart' : 'Reserve in cart'}
            </div>
          )}

          {isAuthenticated ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => handleAddToCart('RENTAL')}
                disabled={outOfStock || inCartRental || addingType === 'RENTAL'}
                aria-label={inCartRental ? `${resource.title} (Borrow) is already in your cart` : `Borrow ${resource.title}`}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '7px 0', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: outOfStock ? 'var(--text-muted)' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: outOfStock || inCartRental ? 'not-allowed' : 'pointer', opacity: inCartRental ? 0.6 : 1 }}
              >
                <ShoppingCart size={13} /> Borrow
              </button>
              <button
                onClick={() => handleAddToCart('SALE')}
                disabled={inCartSale || addingType === 'SALE'}
                aria-label={inCartSale ? `${resource.title} (Reserve) is already in your cart` : `Reserve ${resource.title}`}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '7px 0', borderRadius: 7, border: '1px solid var(--gold)', background: 'transparent', color: 'var(--gold)', fontSize: 12, fontWeight: 600, cursor: inCartSale ? 'not-allowed' : 'pointer', opacity: inCartSale ? 0.6 : 1 }}
              >
                <ShoppingCart size={13} /> Reserve
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <Link href={loginHref} style={{ flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 7, border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Borrow</Link>
              <Link href={loginHref} style={{ flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 7, border: '1px solid var(--gold)', color: 'var(--gold)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Reserve</Link>
            </div>
          )}
          {cartError && <p style={{ fontSize: 11, color: 'var(--red-light)' }}>{cartError}</p>}

          <Link href={`/member/library/resource/${resource.id}`} style={{ textAlign: 'center', padding: '7px 0', borderRadius: 7, border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 12, textDecoration: 'none' }}>
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}

/** List-view resource row — same actions as the card, arranged horizontally per the reference "list" mockup. */
export function ResourceListItem({ resource }: { resource: Resource }) {
  const { isAuthenticated, addingType, cartError, liked, isReadable, outOfStock, inCartRental, inCartSale, loginHref, handleAddToCart } = useResourceCardState(resource)

  return (
    <div style={{ display: 'flex', gap: 14, padding: 14, borderBottom: '1px solid var(--border-light)' }}>
      <div style={{ width: 140, flexShrink: 0, borderRadius: 8, overflow: 'hidden' }}>
        <ResourceCover resource={resource} liked={liked} height={140} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <Link href={`/member/library/resource/${resource.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{resource.title}</div>
          </Link>
          <StarRating avgRating={resource.avgRating} reviewCount={resource.reviewCount} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{getCategoryName(resource.categoryId)}</div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 560 }}>{resource.description}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--gold)' }}>{resource.price > 0 ? `${resource.price.toLocaleString()} RWF` : 'Free'} <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>to reserve</span></span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{resource.borrowPrice > 0 ? `${resource.borrowPrice.toLocaleString()} RWF` : 'Free'} to borrow · {resource.borrowDurationDays}d</span>
          </div>
          {isReadable && (
            <Link href={`/member/library/read/${resource.id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--gold)', textDecoration: 'none' }}>
              <BookOpenCheck size={13} /> Preview
            </Link>
          )}
          {(inCartRental || inCartSale) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--gold-dim, rgba(184,134,11,0.12))', color: 'var(--gold)', fontSize: 11, fontWeight: 600, padding: '5px 8px', borderRadius: 6 }}>
              <Check size={12} /> {inCartRental && inCartSale ? 'Borrow & Reserve in cart' : inCartRental ? 'Borrow in cart' : 'Reserve in cart'}
            </div>
          )}
          {isAuthenticated ? (
            <>
              <button
                onClick={() => handleAddToCart('RENTAL')}
                disabled={outOfStock || inCartRental || addingType === 'RENTAL'}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: outOfStock ? 'var(--text-muted)' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: outOfStock || inCartRental ? 'not-allowed' : 'pointer', opacity: inCartRental ? 0.6 : 1 }}
              >
                <ShoppingCart size={13} /> Borrow
              </button>
              <button
                onClick={() => handleAddToCart('SALE')}
                disabled={inCartSale || addingType === 'SALE'}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 7, border: '1px solid var(--gold)', background: 'transparent', color: 'var(--gold)', fontSize: 12, fontWeight: 600, cursor: inCartSale ? 'not-allowed' : 'pointer', opacity: inCartSale ? 0.6 : 1 }}
              >
                <ShoppingCart size={13} /> Reserve
              </button>
            </>
          ) : (
            <>
              <Link href={loginHref} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Borrow</Link>
              <Link href={loginHref} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid var(--gold)', color: 'var(--gold)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Reserve</Link>
            </>
          )}
          <Link href={`/member/library/resource/${resource.id}`} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 12, textDecoration: 'none' }}>View Details</Link>
        </div>
        {cartError && <p style={{ fontSize: 11, color: 'var(--red-light)' }}>{cartError}</p>}
      </div>
    </div>
  )
}
