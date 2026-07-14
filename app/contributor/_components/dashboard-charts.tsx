'use client'

import { useState, useEffect } from 'react'
import { BookCopy, Receipt } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { CategoryBarChart } from '@/components/ui/category-bar-chart'
import { publicationStatusConfig, type PublicationStatus } from '@/app/contributor/publishing/_components/my-submissions-data'
import { useMySubmissions } from '@/app/contributor/publishing/_components/use-my-submissions'
import { payoutHistory } from '@/app/contributor/earnings/_components/earnings-data'

/** Simulated network delay before mock chart data becomes visible. */
const LOAD_DELAY_MS = 400

/**
 * Two contributor-dashboard charts backed by real underlying mock data:
 * submissions grouped by status (a genuine categorical distribution across
 * the 6-value PublicationStatus enum) and payout amount by date (a real,
 * if short, dated time-series from earnings-data.ts). Research projects
 * are deliberately not charted here — only 2 mock projects exist, too few
 * to show a real distribution rather than a fabricated one.
 */
export function DashboardCharts() {
  const [loading, setLoading] = useState(true)
  const mySubmissions = useMySubmissions()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" aria-label="Loading dashboard charts">
        <Skeleton style={{ height: 240, borderRadius: 8 }} />
        <Skeleton style={{ height: 240, borderRadius: 8 }} />
      </div>
    )
  }

  const statusCounts = mySubmissions.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1
    return acc
  }, {} as Record<PublicationStatus, number>)

  const submissionsByStatus = (Object.keys(statusCounts) as PublicationStatus[]).map((status) => ({
    name: publicationStatusConfig[status].label,
    value: statusCounts[status],
  }))

  const payoutsByDate = [...payoutHistory]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => ({ name: p.date.slice(5), value: p.amount }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card">
        <h2 className="flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
          <BookCopy size={14} style={{ color: 'var(--gold)' }} /> Submissions by Status
        </h2>
        <CategoryBarChart data={submissionsByStatus} ariaLabel="My submissions grouped by publication status" />
      </div>
      <div className="card">
        <h2 className="flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
          <Receipt size={14} style={{ color: 'var(--gold)' }} /> Payouts Over Time (RWF)
        </h2>
        <CategoryBarChart data={payoutsByDate} valueFormatter={(v) => `${v.toLocaleString()} RWF`} ariaLabel="Payout amount by date" />
      </div>
    </div>
  )
}
