'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookCopy, Search, ScrollText } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { RemoteImage } from '@/components/ui/remote-image'
import { getCategoryById, getChildCategories, type CategoryStatus } from '@/lib/kcs-taxonomy'
import { KcsPillarTabs } from './kcs-pillar-tabs'
import { KcsViewToggle, type KcsContentView } from './kcs-view-toggle'
import { KcsScrollsTable } from './kcs-scrolls-table'
import { KcsScrollsList } from './kcs-scrolls-list'
import { KcsPillarAnalytics } from './kcs-pillar-analytics'

/** Simulated network delay before mock scrolls become visible. */
const LOAD_DELAY_MS = 400

const statusConfig: Record<CategoryStatus, { label: string; color: string; bg: string }> = {
  AVAILABLE:    { label: 'Available',    color: 'var(--green-light)', bg: 'var(--green-dim)' },
  ARCHIVED:     { label: 'Archived',     color: 'var(--text-muted)',  bg: 'var(--bg-section)' },
  OUT_OF_STOCK: { label: 'Out of Stock', color: 'var(--red-light)',   bg: 'var(--red-dim)'    },
}

interface KcsPillarViewProps {
  /** Slug of the active root category, e.g. "kcs-fnd". */
  pillarSlug: string
  /** Called when the reader picks a different pillar from the tab bar. */
  onPillarChange: (pillarSlug: string) => void
}

/**
 * Single consolidated view for all 8 KCS pillars: a tab bar to switch
 * pillars (replacing the previous 8 separate routes/page.tsx files) plus
 * the header (code, name, theme) and a searchable grid of the active
 * pillar's scrolls. Shows a brief simulated loading state, then the grid,
 * or an EmptyState if a search yields no results.
 */
export function KcsPillarView({ pillarSlug, onPillarChange }: KcsPillarViewProps) {
  const pillar = getCategoryById(pillarSlug)
  const scrolls = pillar ? getChildCategories(pillar.id) : []
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<KcsContentView>('table')
  const [showAnalytics, setShowAnalytics] = useState(true)

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [pillarSlug])

  if (!pillar) return null

  const filtered = scrolls.filter((s) => s.name.en.toLowerCase().includes(search.toLowerCase()) || s.slug.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <KcsPillarTabs activeSlug={pillarSlug} onChange={onPillarChange} />

      {/* Header */}
      <div className="card mb-4" style={{ display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden', padding: 0 }}>
        <div style={{ position: 'relative', height: 120, background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))' }}>
          <RemoteImage
            src={pillar.heroImage ?? ''}
            alt={`${pillar.name.en} pillar header`}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            style={{ objectFit: 'cover' }}
            fallback={<div />}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.55), rgba(0,0,0,0.15))' }} />
          <div style={{ position: 'absolute', left: 14, bottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookCopy size={18} color="#fff" />
            </div>
            <div>
              <h1 className="cinzel" style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{pillar.name.en}</h1>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>{pillar.code} · {pillar.subtitle}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-1" style={{ padding: '0 14px' }}>
          <span className="stat-chip">{pillar.range}</span>
          <span className="stat-chip">{pillar.theme}</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 4, padding: '0 14px' }}>{pillar.description}</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, padding: '0 14px 14px' }}>{pillar.detail}</p>
      </div>

      {/* Search + view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative max-w-sm flex-1" style={{ minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search scrolls..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={`Search scrolls in ${pillar.name.en}`}
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
              fontSize: 12, borderRadius: 6, border: '1px solid var(--border)',
              background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none',
            }}
          />
        </div>
        <KcsViewToggle
          view={view}
          onViewChange={setView}
          showAnalytics={showAnalytics}
          onToggleAnalytics={() => setShowAnalytics((v) => !v)}
          label="scrolls"
        />
      </div>

      {showAnalytics && !loading && <KcsPillarAnalytics pillar={pillar} scrolls={scrolls} />}

      {/* Scrolls content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" aria-label={`Loading ${pillar.name.en} scrolls`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} style={{ height: 72, borderRadius: 8 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ScrollText} title="No scrolls found" description="Try a different search term." style={{ color: 'var(--text-secondary)' }} />
      ) : view === 'table' ? (
        <KcsScrollsTable scrolls={filtered} pillarSlug={pillarSlug} pillarName={pillar.name.en} />
      ) : view === 'list' ? (
        <KcsScrollsList scrolls={filtered} pillarSlug={pillarSlug} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((scroll) => (
            <Link
              key={scroll.id}
              href={`/dashboard/library/kcs/${pillarSlug}/${encodeURIComponent(scroll.slug)}`}
              aria-label={`View details for ${scroll.name.en}`}
              className="card card-hover"
              style={{ display: 'flex', flexDirection: 'column', gap: 6, textDecoration: 'none' }}
            >
              <div className="flex items-center justify-between">
                <span className="stat-chip">{scroll.slug}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: statusConfig[scroll.status ?? 'AVAILABLE'].color, background: statusConfig[scroll.status ?? 'AVAILABLE'].bg, borderRadius: 4, padding: '1px 6px' }}>
                  {statusConfig[scroll.status ?? 'AVAILABLE'].label}
                </span>
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{scroll.name.en}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
