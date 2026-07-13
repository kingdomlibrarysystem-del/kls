'use client'

import { RankingBarChart } from '@/components/ui/ranking-bar-chart'
import { useRevenue } from './use-revenue'

/**
 * Total-revenue stat card plus a revenue-by-publication ranking chart —
 * same shape as the contributor earnings chart, reading the live
 * `useRevenue()` store so a newly-approved submission's revenue row
 * appears here immediately, not just in the table below.
 */
export function RevenueStats() {
  const revenue = useRevenue()
  const totalRevenue = revenue.reduce((sum, r) => sum + r.totalRevenue, 0)
  const maxValue = Math.max(1, ...revenue.map((r) => r.totalRevenue))

  const chartData = revenue
    .map((r) => ({ name: r.publication, value: r.totalRevenue }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
          <p className="font-cinzel text-2xl font-bold text-w-950">{revenue.length}</p>
          <p className="font-lato text-xs text-w-700 mt-1 leading-tight">Publications Earning</p>
        </div>
        <div className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
          <p className="font-cinzel text-2xl font-bold text-w-600">{totalRevenue.toLocaleString()}</p>
          <p className="font-lato text-xs text-w-700 mt-1 leading-tight">Total Revenue (RWF)</p>
        </div>
        <div className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
          <p className="font-cinzel text-2xl font-bold text-w-950">
            {revenue.length > 0 ? Math.round(totalRevenue / revenue.length).toLocaleString() : 0}
          </p>
          <p className="font-lato text-xs text-w-700 mt-1 leading-tight">Avg Revenue / Publication (RWF)</p>
        </div>
      </div>

      {revenue.length > 0 && (
        <div className="bg-form-highlight border border-w-300 rounded-lg p-4">
          <h2 className="font-cinzel text-sm font-semibold text-w-950 mb-3">Revenue by Publication</h2>
          <RankingBarChart
            data={chartData}
            unit=""
            maxValue={Math.ceil(maxValue / 50000) * 50000}
            height={Math.max(160, chartData.length * 40)}
            ariaLabel="Total revenue per publication, ranked highest to lowest"
          />
        </div>
      )}
    </div>
  )
}
