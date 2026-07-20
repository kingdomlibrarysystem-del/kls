'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export interface DonutDatum {
  /** Slice label, e.g. a status name. */
  name: string
  /** Slice value. */
  value: number
  /** Slice color — pass a `var(--...)` token matching this app's status-color discipline (green/red/gold/muted), not an arbitrary hue. */
  color: string
}

interface StatusDonutChartProps {
  data: DonutDatum[]
  height?: number
  ariaLabel: string
}

/**
 * Part-of-whole donut chart for status/category share breakdowns (e.g.
 * available vs. archived vs. out-of-stock). Same color-discipline and
 * card-background conventions as `CategoryBarChart`/`RankingBarChart` — one
 * new reusable primitive since neither existing chart component covers a
 * part-of-whole shape, added here rather than duplicated inline.
 */
export function StatusDonutChart({ data, height = 200, ariaLabel }: StatusDonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div role="img" aria-label={ariaLabel} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} stroke="var(--bg-card)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--text-primary)' }}
            formatter={(value, name) => {
              const num = Number(value)
              return [`${num} (${total > 0 ? Math.round((num / total) * 100) : 0}%)`, String(name)]
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, color: 'var(--text-muted)' }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
