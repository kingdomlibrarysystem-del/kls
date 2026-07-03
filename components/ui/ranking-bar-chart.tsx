'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export interface RankingBarDatum {
  /** Row label, e.g. a course title. */
  name: string
  /** Value plotted on the horizontal axis, typically a 0-100 percentage. */
  value: number
}

interface RankingBarChartProps {
  data: RankingBarDatum[]
  /** Chart height in px; scales with row count by default via the caller. */
  height?: number
  /** Suffix appended to the tooltip/axis value, e.g. "%". */
  unit?: string
  /** Accessible label for the chart region. */
  ariaLabel: string
}

/**
 * Horizontal ranking bar chart used to compare a metric (e.g. completion %)
 * across a small set of named rows (courses). Gold bars, near-black text,
 * white/card background — matches the KLS color discipline rather than
 * recharts' default rainbow palette. Wrapped in ResponsiveContainer so it
 * never overflows on mobile.
 */
export function RankingBarChart({ data, height = 220, unit = '%', ariaLabel }: RankingBarChartProps) {
  return (
    <div role="img" aria-label={ariaLabel} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            unit={unit}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fill: 'var(--text-primary)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--bg-hover, rgba(0,0,0,0.04))' }}
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--text-primary)' }}
            formatter={(value) => [`${value}${unit}`, '']}
            labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {data.map((d) => (
              <Cell key={d.name} fill="var(--gold)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
