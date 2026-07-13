import { sessionStatusConfig, type SessionRequest, type SessionStatus } from '@/app/lecturer/_shared/session-requests-data'

interface SessionsStatsProps {
  data: SessionRequest[]
}

/** Pending/Approved/Rejected/Completed stat cards, derived from the same real session-request store the table below renders. */
export function SessionsStats({ data }: SessionsStatsProps) {
  const counts = (Object.keys(sessionStatusConfig) as SessionStatus[]).map((s) => ({
    status: s,
    label: sessionStatusConfig[s].label,
    count: data.filter((r) => r.status === s).length,
  }))

  const colorFor: Record<SessionStatus, string> = {
    PENDING: 'text-yellow-700',
    APPROVED: 'text-green-700',
    REJECTED: 'text-red-700',
    COMPLETED: 'text-w-600',
  }

  const stats = [
    { label: 'Total Requests', value: data.length, color: 'text-w-950' },
    ...counts.map((c) => ({ label: c.label, value: c.count, color: colorFor[c.status] })),
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
          <p className={`font-cinzel text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="font-lato text-xs text-w-700 mt-1 leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
