import { PageTransition } from '@/components/ui/page-transition'
import { FavoritesView } from './_components/favorites-view'

export default function FavoritesPage() {
  return (
    <PageTransition>
      <div style={{ marginBottom: 16 }}>
        <div className="cinzel" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
          Favorites
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          Books and courses you&apos;ve saved for later
        </div>
      </div>
      <FavoritesView />
    </PageTransition>
  )
}
