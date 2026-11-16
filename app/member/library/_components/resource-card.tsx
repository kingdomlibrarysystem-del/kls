'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, Heart, BookOpenCheck, ShoppingCart, Check, Package, Headphones, PlayCircle, Info } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { MediaCoverBadge } from '@/components/media/media-cover-badge'
import { playableKind } from '@/lib/media-embed'
import { RemoteImage } from '@/components/ui/remote-image'
import { useAuth } from '@/contexts/auth-context'
import { useFavorites, toggleFavorite } from '@/app/member/_shared/use-favorites'
import { useCart, addToCart, isInCart, type CartItemType } from '@/app/member/_shared/use-cart'
import { getCategoryName } from '@/lib/kcs-taxonomy'
import { isResourceReadable, type Resource } from '@/app/dashboard/library/_components/resources-data'

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
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Package size={28} color="var(--text-muted)" />
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kingdom Library</span>
            </div>
          )}
          <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 8, background: 'linear-gradient(to right, rgba(0,0,0,0.15), rgba(255,255,255,0.3) 40%, rgba(0,0,0,0.1))' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: 16, background: 'linear-gradient(to right, rgba(0,0,0,0.35), transparent)' }} />
          <MediaCoverBadge resource={resource} chip="bottom" />
        </div>
      </Link>
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
  useCart(user?.id)
  const liked = useIsFavorited(resource.id)
  // chapterCount comes with the resource list — no need to download every chapter in the library to know this.
  const isReadable = isResourceReadable(resource)
  // Audio / video titles are played on their detail page, not opened in the reader.
  const mediaKind = playableKind(resource)
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

  return { isAuthenticated, addingType, cartError, liked, isReadable, mediaKind, outOfStock, inCartRental, inCartSale, loginHref, handleAddToCart }
}

/**
 * Grid card for the member library, made to be easy to use: a book-shaped
 * cover (tap it or the title for details), title, author, a short price line,
 * ONE main action — Read / Listen / Watch when the title has that, otherwise
 * Details — and smaller Borrow / Reserve buttons (real cart items; payment
 * happens on the Cart page). Theme tokens, so light and dark mode both work.
 */
export function ResourceCard({ resource }: ResourceCardProps) {
  const { t } = useLanguage()
  const { isAuthenticated, addingType, cartError, liked, isReadable, mediaKind, outOfStock, inCartRental, inCartSale, loginHref, handleAddToCart } = useResourceCardState(resource)
  const detailHref = `/member/library/resource/${resource.id}`
  const main = mediaKind === 'video'
    ? { href: `${detailHref}#player`, icon: <PlayCircle className="size-4" />, label: t('m_library.watch') }
    : mediaKind === 'audio'
      ? { href: `${detailHref}#player`, icon: <Headphones className="size-4" />, label: t('m_library.listen') }
      : isReadable
        ? { href: `/member/library/read/${resource.id}`, icon: <BookOpenCheck className="size-4" />, label: t('m_library.read') }
        : { href: detailHref, icon: <Info className="size-4" />, label: t('m_library.details') }
  const money = (n: number) => (n > 0 ? `${n.toLocaleString()} RWF` : t('m_library.price_free'))
  const small = 'flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative">
        <Link href={detailHref} aria-label={`${t('m_library.details')}: ${resource.title}`} className="relative block aspect-[3/4] overflow-hidden bg-muted">
          {resource.coverImages[0] ? (
            <RemoteImage src={resource.coverImages[0]} alt={resource.title} fill sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 240px" className="object-cover transition-transform duration-500 group-hover:scale-105" fallback={<Package size={32} color="var(--text-muted)" />} />
          ) : (
            <span className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <Package className="size-8" />
              <span className="px-3 text-center text-[11px] font-semibold uppercase tracking-wider">{resource.title}</span>
            </span>
          )}
          {/* Book spine shading */}
          <span aria-hidden className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/30 to-transparent" />
          <MediaCoverBadge resource={resource} chip="bottom" />
        </Link>
        <button
          type="button"
          onClick={() => toggleFavorite(resource.id, 'RESOURCE', resource.title, resource.author)}
          aria-label={liked ? `Remove ${resource.title} from favorites` : `Add ${resource.title} to favorites`}
          className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-105"
        >
          <Heart size={16} color={liked ? 'var(--red-light)' : '#6b6b80'} fill={liked ? 'var(--red-light)' : 'none'} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Link href={detailHref} className="line-clamp-2 text-[15px] font-bold leading-snug text-foreground hover:text-primary">{resource.title}</Link>
        {resource.author && <p className="mt-0.5 truncate text-sm text-muted-foreground">{resource.author}</p>}
        <p className="truncate text-xs text-muted-foreground/80">{getCategoryName(resource.categoryId)}</p>
        {resource.reviewCount > 0 && <div className="mt-1"><StarRating avgRating={resource.avgRating} reviewCount={resource.reviewCount} /></div>}

        <dl className="mt-2 space-y-0.5 text-xs">
          <div className="flex justify-between gap-2"><dt className="text-muted-foreground">{t('m_library.borrow')} · {resource.borrowDurationDays} {t('m_library.days')}</dt><dd className="font-semibold text-foreground">{money(resource.borrowPrice)}</dd></div>
          <div className="flex justify-between gap-2"><dt className="text-muted-foreground">{t('m_library.reserve')}</dt><dd className="font-semibold text-foreground">{money(resource.price)}</dd></div>
        </dl>

        <div className="mt-auto space-y-2 pt-3">
          <Link href={main.href} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90">
            {main.icon} {main.label}
          </Link>
          {(inCartRental || inCartSale) && (
            <p className="flex items-center justify-center gap-1 text-xs font-semibold text-primary"><Check size={12} /> {t('m_library.in_cart')}</p>
          )}
          {isAuthenticated ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAddToCart('RENTAL')}
                disabled={outOfStock || inCartRental || addingType === 'RENTAL'}
                aria-label={inCartRental ? `${resource.title} (Borrow) is already in your cart` : `Borrow ${resource.title}`}
                className={`${small} border-border text-foreground hover:bg-muted`}
              >
                <ShoppingCart size={13} /> {t('m_library.borrow')}
              </button>
              <button
                type="button"
                onClick={() => handleAddToCart('SALE')}
                disabled={inCartSale || addingType === 'SALE'}
                aria-label={inCartSale ? `${resource.title} (Reserve) is already in your cart` : `Reserve ${resource.title}`}
                className={`${small} border-primary/60 text-primary hover:bg-primary/10`}
              >
                <ShoppingCart size={13} /> {t('m_library.reserve')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link href={loginHref} className={`${small} border-border text-foreground hover:bg-muted`}>{t('m_library.borrow')}</Link>
              <Link href={loginHref} className={`${small} border-primary/60 text-primary hover:bg-primary/10`}>{t('m_library.reserve')}</Link>
            </div>
          )}
          {cartError && <p className="text-xs text-destructive">{cartError}</p>}
        </div>
      </div>
    </article>
  )
}

/** List-view resource row — same actions as the card, arranged horizontally per the reference "list" mockup. */
export function ResourceListItem({ resource }: { resource: Resource }) {
  const { isAuthenticated, addingType, cartError, liked, isReadable, mediaKind, outOfStock, inCartRental, inCartSale, loginHref, handleAddToCart } = useResourceCardState(resource)

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
        {/* Three lines at most — the full summary is on the book's own page. */}
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, maxWidth: 640, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{resource.description}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--gold)' }}>{resource.price > 0 ? `${resource.price.toLocaleString()} RWF` : 'Free'} <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>to reserve</span></span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{resource.borrowPrice > 0 ? `${resource.borrowPrice.toLocaleString()} RWF` : 'Free'} to borrow · {resource.borrowDurationDays}d</span>
          </div>
          {mediaKind && (
            <Link href={`/member/library/resource/${resource.id}#player`} aria-label={`${mediaKind === 'video' ? 'Watch' : 'Listen to'} ${resource.title}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--gold)', textDecoration: 'none' }}>
              {mediaKind === 'video' ? <PlayCircle size={13} /> : <Headphones size={13} />} {mediaKind === 'video' ? 'Watch' : 'Listen'}
            </Link>
          )}
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
