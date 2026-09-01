'use client'

import Link from 'next/link'
import { ChevronRight, ScrollText } from 'lucide-react'
import type { Category, CategoryStatus } from '@/lib/kcs-taxonomy'

const statusConfig: Record<CategoryStatus, { label: string; color: string; bg: string }> = {
  AVAILABLE:    { label: 'Available',    color: 'var(--green-light)', bg: 'var(--green-dim)' },
  ARCHIVED:     { label: 'Archived',     color: 'var(--text-muted)',  bg: 'var(--bg-section)' },
  OUT_OF_STOCK: { label: 'Out of Stock', color: 'var(--red-light)',   bg: 'var(--red-dim)'    },
}

interface KcsScrollsListProps {
  scrolls: Category[]
  pillarSlug: string
}

/** Compact list-row view of a pillar's scrolls — same destination and status data as the Cards/Table views, denser layout. */
export function KcsScrollsList({ scrolls, pillarSlug }: KcsScrollsListProps) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {scrolls.map((scroll, i) => {
        const status = scroll.status ?? 'AVAILABLE'
        return (
          <Link
            key={scroll.id}
            href={`/dashboard/library/kcs/${pillarSlug}/${encodeURIComponent(scroll.slug)}`}
            aria-label={`View details for ${scroll.name.en}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
              borderBottom: i < scrolls.length - 1 ? '1px solid var(--border)' : 'none',
              textDecoration: 'none', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <ScrollText size={14} color="var(--gold)" style={{ flexShrink: 0 }} />
            <span className="stat-chip" style={{ flexShrink: 0 }}>{scroll.slug}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {scroll.name.en}
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, color: statusConfig[status].color, background: statusConfig[status].bg, borderRadius: 4, padding: '2px 7px', flexShrink: 0 }}>
              {statusConfig[status].label}
            </span>
            <ChevronRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          </Link>
        )
      })}
    </div>
  )
}
