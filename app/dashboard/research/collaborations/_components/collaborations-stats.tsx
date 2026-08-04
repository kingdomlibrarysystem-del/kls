import { projectStatusConfig, type ProjectStatus, type ResearchProjectSummary } from './collaborations-data'

interface CollaborationsStatsProps {
  data: ResearchProjectSummary[]
}

/** Active/Completed/Suspended project-count stat cards, derived from the same real project list the grid below renders. */
export function CollaborationsStats({ data }: CollaborationsStatsProps) {
  const colorFor: Record<ProjectStatus, string> = {
    ACTIVE: 'text-green-700',
    COMPLETED: 'text-w-600',
    SUSPENDED: 'text-red-700',
  }

  const stats = [
    { label: 'Total Projects', value: data.length, color: 'text-w-950' },
    ...(Object.keys(projectStatusConfig) as ProjectStatus[]).map((s) => ({
      label: projectStatusConfig[s].label,
      value: data.filter((p) => p.status === s).length,
      color: colorFor[s],
    })),
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      {stats.map((s) => (
        <div key={s.label} className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
          <p className={`font-cinzel text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="font-lato text-xs text-w-700 mt-1 leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
