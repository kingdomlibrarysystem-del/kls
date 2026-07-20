'use client'

import { ScrollText, CheckCircle2, Archive, PackageX, BookCopy } from 'lucide-react'
import { StatusDonutChart } from '@/components/ui/status-donut-chart'
import { useResources, findResourcesForScroll } from '@/app/dashboard/library/_components/use-resources'
import type { Category } from '@/lib/kcs-taxonomy'

interface KcsPillarAnalyticsProps {
  pillar: Category
  /** This pillar's child scroll categories — passed in rather than looked up again since the caller already has them. */
  scrolls: Category[]
}

interface StatDef {
  label: string
  value: number
  icon: typeof ScrollText
  color: string
  bg: string
}

/**
 * Real, derived analytics for the active pillar: scroll-count breakdown by
 * status (available/archived/out-of-stock, computed from the pillar's own
 * scroll list — no fabricated numbers) as stat cards, plus total borrowable
 * copies sourced from the canonical Resource store via the same
 * `findResourcesForScroll` `categoryId` FK relationship the scroll-detail page
 * already uses for Related Resources. A `StatusDonutChart` (part-of-whole
 * shape fits a 3-way status split better than a bar chart) shows the status
 * breakdown visually. Toggleable independently of the Cards/Table/List
 * content view via `KcsViewToggle`'s separate Analytics button, so it can be
 * shown alongside any of the three.
 */
export function KcsPillarAnalytics({ pillar, scrolls }: KcsPillarAnalyticsProps) {
  const resources = useResources()

  const available = scrolls.filter((s) => (s.status ?? 'AVAILABLE') === 'AVAILABLE').length
  const archived = scrolls.filter((s) => s.status === 'ARCHIVED').length
  const outOfStock = scrolls.filter((s) => s.status === 'OUT_OF_STOCK').length

  const borrowableCopies = scrolls.reduce((sum, scroll) => {
    const matches = findResourcesForScroll(scroll.id, resources)
    return sum + matches.reduce((s, r) => s + r.availableQty, 0)
  }, 0)

  const stats: StatDef[] = [
    { label: 'Total Scrolls', value: scrolls.length, icon: ScrollText, color: 'var(--gold)', bg: 'var(--bg-section)' },
    { label: 'Available', value: available, icon: CheckCircle2, color: 'var(--green-light)', bg: 'var(--green-dim)' },
    { label: 'Archived', value: archived, icon: Archive, color: 'var(--text-muted)', bg: 'var(--bg-section)' },
    { label: 'Out of Stock', value: outOfStock, icon: PackageX, color: 'var(--red-light)', bg: 'var(--red-dim)' },
    { label: 'Borrowable Copies', value: borrowableCopies, icon: BookCopy, color: 'var(--gold)', bg: 'var(--bg-section)' },
  ]

  const chartData = [
    { name: 'Available', value: available, color: 'var(--green-light)' },
    { name: 'Archived', value: archived, color: 'var(--text-muted)' },
    { name: 'Out of Stock', value: outOfStock, color: 'var(--red-light)' },
  ]

  return (
    <div className="card mb-4" aria-label={`Analytics for ${pillar.name.en}`}>
      <h2 className="cinzel" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
        {pillar.name.en} Analytics
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
        {stats.map((s) => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={15} color={s.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <StatusDonutChart data={chartData} height={180} ariaLabel={`Scroll status share for ${pillar.name.en}`} />
    </div>
  )
}
