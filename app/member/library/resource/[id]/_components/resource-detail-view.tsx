'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Star, Heart, BookOpenCheck, ShoppingCart, Check, Package, BookX } from 'lucide-react'
import { RemoteImage } from '@/components/ui/remote-image'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/contexts/auth-context'
import { useFavorites, toggleFavorite } from '@/app/member/_shared/use-favorites'
import { useCart, addToCart, isInCart, type CartItemType } from '@/app/member/_shared/use-cart'
import { bindingTypeLabels, isResourceReadable, type Resource } from '@/app/dashboard/library/_components/resources-data'
import { useMediaTypes } from '@/lib/client/use-media-types'
import { mediaTypeName } from '@/lib/media-types-shared'
import { ResourceReviews, type Review } from './resource-reviews'

interface ResourceDetailViewProps {
  /** Loaded on the server by page.tsx; null when it doesn't exist. */
  resource: Resource | null
  /** Category display name, resolved server-side. */
  categoryName: string
  /** This resource's reviews, loaded server-side. */
  initialReviews: Review[]
}

/**
 * Member-facing single-resource detail page — Open Library style
 * (cover + title/rating/action row up top, description/subjects below,
 * a metadata sidebar), distinct from the admin's /dashboard/library/[id]
 * (staff-only, edit/archive actions) and the public /library/[id] (no
 * member sidebar/favorites/cart-sync). Reuses the exact same real data
 * hooks and modals as resource-card.tsx rather than re-implementing
 * borrow/reserve/buy/cart logic a second time. The resource, its category
 * name and its reviews come from the server page — previously this view
 * downloaded the whole catalog (useResources) and every chapter in the
 * library (useReadableContent) just to show one book.
 */
export function ResourceDetailView({ resource, categoryName, initialReviews }: ResourceDetailViewProps) {
  const { user, isAuthenticated } = useAuth()
  const favorites = useFavorites(user?.id)
  const [addingType, setAddingType] = useState<CartItemType | null>(null)
  const [cartError, setCartError] = useState('')
  useCart(user?.id)
  const { mediaTypes } = useMediaTypes()

  if (!resource) {
    return <EmptyState icon={BookX} title="Resource not found" description="This resource doesn't exist in the Kingdom Library." style={{ color: 'var(--text-secondary)' }} />
  }

  const liked = favorites.some((f) => f.id === resource.id)
  const isReadable = isResourceReadable(resource)
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Link href="/member/library" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>
        <ChevronLeft size={16} /> Back to Kingdom Library
      </Link>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ width: 200, flexShrink: 0, position: 'relative', height: 280, borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          {resource.coverImages[0] ? (
            <RemoteImage src={resource.coverImages[0]} alt={resource.title} fill sizes="200px" className="object-cover" fallback={<div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--bg-section)' }}><Package size={28} color="var(--text-muted)" /><span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kingdom Library</span></div>} />
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--bg-section)' }}>
              <Package size={28} color="var(--text-muted)" />
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kingdom Library</span>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <h1 className="cinzel" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{resource.title}</h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>by {resource.author}</p>
            </div>
            <button
              onClick={() => toggleFavorite(resource.id, 'RESOURCE', resource.title, resource.author)}
              aria-label={liked ? `Remove ${resource.title} from favorites` : `Add ${resource.title} to favorites`}
              style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <Heart size={18} color={liked ? 'var(--red-light)' : 'var(--text-muted)'} fill={liked ? 'var(--red-light)' : 'none'} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {Array.from({ length: 5 }, (_, i) => <Star key={i} size={15} color="var(--gold)" fill={i < Math.round(resource.avgRating) ? 'var(--gold)' : 'none'} />)}
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {resource.reviewCount > 0 ? `${resource.avgRating.toFixed(1)} (${resource.reviewCount} review${resource.reviewCount === 1 ? '' : 's'})` : 'No reviews yet'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }} suppressHydrationWarning>{resource.price > 0 ? `${resource.price.toLocaleString()} RWF` : 'Free'} <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>to reserve</span></span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }} suppressHydrationWarning>{resource.borrowPrice > 0 ? `${resource.borrowPrice.toLocaleString()} RWF` : 'Free'} to borrow · {resource.borrowDurationDays} days</span>
          </div>

          {(inCartRental || inCartSale) && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--gold-dim, rgba(184,134,11,0.12))', color: 'var(--gold)', fontSize: 12, fontWeight: 600, padding: '5px 10px', borderRadius: 6, width: 'fit-content' }}>
              <Check size={13} /> {inCartRental && inCartSale ? 'Borrow & Reserve in cart' : inCartRental ? 'Borrow in cart' : 'Reserve in cart'}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {isReadable && (
              <Link href={`/member/library/read/${resource.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, background: 'var(--gold)', color: 'var(--primary-foreground)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                <BookOpenCheck size={14} /> {resource.price > 0 ? 'Preview' : 'Read'}
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => handleAddToCart('RENTAL')}
                  disabled={outOfStock || inCartRental || addingType === 'RENTAL'}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: outOfStock ? 'var(--text-muted)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: outOfStock || inCartRental ? 'not-allowed' : 'pointer', opacity: inCartRental ? 0.6 : 1 }}
                >
                  <ShoppingCart size={14} /> Borrow
                </button>
                <button
                  onClick={() => handleAddToCart('SALE')}
                  disabled={inCartSale || addingType === 'SALE'}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: '1px solid var(--gold)', background: 'transparent', color: 'var(--gold)', fontSize: 13, fontWeight: 600, cursor: inCartSale ? 'not-allowed' : 'pointer', opacity: inCartSale ? 0.6 : 1 }}
                >
                  <ShoppingCart size={14} /> Reserve
                </button>
              </>
            ) : (
              <Link href={loginHref} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Sign in for more actions</Link>
            )}
          </div>
          {cartError && <p style={{ fontSize: 12, color: 'var(--red-light)' }}>{cartError}</p>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h2 className="cinzel" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Description</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{resource.description}</p>
          </div>

          {resource.tags.length > 0 && (
            <div>
              <h2 className="cinzel" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Subjects</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {resource.tags.map((t) => <span key={t} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>{t}</span>)}
              </div>
            </div>
          )}

          <ResourceReviews resourceId={resource.id} initialReviews={initialReviews} />
        </div>

        <div style={{ width: 240, flexShrink: 0 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Details</h3>
            {[
              ['Category', categoryName],
              ['Language', resource.language],
              ['Pages', `${resource.pages}`],
              ['Binding', bindingTypeLabels[resource.bindingType]],
              ['Media', mediaTypeName(resource.mediaType, mediaTypes)],
              ['ISBN', resource.isbn],
              ['Publisher', resource.publisher],
              ['Year', `${resource.year}`],
              ['Availability', `${resource.availableQty} / ${resource.totalQty} available`],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
