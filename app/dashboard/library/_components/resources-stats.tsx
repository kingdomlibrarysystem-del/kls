import type { Resource } from './resources-data'

interface ResourcesStatsProps {
  data: Resource[]
}

/** Stat card row summarizing the current resource list — total, available, out-of-stock, archived, copy counts. */
export function ResourcesStats({ data }: ResourcesStatsProps) {
  const stats = [
    { label: 'Total Resources', value: data.length, color: 'text-w-950' },
    { label: 'Available', value: data.filter((r) => r.status === 'available').length, color: 'text-green-700' },
    { label: 'Out of Stock', value: data.filter((r) => r.status === 'out_of_stock').length, color: 'text-red-700' },
    { label: 'Archived', value: data.filter((r) => r.status === 'archived').length, color: 'text-w-600' },
    { label: 'Total Copies', value: data.reduce((s, r) => s + r.totalQty, 0), color: 'text-w-950' },
    { label: 'Available Copies', value: data.reduce((s, r) => s + r.availableQty, 0), color: 'text-green-700' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
          <p className={`font-cinzel text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="font-lato text-xs text-w-700 mt-1 leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
