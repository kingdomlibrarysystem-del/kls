'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Star, Heart, BookOpenCheck, ShoppingCart, Check, Package, AlertTriangle, BookX } from 'lucide-react'
import { RemoteImage } from '@/components/ui/remote-image'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/contexts/auth-context'
import { useResources } from '@/app/dashboard/library/_components/use-resources'
import { useReadableContent } from '@/app/member/_shared/use-readable-content'
import { useFavorites, toggleFavorite } from '@/app/member/_shared/use-favorites'
import { useCart, addToCart, isInCart } from '@/app/member/_shared/use-cart'
import { getCategoryName } from '@/lib/kcs-taxonomy'
import { bindingTypeLabels, mediaTypeLabels } from '@/app/dashboard/library/_components/resources-data'
import { BorrowReserveConfirmModal, type BorrowReserveAction } from '@/app/(public)/library/_components/borrow-reserve-confirm-modal'
import { BuyConfirmModal, type BuyAction } from '@/app/(public)/library/_components/buy-confirm-modal'
import { ResourceReviews } from './resource-reviews'

interface ResourceDetailViewProps {
  resourceId: string
}

/**
 * Member-facing single-resource detail page — Open Library style
 * (cover + title/rating/action row up top, description/subjects below,
 * a metadata sidebar), distinct from the admin's /dashboard/library/[id]
 * (staff-only, edit/archive actions) and the public /library/[id] (no
 * member sidebar/favorites/cart-sync). Reuses the exact same real data
 * hooks and modals as resource-card.tsx rather than re-implementing
 * borrow/reserve/buy/cart logic a second time.
 */
export function ResourceDetailView({ resourceId }: ResourceDetailViewProps) {
  const { user, isAuthenticated } = useAuth()
  const { data: resources, loading, error } = useResources()
  const readableContent = useReadableContent()
  const favorites = useFavorites(user?.id)
  const [borrowReserveAction, setBorrowReserveAction] = useState<BorrowReserveAction>(null)
  const [buyAction, setBuyAction] = useState<BuyAction>(null)
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartError, setCartError] = useState('')
  useCart(user?.id)

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-label="Loading resource">
        <Skeleton style={{ height: 40, borderRadius: 8 }} />
        <Skeleton style={{ height: 320, borderRadius: 8 }} />
      </div>
    )
  }

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load this resource" description={error} style={{ color: 'var(--text-secondary)' }} />
  }

  const resource = resources.find((r) => r.id === resourceId)
  if (!resource) {
    return <EmptyState icon={BookX} title="Resource not found" description="This resource doesn't exist in the Kingdom Library." style={{ color: 'var(--text-secondary)' }} />
  }

  const liked = favorites.some((f) => f.id === resource.id)
  const isReadable = !!readableContent[resource.id] || !!resource.documentUrl
  const outOfStock = resource.availableQty === 0
  const inCart = isInCart(resource.id, 'SALE')
  const loginHref = `/auth/login?redirect=${encodeURIComponent(`/member/library/resource/${resource.id}`)}`

  const handleAddToCart = async () => {
    if (!user) return
    setAddingToCart(true)
    setCartError('')
    try {
      await addToCart(user.id, resource.id, 'SALE')
    } catch (err) {
      setCartError(err instanceof Error ? err.message : 'Could not add to cart')
    } finally {
      setAddingToCart(false)
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
            <RemoteImage src={resource.coverImages[0]} alt={resource.title} fill sizes="200px" className="object-cover" fallback={<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-section)' }}><Package size={32} color="var(--text-muted)" /></div>} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-section)' }}><Package size={32} color="var(--text-muted)" /></div>
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

          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{resource.price > 0 ? `${resource.price.toLocaleString()} RWF` : 'Free'}</span>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {isReadable && (
              <Link href={`/member/library/read/${resource.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, background: 'var(--gold)', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                <BookOpenCheck size={14} /> {resource.price > 0 ? 'Preview' : 'Read'}
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <button onClick={() => setBorrowReserveAction('borrow')} disabled={outOfStock} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: outOfStock ? 'var(--text-muted)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: outOfStock ? 'not-allowed' : 'pointer' }}>Borrow</button>
                <button onClick={() => setBorrowReserveAction('reserve')} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--gold)', background: 'transparent', color: 'var(--gold)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Reserve</button>
                {resource.price > 0 && (
                  <>
                    <button onClick={() => setBuyAction('SALE')} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Buy</button>
                    <button onClick={() => setBuyAction('RENTAL')} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Rent</button>
                    <button
                      onClick={handleAddToCart}
                      disabled={inCart || addingToCart}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--bg-section)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: inCart || addingToCart ? 'default' : 'pointer' }}
                    >
                      {inCart ? <Check size={14} /> : <ShoppingCart size={14} />} {inCart ? 'In Cart' : 'Add to Cart'}
                    </button>
                  </>
                )}
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

          <ResourceReviews resourceId={resource.id} />
        </div>

        <div style={{ width: 240, flexShrink: 0 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Details</h3>
            {[
              ['Category', getCategoryName(resource.categoryId)],
              ['Language', resource.language],
              ['Pages', `${resource.pages}`],
              ['Binding', bindingTypeLabels[resource.bindingType]],
              ['Media', mediaTypeLabels[resource.mediaType]],
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

      <BorrowReserveConfirmModal action={borrowReserveAction} resourceId={resource.id} bookTitle={resource.title} bookAuthor={resource.author} availableQty={resource.availableQty} onClose={() => setBorrowReserveAction(null)} />
      <BuyConfirmModal action={buyAction} resourceId={resource.id} bookTitle={resource.title} priceRwf={resource.price} onClose={() => setBuyAction(null)} />
    </div>
  )
}
