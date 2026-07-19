'use client'

import Link from 'next/link'
import { ChevronRight, ScrollText } from 'lucide-react'
import type { Scroll, ScrollStatus } from './kcs-pillars-data'

const statusConfig: Record<ScrollStatus, { label: string; color: string; bg: string }> = {
  AVAILABLE:    { label: 'Available',    color: 'var(--green-light)', bg: 'var(--green-dim)' },
  ARCHIVED:     { label: 'Archived',     color: 'var(--text-muted)',  bg: 'var(--bg-section)' },
  OUT_OF_STOCK: { label: 'Out of Stock', color: 'var(--red-light)',   bg: 'var(--red-dim)'    },
}

interface KcsScrollsListProps {
  scrolls: Scroll[]
  pillarKey: string
}

/** Compact list-row view of a pillar's scrolls — same destination and status data as the Cards/Table views, denser layout. */
export function KcsScrollsList({ scrolls, pillarKey }: KcsScrollsListProps) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {scrolls.map((scroll, i) => (
        <Link
          key={scroll.code}
          href={`/dashboard/kcs/${pillarKey}/${encodeURIComponent(scroll.code)}`}
          aria-label={`View details for ${scroll.title}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
            borderBottom: i < scrolls.length - 1 ? '1px solid var(--border)' : 'none',
            textDecoration: 'none', transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <ScrollText size={14} color="var(--gold)" style={{ flexShrink: 0 }} />
          <span className="stat-chip" style={{ flexShrink: 0 }}>{scroll.code}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {scroll.title}
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, color: statusConfig[scroll.status].color, background: statusConfig[scroll.status].bg, borderRadius: 4, padding: '2px 7px', flexShrink: 0 }}>
            {statusConfig[scroll.status].label}
          </span>
          <ChevronRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </Link>
      ))}
    </div>
  )
}
