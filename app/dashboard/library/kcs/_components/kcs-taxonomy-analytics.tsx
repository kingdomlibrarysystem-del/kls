'use client'

import { ScrollText, Library, CheckCircle2, Archive } from 'lucide-react'
import { CategoryBarChart } from '@/components/ui/category-bar-chart'
import { RankingBarChart } from '@/components/ui/ranking-bar-chart'
import { StatusDonutChart } from '@/components/ui/status-donut-chart'
import { getRootCategories, getChildCategories, resourceCountFor } from '@/lib/kcs-taxonomy'
import { useResources } from '@/app/dashboard/library/_components/use-resources'

/**
 * Whole-taxonomy analytics for the KCS Map, distinct from `KcsPillarAnalytics`
 * (which covers only the active pillar): a resource-count-per-pillar
 * comparison bar chart, a taxonomy-wide Available/Archived/Out-of-Stock
 * breakdown, and a "Top categories by resource count" ranking. Every number
 * here is a real, live aggregate over `lib/kcs-taxonomy` + the canonical
 * `Resource[]` store — no fabricated metrics.
 *
 * Deliberately omits: a borrow/reservation-activity metric (would require
 * matching `Borrowing.resourceTitle`, a free-text field, back to a category
 * — the same fragile title-match hack the last taxonomy merge eliminated
 * elsewhere, not worth reintroducing here) and a revenue/earnings metric
 * (`RevenueRow` has no categoryId either, keyed by publication+contributor
 * instead). Also omits a time-series/trend chart: every category's
 * `createdAt` is an identical seed-time constant, and `Resource` has no
 * per-item `createdAt` at all — there is no real date variance to plot.
 */
export function KcsTaxonomyAnalytics() {
  const { data: resources } = useResources()
  const roots = getRootCategories()

  const perPillar = roots.map((root) => ({
    name: root.name.en,
    value: resourceCountFor(root.id, resources),
  }))

  const allScrolls = roots.flatMap((root) => getChildCategories(root.id))
  const available = allScrolls.filter((s) => (s.status ?? 'AVAILABLE') === 'AVAILABLE').length
  const archived = allScrolls.filter((s) => s.status === 'ARCHIVED').length
  const outOfStock = allScrolls.filter((s) => s.status === 'OUT_OF_STOCK').length

  const topCategories = [...perPillar]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
  const topMax = Math.max(1, ...topCategories.map((c) => c.value))

  const totalResources = resources.length
  const totalScrolls = allScrolls.length

  const stats = [
    { label: 'Root Pillars', value: roots.length, icon: Library, color: 'var(--gold)', bg: 'var(--bg-section)' },
    { label: 'Total Scrolls', value: totalScrolls, icon: ScrollText, color: 'var(--gold)', bg: 'var(--bg-section)' },
    { label: 'Available Scrolls', value: available, icon: CheckCircle2, color: 'var(--green-light)', bg: 'var(--green-dim)' },
    { label: 'Archived Scrolls', value: archived, icon: Archive, color: 'var(--text-muted)', bg: 'var(--bg-section)' },
    { label: 'Catalogued Resources', value: totalResources, icon: ScrollText, color: 'var(--gold)', bg: 'var(--bg-section)' },
  ]

  return (
    <div className="card mb-4" aria-label="KCS Map analytics">
      <h2 className="cinzel" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
        KCS Map Analytics
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Resources per Pillar</p>
          <CategoryBarChart data={perPillar} height={200} ariaLabel="Catalogued resource count per KCS pillar" />
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Scroll Status Share (all pillars)</p>
          <StatusDonutChart
            data={[
              { name: 'Available', value: available, color: 'var(--green-light)' },
              { name: 'Archived', value: archived, color: 'var(--text-muted)' },
              { name: 'Out of Stock', value: outOfStock, color: 'var(--red-light)' },
            ]}
            height={200}
            ariaLabel="Share of scrolls by status across the whole KCS taxonomy"
          />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Top Pillars by Resource Count</p>
        <RankingBarChart
          data={topCategories}
          height={140}
          unit=""
          maxValue={topMax}
          ariaLabel="Top KCS pillars ranked by catalogued resource count"
        />
      </div>
    </div>
  )
}
