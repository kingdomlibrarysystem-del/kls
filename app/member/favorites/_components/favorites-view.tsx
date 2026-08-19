'use client'

import { useState, useEffect } from 'react'
import { Heart, BookOpen, GraduationCap, Eye, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { useAuth } from '@/contexts/auth-context'
import { useFavorites, removeFavorite } from '@/app/member/_shared/use-favorites'
import type { FavoriteItem } from './favorites-data'

/** Favorites carry no favorite-specific data of their own (no notes/date) —
 *  they're just a pointer to a resource or course, so "view" goes straight
 *  to that item's own real detail page rather than a duplicate view. */
function detailHref(item: FavoriteItem) {
  return item.type === 'COURSE' ? '/member/e-learning' : `/library/${item.id}`
}

/** Simulated network delay before the shared favorites store's initial snapshot is shown. */
const LOAD_DELAY_MS = 400

/**
 * Favorites list with a real "Remove from favorites" action — reads/writes
 * the shared use-favorites store, so removing here (or favoriting from the
 * library page) stays in sync across both pages.
 */
export function FavoritesView() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [removeError, setRemoveError] = useState('')
  const favorites = useFavorites(user?.id)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = (id: string) => {
    setRemoveError('')
    try {
      if (!favorites.some((f) => f.id === id)) throw new Error('Favorite not found')
      removeFavorite(id)
    } catch (error) {
      setRemoveError(error instanceof Error ? error.message : 'Could not remove favorite')
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-label="Loading favorites">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} style={{ height: 72, borderRadius: 8 }} />
        ))}
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="No favorites yet"
        description="Items you favorite from the library or e-learning catalog will appear here."
        style={{ color: 'var(--text-secondary)' }}
      />
    )
  }

  return (
    <div>
      {removeError && (
        <div style={{ background: 'var(--red-dim)', color: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>
          {removeError}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {favorites.map((item) => (
          <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0 }}>
              {item.type === 'COURSE' ? <GraduationCap size={18} /> : <BookOpen size={18} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.subtitle}</p>
            </div>
            <UniversalButton
              href={detailHref(item)}
              variant="gold-outline"
              size="sm"
              icon={<Eye size={14} />}
              aria-label={`View details for ${item.title}`}
            >
              View
            </UniversalButton>
            <button
              onClick={() => handleRemove(item.id)}
              aria-label={`Remove ${item.title} from favorites`}
              style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
