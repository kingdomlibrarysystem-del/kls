'use client'

import { useState, useEffect } from 'react'
import { Heart, BookOpen, GraduationCap, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { initialFavorites, type FavoriteItem } from './favorites-data'
import { FavoriteDetailModal } from './favorite-detail-modal'

/** Simulated network delay before mock favorites become visible. */
const LOAD_DELAY_MS = 400

/**
 * Favorites list with a "Remove from favorites" action per item. Removal is
 * local component state only — it does not persist across a reload.
 */
export function FavoritesView() {
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [removeError, setRemoveError] = useState('')
  const [viewing, setViewing] = useState<FavoriteItem | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFavorites(initialFavorites)
      setLoading(false)
    }, LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = (id: string) => {
    setRemoveError('')
    try {
      setFavorites((prev) => {
        const exists = prev.some((f) => f.id === id)
        if (!exists) throw new Error('Favorite not found')
        return prev.filter((f) => f.id !== id)
      })
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
        <div style={{ background: 'var(--red-dim)', color: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 6, padding: '8px 12px', fontSize: 11, marginBottom: 12 }}>
          {removeError}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {favorites.map((item) => (
          <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setViewing(item)}
              aria-label={`View details for ${item.title}`}
              style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0 }}>
                {item.type === 'COURSE' ? <GraduationCap size={16} /> : <BookOpen size={16} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</p>
                <p style={{ fontSize: 9, color: 'var(--text-muted)' }}>{item.subtitle}</p>
              </div>
            </button>
            <button
              onClick={() => handleRemove(item.id)}
              aria-label={`Remove ${item.title} from favorites`}
              style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <FavoriteDetailModal favorite={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}
