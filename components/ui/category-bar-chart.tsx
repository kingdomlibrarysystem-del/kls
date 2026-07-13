'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export interface CategoryBarDatum {
  /** X-axis category label, e.g. a status name or a payout date. */
  name: string
  /** Bar height value. */
  value: number
}

interface CategoryBarChartProps {
  data: CategoryBarDatum[]
  height?: number
  /** Prefix/suffix formatting for the tooltip value, e.g. "RWF ". */
  valueFormatter?: (value: number) => string
  ariaLabel: string
}

/**
 * Vertical bar chart for categorical or short time-series data (status
 * counts, payout amounts by date). Gold bars, near-black axis text, white/
 * card background, wrapped in ResponsiveContainer so it never overflows on
 * mobile — shares the same color discipline as RankingBarChart.
 */
export function CategoryBarChart({ data, height = 200, valueFormatter, ariaLabel }: CategoryBarChartProps) {
  const format = valueFormatter ?? ((v: number) => String(v))
  return (
    <div role="img" aria-label={ariaLabel} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ fill: 'var(--bg-hover, rgba(0,0,0,0.04))' }}
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--text-primary)' }}
            formatter={(value) => [format(Number(value)), '']}
            labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
          />
          <Bar dataKey="value" fill="var(--gold)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
