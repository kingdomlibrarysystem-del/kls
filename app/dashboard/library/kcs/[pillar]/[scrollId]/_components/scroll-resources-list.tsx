'use client'

import { Package } from 'lucide-react'
import type { Resource } from '@/app/dashboard/library/_components/resources-data'

interface ScrollResourcesListProps {
  resources: Resource[]
}

/** Compact list-row view of a scroll's matched Related Resources — same data as the Cards/Table views, denser layout. */
export function ScrollResourcesList({ resources }: ScrollResourcesListProps) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {resources.map((r, i) => (
        <div
          key={r.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
            borderBottom: i < resources.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {r.title}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{r.author}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>{r.price.toLocaleString()} RWF</span>
          <span
            style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: r.availableQty === 0 ? 'var(--red-light)' : 'var(--text-secondary)', flexShrink: 0 }}
          >
            <Package size={11} /> {r.availableQty} available
          </span>
        </div>
      ))}
    </div>
  )
}
