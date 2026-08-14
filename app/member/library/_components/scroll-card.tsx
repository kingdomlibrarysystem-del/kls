'use client'

import Link from 'next/link'
import { ScrollText, Heart, ChevronRight, BookOpenCheck } from 'lucide-react'
import { RemoteImage } from '@/components/ui/remote-image'
import { useAuth } from '@/contexts/auth-context'
import { useFavorites, toggleFavorite } from '@/app/member/_shared/use-favorites'
import { useResources, findResourcesForScroll } from '@/app/dashboard/library/_components/use-resources'
import { useReadableContent } from '@/app/member/_shared/use-readable-content'
import { useReadingProgress, getReadingProgressPercent } from '@/app/member/_shared/use-reading-progress'
import { getParentName, getScrollImage, type Category } from '@/lib/kcs-taxonomy'

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
function useReadableResourceId(categoryId: string): string | undefined {
  const { data: resources } = useResources()
  const content = useReadableContent()
  const match = findResourcesForScroll(categoryId, resources).find((r) => !!content[r.id])
  return match?.id
}

/** This scroll's reading-progress percent, if the member has started reading it. */
function useReadingPercent(resourceId: string | undefined): number | undefined {
  const { user } = useAuth()
  const progress = useReadingProgress(user?.id)
  if (!resourceId) return undefined
  const entry = progress.find((p) => p.resourceId === resourceId)
  return entry ? getReadingProgressPercent(entry) : undefined
}

/** Grid-view scroll card: heart toggle wired to the real shared favorites store, "Open Scroll" navigates to a real detail page. */
export function ScrollCard({ scroll }: ScrollProps) {
  const liked = useIsFavorited(scroll.id)
  const readableResourceId = useReadableResourceId(scroll.id)
  const readingPercent = useReadingPercent(readableResourceId)
  const sectionName = getParentName(scroll) ?? ''
  const image = getScrollImage(scroll)

  return (
    <div
      style={{
        background: 'var(--bg-subtle, var(--bg-card))', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ height: 80, background: 'linear-gradient(135deg, rgba(212,168,67,0.1), var(--bg-section))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {image ? (
          <RemoteImage
            src={image}
            alt={scroll.name.en}
            fill
            sizes="(max-width: 768px) 50vw, 20vw"
            className="object-cover"
            fallback={<ScrollText size={28} color="var(--gold)" />}
          />
        ) : (
          <ScrollText size={28} color="var(--gold)" />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(scroll.id, 'RESOURCE', scroll.name.en, `Scroll · ${sectionName}`) }}
          aria-label={liked ? `Remove ${scroll.name.en} from favorites` : `Add ${scroll.name.en} to favorites`}
          style={{
            position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.35)', border: 'none', borderRadius: '50%',
            width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1,
          }}
        >
          <Heart size={10} color={liked ? 'var(--red-light)' : '#fff'} fill={liked ? 'var(--red-light)' : 'none'} />
        </button>
      </div>
      <div style={{ padding: '8px 10px 10px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {scroll.name.en}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <span style={{ fontSize: 8, color: 'var(--gold)', background: 'rgba(212,168,67,0.1)', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace' }}>{scroll.slug}</span>
          <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>{sectionName}</span>
        </div>
        {readableResourceId && (
          <>
            {typeof readingPercent === 'number' && (
              <div style={{ height: 3, borderRadius: 2, background: 'var(--bg-section)', marginBottom: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${readingPercent}%`, background: 'var(--gold)' }} />
              </div>
            )}
            <Link
              href={`/member/library/read/${readableResourceId}`}
              aria-label={readingPercent ? `Continue reading ${scroll.name.en}` : `Read ${scroll.name.en} online`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, width: '100%', padding: '5px 0', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 9, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', marginBottom: 4 }}
            >
              <BookOpenCheck size={10} /> {typeof readingPercent === 'number' ? `Continue Reading (${readingPercent}%)` : 'Read Online'}
            </Link>
          </>
        )}
        <Link
          href={`/member/library/${scroll.parentId}/${scroll.id}`}
          aria-label={`Open ${scroll.name.en}`}
          style={{ display: 'block', textAlign: 'center', width: '100%', padding: '5px 0', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 9, cursor: 'pointer', textDecoration: 'none' }}
        >
          Open Scroll
        </Link>
      </div>
    </div>
  )
}

/** List-view scroll row: same real favorite toggle + real Open Scroll destination as the card variant. */
export function ScrollListItem({ scroll }: ScrollProps) {
  const liked = useIsFavorited(scroll.id)
  const readableResourceId = useReadableResourceId(scroll.id)
  const readingPercent = useReadingPercent(readableResourceId)
  const sectionName = getParentName(scroll) ?? ''

  return (
    <Link
      href={`/member/library/${scroll.parentId}/${scroll.id}`}
      aria-label={`Open ${scroll.name.en}`}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', width: '100%', background: 'none', border: 'none', textAlign: 'left', textDecoration: 'none' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ScrollText size={20} color="var(--gold)" /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{scroll.name.en}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
          <span style={{ fontSize: 8, color: 'var(--gold)', background: 'rgba(212,168,67,0.1)', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace' }}>{scroll.slug}</span>
          <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>{sectionName}</span>
        </div>
      </div>
      {readableResourceId && (
        <span
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/member/library/read/${readableResourceId}` }}
          role="link"
          aria-label={readingPercent ? `Continue reading ${scroll.name.en}` : `Read ${scroll.name.en} online`}
          style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 6, background: 'var(--gold)', color: '#fff', fontSize: 9, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
        >
          <BookOpenCheck size={10} /> {typeof readingPercent === 'number' ? `${readingPercent}%` : 'Read'}
        </span>
      )}
      <span
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(scroll.id, 'RESOURCE', scroll.name.en, `Scroll · ${sectionName}`) }}
        role="button"
        aria-label={liked ? `Remove ${scroll.name.en} from favorites` : `Add ${scroll.name.en} to favorites`}
        style={{ padding: '4px 6px', cursor: 'pointer', color: liked ? 'var(--red-light)' : 'var(--text-muted)', display: 'flex' }}
      >
        <Heart size={12} fill={liked ? 'var(--red-light)' : 'none'} />
      </span>
      <ChevronRight size={14} color="var(--text-muted)" />
    </Link>
  )
}
