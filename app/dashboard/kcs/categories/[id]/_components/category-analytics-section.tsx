'use client'

import { Package, Users, BookOpen, Bookmark, Wallet, CheckCircle2 } from 'lucide-react'
import { StatusDonutChart } from '@/components/ui/status-donut-chart'
import { CategoryBarChart } from '@/components/ui/category-bar-chart'
import type { Resource } from '@/app/dashboard/library/_components/resources-data'
import type { Borrowing } from '@/app/dashboard/library/borrowings/_components/borrowings-data'
import type { Reservation } from '@/app/dashboard/reservations/_components/reservations-data'

interface CategoryAnalyticsSectionProps {
  categoryName: string
  resources: Resource[]
  borrowings: Borrowing[]
  reservations: Reservation[]
  memberCount: number
  revenueRwf: number
}

interface StatDef {
  label: string
  value: string
  icon: typeof Package
  color: string
  bg: string
}

/**
 * Real, derived analytics for this category: resource status split,
 * borrowing status split, and top-line stat cards — all computed from the
 * same categoryId-joined Resources/Borrowings/Reservations/revenue this
 * page's other sections already fetch, not fabricated numbers.
 */
export function CategoryAnalyticsSection({ categoryName, resources, borrowings, reservations, memberCount, revenueRwf }: CategoryAnalyticsSectionProps) {
  const available = resources.filter((r) => r.status === 'available').length
  const outOfStock = resources.filter((r) => r.status === 'out_of_stock').length
  const archived = resources.filter((r) => r.status === 'archived').length

  const active = borrowings.filter((b) => b.status === 'active').length
  const overdue = borrowings.filter((b) => b.status === 'overdue').length
  const returned = borrowings.filter((b) => b.status === 'returned').length
  const pending = borrowings.filter((b) => b.status === 'pending').length

  const stats: StatDef[] = [
    { label: 'Resources', value: String(resources.length), icon: Package, color: 'var(--gold)', bg: 'var(--bg-section)' },
    { label: 'Borrowings', value: String(borrowings.length), icon: BookOpen, color: 'var(--gold)', bg: 'var(--bg-section)' },
    { label: 'Reservations', value: String(reservations.length), icon: Bookmark, color: 'var(--gold)', bg: 'var(--bg-section)' },
    { label: 'Members', value: String(memberCount), icon: Users, color: 'var(--green-light)', bg: 'var(--green-dim)' },
    { label: 'Revenue', value: `${revenueRwf.toLocaleString()} RWF`, icon: Wallet, color: 'var(--green-light)', bg: 'var(--green-dim)' },
    { label: 'Returned', value: String(returned), icon: CheckCircle2, color: 'var(--text-muted)', bg: 'var(--bg-section)' },
  ]

  const statusData = [
    { name: 'Available', value: available, color: 'var(--green-light)' },
    { name: 'Out of Stock', value: outOfStock, color: 'var(--red-light)' },
    { name: 'Archived', value: archived, color: 'var(--text-muted)' },
  ]

  const borrowStatusData = [
    { name: 'Pending', value: pending },
    { name: 'Active', value: active },
    { name: 'Overdue', value: overdue },
    { name: 'Returned', value: returned },
  ]

  return (
    <div className="card mb-4" aria-label={`Analytics for ${categoryName}`}>
      <h2 className="cinzel" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
        {categoryName} Analytics
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
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

      {resources.length === 0 && borrowings.length === 0 ? (
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>No activity yet to chart for this category.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.length > 0 && <StatusDonutChart data={statusData} height={180} ariaLabel={`Resource status share for ${categoryName}`} />}
          {borrowings.length > 0 && <CategoryBarChart data={borrowStatusData} height={180} ariaLabel={`Borrowing status breakdown for ${categoryName}`} />}
        </div>
      )}
    </div>
  )
}
