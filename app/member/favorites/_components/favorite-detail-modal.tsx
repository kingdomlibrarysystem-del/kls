import { BookOpen, GraduationCap, Tag } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import type { FavoriteItem } from './favorites-data'

interface FavoriteDetailModalProps {
  favorite: FavoriteItem | null
  onClose: () => void
}

/**
 * Read-only details view for a single favorite. Deliberately thin — a
 * `FavoriteItem` is just a pointer + display info (type, title, subtitle),
 * so this shows exactly that rather than inventing extra fields the data
 * model doesn't have.
 */
export function FavoriteDetailModal({ favorite, onClose }: FavoriteDetailModalProps) {
  return (
    <Modal open={!!favorite} onClose={onClose} title="Favorite Details" size="sm">
      {favorite && (
        <div className="flex items-start gap-3">
          <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0 }}>
            {favorite.type === 'COURSE' ? <GraduationCap size={20} /> : <BookOpen size={20} />}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{favorite.title}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{favorite.subtitle}</p>
            <p className="flex items-center gap-1" style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6 }}>
              <Tag size={11} /> {favorite.type === 'COURSE' ? 'Course' : 'Library Resource'}
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
}
