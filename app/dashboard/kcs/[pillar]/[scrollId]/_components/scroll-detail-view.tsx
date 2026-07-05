'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ScrollText, Package, BookX } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { RelatedResourceCard } from '@/components/ui/related-resource-card'
import { useAuth } from '@/contexts/auth-context'
import { useResources, findResourcesForScroll } from '@/app/dashboard/library/_components/use-resources'
import { BorrowReserveConfirmModal, type BorrowReserveAction } from '@/app/(public)/library/_components/borrow-reserve-confirm-modal'
import { kcsPillars, type ScrollStatus } from '../../../_components/kcs-pillars-data'

/** Simulated network delay before the mock scroll + related resources become visible. */
const LOAD_DELAY_MS = 400

const statusConfig: Record<ScrollStatus, { label: string; color: string; bg: string }> = {
  AVAILABLE: { label: 'Available', color: 'var(--green-light)', bg: 'var(--green-dim)' },
  ARCHIVED: { label: 'Archived', color: 'var(--text-muted)', bg: 'var(--bg-section)' },
  OUT_OF_STOCK: { label: 'Out of Stock', color: 'var(--red-light)', bg: 'var(--red-dim)' },
}

interface ScrollDetailViewProps {
  pillarKey: string
  scrollCode: string
}

/**
 * Real click-through detail page for a single KCS scroll — identity
 * (title/code/section/status, unchanged from the card) plus a genuine
 * Related Resources section sourced from the canonical Resource store by
 * title match, with a real Borrow action when a matching resource has
 * stock. A scroll with no matching resource (archived/apocryphal titles
 * not in the canonical store) correctly shows EmptyState rather than
 * fabricated content — the underlying scroll model still has no
 * content/body field, so this page adds a real relationship, not reader
 * content that doesn't exist.
 */
export function ScrollDetailView({ pillarKey, scrollCode }: ScrollDetailViewProps) {
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState<BorrowReserveAction>(null)
  const { isAuthenticated } = useAuth()
  const resources = useResources()

  const pillar = kcsPillars[pillarKey]
  const scroll = pillar?.scrolls.find((s) => s.code === scrollCode)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading scroll details">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    )
  }

  if (!pillar || !scroll) {
    return <EmptyState icon={BookX} title="Scroll not found" description="This scroll doesn't exist in the KCS Map." />
  }

  const matches = findResourcesForScroll(scroll.title, resources)
  const borrowable = matches.find((r) => r.availableQty > 0)

  return (
    <div>
      <Link href={`/dashboard/kcs/${pillarKey}`} className="flex items-center gap-1 mb-4" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        <ChevronLeft size={14} /> Back to {pillar.name}
      </Link>

      <div className="card mb-4" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 8, background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ScrollText size={22} color="#fff" />
        </div>
        <div>
          <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', lineHeight: 1.2 }}>{scroll.title}</h1>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{scroll.code} · {pillar.name} ({pillar.code})</p>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: statusConfig[scroll.status].color, background: statusConfig[scroll.status].bg, borderRadius: 4, padding: '3px 8px' }}>
          {statusConfig[scroll.status].label}
        </span>
      </div>

      <h2 className="cinzel" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Related Resources</h2>

      {matches.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No related resources"
          description="No library resource is currently linked to this scroll."
          style={{ color: 'var(--text-secondary)' }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {matches.map((resource) => (
            <RelatedResourceCard
              key={resource.id}
              resource={resource}
              style={{}}
              action={
                resource.availableQty > 0 && isAuthenticated ? (
                  <button
                    onClick={() => setAction('borrow')}
                    aria-label={`Borrow ${resource.title}`}
                    style={{ padding: '6px 0', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Borrow this resource
                  </button>
                ) : undefined
              }
            />
          ))}
        </div>
      )}

      {borrowable && (
        <BorrowReserveConfirmModal action={action} bookTitle={borrowable.title} bookAuthor={borrowable.author} onClose={() => setAction(null)} />
      )}
    </div>
  )
}
