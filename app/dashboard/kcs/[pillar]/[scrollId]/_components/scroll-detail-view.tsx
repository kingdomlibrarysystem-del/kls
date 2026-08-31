'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ScrollText, Package, BookX, GraduationCap, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { RelatedResourceCard } from '@/components/ui/related-resource-card'
import { useAuth } from '@/contexts/auth-context'
import { useResources, findResourcesForScroll } from '@/app/dashboard/library/_components/use-resources'
import { useCart, addToCart, isInCart } from '@/app/member/_shared/use-cart'
import { getCategoryById, getChildCategories, type CategoryStatus } from '@/lib/kcs-taxonomy'
import { useCategories } from '@/lib/kcs-taxonomy/use-categories'
import { KcsViewToggle, type KcsContentView } from '../../../_components/kcs-view-toggle'
import { ScrollResourcesTable } from './scroll-resources-table'
import { ScrollResourcesList } from './scroll-resources-list'
import { ScrollAnalytics } from './scroll-analytics'

const statusConfig: Record<CategoryStatus, { label: string; color: string; bg: string }> = {
  AVAILABLE: { label: 'Available', color: 'var(--green-light)', bg: 'var(--green-dim)' },
  ARCHIVED: { label: 'Archived', color: 'var(--text-muted)', bg: 'var(--bg-section)' },
  OUT_OF_STOCK: { label: 'Out of Stock', color: 'var(--red-light)', bg: 'var(--red-dim)' },
}

interface ScrollDetailViewProps {
  pillarSlug: string
  scrollSlug: string
}

/**
 * Real click-through detail page for a single KCS scroll — identity
 * (title/code/section/status, unchanged from the card) plus a genuine
 * Related Resources section sourced from the canonical Resource store by
 * a real `categoryId` FK match, with a real Borrow action (adds a real
 * RENTAL charge to the cart) when a matching resource has stock. A
 * scroll with no matching resource (archived/
 * apocryphal titles with no catalog entry) correctly shows EmptyState
 * rather than fabricated content — the underlying scroll model still has
 * no content/body field, so this page adds a real relationship, not
 * reader content that doesn't exist.
 *
 * Previously matched resources by title string against the scroll's title
 * (a fragile hack); now filters `Resource.categoryId` directly against the
 * scroll's own stable id.
 *
 * Related Courses is intentionally an honest "not yet linked" EmptyState,
 * not a fabricated list: `CourseCatalogEntry.category` (course-form-schema.ts)
 * is a free-text field with values like "Theology"/"Discipleship" — checked
 * and confirmed to have zero structural link (no categoryId, no slug match)
 * to this KCS taxonomy. Faking a course list against an unrelated field
 * would be worse than admitting the relationship doesn't exist yet.
 */
export function ScrollDetailView({ pillarSlug, scrollSlug }: ScrollDetailViewProps) {
  const [view, setView] = useState<KcsContentView>('table')
  const [showAnalytics, setShowAnalytics] = useState(true)
  const [addingId, setAddingId] = useState<string | null>(null)
  const { isAuthenticated, user } = useAuth()
  const { data: resources, loading: resourcesLoading, error: resourcesError } = useResources()
  const { loading: categoriesLoading, error: categoriesError } = useCategories()
  useCart(user?.id)

  const handleAddToCart = async (resourceId: string) => {
    if (!user) return
    setAddingId(resourceId)
    try {
      await addToCart(user.id, resourceId, 'RENTAL')
    } finally {
      setAddingId(null)
    }
  }

  const loading = resourcesLoading || categoriesLoading
  const error = categoriesError ?? resourcesError

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading scroll details">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    )
  }

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load this scroll" description={error} />
  }

  const pillar = getCategoryById(pillarSlug)
  const scroll = pillar ? getChildCategories(pillar.id).find((s) => s.slug === scrollSlug) : undefined

  if (!pillar || !scroll) {
    return <EmptyState icon={BookX} title="Scroll not found" description="This scroll doesn't exist in the KCS Map." />
  }

  const matches = findResourcesForScroll(scroll.id, resources)
  const status = scroll.status ?? 'AVAILABLE'

  return (
    <div>
      <Link href={`/dashboard/kcs?pillar=${pillarSlug}`} className="flex items-center gap-1 mb-4" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        <ChevronLeft size={14} /> Back to {pillar.name.en}
      </Link>

      <div className="card mb-4" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 8, background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ScrollText size={22} color="#fff" />
        </div>
        <div>
          <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', lineHeight: 1.2 }}>{scroll.name.en}</h1>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{scroll.slug} · {pillar.name.en} ({pillar.code})</p>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: statusConfig[status].color, background: statusConfig[status].bg, borderRadius: 4, padding: '3px 8px' }}>
          {statusConfig[status].label}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="cinzel" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Related Resources</h2>
        {matches.length > 0 && (
          <KcsViewToggle
            view={view}
            onViewChange={setView}
            showAnalytics={showAnalytics}
            onToggleAnalytics={() => setShowAnalytics((v) => !v)}
            label="related resources"
          />
        )}
      </div>

      {matches.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No related resources"
          description="No library resource is currently linked to this scroll."
          style={{ color: 'var(--text-secondary)' }}
        />
      ) : (
        <>
          {showAnalytics && <ScrollAnalytics resources={matches} />}

          {view === 'table' ? (
            <ScrollResourcesTable resources={matches} />
          ) : view === 'list' ? (
            <ScrollResourcesList resources={matches} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {matches.map((resource) => (
                <RelatedResourceCard
                  key={resource.id}
                  resource={resource}
                  style={{}}
                  action={
                    resource.availableQty > 0 && isAuthenticated && resource.price > 0 ? (
                      <button
                        onClick={() => handleAddToCart(resource.id)}
                        disabled={isInCart(resource.id, 'RENTAL') || addingId === resource.id}
                        aria-label={`Borrow ${resource.title}`}
                        style={{ padding: '6px 0', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                      >
                        {isInCart(resource.id, 'RENTAL') ? 'In Cart' : 'Borrow this resource'}
                      </button>
                    ) : undefined
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 20 }}>
        <h2 className="cinzel" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Related Courses</h2>
        <EmptyState
          icon={GraduationCap}
          title="Not yet linked"
          description="Courses in the E-Learning catalog aren't linked to a KCS category yet — a course's own category field (e.g. Theology, Discipleship) is a separate concept from this taxonomy. This section will show real linked courses once that relationship exists."
          style={{ color: 'var(--text-secondary)' }}
        />
      </div>

    </div>
  )
}
