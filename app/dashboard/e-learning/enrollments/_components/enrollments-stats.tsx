import { enrollmentStatusConfig, type EnrollmentStatus } from './enrollments-data'
import type { DisplayEnrollment } from './enrollments-view'

interface EnrollmentsStatsProps {
  data: DisplayEnrollment[]
}

/** Active/Completed/Dropped stat cards, derived from the same combined (static + live) rows the table below renders. */
export function EnrollmentsStats({ data }: EnrollmentsStatsProps) {
  const counts = (Object.keys(enrollmentStatusConfig) as EnrollmentStatus[]).map((s) => ({
    status: s,
    label: enrollmentStatusConfig[s].label,
    count: data.filter((e) => e.status === s).length,
  }))

  const colorFor: Record<EnrollmentStatus, string> = {
    ACTIVE: 'text-green-700',
    COMPLETED: 'text-w-600',
    DROPPED: 'text-red-700',
  }

  const stats = [
    { label: 'Total Enrollments', value: data.length, color: 'text-w-950' },
    ...counts.map((c) => ({ label: c.label, value: c.count, color: colorFor[c.status] })),
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
