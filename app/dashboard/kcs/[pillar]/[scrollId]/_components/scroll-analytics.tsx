'use client'

import { Package, PackageCheck, Coins } from 'lucide-react'
import { CategoryBarChart } from '@/components/ui/category-bar-chart'
import type { Resource } from '@/app/dashboard/library/_components/resources-data'

interface ScrollAnalyticsProps {
  resources: Resource[]
}

/**
 * Real, derived analytics for a single scroll's matched Related Resources:
 * total/available copy counts and total catalog value as stat cards, plus a
 * per-resource available-copies chart (reusing `CategoryBarChart`, the same
 * recharts precedent used by `KcsPillarAnalytics`). Sourced entirely from the
 * matched `Resource[]` already computed by the page via `findResourcesForScroll`
 * — no fabricated numbers. Toggleable independently of the Cards/Table/List view.
 */
export function ScrollAnalytics({ resources }: ScrollAnalyticsProps) {
  const totalCopies = resources.reduce((sum, r) => sum + r.totalQty, 0)
  const availableCopies = resources.reduce((sum, r) => sum + r.availableQty, 0)
  const totalValue = resources.reduce((sum, r) => sum + r.price * r.totalQty, 0)

  const stats = [
    { label: 'Total Copies', value: totalCopies, icon: Package, color: 'var(--gold)', bg: 'var(--bg-section)' },
    { label: 'Available Copies', value: availableCopies, icon: PackageCheck, color: 'var(--green-light)', bg: 'var(--green-dim)' },
    { label: 'Catalog Value', value: `${totalValue.toLocaleString()} RWF`, icon: Coins, color: 'var(--gold)', bg: 'var(--bg-section)' },
  ]

  const chartData = resources.map((r) => ({ name: r.title, value: r.availableQty }))

  return (
    <div className="card mb-4" aria-label="Related resources analytics">
      <h2 className="cinzel" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
        Related Resources Analytics
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        {stats.map((s) => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={15} color={s.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <CategoryBarChart data={chartData} height={180} ariaLabel="Available copies by related resource" />
    </div>
  )
}
