'use client'

import { useState, useEffect } from 'react'
import { BookCopy, Search, ScrollText } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { kcsPillars, type ScrollStatus } from './kcs-pillars-data'

/** Simulated network delay before mock scrolls become visible. */
const LOAD_DELAY_MS = 400

const statusConfig: Record<ScrollStatus, { label: string; color: string; bg: string }> = {
  AVAILABLE:    { label: 'Available',    color: 'var(--green-light)', bg: 'var(--green-dim)' },
  ARCHIVED:     { label: 'Archived',     color: 'var(--text-muted)',  bg: 'var(--bg-section)' },
  OUT_OF_STOCK: { label: 'Out of Stock', color: 'var(--red-light)',   bg: 'var(--red-dim)'    },
}

interface KcsPillarViewProps {
  /** Key into `kcsPillars`, e.g. "foundation". */
  pillarKey: string
}

/**
 * Shared view for all 8 KCS pillar pages: header (code, name, theme) plus a
 * searchable grid of the pillar's scrolls. Shows a brief simulated loading
 * state, then the grid, or an EmptyState if a search yields no results.
 */
export function KcsPillarView({ pillarKey }: KcsPillarViewProps) {
  const pillar = kcsPillars[pillarKey]
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (!pillar) return null

  const filtered = pillar.scrolls.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      {/* Header */}
      <div className="card mb-4" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="flex items-center gap-2">
          <div style={{ width: 40, height: 40, borderRadius: 8, background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookCopy size={20} color="#fff" />
          </div>
          <div>
            <h1 className="cinzel" style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)', lineHeight: 1.2 }}>{pillar.name}</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pillar.code} · {pillar.subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-1">
          <span className="stat-chip">{pillar.range}</span>
          <span className="stat-chip">{pillar.theme}</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 4 }}>{pillar.description}</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>{pillar.detail}</p>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search scrolls..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={`Search scrolls in ${pillar.name}`}
          style={{
            width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
            fontSize: 12, borderRadius: 6, border: '1px solid var(--border)',
            background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none',
          }}
        />
      </div>

      {/* Scrolls grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" aria-label={`Loading ${pillar.name} scrolls`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} style={{ height: 72, borderRadius: 8 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ScrollText} title="No scrolls found" description="Try a different search term." style={{ color: 'var(--text-secondary)' }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((scroll) => (
            <div key={scroll.code} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="flex items-center justify-between">
                <span className="stat-chip">{scroll.code}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: statusConfig[scroll.status].color, background: statusConfig[scroll.status].bg, borderRadius: 4, padding: '1px 6px' }}>
                  {statusConfig[scroll.status].label}
                </span>
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{scroll.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
