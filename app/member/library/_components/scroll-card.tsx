'use client'

import Link from 'next/link'
import { ScrollText, Heart, ChevronRight, BookOpenCheck } from 'lucide-react'
import { useFavorites, toggleFavorite } from '@/app/member/_shared/use-favorites'
import { useResources, findResourcesForScroll } from '@/app/dashboard/library/_components/use-resources'
import { useReadableContent } from '@/app/member/_shared/use-readable-content'
import type { ScrollSummary } from './library-data'

interface ScrollProps {
  scroll: ScrollSummary
}

function useIsFavorited(id: string) {
  const favorites = useFavorites()
  return favorites.some((f) => f.id === id)
}

/** The one readable-online match for this scroll's title, if any — same title-based relationship findResourcesForScroll already establishes elsewhere. */
function useReadableResourceId(scrollTitle: string): string | undefined {
  const resources = useResources()
  const content = useReadableContent()
  const match = findResourcesForScroll(scrollTitle, resources).find((r) => !!content[r.id])
  return match?.id
}

/** Grid-view scroll card: heart toggle wired to the real shared favorites store, "Open Scroll" navigates to a real detail page. */
export function ScrollCard({ scroll }: ScrollProps) {
  const liked = useIsFavorited(scroll.id)
  const readableResourceId = useReadableResourceId(scroll.title)

  return (
    <div
      style={{
        background: 'var(--bg-subtle, var(--bg-card))', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ height: 80, background: 'linear-gradient(135deg, rgba(212,168,67,0.1), var(--bg-section))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <ScrollText size={28} color="var(--gold)" />
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(scroll.id, 'RESOURCE', scroll.title, `Scroll · ${scroll.section}`) }}
          aria-label={liked ? `Remove ${scroll.title} from favorites` : `Add ${scroll.title} to favorites`}
          style={{
            position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%',
            width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <Heart size={10} color={liked ? 'var(--red-light)' : '#fff'} fill={liked ? 'var(--red-light)' : 'none'} />
        </button>
      </div>
      <div style={{ padding: '8px 10px 10px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {scroll.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <span style={{ fontSize: 8, color: 'var(--gold)', background: 'rgba(212,168,67,0.1)', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace' }}>{scroll.code}</span>
          <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>{scroll.section}</span>
        </div>
        {readableResourceId && (
          <Link
            href={`/member/library/read/${readableResourceId}`}
            aria-label={`Read ${scroll.title} online`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, width: '100%', padding: '5px 0', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 9, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', marginBottom: 4 }}
          >
            <BookOpenCheck size={10} /> Read Online
          </Link>
        )}
        <Link
          href={`/member/library/${scroll.code}/${scroll.id}`}
          aria-label={`Open ${scroll.title}`}
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
  const readableResourceId = useReadableResourceId(scroll.title)

  return (
    <Link
      href={`/member/library/${scroll.code}/${scroll.id}`}
      aria-label={`Open ${scroll.title}`}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', width: '100%', background: 'none', border: 'none', textAlign: 'left', textDecoration: 'none' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ScrollText size={20} color="var(--gold)" /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{scroll.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
          <span style={{ fontSize: 8, color: 'var(--gold)', background: 'rgba(212,168,67,0.1)', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace' }}>{scroll.code}</span>
          <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>{scroll.section}</span>
        </div>
      </div>
      {readableResourceId && (
        <span
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/member/library/read/${readableResourceId}` }}
          role="link"
          aria-label={`Read ${scroll.title} online`}
          style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 6, background: 'var(--gold)', color: '#fff', fontSize: 9, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
        >
          <BookOpenCheck size={10} /> Read
        </span>
      )}
      <span
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(scroll.id, 'RESOURCE', scroll.title, `Scroll · ${scroll.section}`) }}
        role="button"
        aria-label={liked ? `Remove ${scroll.title} from favorites` : `Add ${scroll.title} to favorites`}
        style={{ padding: '4px 6px', cursor: 'pointer', color: liked ? 'var(--red-light)' : 'var(--text-muted)', display: 'flex' }}
      >
        <Heart size={12} fill={liked ? 'var(--red-light)' : 'none'} />
      </span>
      <ChevronRight size={14} color="var(--text-muted)" />
    </Link>
  )
}
