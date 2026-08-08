'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ScrollText, Heart, Package, BookX, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { RelatedResourceCard } from '@/components/ui/related-resource-card'
import { useAuth } from '@/contexts/auth-context'
import { useResources, findResourcesForScroll } from '@/app/dashboard/library/_components/use-resources'
import { BorrowReserveConfirmModal, type BorrowReserveAction } from '@/app/(public)/library/_components/borrow-reserve-confirm-modal'
import { useFavorites, toggleFavorite } from '@/app/member/_shared/use-favorites'
import { useReadableContent } from '@/app/member/_shared/use-readable-content'
import { getCategoryById, getChildCategories } from '@/lib/kcs-taxonomy'
import { useCategories } from '@/lib/kcs-taxonomy/use-categories'

interface ScrollDetailViewProps {
  scrollId: string
}

/**
 * Real click-through detail page for a single KCS scroll on the member
 * side — same relationship and shared components as the admin KCS Map
 * detail page (RelatedResourceCard, findResourcesForScroll,
 * BorrowReserveConfirmModal), not a duplicated implementation. Adds the
 * real favorites toggle already established for this module.
 *
 * `scrollId` is looked up directly against the canonical taxonomy (it is
 * that scroll's own stable id) rather than via the old `library-data.tsx`
 * flattened list, which has been folded into `lib/kcs-taxonomy` and removed.
 */
export function ScrollDetailView({ scrollId }: ScrollDetailViewProps) {
  const [action, setAction] = useState<BorrowReserveAction>(null)
  const [actionTarget, setActionTarget] = useState<{ id: string; title: string; author: string } | null>(null)
  const { isAuthenticated } = useAuth()
  const { data: resources, loading: resourcesLoading, error: resourcesError } = useResources()
  const { loading: categoriesLoading, error: categoriesError } = useCategories()
  const favorites = useFavorites()
  const readableContent = useReadableContent()

  const loading = resourcesLoading || categoriesLoading
  const error = categoriesError ?? resourcesError

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-label="Loading scroll details">
        <Skeleton style={{ height: 80, borderRadius: 8 }} />
        <Skeleton style={{ height: 160, borderRadius: 8 }} />
      </div>
    )
  }

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load this scroll" description={error} style={{ color: 'var(--text-secondary)' }} />
  }

  const scroll = getCategoryById(scrollId)
  const section = scroll?.parentId ? getCategoryById(scroll.parentId) : undefined
  const liked = scroll ? favorites.some((f) => f.id === scroll.id) : false

  if (!scroll || !section || !getChildCategories(section.id).some((c) => c.id === scroll.id)) {
    return <EmptyState icon={BookX} title="Scroll not found" description="This scroll doesn't exist in the Kingdom Library." style={{ color: 'var(--text-secondary)' }} />
  }

  const matches = findResourcesForScroll(scroll.id, resources)

  const startAction = (verb: BorrowReserveAction, resource: { id: string; title: string; author: string }) => {
    setAction(verb)
    setActionTarget(resource)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Link href="/member/library" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
        <ChevronLeft size={14} /> Back to Kingdom Library
      </Link>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 8, background: 'linear-gradient(135deg, rgba(212,168,67,0.1), var(--bg-section))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ScrollText size={22} color="var(--gold)" />
        </div>
        <div style={{ flex: 1 }}>
          <h1 className="cinzel" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{scroll.name.en}</h1>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{scroll.slug} · {section.name.en}</p>
        </div>
        <button
          onClick={() => toggleFavorite(scroll.id, 'RESOURCE', scroll.name.en, `Scroll · ${section.name.en}`)}
          aria-label={liked ? `Remove ${scroll.name.en} from favorites` : `Add ${scroll.name.en} to favorites`}
          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <Heart size={14} color={liked ? 'var(--red-light)' : 'var(--text-muted)'} fill={liked ? 'var(--red-light)' : 'none'} />
        </button>
      </div>

      <p style={{ fontSize: 11, color: 'var(--green-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <CheckCircle2 size={12} /> Available in the Kingdom Classification System
      </p>

      <h2 className="cinzel" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Related Resources</h2>

      {matches.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No related resources"
          description="No library resource is currently linked to this scroll."
          style={{ color: 'var(--text-secondary)' }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {matches.map((resource) => (
            <RelatedResourceCard
              key={resource.id}
              resource={resource}
              style={{}}
              action={
                isAuthenticated ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {!!readableContent[resource.id] && (
                      <Link
                        href={`/member/library/read/${resource.id}`}
                        aria-label={`Read ${resource.title} online`}
                        style={{ display: 'block', textAlign: 'center', padding: '6px 0', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 10, fontWeight: 600, textDecoration: 'none' }}
                      >
                        Read Online
                      </Link>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      {resource.availableQty > 0 && (
                        <button
                          onClick={() => startAction('borrow', resource)}
                          aria-label={`Borrow ${resource.title}`}
                          style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: 'var(--bg-section)', color: 'var(--text-primary)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Borrow
                        </button>
                      )}
                      <button
                        onClick={() => startAction('reserve', resource)}
                        aria-label={`Reserve ${resource.title}`}
                        style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid var(--gold)', background: 'transparent', color: 'var(--gold)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Reserve
                      </button>
                    </div>
                  </div>
                ) : undefined
              }
            />
          ))}
        </div>
      )}

      {actionTarget && (
        <BorrowReserveConfirmModal action={action} resourceId={actionTarget.id} bookTitle={actionTarget.title} bookAuthor={actionTarget.author} onClose={() => { setAction(null); setActionTarget(null) }} />
      )}
    </div>
  )
}
