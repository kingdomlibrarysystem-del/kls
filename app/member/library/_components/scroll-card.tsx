'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ScrollText, Heart, ChevronRight, BookOpenCheck, Package } from 'lucide-react'
import { RemoteImage } from '@/components/ui/remote-image'
import { useAuth } from '@/contexts/auth-context'
import { useFavorites, toggleFavorite } from '@/app/member/_shared/use-favorites'
import { useResources, findResourcesForScroll } from '@/app/dashboard/library/_components/use-resources'
import { useReadableContent } from '@/app/member/_shared/use-readable-content'
import { useReadingProgress, getReadingProgressPercent } from '@/app/member/_shared/use-reading-progress'
import { getParentName, getScrollImage, type Category } from '@/lib/kcs-taxonomy'
import { BorrowReserveConfirmModal, type BorrowReserveAction } from '@/app/(public)/library/_components/borrow-reserve-confirm-modal'

interface ScrollProps {
  /** A leaf/scroll-level Category row from the canonical KCS taxonomy. */
  scroll: Category
}

function useIsFavorited(id: string) {
  const { user } = useAuth()
  const favorites = useFavorites(user?.id)
  return favorites.some((f) => f.id === id)
}

/** The one readable-online match for this scroll, if any — a real `categoryId` FK match, not a title-string hack. */
function useReadableResource(categoryId: string) {
  const { data: resources } = useResources()
  const content = useReadableContent()
  return findResourcesForScroll(categoryId, resources).find((r) => !!content[r.id])
}

/** This scroll's reading-progress percent, if the member has started reading it. */
function useReadingPercent(resourceId: string | undefined): number | undefined {
  const { user } = useAuth()
  const progress = useReadingProgress(user?.id)
  if (!resourceId) return undefined
  const entry = progress.find((p) => p.resourceId === resourceId)
  return entry ? getReadingProgressPercent(entry) : undefined
}

/**
 * Grid-view scroll card: real large cover (matches the physical-book
 * mockups this was redesigned against, not the old 80px thumbnail strip),
 * heart toggle wired to the real shared favorites store. When a readable
 * resource is linked, Read/Borrow/Reserve render directly on the card —
 * previously these only appeared after a click-through to the detail
 * page, which made the reading path easy to miss entirely.
 */
export function ScrollCard({ scroll }: ScrollProps) {
  const { isAuthenticated } = useAuth()
  const [action, setAction] = useState<BorrowReserveAction>(null)
  const liked = useIsFavorited(scroll.id)
  const readableResource = useReadableResource(scroll.id)
  const readingPercent = useReadingPercent(readableResource?.id)
  const sectionName = getParentName(scroll) ?? ''
  const image = getScrollImage(scroll)

  return (
    <div
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.16)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ position: 'relative' }}>
        <Link href={`/member/library/${scroll.parentId}/${scroll.id}`} aria-label={`Open ${scroll.name.en}`} style={{ display: 'block' }}>
          <div
            style={{
              height: 220, background: 'linear-gradient(135deg, rgba(212,168,67,0.12), var(--bg-section))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
            }}
          >
            {image ? (
              <RemoteImage
                src={image}
                alt={scroll.name.en}
                fill
                sizes="(max-width: 768px) 90vw, 30vw"
                className="object-cover"
                fallback={<ScrollText size={40} color="var(--gold)" />}
              />
            ) : (
              <ScrollText size={40} color="var(--gold)" />
            )}
            {/* Page-edge + spine depth — same book-like treatment as the public library redesign, reused here for visual consistency. */}
            <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 8, background: 'linear-gradient(to right, rgba(0,0,0,0.15), rgba(255,255,255,0.3) 40%, rgba(0,0,0,0.1))' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: 16, background: 'linear-gradient(to right, rgba(0,0,0,0.35), transparent)' }} />
          </div>
        </Link>

        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(scroll.id, 'RESOURCE', scroll.name.en, `Scroll · ${sectionName}`) }}
          aria-label={liked ? `Remove ${scroll.name.en} from favorites` : `Add ${scroll.name.en} to favorites`}
          style={{
            position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1,
          }}
        >
          <Heart size={16} color={liked ? 'var(--red-light)' : '#fff'} fill={liked ? 'var(--red-light)' : 'none'} />
        </button>
      </div>

      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <Link href={`/member/library/${scroll.parentId}/${scroll.id}`} style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {scroll.name.en}
          </div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--gold)', background: 'rgba(212,168,67,0.1)', padding: '2px 7px', borderRadius: 4, fontFamily: 'monospace' }}>{scroll.slug}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sectionName}</span>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {readableResource && (
            <>
              {typeof readingPercent === 'number' && (
                <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-section)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${readingPercent}%`, background: 'var(--gold)' }} />
                </div>
              )}
              <Link
                href={`/member/library/read/${readableResource.id}`}
                aria-label={readingPercent ? `Continue reading ${scroll.name.en}` : `Read ${scroll.name.en} online`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, width: '100%', padding: '8px 0', borderRadius: 7, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
              >
                <BookOpenCheck size={14} /> {typeof readingPercent === 'number' ? `Continue Reading (${readingPercent}%)` : 'Read Online'}
              </Link>
              {isAuthenticated && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {readableResource.availableQty > 0 && (
                    <button
                      onClick={() => setAction('borrow')}
                      aria-label={`Borrow ${readableResource.title}`}
                      style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Borrow
                    </button>
                  )}
                  <button
                    onClick={() => setAction('reserve')}
                    aria-label={`Reserve ${readableResource.title}`}
                    style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: '1px solid var(--gold)', background: 'transparent', color: 'var(--gold)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Reserve
                  </button>
                </div>
              )}
            </>
          )}
          <Link
            href={`/member/library/${scroll.parentId}/${scroll.id}`}
            aria-label={`Open ${scroll.name.en}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', padding: '7px 0', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', textDecoration: 'none' }}
          >
            {readableResource ? 'View Details' : 'Open Scroll'} <ChevronRight size={13} />
          </Link>
          {!readableResource && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
              <Package size={11} /> No linked resource yet
            </p>
          )}
        </div>
      </div>

      {readableResource && (
        <BorrowReserveConfirmModal
          action={action}
          resourceId={readableResource.id}
          bookTitle={readableResource.title}
          bookAuthor={readableResource.author}
          availableQty={readableResource.availableQty}
          onClose={() => setAction(null)}
        />
      )}
    </div>
  )
}

/** List-view scroll row: same real favorite toggle + real Open Scroll destination as the card variant. */
export function ScrollListItem({ scroll }: ScrollProps) {
  const liked = useIsFavorited(scroll.id)
  const readableResource = useReadableResource(scroll.id)
  const readingPercent = useReadingPercent(readableResource?.id)
  const sectionName = getParentName(scroll) ?? ''

  return (
    <Link
      href={`/member/library/${scroll.parentId}/${scroll.id}`}
      aria-label={`Open ${scroll.name.en}`}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', width: '100%', background: 'none', border: 'none', textAlign: 'left', textDecoration: 'none' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ScrollText size={22} color="var(--gold)" /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{scroll.name.en}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
          <span style={{ fontSize: 10, color: 'var(--gold)', background: 'rgba(212,168,67,0.1)', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace' }}>{scroll.slug}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sectionName}</span>
        </div>
      </div>
      {readableResource && (
        <span
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/member/library/read/${readableResource.id}` }}
          role="link"
          aria-label={readingPercent ? `Continue reading ${scroll.name.en}` : `Read ${scroll.name.en} online`}
          style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 6, background: 'var(--gold)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
        >
          <BookOpenCheck size={12} /> {typeof readingPercent === 'number' ? `${readingPercent}%` : 'Read'}
        </span>
      )}
      <span
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(scroll.id, 'RESOURCE', scroll.name.en, `Scroll · ${sectionName}`) }}
        role="button"
        aria-label={liked ? `Remove ${scroll.name.en} from favorites` : `Add ${scroll.name.en} to favorites`}
        style={{ padding: '4px 6px', cursor: 'pointer', color: liked ? 'var(--red-light)' : 'var(--text-muted)', display: 'flex' }}
      >
        <Heart size={14} fill={liked ? 'var(--red-light)' : 'none'} />
      </span>
      <ChevronRight size={16} color="var(--text-muted)" />
    </Link>
  )
}
