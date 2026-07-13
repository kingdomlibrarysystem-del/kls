import { useRepository } from './use-repository'

/**
 * Total-papers/by-status stat cards, reading the live `useRepository()`
 * store so a newly submitted paper (which lands as SUBMITTED, not
 * PUBLISHED) counts immediately. No chart here: only 3 seeded papers exist
 * today, and each maps to a different research project (1 paper each) —
 * a "papers per project" chart would be 3 bars of identical height 1, with
 * no real distribution to show. Skipped per the same discipline as the
 * contributor dashboard's 2-project skip, rather than fabricating a chart
 * with no real signal.
 */
export function RepositoryStats() {
  const papers = useRepository()
  const published = papers.filter((p) => p.status === 'PUBLISHED').length
  const submitted = papers.filter((p) => p.status === 'SUBMITTED').length
  const draft = papers.filter((p) => p.status === 'DRAFT').length

  const stats = [
    { label: 'Total Papers', value: papers.length, color: 'text-w-950' },
    { label: 'Published', value: published, color: 'text-green-700' },
    { label: 'Submitted', value: submitted, color: 'text-yellow-700' },
    { label: 'Draft', value: draft, color: 'text-w-600' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
          <p className={`font-cinzel text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="font-lato text-xs text-w-700 mt-1 leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
